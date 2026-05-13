<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import LayoutShell from '@/components/layout-shell.vue'
import { approveApproval, getApprovalDetail } from '@/services/approvals'
import type { ApprovalDetail } from '@/types/approvals'

const approvalId = ref(0)
const detail = ref<ApprovalDetail | null>(null)
const loading = ref(false)
const error = ref('')
const reviewComment = ref('')

function formatStatus(status: string) {
  switch (status) {
    case 'pending':
      return '待审批'
    case 'approved':
      return '已通过'
    case 'rejected':
      return '已驳回'
    case 'withdrawn':
      return '已撤回'
    default:
      return status || '未知状态'
  }
}

async function loadDetail() {
  if (!approvalId.value) {
    return
  }
  loading.value = true
  error.value = ''
  try {
    detail.value = await getApprovalDetail(approvalId.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载详情失败'
  } finally {
    loading.value = false
  }
}

async function submitReview(action: 'approve' | 'reject') {
  if (!approvalId.value) {
    return
  }
  try {
    await approveApproval(approvalId.value, action, reviewComment.value.trim() || undefined)
    uni.showToast({ title: action === 'approve' ? '已审批通过' : '已驳回', icon: 'success' })
    await loadDetail()
  } catch (e) {
    const message = e instanceof Error ? e.message : '审批失败'
    uni.showToast({ title: message, icon: 'none' })
  }
}

onLoad((query) => {
  approvalId.value = Number(query?.id || 0)
  loadDetail()
})
</script>

<template>
  <layout-shell current="approvals">
    <view class="page-container detail-page">
      <content-panel :title="`审批详情 #${approvalId || '-'}`" sub-title="审批记录与操作">
        <template #default>
          <nut-noticebar v-if="error" wrapable color="danger" :text="`加载失败：${error}`" />
          <nut-cell title="申请类型" :desc="detail?.approval?.approval_type || '-'" />
          <nut-cell title="申请标题" :desc="detail?.approval?.title || '-'" />
          <nut-cell title="状态" :desc="formatStatus(detail?.approval?.status || '')" />
          <nut-cell title="提交时间" :desc="detail?.approval?.submitted_at || detail?.approval?.created_at || '-'" />
          <nut-cell title="更新时间" :desc="detail?.approval?.updated_at || '-'" />
        </template>
      </content-panel>

      <content-panel title="审批操作">
        <template #default>
          <nut-input v-model="reviewComment" placeholder="审批备注（可选）" />
          <view class="action-row">
            <nut-button type="primary" :loading="loading" @click="submitReview('approve')">审批通过</nut-button>
            <nut-button plain :loading="loading" @click="submitReview('reject')">驳回申请</nut-button>
          </view>
        </template>
      </content-panel>

      <content-panel title="审批动作记录">
        <template #default>
          <nut-cell
            v-for="(item, index) in detail?.actions || []"
            :key="`${item.action}-${item.created_at || index}`"
            :title="item.action"
            :desc="`${item.created_at || '-'}${item.comment ? ` · ${item.comment}` : ''}`"
          />
          <nut-empty v-if="!loading && !(detail?.actions || []).length" image="empty" description="暂无审批记录" />
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
