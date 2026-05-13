<script setup lang="ts">
import { reactive } from 'vue'
import LayoutShell from '@/components/layout-shell.vue'
import { submitApproval } from '@/services/approvals'

const formState = reactive({
  approvalType: 'leave',
  title: '',
  reason: '',
  startAt: '',
  endAt: '',
  contactPhone: '',
  semester: '',
})

async function submitForm() {
  if (!formState.title.trim()) {
    uni.showToast({ title: '请填写申请标题', icon: 'none' })
    return
  }
  if (!formState.reason.trim()) {
    uni.showToast({ title: '请填写申请说明', icon: 'none' })
    return
  }
  if (!formState.startAt.trim() || !formState.endAt.trim()) {
    uni.showToast({ title: '请填写起止时间', icon: 'none' })
    return
  }
  if (!formState.contactPhone.trim()) {
    uni.showToast({ title: '请填写联系电话', icon: 'none' })
    return
  }

  try {
    const res = await submitApproval({
      approval_type: formState.approvalType,
      title: formState.title.trim(),
      form_data: {
        reason: formState.reason.trim(),
        start_at: formState.startAt.trim(),
        end_at: formState.endAt.trim(),
        contact_phone: formState.contactPhone.trim(),
      },
      semester: formState.semester.trim() || undefined,
    })
    uni.showToast({ title: '提交成功', icon: 'success' })
    if (res.id) {
      uni.redirectTo({ url: `/subpackages/approvals/detail?id=${res.id}` })
      return
    }
    uni.navigateBack()
  } catch (e) {
    const message = e instanceof Error ? e.message : '提交失败，请稍后重试'
    uni.showToast({ title: message, icon: 'none' })
  }
}
</script>

<template>
  <layout-shell current="approvals">
    <view class="page-container form-page">
      <content-panel title="发起审批申请" sub-title="当前为页面骨架，后续可直接接接口">
        <template #default>
          <view class="field">
            <text class="label">申请类型</text>
            <nut-input v-model="formState.approvalType" placeholder="例如：leave / stamp / certificate" />
          </view>

          <view class="field">
            <text class="label">标题</text>
            <nut-input v-model="formState.title" placeholder="例如：事假申请（4月10日）" />
          </view>

          <view class="field">
            <text class="label">申请说明</text>
            <nut-textarea v-model="formState.reason" placeholder="请填写详细原因" maxlength="300" />
          </view>

          <view class="field">
            <text class="label">开始时间</text>
            <nut-input v-model="formState.startAt" placeholder="例如：2026-04-10 08:30" />
          </view>

          <view class="field">
            <text class="label">结束时间</text>
            <nut-input v-model="formState.endAt" placeholder="例如：2026-04-10 18:00" />
          </view>

          <view class="field">
            <text class="label">联系电话</text>
            <nut-input v-model="formState.contactPhone" type="number" placeholder="请填写手机号" maxlength="20" />
          </view>

          <view class="field">
            <text class="label">学期（可选）</text>
            <nut-input v-model="formState.semester" placeholder="例如：2025-2026-2" />
          </view>

          <nut-button type="primary" block @click="submitForm">提交申请</nut-button>
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
