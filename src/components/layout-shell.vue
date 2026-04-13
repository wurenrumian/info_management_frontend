<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { isH5, isWeixinMiniProgram } from '@/utils/platform'
import { useUserStore } from '@/stores/user'
import { getUserInfo } from '@/services/auth'

type NavKey = 'home' | 'announcements' | 'partyflow' | 'knowledge' | 'profile'

const props = defineProps<{
  current: NavKey
}>()

const userStore = useUserStore()

const navItems: Array<{ key: NavKey; label: string; path: string; icon: string; isSubpackage?: boolean }> = [
  { key: 'home', label: '首页', path: '/pages/home/index', icon: 'home' },
  { key: 'announcements', label: '通知', path: '/subpackages/announcements/index', icon: 'notice', isSubpackage: true },
  { key: 'partyflow', label: '党团', path: '/subpackages/partyflow/index', icon: 'service', isSubpackage: true },
  { key: 'knowledge', label: '知识库', path: '/subpackages/knowledge/index', icon: 'category', isSubpackage: true },
  { key: 'profile', label: '个人', path: '/pages/profile/index', icon: 'my' },
]

const showSidebar = computed(() => isH5())
const showBottomNav = computed(() => isWeixinMiniProgram())

function goTo(path: string, isSubpackage = false) {
  if (path === `/${getCurrentPages().slice(-1)[0]?.route}`) {
    return
  }
  if (isSubpackage) {
    uni.navigateTo({ url: path })
    return
  }
  uni.reLaunch({ url: path })
}

async function ensureUserInfoLoaded() {
  if (userStore.userInfo) {
    return
  }

  const token = String(uni.getStorageSync('token') || '').trim()
  if (!token) {
    return
  }

  try {
    const me = await getUserInfo()
    userStore.setUserInfo(me)
  } catch {
    // Ignore here; request layer already handles auth failures globally.
  }
}

onMounted(() => {
  ensureUserInfoLoaded()
})
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
        @tap="goTo(item.path, item.isSubpackage)"
      >
        <nut-icon :name="item.icon" size="14" />
        <text>{{ item.label }}</text>
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
        @tap="goTo(item.path, item.isSubpackage)"
      >
        <nut-icon :name="item.icon" size="14" />
        <text>{{ item.label }}</text>
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
  width: 240px;
  min-height: 100vh;
  padding: var(--space-4);
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: 8px 0 24px rgba(43, 43, 43, 0.04);
}

.sidebar-title {
  display: block;
  margin-bottom: var(--space-4);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  transition: background-color 0.2s ease, color 0.2s ease;
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
  min-width: 0;
  max-width: none;
  padding: var(--space-5) var(--space-6);
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
  flex-direction: column;
  gap: 2px;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.bottom-nav-item--active {
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

@media (min-width: 1024px) {
  .sidebar {
    position: sticky;
    top: 0;
    height: 100vh;
    padding: 28px 20px;
  }

  .sidebar-title {
    margin-bottom: var(--space-5);
    font-size: 20px;
  }

  .nav-item {
    min-height: 44px;
    font-size: var(--font-size-sm);
  }

  .layout-shell--h5 .content {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 36px 40px 48px;
  }
}
</style>
