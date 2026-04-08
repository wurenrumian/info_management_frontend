<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import LayoutShell from '@/components/layout-shell.vue'

const approvalId = ref(0)

function approvePlaceholder() {
  // TODO: 接入 approveApproval(action=approve)。
  uni.showToast({ title: '通过逻辑待补全', icon: 'none' })
}

function rejectPlaceholder() {
  // TODO: 接入 approveApproval(action=reject)。
  uni.showToast({ title: '驳回逻辑待补全', icon: 'none' })
}

onLoad((query) => {
  approvalId.value = Number(query?.id || 0)
})
</script>

<template>
  <layout-shell current="approvals">
    <view class="page-container detail-page">
      <content-panel :title="`审批详情 #${approvalId || '-'}`" sub-title="审批记录与操作（占位）">
        <template #default>
          <nut-cell title="申请类型" desc="请假申请" />
          <nut-cell title="申请人" desc="当前用户（占位）" />
          <nut-cell title="状态" desc="待审批" />
          <nut-cell title="提交时间" desc="2026-04-08 08:40" />
        </template>
      </content-panel>

      <content-panel title="审批操作">
        <template #default>
          <view class="action-row">
            <nut-button type="primary" @click="approvePlaceholder">审批通过</nut-button>
            <nut-button plain @click="rejectPlaceholder">驳回申请</nut-button>
          </view>
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
