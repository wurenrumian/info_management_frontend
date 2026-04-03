<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  uni.redirectTo({ url: '/pages/auth/login?mode=public' })
})
</script>

<template>
  <view class="register-page">
    <view class="register-card">
      <text class="title">正在跳转到公开注册/激活...</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.register-page {
  min-height: 100vh;
  padding: var(--space-4);
  background: var(--color-bg);
}

.register-card {
  max-width: 520px;
  margin: 0 auto;
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.title {
  display: block;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
}
</style>
