<script setup lang="ts">
import LayoutShell from '@/components/layout-shell.vue'

function goToStyleShowcase() {
  uni.navigateTo({
    url: '/pages/style-showcase/index',
  })
}

function goToProfile() {
  uni.reLaunch({
    url: '/pages/profile/index',
  })
}
</script>

<template>
  <layout-shell current="home">
    <view class="home">
      <view class="hero-card">
        <text class="hero-title">学院事务一站式系统</text>
        <text class="hero-subtitle">通知、审批与流程统一入口</text>
        <view class="button-row">
          <button class="preview-button" @tap="goToProfile">
            前往个人主页
          </button>
          <button class="preview-button preview-button--secondary" @tap="goToStyleShowcase">
            查看样式预览页
          </button>
        </view>
      </view>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.home {
  display: flex;
  align-items: flex-start;
  min-height: 100vh;
  padding: var(--space-4);
}

.hero-card {
  width: 100%;
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
}

.hero-title {
  display: block;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

.hero-subtitle {
  display: block;
  margin-top: var(--space-1);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.preview-button {
  margin-top: var(--space-3);
  background: var(--color-primary);
  color: #fff;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.preview-button--secondary {
  background: var(--color-surface);
  color: var(--color-primary);
}
</style>
