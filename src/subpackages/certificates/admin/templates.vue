<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import LayoutShell from '@/components/layout-shell.vue'
import { activateCertificateTemplate, deactivateCertificateTemplate, getCertificateTemplates } from '@/services/certificates'
import { useUserStore } from '@/stores/user'
import { UserRole } from '@/constants/enums'
import type { CertificateTemplate } from '@/types/certificates'

const userStore = useUserStore()
const canManage = computed(() => Number(userStore.userInfo?.role || 0) >= UserRole.TEACHER)

const loading = ref(false)
const error = ref('')
const templates = ref<CertificateTemplate[]>([])

function statusLabel(status: string) {
  if (!status) return '-'
  if (status === 'active') return '启用'
  if (status === 'inactive') return '停用'
  return status
}

async function fetchTemplates() {
  loading.value = true
  error.value = ''
  try {
    templates.value = await getCertificateTemplates()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载模板失败'
  } finally {
    loading.value = false
  }
}

async function toggleTemplate(item: CertificateTemplate) {
  if (!item?.id) return
  try {
    loading.value = true
    if (item.status === 'active') {
      await deactivateCertificateTemplate(item.id)
      uni.showToast({ title: '已停用', icon: 'success' })
    } else {
      await activateCertificateTemplate(item.id)
      uni.showToast({ title: '已启用', icon: 'success' })
    }
    await fetchTemplates()
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

onShow(() => {
  fetchTemplates()
})
</script>

<template>
  <layout-shell current="certificates">
    <view class="page-container template-admin-page">
      <content-panel title="证书模板管理" sub-title="启停模板后会影响后续材料/凭证生成">
        <template #default>
          <nut-noticebar
            v-if="!canManage"
            wrapable
            color="warning"
            text="当前账号无管理权限，无法查看模板列表。"
          />
          <nut-noticebar v-if="error" wrapable color="danger" :text="`加载失败：${error}`" />

          <nut-cell
            v-for="item in templates"
            :key="item.id"
            :title="`${item.code} · ${item.name}`"
            :desc="`approval_type=${item.approval_type || '-'} · stage=${item.document_stage} · 状态=${statusLabel(item.status || '')}`"
          >
            <template #link>
              <nut-button v-if="canManage" size="small" :loading="loading" @click="toggleTemplate(item)">
                {{ item.status === 'active' ? '停用' : '启用' }}
              </nut-button>
            </template>
          </nut-cell>

          <nut-empty v-if="!loading && canManage && !templates.length && !error" image="empty" description="暂无模板" />
        </template>
      </content-panel>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.template-admin-page {
  min-height: 100vh;
}
</style>

