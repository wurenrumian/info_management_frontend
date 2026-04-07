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
    <view class="profile-page page-container">
      <content-panel v-if="loading" title="个人主页">
        <template #default>
          <nut-empty image="empty" description="个人主页加载中..." />
        </template>
      </content-panel>

      <content-panel v-else-if="error" title="加载失败">
        <template #default>
          <nut-noticebar wrapable color="danger" :text="error" />
          <nut-button type="primary" block @click="loadProfile">重试</nut-button>
        </template>
      </content-panel>

      <view v-else-if="profile" class="profile-grid">
        <content-panel class="profile-card--hero" title="个人主页" sub-title="信息概览与快捷操作">
          <template #default>
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
            <nut-button type="primary" block @click="goEditPage">编辑资料</nut-button>
          </template>
        </content-panel>

        <content-panel title="学业信息">
          <template #default>
            <nut-cell title="学院" :desc="collegeText" />
            <nut-cell title="专业" :desc="majorText" />
            <nut-cell title="入学学年" :desc="enrollmentYearText" />
            <nut-cell title="班级ID" :desc="String(profile.basic.classId || 0)" />
          </template>
        </content-panel>

        <content-panel title="账号状态">
          <template #default>
            <view class="status-list">
              <view class="status-item">
                <text class="status-label">登录状态</text>
                <nut-tag type="success">{{ profile.account.hasToken ? '已登录' : '未登录' }}</nut-tag>
              </view>
              <view class="status-item">
                <text class="status-label">微信绑定</text>
                <nut-tag type="warning">{{ profile.account.wechatBound ? '微信已绑定' : '微信未绑定' }}</nut-tag>
              </view>
            </view>
          </template>
        </content-panel>

        <content-panel title="我的数据">
          <template #default>
            <nut-cell title="公告" :desc="String(profile.quickEntry.announcementsCount)" icon="message" />
            <nut-cell title="审批" :desc="String(profile.quickEntry.approvalsCount)" icon="checked" />
            <nut-cell title="知识库" :desc="String(profile.quickEntry.knowledgeCount)" icon="category" />
            <nut-cell title="未读通知" :desc="String(profile.quickEntry.unreadNotifications)" icon="notice" />
          </template>
        </content-panel>

        <content-panel title="账号操作">
          <template #default>
            <view class="action-group">
              <nut-button plain @click="loadProfile">刷新数据</nut-button>
              <nut-button plain @click="goHome">返回首页</nut-button>
              <nut-button type="danger" @click="handleLogout">退出登录</nut-button>
            </view>
          </template>
        </content-panel>
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
  min-width: 0;
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

.status-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.72);
}

.status-label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

:deep(.nut-tag) {
  margin: 0;
}

@media (min-width: 1024px) {
  .profile-grid {
    grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.9fr);
    gap: var(--space-4);
  }

  .profile-card--hero {
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }

  .hero-row {
    align-items: flex-start;
    gap: var(--space-4);
  }

  .hero-avatar {
    width: 92px;
    height: 92px;
  }

  .hero-name {
    font-size: 28px;
    line-height: 1.3;
  }

  .hero-meta,
  .hero-bio {
    font-size: 15px;
    line-height: 1.7;
  }

  .status-item {
    padding: 12px 14px;
  }

  .status-label {
    font-size: 15px;
  }
}
</style>
