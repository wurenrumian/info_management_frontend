<script setup lang="ts">
import { computed, ref } from 'vue'
import LayoutShell from '@/components/layout-shell.vue'
import { importAdminPartyflowStatuses } from '@/services/partyflow'
import { useUserStore } from '@/stores/user'
import { UserRole } from '@/constants/enums'
import type { PartyflowImportItem, PartyflowImportPayload, PartyflowImportResult } from '@/types/partyflow'

const userStore = useUserStore()
const hasPermission = computed(() => Number(userStore.userInfo?.role || 0) >= UserRole.LEAGUE_CADRE)

const rawJson = ref('')
const importing = ref(false)
const result = ref<PartyflowImportResult | null>(null)
const error = ref('')

function parsePayload(): PartyflowImportPayload {
  const text = rawJson.value.trim()
  const items = JSON.parse(text) as PartyflowImportItem[]
  if (!Array.isArray(items)) {
    throw new Error('导入数据必须是 JSON 数组')
  }
  return { items }
}

async function submitImport() {
  if (!hasPermission.value) {
    return
  }
  importing.value = true
  error.value = ''
  result.value = null
  try {
    const payload = parsePayload()
    result.value = await importAdminPartyflowStatuses(payload)
    uni.showToast({ title: '导入完成', icon: 'success' })
  } catch (e) {
    error.value = e instanceof Error ? e.message : '导入失败'
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <layout-shell current="partyflow">
    <view class="import-page page-container">
      <content-panel v-if="!hasPermission" title="无权限访问" />

      <template v-else>
        <content-panel title="批量导入党团流程状态" sub-title="粘贴 JSON 数组（每项对应一个学生）">
          <template #default>
            <nut-textarea
              v-model="rawJson"
              class="textarea--large"
              maxlength="20000"
              placeholder='示例：[{"student_id":"20201099","org_type":"party","status":"activist","status_started_at":"2026-04-01T00:00:00Z","next_action_hint":"每满3个月提交思想汇报"}]'
            />
            <nut-button type="primary" block :loading="importing" @click="submitImport">开始导入</nut-button>
          </template>
        </content-panel>

        <nut-noticebar v-if="error" wrapable color="danger" :text="`导入失败：${error}`" />

        <content-panel v-else-if="result" title="导入结果">
          <template #default>
            <nut-cell title="成功数" :desc="String(result.success_count)" />
            <nut-cell title="失败数" :desc="String(result.failed_count)" />
            <content-panel v-if="result.failed_items && result.failed_items.length" title="失败明细">
              <template #default>
                <nut-cell
                  v-for="item in result.failed_items"
                  :key="`failed-${item.student_id}`"
                  :title="item.student_id"
                  :desc="item.reason"
                  icon="failure"
                />
              </template>
            </content-panel>
          </template>
        </content-panel>
      </template>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.import-page {
  min-height: 100vh;
}

.textarea--large {
  min-height: 220px;
}

:deep(.nut-button) {
  margin-top: var(--space-3);
}
</style>

