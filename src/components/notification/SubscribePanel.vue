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
  <view class="subscribe-panel">
    <view class="subscribe-panel__header">
      <text class="subscribe-panel__title">通知订阅</text>
      <text class="subscribe-panel__subtitle">首次订阅时建议勾选“总是保持以上选择，不再询问”</text>
    </view>

    <view class="subscribe-template-list">
      <view v-for="template in SUBSCRIBE_TEMPLATES" :key="template.wechat_template_id" class="subscribe-template-item">
        <text class="subscribe-template-item__name">{{ template.name }}</text>
        <text class="subscribe-template-item__description">{{ template.description }}</text>
      </view>
    </view>

    <view v-if="!isSupported" class="subscribe-panel__unsupported">
      仅微信小程序支持订阅消息，H5 端不展示订阅弹窗。
    </view>

    <button v-else class="subscribe-panel__button" :disabled="loading" @tap="onSubscribeTap">
      {{ loading ? '处理中...' : `一键订阅通知（${totalTemplateCount}项）` }}
    </button>

    <view class="subscribe-result">
      <text class="subscribe-result__item">{{ acceptedLabel }}</text>
      <text class="subscribe-result__item">{{ rejectedLabel }}</text>
      <text class="subscribe-result__item">{{ reportFailedLabel }}</text>
    </view>

    <button v-if="hasFailedReports" class="subscribe-panel__retry" :disabled="loading" @tap="onRetryTap">
      重试上报失败项
    </button>

    <button
      v-if="isDev && isSupported"
      class="subscribe-panel__manual-send"
      :disabled="manualSendLoading"
      @tap="onManualSendTap"
    >
      {{ manualSendLoading ? '发送中...' : '手动发送登录通知（调试）' }}
    </button>

    <text v-if="errorMessage" class="subscribe-panel__error">{{ errorMessage }}</text>
    <text v-if="manualSendMessage" class="subscribe-panel__manual-message">{{ manualSendMessage }}</text>
  </view>
</template>

<style scoped lang="scss">
.subscribe-panel {
  margin-top: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.subscribe-panel__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.subscribe-panel__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.subscribe-panel__subtitle {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.subscribe-template-list {
  margin-top: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.subscribe-template-item {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-primary-soft);
}

.subscribe-template-item__name {
  display: block;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
}

.subscribe-template-item__description {
  display: block;
  margin-top: 2px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.subscribe-panel__unsupported {
  margin-top: var(--space-3);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.subscribe-panel__button {
  margin-top: var(--space-3);
  background: var(--color-primary);
  color: #fff;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
}

.subscribe-result {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.subscribe-result__item {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
}

.subscribe-panel__retry {
  margin-top: var(--space-2);
  background: var(--color-surface);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.subscribe-panel__error {
  display: block;
  margin-top: var(--space-2);
  color: var(--color-danger);
  font-size: var(--font-size-sm);
}

.subscribe-panel__manual-send {
  margin-top: var(--space-2);
  background: #fff;
  color: var(--color-warning);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.subscribe-panel__manual-message {
  display: block;
  margin-top: var(--space-1);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
</style>
