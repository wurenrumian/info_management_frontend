<script setup lang="ts">
import { reactive } from 'vue'
import LayoutShell from '@/components/layout-shell.vue'

const formState = reactive({
  type: '在读证明',
  purpose: '',
  notes: '',
})

function submitPlaceholder() {
  // TODO: 接入证件申请 API，提交后写入 records 列表。
  uni.showToast({ title: '申请逻辑待补全', icon: 'none' })
}
</script>

<template>
  <layout-shell current="certificates">
    <view class="page-container certificate-form-page">
      <content-panel title="证件申请" sub-title="在线填报申请信息（占位）">
        <template #default>
          <view class="field">
            <text class="label">证件类型</text>
            <nut-input v-model="formState.type" readonly />
          </view>

          <view class="field">
            <text class="label">用途说明</text>
            <nut-input v-model="formState.purpose" placeholder="例如：奖学金申请、实习材料提交" maxlength="60" />
          </view>

          <view class="field">
            <text class="label">补充备注</text>
            <nut-textarea v-model="formState.notes" placeholder="可填写时间要求、份数等" maxlength="200" />
          </view>

          <nut-button type="primary" block @click="submitPlaceholder">提交申请（占位）</nut-button>
        </template>
      </content-panel>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.certificate-form-page {
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
