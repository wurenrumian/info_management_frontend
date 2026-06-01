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

function trimText(value: string) {
  return String(value || '').trim()
}

function isValidDateTimeText(value: string) {
  const text = trimText(value)
  if (!/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(text)) {
    return false
  }
  return !Number.isNaN(Date.parse(text.replace(' ', 'T')))
}

function isValidDateText(value: string) {
  const text = trimText(value)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return false
  }
  return !Number.isNaN(Date.parse(text))
}

function isValidPhoneText(value: string) {
  return /^1\d{10}$/.test(trimText(value))
}

function isValidSemesterText(value: string) {
  const text = trimText(value)
  return text === '' || /^\d{4}-\d{1,2}$/.test(text)
}

function isValidPositiveAmount(value: string) {
  const amount = Number(trimText(value))
  return Number.isFinite(amount) && amount > 0
}

async function submitForm() {
  const title = trimText(formState.title)
  if (!title) {
    uni.showToast({ title: '请填写申请标题', icon: 'none' })
    return
  }

  const semester = trimText(formState.semester)
  if (semester && !isValidSemesterText(semester)) {
    uni.showToast({ title: '学期格式不正确', icon: 'none' })
    return
  }

  const payload = formState.approvalType === 'leave' ? buildLeavePayload() : buildBudgetPayload()
  if (!payload) {
    return
  }

  try {
    const res = await submitApproval({
      approval_type: formState.approvalType,
      title,
      form_data: payload,
      semester: semester || undefined,
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
  const reason = trimText(formState.leave.reason)
  const startAt = trimText(formState.leave.startAt)
  const endAt = trimText(formState.leave.endAt)
  const contactPhone = trimText(formState.leave.contactPhone)

  if (!reason) {
    uni.showToast({ title: '请填写请假原因', icon: 'none' })
    return null
  }
  if (!isValidDateTimeText(startAt) || !isValidDateTimeText(endAt)) {
    uni.showToast({ title: '请填写正确的请假起止时间', icon: 'none' })
    return null
  }
  if (Date.parse(startAt.replace(' ', 'T')) >= Date.parse(endAt.replace(' ', 'T'))) {
    uni.showToast({ title: '请假结束时间必须晚于开始时间', icon: 'none' })
    return null
  }
  if (!isValidPhoneText(contactPhone)) {
    uni.showToast({ title: '联系电话格式不正确', icon: 'none' })
    return null
  }

  return {
    reason,
    start_at: startAt,
    end_at: endAt,
    contact_phone: contactPhone,
  }
}

function buildBudgetPayload() {
  const activityName = trimText(formState.budget.activityName)
  const activityDate = trimText(formState.budget.activityDate)
  const budgetAmountText = trimText(formState.budget.budgetAmount)
  const purpose = trimText(formState.budget.purpose)

  if (!activityName) {
    uni.showToast({ title: '请填写活动名称', icon: 'none' })
    return null
  }
  if (!isValidDateText(activityDate)) {
    uni.showToast({ title: '活动日期格式不正确', icon: 'none' })
    return null
  }
  if (!isValidPositiveAmount(budgetAmountText)) {
    uni.showToast({ title: '预算金额格式不正确', icon: 'none' })
    return null
  }
  if (!purpose) {
    uni.showToast({ title: '请填写预算用途', icon: 'none' })
    return null
  }

  return {
    activity_name: activityName,
    activity_date: activityDate,
    budget_amount: Number(budgetAmountText),
    purpose,
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
