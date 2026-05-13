<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import LayoutShell from '@/components/layout-shell.vue'
import { approveApproval, getAdminApprovalDetail, getApprovalDetail, withdrawApproval } from '@/services/approvals'
import type { ApprovalDetail } from '@/types/approvals'
import { useUserStore } from '@/stores/user'
import { UserRole } from '@/constants/enums'
import { formatDateTime } from '@/utils/partyflow'

const approvalId = ref(0)
const adminMode = ref(false)
const detail = ref<ApprovalDetail | null>(null)
const loading = ref(false)
const error = ref('')
const reviewComment = ref('')
const userStore = useUserStore()

const canManageApproval = computed(() => Number(userStore.userInfo?.role || 0) >= UserRole.LEAGUE_CADRE)
const canReviewApproval = computed(() => Number(userStore.userInfo?.role || 0) >= UserRole.TEACHER)
const currentUserId = computed(() => Number(userStore.userInfo?.id || 0))
const approvalOwnerId = computed(() => Number(detail.value?.approval?.applicant_id || 0))
const isSelfApproval = computed(() => Boolean(currentUserId.value && approvalOwnerId.value && currentUserId.value === approvalOwnerId.value))
const canWithdraw = computed(() => detail.value?.approval?.status === 'pending' && isSelfApproval.value)
const canSubmitReview = computed(() => canReviewApproval.value && !isSelfApproval.value)

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

function formatActionLabel(action: string) {
  switch (action) {
    case 'approve':
      return '审批通过'
    case 'reject':
      return '驳回申请'
    case 'withdraw':
      return '撤回申请'
    case 'submit':
      return '提交申请'
    default:
      return action || '审批动作'
  }
}

function formatOperator(item: ApprovalDetail['actions'][number]) {
  if (item.operator_name && String(item.operator_name).trim()) {
    return item.operator_name
  }
  if (item.operator_id) {
    return `ID ${item.operator_id}`
  }
  return '未知操作者'
}

function formatActionTime(item: ApprovalDetail['actions'][number]) {
  return formatDateTime(item.created_at)
}

function formatActionComment(item: ApprovalDetail['actions'][number]) {
  const comment = String(item.comment || '').trim()
  return comment || '无备注'
}

function formatActionMeta(item: ApprovalDetail['actions'][number]) {
  const actionType = String(item.action_type || item.action || '').trim()
  const transition = item.from_status && item.to_status ? `${item.from_status} → ${item.to_status}` : ''
  const parts = [actionType ? `动作：${formatActionLabel(actionType)}` : '', transition ? `状态：${transition}` : '']
    .filter(Boolean)
  return parts.join(' · ') || '无额外信息'
}

async function loadDetail() {
  if (!approvalId.value) {
    return
  }
  loading.value = true
  error.value = ''
  try {
    detail.value = adminMode.value ? await getAdminApprovalDetail(approvalId.value) : await getApprovalDetail(approvalId.value)
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
  if (!canSubmitReview.value) {
    uni.showToast({ title: '不能审批自己的申请', icon: 'none' })
    return
  }
  try {
    await approveApproval(approvalId.value, action, reviewComment.value.trim() || undefined)
    uni.showToast({ title: action === 'approve' ? '已审批通过' : '已驳回', icon: 'success' })
    reviewComment.value = ''
    await loadDetail()
  } catch (e) {
    const message = e instanceof Error ? e.message : '审批失败'
    uni.showToast({ title: message, icon: 'none' })
  }
}

async function submitWithdraw() {
  if (!approvalId.value) {
    return
  }
  if (!canWithdraw.value) {
    uni.showToast({ title: '当前状态不能撤回', icon: 'none' })
    return
  }

  uni.showModal({
    title: '确认撤回',
    content: '撤回后该申请将结束，是否继续？',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      try {
        await withdrawApproval(approvalId.value)
        uni.showToast({ title: '已撤回', icon: 'success' })
        await loadDetail()
      } catch (e) {
        uni.showToast({ title: e instanceof Error ? e.message : '撤回失败', icon: 'none' })
      }
    },
  })
}

onLoad((query) => {
  approvalId.value = Number(query?.id || 0)
  adminMode.value = String(query?.admin || '') === '1'
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
          <nut-cell title="当前步骤" :desc="detail?.approval?.current_step || '-'" />
          <nut-cell title="审批人ID" :desc="detail?.approval?.current_approver_id ? String(detail?.approval?.current_approver_id) : '-'" />
          <nut-cell title="截止时间" :desc="detail?.approval?.due_at ? formatDateTime(detail?.approval?.due_at) : '-'" />
          <nut-cell title="提交时间" :desc="detail?.approval?.submitted_at || detail?.approval?.created_at || '-'" />
          <nut-cell title="更新时间" :desc="detail?.approval?.updated_at || '-'" />
        </template>
      </content-panel>

      <content-panel v-if="canWithdraw" title="申请操作">
        <template #default>
          <nut-noticebar wrapable color="primary" text="这是你发起的申请，可以撤回当前待审批申请。" />
          <view class="action-row">
            <nut-button type="primary" :loading="loading" @click="submitWithdraw">撤回申请</nut-button>
          </view>
        </template>
      </content-panel>

      <content-panel v-if="canManageApproval" title="审批操作">
        <template #default>
          <nut-noticebar v-if="isSelfApproval" wrapable color="warning" text="不能审批自己的申请，请让其他审批人处理。" />
          <nut-noticebar v-else-if="!canReviewApproval" wrapable color="primary" text="当前角色可查看管理信息，但不能最终审批。" />
          <template v-else>
            <nut-input v-model="reviewComment" placeholder="审批备注（可选）" />
            <view class="action-row">
              <nut-button type="primary" :disabled="!canSubmitReview" :loading="loading" @click="submitReview('approve')">审批通过</nut-button>
              <nut-button plain :disabled="!canSubmitReview" :loading="loading" @click="submitReview('reject')">驳回申请</nut-button>
            </view>
          </template>
        </template>
      </content-panel>

      <content-panel title="审批动作记录">
        <template #default>
          <view v-for="(item, index) in detail?.actions || []" :key="`${item.id || item.action_type || item.action || index}-${item.created_at || index}`" class="action-card">
            <view class="action-card__header">
              <text class="action-card__title">{{ formatActionLabel(item.action_type || item.action || '') }}</text>
              <text class="action-card__time">{{ formatActionTime(item) }}</text>
            </view>
            <view class="action-card__meta">
              <text>{{ formatActionMeta(item) }}</text>
              <text>操作者：{{ formatOperator(item) }}</text>
              <text>备注：{{ formatActionComment(item) }}</text>
            </view>
          </view>
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

.action-card {
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.action-card + .action-card {
  margin-top: var(--space-2);
}

.action-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.action-card__title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.action-card__time {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.action-card__meta {
  display: grid;
  gap: 4px;
  margin-top: 8px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

:deep(.nut-button) {
  margin: 0;
}
</style>
