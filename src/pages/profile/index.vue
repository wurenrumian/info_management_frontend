<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import LayoutShell from '@/components/layout-shell.vue'
import { buildPublicFileUrl } from '@/services/file'
import { getProfileEditableInfo, getProfileHomeViewModel } from '@/services/profile'
import type { ProfileHomeViewModel } from '@/types/profile'
import type { UserInfo } from '@/types/user'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const loading = ref(true)
const error = ref('')
const profile = ref<ProfileHomeViewModel | null>(null)
const editable = ref<UserInfo | null>(null)
const AVATAR_CACHE_KEY = 'profile_avatar_url'

const displayName = computed(() => {
  const nickname = String(editable.value?.nickname || '').trim()
  const realName = String(editable.value?.real_name || '').trim()
  const legacyName = String(editable.value?.name || profile.value?.basic.name || '').trim()
  return nickname || realName || legacyName || '未命名用户'
})

const enrollmentYearText = computed(() => {
  const year = editable.value?.enrollment_year
  return year ? String(year) : '未填写'
})

const collegeText = computed(() => {
  const college = String(editable.value?.college || '').trim()
  return college || '未填写学院'
})

const majorText = computed(() => {
  const major = String(editable.value?.major || profile.value?.basic.major || '').trim()
  return major || '未填写专业'
})

const realNameText = computed(() => {
  return String(editable.value?.real_name || editable.value?.name || profile.value?.basic.name || '未填写').trim()
})

const bioText = computed(() => {
  const bio = String(editable.value?.bio || profile.value?.ext.bio || '').trim()
  return bio || '这个人很低调，还没有个性签名。'
})

const avatarUrl = computed(() => {
  const fromApi = String(editable.value?.avatar_url || '').trim()
  if (fromApi) {
    return fromApi
  }
  const fromFilePath = buildPublicFileUrl(String(editable.value?.avatar_file_path || '').trim())
  if (fromFilePath) {
    return fromFilePath
  }
  const fromCache = String(uni.getStorageSync(AVATAR_CACHE_KEY) || '').trim()
  return fromCache || ''
})

async function loadProfile() {
  loading.value = true
  error.value = ''
  try {
    const [homeData, editableData] = await Promise.all([getProfileHomeViewModel(), getProfileEditableInfo()])
    profile.value = homeData
    editable.value = editableData as UserInfo
    if (editable.value?.avatar_url) {
      uni.setStorageSync(AVATAR_CACHE_KEY, editable.value.avatar_url)
    }
    userStore.setUserInfo(editableData as UserInfo)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败，请重试'
  } finally {
    loading.value = false
  }
}

function goEditPage() {
  uni.navigateTo({ url: '/pages/profile/edit' })
}

function goHome() {
  uni.reLaunch({ url: '/pages/home/index' })
}

function handleLogout() {
  userStore.logout()
  uni.reLaunch({ url: '/pages/auth/login' })
}

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <layout-shell current="profile">
    <view class="profile-page">
      <view v-if="loading" class="state-card">
        <text>个人主页加载中...</text>
      </view>

      <view v-else-if="error" class="state-card state-card--error">
        <text class="state-title">加载失败</text>
        <text class="state-desc">{{ error }}</text>
        <button class="btn primary" @tap="loadProfile">重试</button>
      </view>

      <view v-else-if="profile" class="profile-grid">
        <view class="profile-card profile-card--hero">
          <view class="hero-row">
            <image v-if="avatarUrl" class="hero-avatar" :src="avatarUrl" mode="aspectFill" />
            <view v-else class="hero-avatar hero-avatar--placeholder">头像</view>
            <view class="hero-content">
              <text class="hero-name">{{ displayName }}</text>
              <text class="hero-meta">实名：{{ realNameText }}</text>
              <text class="hero-meta">学号 {{ profile.basic.studentId }} · {{ profile.basic.roleText }}</text>
            </view>
          </view>
          <text class="hero-bio">{{ bioText }}</text>
          <button class="btn primary" @tap="goEditPage">编辑资料</button>
        </view>

        <view class="profile-card">
          <text class="card-title">学业信息</text>
          <text class="row"><text class="label">学院：</text>{{ collegeText }}</text>
          <text class="row"><text class="label">专业：</text>{{ majorText }}</text>
          <text class="row"><text class="label">入学学年：</text>{{ enrollmentYearText }}</text>
          <text class="row"><text class="label">班级ID：</text>{{ profile.basic.classId || 0 }}</text>
        </view>

        <view class="profile-card">
          <text class="card-title">账号状态</text>
          <text class="row"><text class="label">登录状态：</text>{{ profile.account.hasToken ? '已登录' : '未登录' }}</text>
          <text class="row"><text class="label">微信绑定：</text>{{ profile.account.wechatBound ? '已绑定' : '未绑定' }}</text>
        </view>

        <view class="profile-card">
          <text class="card-title">我的数据</text>
          <text class="row"><text class="label">公告：</text>{{ profile.quickEntry.announcementsCount }}</text>
          <text class="row"><text class="label">审批：</text>{{ profile.quickEntry.approvalsCount }}</text>
          <text class="row"><text class="label">知识库：</text>{{ profile.quickEntry.knowledgeCount }}</text>
          <text class="row"><text class="label">未读通知：</text>{{ profile.quickEntry.unreadNotifications }}</text>
        </view>

        <view class="profile-card">
          <text class="card-title">账号操作</text>
          <button class="btn" @tap="loadProfile">刷新数据</button>
          <button class="btn" @tap="goHome">返回首页</button>
          <button class="btn danger" @tap="handleLogout">退出登录</button>
        </view>
      </view>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.profile-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.profile-grid {
  display: grid;
  gap: var(--space-3);
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.profile-card,
.state-card {
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.profile-card--hero {
  grid-column: 1 / -1;
}

.hero-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.hero-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: #fff;
}

.hero-avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

.hero-content {
  flex: 1;
}

.hero-name {
  display: block;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

.hero-meta,
.hero-bio {
  display: block;
  margin-top: var(--space-1);
  color: var(--color-text-secondary);
}

.hero-bio {
  margin-top: var(--space-3);
}

.state-card--error {
  border-color: #f0c5c5;
}

.card-title,
.state-title {
  display: block;
  margin-bottom: var(--space-3);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.state-desc {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--color-text-secondary);
}

.row {
  display: block;
  margin-top: var(--space-1);
}

.label {
  color: var(--color-text-secondary);
}

.btn {
  margin-top: var(--space-2);
  background: #fff;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
}

.btn.primary {
  background: var(--color-primary);
  color: #fff;
}

.btn.danger {
  border-color: var(--color-danger);
  color: var(--color-danger);
}
</style>
