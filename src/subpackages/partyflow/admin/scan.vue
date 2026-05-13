<script setup lang="ts">
import { computed, ref } from 'vue'
import LayoutShell from '@/components/layout-shell.vue'
import { scanAdminPartyflowReminders } from '@/services/partyflow'
import { useUserStore } from '@/stores/user'
import { UserRole } from '@/constants/enums'
import type { ScanPartyflowRemindersResult } from '@/types/partyflow'

const userStore = useUserStore()
const hasPermission = computed(() => Number(userStore.userInfo?.role || 0) >= UserRole.LEAGUE_CADRE)

const scanning = ref(false)
const error = ref('')
const result = ref<ScanPartyflowRemindersResult | null>(null)

async function runScan() {
  if (!hasPermission.value) {
    return
  }
  scanning.value = true
  error.value = ''
  try {
    result.value = await scanAdminPartyflowReminders()
    uni.showToast({ title: '扫描完成', icon: 'success' })
  } catch (e) {
    error.value = e instanceof Error ? e.message : '扫描失败'
  } finally {
    scanning.value = false
  }
}
</script>

<template>
  <layout-shell current="partyflow">
    <view class="scan-page page-container">
      <content-panel v-if="!hasPermission" title="无权限访问" />

      <template v-else>
        <content-panel title="扫描提醒" sub-title="手动触发提醒扫描并查看统计结果">
          <template #default>
            <nut-button type="primary" block :loading="scanning" @click="runScan">开始扫描</nut-button>
          </template>
        </content-panel>

        <nut-noticebar v-if="error" wrapable color="danger" :text="`扫描失败：${error}`" />

        <content-panel v-else-if="result" title="扫描结果">
          <template #default>
            <nut-cell title="扫描数量" :desc="String(result.scanned_count)" />
            <nut-cell title="生成提醒" :desc="String(result.generated_count)" />
            <nut-cell title="发送成功" :desc="String(result.sent_count)" />
            <nut-cell title="跳过数量" :desc="String(result.skipped_count)" />
            <nut-cell title="失败数量" :desc="String(result.failed_count)" />
          </template>
        </content-panel>
      </template>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.scan-page {
  min-height: 100vh;
}
</style>

