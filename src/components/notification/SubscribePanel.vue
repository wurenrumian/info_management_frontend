<script setup lang="ts">
import { computed } from 'vue'
import { SUBSCRIBE_TEMPLATES } from '@/constants/notification'
import { useNotificationSubscribe } from '@/hooks/use-notification-subscribe'

const {
  loading,
  errorMessage,
  summary,
  isSupported,
  hasFailedReports,
  manualSendLoading,
  manualSendMessage,
  requestAndReport,
  retryFailedReports,
  sendManualLoginNotification,
} = useNotificationSubscribe()

const isDev = import.meta.env.DEV

const totalTemplateCount = computed(() => SUBSCRIBE_TEMPLATES.length)
const acceptedLabel = computed(() => `已同意 ${summary.value.accept}/${totalTemplateCount.value}`)
const rejectedLabel = computed(() => `已拒绝 ${summary.value.reject}`)
const reportFailedLabel = computed(() => `上报失败 ${summary.value.report_failed}`)

function onSubscribeTap() {
  requestAndReport()
}

function onRetryTap() {
  retryFailedReports()
}

function onManualSendTap() {
  sendManualLoginNotification()
}
</script>

<template>
  <content-panel class="subscribe-panel" title="通知订阅" sub-title="一键订阅系统通知（首次可勾选“不再询问”）">
    <template #default>
      <nut-empty v-if="!isSupported" image="empty" description="仅微信小程序支持订阅消息" />

      <nut-button v-else type="primary" block :loading="loading" @click="onSubscribeTap">
        {{ loading ? '处理中...' : `一键订阅通知（${totalTemplateCount}项）` }}
      </nut-button>

      <view class="subscribe-result">
        <nut-tag type="primary">{{ acceptedLabel }}</nut-tag>
        <nut-tag type="warning">{{ rejectedLabel }}</nut-tag>
        <nut-tag type="danger">{{ reportFailedLabel }}</nut-tag>
      </view>

      <nut-button v-if="hasFailedReports" block plain :loading="loading" @click="onRetryTap">重试上报失败项</nut-button>

      <nut-button
        v-if="isDev && isSupported"
        block
        plain
        :loading="manualSendLoading"
        @click="onManualSendTap"
      >
        {{ manualSendLoading ? '发送中...' : '手动发送登录通知（调试）' }}
      </nut-button>

      <nut-noticebar v-if="errorMessage" wrapable color="danger" :text="errorMessage" />
      <nut-noticebar v-if="manualSendMessage" wrapable :text="manualSendMessage" />
    </template>
  </content-panel>
</template>

<style scoped lang="scss">
.subscribe-panel {
  margin-top: var(--space-2);
}

.subscribe-result {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}
</style>
