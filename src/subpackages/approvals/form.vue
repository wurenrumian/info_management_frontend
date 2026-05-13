<script setup lang="ts">
import { computed, reactive } from 'vue'
import LayoutShell from '@/components/layout-shell.vue'
import { submitApproval } from '@/services/approvals'

type ApprovalFormType = 'leave' | 'budget'

const formState = reactive({
  approvalType: 'leave' as ApprovalFormType,
  title: '',
  semester: '',
  leave: {
    reason: '',
    startAt: '',
    endAt: '',
    contactPhone: '',
  },
  budget: {
    activityName: '',
    activityDate: '',
    budgetAmount: '',
    purpose: '',
  },
})

const isLeaveForm = computed(() => formState.approvalType === 'leave')
const isBudgetForm = computed(() => formState.approvalType === 'budget')

function switchFormType(type: ApprovalFormType) {
  formState.approvalType = type
}

async function submitForm() {
  if (!formState.title.trim()) {
    uni.showToast({ title: '请填写申请标题', icon: 'none' })
    return
  }

  const payload =
    formState.approvalType === 'leave'
      ? buildLeavePayload()
      : buildBudgetPayload()

  if (!payload) {
    return
  }

  try {
    const res = await submitApproval({
      approval_type: formState.approvalType,
      title: formState.title.trim(),
      form_data: payload,
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

function buildLeavePayload() {
  if (!formState.leave.reason.trim()) {
    uni.showToast({ title: '请填写请假原因', icon: 'none' })
    return null
  }
  if (!formState.leave.startAt.trim() || !formState.leave.endAt.trim()) {
    uni.showToast({ title: '请填写请假起止时间', icon: 'none' })
    return null
  }
  if (!formState.leave.contactPhone.trim()) {
    uni.showToast({ title: '请填写联系电话', icon: 'none' })
    return null
  }

  return {
    reason: formState.leave.reason.trim(),
    start_at: formState.leave.startAt.trim(),
    end_at: formState.leave.endAt.trim(),
    contact_phone: formState.leave.contactPhone.trim(),
  }
}

function buildBudgetPayload() {
  if (!formState.budget.activityName.trim()) {
    uni.showToast({ title: '请填写活动名称', icon: 'none' })
    return null
  }
  if (!formState.budget.activityDate.trim()) {
    uni.showToast({ title: '请填写活动日期', icon: 'none' })
    return null
  }
  if (!formState.budget.budgetAmount.trim()) {
    uni.showToast({ title: '请填写预算金额', icon: 'none' })
    return null
  }
  if (!formState.budget.purpose.trim()) {
    uni.showToast({ title: '请填写预算用途', icon: 'none' })
    return null
  }

  return {
    activity_name: formState.budget.activityName.trim(),
    activity_date: formState.budget.activityDate.trim(),
    budget_amount: Number(formState.budget.budgetAmount),
    purpose: formState.budget.purpose.trim(),
  }
}
</script>

<template>
  <layout-shell current="approvals">
    <view class="page-container form-page">
      <content-panel title="发起审批申请" sub-title="支持请假和预算两类申请">
        <template #default>
          <view class="field">
            <text class="label">申请类型</text>
            <view class="type-row">
              <nut-button size="small" :type="isLeaveForm ? 'primary' : 'default'" @click="switchFormType('leave')">请假申请</nut-button>
              <nut-button size="small" :type="isBudgetForm ? 'primary' : 'default'" @click="switchFormType('budget')">预算申请</nut-button>
            </view>
          </view>

          <view class="field">
            <text class="label">标题</text>
            <nut-input
              v-model="formState.title"
              :placeholder="isLeaveForm ? '例如：五一离校请假申请' : '例如：班级团日活动预算申请'"
            />
          </view>

          <template v-if="isLeaveForm">
            <view class="field">
              <text class="label">请假原因</text>
              <nut-textarea v-model="formState.leave.reason" placeholder="请填写详细原因" maxlength="300" />
            </view>

            <view class="field">
              <text class="label">开始时间</text>
              <nut-input v-model="formState.leave.startAt" placeholder="例如：2026-05-01 09:00" />
            </view>

            <view class="field">
              <text class="label">结束时间</text>
              <nut-input v-model="formState.leave.endAt" placeholder="例如：2026-05-03 18:00" />
            </view>

            <view class="field">
              <text class="label">联系电话</text>
              <nut-input v-model="formState.leave.contactPhone" type="number" placeholder="请填写手机号" maxlength="20" />
            </view>
          </template>

          <template v-else>
            <view class="field">
              <text class="label">活动名称</text>
              <nut-input v-model="formState.budget.activityName" placeholder="例如：班级团日活动" />
            </view>

            <view class="field">
              <text class="label">活动日期</text>
              <nut-input v-model="formState.budget.activityDate" placeholder="例如：2026-05-20" />
            </view>

            <view class="field">
              <text class="label">预算金额</text>
              <nut-input v-model="formState.budget.budgetAmount" type="number" placeholder="例如：1200" />
            </view>

            <view class="field">
              <text class="label">用途说明</text>
              <nut-textarea v-model="formState.budget.purpose" placeholder="请填写预算用途" maxlength="300" />
            </view>
          </template>

          <view class="field">
            <text class="label">学期（可选）</text>
            <nut-input v-model="formState.semester" placeholder="例如：2026-1" />
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

.type-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

:deep(.nut-button) {
  margin-top: var(--space-3);
}
</style>
