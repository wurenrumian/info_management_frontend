<script setup lang="ts">
import LayoutShell from '@/components/layout-shell.vue'

function goCreateApproval() {
  uni.redirectTo({ url: '/subpackages/approvals/form' })
}

function goRecords() {
  uni.redirectTo({ url: '/subpackages/certificates/records' })
}
</script>

<template>
  <layout-shell current="certificates">
    <view class="page-container certificate-form-page">
      <content-panel title="证件生成" sub-title="证件由审批流程自动生成">
        <template #default>
          <text class="intro">当前后端未提供“单独提交证件申请”的接口。请通过提交审批（leave/budget）来触发证件生成。</text>
          <view class="action-row">
            <nut-button type="primary" @click="goCreateApproval">去发起审批</nut-button>
            <nut-button plain @click="goRecords">查看我的证件</nut-button>
          </view>
        </template>
      </content-panel>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.certificate-form-page {
  min-height: 100vh;
}

.intro {
  display: block;
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.action-row {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-top: var(--space-3);
}

:deep(.nut-button) {
  margin: 0;
}
</style>
