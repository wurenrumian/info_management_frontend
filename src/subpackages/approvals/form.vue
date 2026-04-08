<script setup lang="ts">
import { reactive } from 'vue'
import LayoutShell from '@/components/layout-shell.vue'

const formState = reactive({
  type: '请假申请',
  title: '',
  reason: '',
})

function submitPlaceholder() {
  // TODO: 接入 submitApproval，提交后跳转 detail 页面。
  uni.showToast({ title: '提交逻辑待补全', icon: 'none' })
}
</script>

<template>
  <layout-shell current="approvals">
    <view class="page-container form-page">
      <content-panel title="发起审批申请" sub-title="当前为页面骨架，后续可直接接接口">
        <template #default>
          <view class="field">
            <text class="label">申请类型</text>
            <nut-input v-model="formState.type" readonly />
          </view>

          <view class="field">
            <text class="label">标题</text>
            <nut-input v-model="formState.title" placeholder="例如：事假申请（4月10日）" />
          </view>

          <view class="field">
            <text class="label">申请说明</text>
            <nut-textarea v-model="formState.reason" placeholder="请填写详细原因" maxlength="300" />
          </view>

          <nut-button type="primary" block @click="submitPlaceholder">提交申请（占位）</nut-button>
        </template>
      </content-panel>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.form-page {
  min-height: 100vh;
}

.field + .field {
  margin-top: var(--space-3);
}

.label {
  display: block;
  margin-bottom: var(--space-1);
  color: var(--color-text-secondary);
}

:deep(.nut-button) {
  margin-top: var(--space-3);
}
</style>
