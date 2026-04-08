<script setup lang="ts">
import { ref } from 'vue'
import LayoutShell from '@/components/layout-shell.vue'

type ApprovalListItem = {
  id: number
  type: string
  statusText: string
  submitAt: string
}

// TODO: 接入审批 API 后替换示例数据。
const myApplications = ref<ApprovalListItem[]>([
  { id: 3001, type: '请假申请', statusText: '待审批', submitAt: '2026-04-08 08:40' },
  { id: 3002, type: '盖章申请', statusText: '已通过', submitAt: '2026-04-05 16:10' },
])

const pendingTasks = ref<ApprovalListItem[]>([
  { id: 4001, type: '请假申请', statusText: '待你审批', submitAt: '2026-04-08 09:15' },
])

function goCreate() {
  uni.navigateTo({ url: '/subpackages/approvals/form' })
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/subpackages/approvals/detail?id=${id}` })
}
</script>

<template>
  <layout-shell current="approvals">
    <view class="page-container approvals-page">
      <content-panel title="审批流程" sub-title="请假、盖章等申请与审批入口">
        <template #default>
          <nut-button type="primary" @click="goCreate">发起新申请</nut-button>
        </template>
      </content-panel>

      <content-panel title="我发起的申请">
        <template #default>
          <nut-cell
            v-for="item in myApplications"
            :key="`me-${item.id}`"
            :title="item.type"
            :desc="`${item.statusText} · ${item.submitAt}`"
            is-link
            @click="goDetail(item.id)"
          />
        </template>
      </content-panel>

      <content-panel title="待我审批">
        <template #default>
          <nut-cell
            v-for="item in pendingTasks"
            :key="`pending-${item.id}`"
            :title="item.type"
            :desc="`${item.statusText} · ${item.submitAt}`"
            is-link
            @click="goDetail(item.id)"
          />
          <nut-empty v-if="!pendingTasks.length" image="empty" description="暂无待处理审批" />
        </template>
      </content-panel>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.approvals-page {
  min-height: 100vh;
}

:deep(.nut-button) {
  margin: 0;
}
</style>
