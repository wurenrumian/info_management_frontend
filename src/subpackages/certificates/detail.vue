<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import LayoutShell from '@/components/layout-shell.vue'
import { getCertificateDetail, revokeCertificate } from '@/services/certificates'
import type { CertificateRecord } from '@/types/certificates'
import { buildFileDownloadUrl } from '@/services/file'
import { isH5 } from '@/utils/platform'
import { useUserStore } from '@/stores/user'
import { UserRole } from '@/constants/enums'

const recordId = ref(0)
const loading = ref(false)
const error = ref('')
const record = ref<CertificateRecord | null>(null)
const revokeReason = ref('')

const userStore = useUserStore()
const canManage = computed(() => Number(userStore.userInfo?.role || 0) >= UserRole.TEACHER)

function stageLabel(stage: string) { return stage === 'application' ? '申请材料' : stage === 'approval_certificate' ? '审批凭证' : stage || '-' }
function sealLabel(seal: string) { return seal === 'none' ? '未盖章' : seal === 'internal_seal_applied' ? '已盖章' : seal || '-' }
function statusLabel(status: string) { return status === 'generated' ? '已生成' : status === 'failed' ? '生成失败' : status === 'revoked' ? '已作废' : status || '-' }

function buildDocumentUrl() {
  const documentId = Number(record.value?.document_id || 0)
  if (!documentId) return ''
  return buildFileDownloadUrl(documentId)
}

function previewDocument() {
  const url = buildDocumentUrl()
  if (!url) return uni.showToast({ title: '暂无可预览材料', icon: 'none' })
  if (isH5()) return void window.open(url, '_blank')
  uni.downloadFile({
    url,
    success: (res) => uni.openDocument({ filePath: res.tempFilePath, fail: () => uni.setClipboardData({ data: url }) }),
    fail: () => uni.setClipboardData({ data: url }),
  })
}

function downloadDocument() {
  const url = buildDocumentUrl()
  if (!url) return uni.showToast({ title: '暂无可下载材料', icon: 'none' })
  if (isH5()) return void window.open(url, '_blank')

  uni.downloadFile({
    url,
    success: (res) => {
      uni.saveFile({
        tempFilePath: res.tempFilePath,
        success: () => uni.showToast({ title: '已保存到本地', icon: 'success' }),
        fail: () => uni.openDocument({ filePath: res.tempFilePath }),
      })
    },
    fail: () => uni.setClipboardData({ data: url }),
  })
}

function goApprovalDetail() {
  const approvalId = Number(record.value?.approval_id || 0)
  if (!approvalId) return uni.showToast({ title: '未关联审批单', icon: 'none' })
  uni.navigateTo({ url: `/subpackages/approvals/detail?id=${approvalId}` })
}

function copyVerifyCode() {
  const code = String(record.value?.verification_code || '').trim()
  if (!code) return uni.showToast({ title: '暂无核验码', icon: 'none' })
  uni.setClipboardData({ data: code })
}

async function loadDetail() {
  if (!recordId.value) return
  loading.value = true
  error.value = ''
  try {
    record.value = await getCertificateDetail(recordId.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载证件详情失败'
  } finally {
    loading.value = false
  }
}

async function submitRevoke() {
  const reason = revokeReason.value.trim()
  if (!recordId.value || !reason) return uni.showToast({ title: '请填写作废原因', icon: 'none' })
  try {
    await revokeCertificate(recordId.value, reason)
    uni.showToast({ title: '已作废', icon: 'success' })
    revokeReason.value = ''
    await loadDetail()
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '作废失败', icon: 'none' })
  }
}

onLoad((query) => {
  recordId.value = Number(query?.id || 0)
  loadDetail()
})
</script>

<template>
  <layout-shell current="certificates">
    <view class="page-container detail-page">
      <content-panel :title="`证件详情 #${recordId || '-'}`" sub-title="证件信息与下载">
        <template #default>
          <nut-noticebar v-if="error" wrapable color="danger" :text="`加载失败：${error}`" />
          <nut-cell title="阶段" :desc="stageLabel(record?.document_stage || '')" />
          <nut-cell title="编号" :desc="record?.certificate_no || '-'" />
          <nut-cell title="状态" :desc="statusLabel(record?.status || '')" />
          <nut-cell title="盖章" :desc="sealLabel(record?.seal_status || '')" />
          <nut-cell title="生成时间" :desc="record?.generated_at || '-'" />
          <nut-cell title="作废时间" :desc="record?.revoked_at || '-'" />
          <nut-cell title="核验码" :desc="record?.verification_code || '-'" />
          <nut-cell title="关联审批" :desc="record?.approval_id ? `审批 #${record.approval_id}` : '-'" />
          <nut-cell title="文档ID" :desc="record?.document_id ? String(record.document_id) : '-'" />
          <nut-cell v-if="record?.error_message" title="失败原因" :desc="record.error_message" />
        </template>
      </content-panel>

      <content-panel title="证件操作">
        <template #default>
          <view class="action-row">
            <nut-button type="primary" :loading="loading" @click="previewDocument">在线预览</nut-button>
            <nut-button plain :loading="loading" @click="downloadDocument">下载 PDF</nut-button>
            <nut-button plain @click="goApprovalDetail">查看关联审批</nut-button>
            <nut-button plain @click="copyVerifyCode">复制核验码</nut-button>
          </view>
        </template>
      </content-panel>

      <content-panel v-if="canManage" title="管理操作">
        <template #default>
          <nut-input v-model="revokeReason" placeholder="作废原因" />
          <nut-button plain :loading="loading" @click="submitRevoke">作废凭证</nut-button>
        </template>
      </content-panel>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.detail-page {
  min-height: 100vh;
}

.action-row {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

:deep(.nut-button) {
  margin: 0;
}
</style>
