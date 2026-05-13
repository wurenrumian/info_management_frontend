<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import LayoutShell from '@/components/layout-shell.vue'
import { getAdminApprovalList } from '@/services/approvals'
import type { Approval } from '@/types/approvals'
import type { PaginationParams } from '@/types/api'
import { useUserStore } from '@/stores/user'
import { ApprovalStatus, UserRole } from '@/constants/enums'
import { formatDateTime } from '@/utils/partyflow'

const LIMIT = 20

const userStore = useUserStore()
const status = ref('')
const approvalType = ref('')
const items = ref<Approval[]>([])
const total = ref(0)
const offset = ref(0)
const loading = ref(false)
const error = ref('')

const hasPermission = computed(() => Number(userStore.userInfo?.role || 0) >= UserRole.LEAGUE_CADRE)
const canReview = computed(() => Number(userStore.userInfo?.role || 0) >= UserRole.TEACHER)
const isEmpty = computed(() => !loading.value && !error.value && items.value.length === 0)
const canPrev = computed(() => offset.value > 0)
const canNext = computed(() => offset.value + LIMIT < total.value)

function formatStatus(value: string) {
  switch (value) {
    case ApprovalStatus.PENDING:
      return '待审批'
    case ApprovalStatus.APPROVED:
      return '已通过'
    case ApprovalStatus.REJECTED:
      return '已驳回'
    case ApprovalStatus.WITHDRAWN:
      return '已撤回'
    default:
      return value || '未知状态'
  }
}

function buildParams(): PaginationParams & { status?: string; approval_type?: string } {
  const params: PaginationParams & { status?: string; approval_type?: string } = {
    limit: LIMIT,
    offset: offset.value,
  }
  const statusValue = status.value.trim()
  const typeValue = approvalType.value.trim()
  if (statusValue) {
    params.status = statusValue
  }
  if (typeValue) {
    params.approval_type = typeValue
  }
  return params
}

async function loadList() {
  if (!hasPermission.value) {
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await getAdminApprovalList(buildParams())
    items.value = res.data
    total.value = res.total
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function onSearch() {
  offset.value = 0
  loadList()
}

function onReset() {
  status.value = ''
  approvalType.value = ''
  offset.value = 0
  loadList()
}

function prevPage() {
  if (!canPrev.value) {
    return
  }
  offset.value = Math.max(0, offset.value - LIMIT)
  loadList()
}

function nextPage() {
  if (!canNext.value) {
    return
  }
  offset.value += LIMIT
  loadList()
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/subpackages/approvals/detail?id=${id}&admin=1` })
}

function goBack() {
  uni.navigateTo({ url: '/subpackages/approvals/index' })
}

onShow(() => {
  loadList()
})
</script>

<template>
  <layout-shell current="approvals">
    <view class="admin-page page-container">
      <content-panel v-if="!hasPermission" title="无权限访问">
        <template #default>
          <nut-noticebar color="danger" text="仅团学干部及以上角色可进入审批管理面板" />
        </template>
      </content-panel>

      <template v-else>
        <content-panel class="toolbar" title="审批管理面板" sub-title="团学干部可查看和提醒，教师/超管可审批">
          <template #default>
            <view class="filter-row">
              <nut-button size="small" :type="status === '' ? 'primary' : 'default'" @click="status = ''">全部状态</nut-button>
              <nut-button size="small" :type="status === ApprovalStatus.PENDING ? 'primary' : 'default'" @click="status = ApprovalStatus.PENDING">待审批</nut-button>
              <nut-button size="small" :type="status === ApprovalStatus.APPROVED ? 'primary' : 'default'" @click="status = ApprovalStatus.APPROVED">已通过</nut-button>
              <nut-button size="small" :type="status === ApprovalStatus.REJECTED ? 'primary' : 'default'" @click="status = ApprovalStatus.REJECTED">已驳回</nut-button>
              <nut-button size="small" :type="status === ApprovalStatus.WITHDRAWN ? 'primary' : 'default'" @click="status = ApprovalStatus.WITHDRAWN">已撤回</nut-button>
            </view>

            <view class="filter-row">
              <nut-button size="small" :type="approvalType === '' ? 'primary' : 'default'" @click="approvalType = ''">全部类型</nut-button>
              <nut-button size="small" :type="approvalType === 'leave' ? 'primary' : 'default'" @click="approvalType = 'leave'">请假</nut-button>
              <nut-button size="small" :type="approvalType === 'budget' ? 'primary' : 'default'" @click="approvalType = 'budget'">预算</nut-button>
            </view>

            <view class="button-row">
              <nut-button type="primary" :loading="loading" @click="onSearch">搜索</nut-button>
              <nut-button plain :disabled="loading" @click="onReset">重置</nut-button>
              <nut-button plain :disabled="loading" @click="goBack">返回审批列表</nut-button>
            </view>
          </template>
        </content-panel>

        <nut-noticebar v-if="canReview" color="primary" wrapable text="你当前角色可执行审批通过和驳回操作；若是申请人本人，只能查看，不能审批自己的申请。" />
        <nut-noticebar v-else color="warning" wrapable text="你当前角色可查看审批列表和详情，但不能最终审批。" />

        <nut-noticebar v-if="error" wrapable color="danger" :text="`加载失败：${error}`" />

        <nut-empty v-else-if="isEmpty" image="empty" description="暂无审批数据" />

        <view v-else class="list-wrap">
          <content-panel v-for="item in items" :key="item.id" class="item-card">
            <template #default>
              <text class="item-title">{{ item.title }}</text>
              <text class="item-meta">类型：{{ item.approval_type }} · 状态：{{ formatStatus(item.status) }}</text>
              <text class="item-meta">当前步骤：{{ item.current_step || '-' }}</text>
              <text class="item-meta">申请人ID：{{ item.applicant_id || '-' }}</text>
              <text class="item-meta">审批人ID：{{ item.current_approver_id || '-' }}</text>
              <text class="item-meta">截止时间：{{ item.due_at ? formatDateTime(item.due_at) : '-' }}</text>
              <text class="item-meta">提交时间：{{ item.submitted_at ? formatDateTime(item.submitted_at) : formatDateTime(item.created_at) }}</text>
              <view class="button-row">
                <nut-button plain size="small" @click="goDetail(item.id)">详情</nut-button>
              </view>
            </template>
          </content-panel>

          <content-panel class="pager">
            <template #default>
              <text class="item-meta">共 {{ total }} 条，当前偏移 {{ offset }}</text>
              <view class="button-row">
                <nut-button plain :disabled="!canPrev || loading" @click="prevPage">上一页</nut-button>
                <nut-button plain :disabled="!canNext || loading" @click="nextPage">下一页</nut-button>
              </view>
            </template>
          </content-panel>
        </view>
      </template>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.admin-page {
  min-height: 100vh;
}

.toolbar {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.list-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.item-title {
  display: block;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

.item-meta {
  display: block;
  margin-top: var(--space-1);
  color: var(--color-text-secondary);
}

:deep(.nut-button) {
  margin: 0;
}

:deep(.nut-input) {
  flex: 1;
  min-width: 200px;
}
</style>
