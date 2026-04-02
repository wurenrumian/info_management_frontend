<script setup lang="ts">
import { computed } from 'vue'
import { isH5, isWeixinMiniProgram } from '@/utils/platform'

type NavKey = 'home' | 'profile'

const props = defineProps<{
  current: NavKey
}>()

const navItems: Array<{ key: NavKey; label: string; path: string }> = [
  { key: 'home', label: '首页', path: '/pages/home/index' },
  { key: 'profile', label: '个人', path: '/pages/profile/index' },
]

const showSidebar = computed(() => isH5())
const showBottomNav = computed(() => isWeixinMiniProgram())

function goTo(path: string) {
  if (path === `/${getCurrentPages().slice(-1)[0]?.route}`) {
    return
  }
  uni.reLaunch({ url: path })
}
</script>

<template>
  <view class="layout-shell" :class="{ 'layout-shell--h5': showSidebar }">
    <view v-if="showSidebar" class="sidebar">
      <text class="sidebar-title">学院事务</text>
      <view
        v-for="item in navItems"
        :key="item.key"
        class="nav-item"
        :class="{ 'nav-item--active': props.current === item.key }"
        @tap="goTo(item.path)"
      >
        {{ item.label }}
      </view>
    </view>

    <view class="content" :class="{ 'content--with-bottom-nav': showBottomNav }">
      <slot />
    </view>

    <view v-if="showBottomNav" class="bottom-nav">
      <view
        v-for="item in navItems"
        :key="item.key"
        class="bottom-nav-item"
        :class="{ 'bottom-nav-item--active': props.current === item.key }"
        @tap="goTo(item.path)"
      >
        {{ item.label }}
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.layout-shell {
  min-height: 100vh;
  background: var(--color-bg);
}

.layout-shell--h5 {
  display: flex;
}

.sidebar {
  width: 220px;
  min-height: 100vh;
  padding: var(--space-4);
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
}

.sidebar-title {
  display: block;
  margin-bottom: var(--space-4);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.nav-item {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
}

.nav-item + .nav-item {
  margin-top: var(--space-2);
}

.nav-item--active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.content {
  padding: var(--space-4);
}

.layout-shell--h5 .content {
  flex: 1;
  max-width: 980px;
}

.content--with-bottom-nav {
  padding-bottom: calc(var(--space-5) + 64px);
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  height: 56px;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  z-index: 20;
}

.bottom-nav-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.bottom-nav-item--active {
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}
</style>
