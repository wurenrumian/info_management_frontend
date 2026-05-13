<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import LayoutShell from '@/components/layout-shell.vue'
import { getMyApprovalList } from '@/services/approvals'
import type { Approval } from '@/types/approvals'
import { useUserStore } from '@/stores/user'
import { UserRole } from '@/constants/enums'

const myApplications = ref<Approval[]>([])
const loading = ref(false)
const error = ref('')
const userStore = useUserStore()

const canOpenAdminPanel = computed(() => Number(userStore.userInfo?.role || 0) >= UserRole.LEAGUE_CADRE)

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

function formatSubmittedAt(item: Approval) {
  return item.submitted_at || item.created_at || '-'
}

async function fetchMyApprovals() {
  loading.value = true
  error.value = ''
  try {
    const res = await getMyApprovalList({ limit: 20, offset: 0 })
    myApplications.value = res.data || []
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载审批列表失败'
  } finally {
    loading.value = false
  }
}

function goCreate() {
  uni.navigateTo({ url: '/subpackages/approvals/form' })
}

function goAdminPanel() {
  uni.navigateTo({ url: '/subpackages/approvals/admin/index' })
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/subpackages/approvals/detail?id=${id}` })
}

onShow(() => {
  fetchMyApprovals()
})
</script>

<template>
  <layout-shell current="approvals">
    <view class="page-container approvals-page">
      <content-panel title="审批流程" sub-title="请假、盖章等申请与审批入口">
        <template #default>
          <view class="action-row">
            <nut-button type="primary" @click="goCreate">发起新申请</nut-button>
            <nut-button v-if="canOpenAdminPanel" plain @click="goAdminPanel">审批管理面板</nut-button>
          </view>
        </template>
      </content-panel>

      <content-panel title="我发起的申请">
        <template #default>
          <nut-noticebar v-if="error" wrapable color="danger" :text="`加载失败：${error}`" />
          <nut-cell
            v-for="item in myApplications"
            :key="item.id"
            :title="item.title || item.approval_type"
            :desc="`${formatStatus(item.status)} · ${formatSubmittedAt(item)}`"
            is-link
            @click="goDetail(item.id)"
          />
          <nut-empty v-if="!loading && !myApplications.length && !error" image="empty" description="暂无审批申请" />
        </template>
      </content-panel>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.approvals-page {
  min-height: 100vh;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

:deep(.nut-button) {
  margin: 0;
}
</style>
