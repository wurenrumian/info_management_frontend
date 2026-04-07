<script setup lang="ts">
defineProps<{
  title?: string
  subTitle?: string
}>()
</script>

<template>
  <view class="content-panel section-card">
    <view v-if="title || subTitle || $slots.header" class="content-panel__header">
      <view class="content-panel__heading">
        <text v-if="title" class="content-panel__title">{{ title }}</text>
        <text v-if="subTitle" class="content-panel__subtitle">{{ subTitle }}</text>
      </view>
      <view v-if="$slots.header" class="content-panel__header-extra">
        <slot name="header" />
      </view>
    </view>
    <view v-if="$slots.default" class="content-panel__body">
      <slot />
    </view>
  </view>
</template>

<style scoped lang="scss">
.content-panel {
  display: flex;
  flex-direction: column;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.content-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
}

.content-panel__heading {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.content-panel__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.content-panel__subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.content-panel__body {
  margin-top: var(--space-3);
}

@media (min-width: 1024px) {
  .content-panel {
    padding: var(--space-4);
    border-radius: 18px;
  }

  .content-panel__header {
    gap: var(--space-3);
  }

  .content-panel__title {
    font-size: 20px;
    line-height: 1.3;
  }

  .content-panel__subtitle {
    font-size: 15px;
    line-height: 1.5;
  }

  .content-panel__body {
    margin-top: 18px;
  }
}
</style>
