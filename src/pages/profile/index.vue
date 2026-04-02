<script setup lang="ts">
import { onMounted, ref } from 'vue'
import LayoutShell from '@/components/layout-shell.vue'
import { getProfileHomeViewModel } from '@/services/profile'
import type { ProfileHomeViewModel } from '@/types/profile'

const loading = ref(true)
const error = ref('')
const profile = ref<ProfileHomeViewModel | null>(null)

async function loadProfile() {
  loading.value = true
  error.value = ''
  try {
    profile.value = await getProfileHomeViewModel()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败，请重试'
  } finally {
    loading.value = false
  }
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
        <button class="retry-btn" @tap="loadProfile">重试</button>
      </view>

      <view v-else-if="profile" class="profile-grid">
        <view class="profile-card">
          <text class="card-title">基本信息</text>
          <text class="row"><text class="label">姓名：</text>{{ profile.basic.name }}</text>
          <text class="row"><text class="label">学号：</text>{{ profile.basic.studentId }}</text>
          <text class="row"><text class="label">角色：</text>{{ profile.basic.roleText }}</text>
          <text class="row"><text class="label">班级ID：</text>{{ profile.basic.classId }}</text>
          <text class="row"><text class="label">年级：</text>{{ profile.basic.grade }}</text>
          <text class="row"><text class="label">专业：</text>{{ profile.basic.major }}</text>
        </view>

        <view class="profile-card">
          <text class="card-title">账号状态</text>
          <text class="row">
            <text class="label">登录状态：</text>
            {{ profile.account.hasToken ? '已登录' : '未登录' }}
          </text>
          <text class="row">
            <text class="label">微信绑定：</text>
            {{ profile.account.wechatBound ? '已绑定' : '未绑定' }}
          </text>
        </view>

        <view class="profile-card">
          <text class="card-title">我的快捷入口</text>
          <text class="row"><text class="label">公告：</text>{{ profile.quickEntry.announcementsCount }}</text>
          <text class="row"><text class="label">审批：</text>{{ profile.quickEntry.approvalsCount }}</text>
          <text class="row"><text class="label">知识库：</text>{{ profile.quickEntry.knowledgeCount }}</text>
          <text class="row"><text class="label">未读通知：</text>{{ profile.quickEntry.unreadNotifications }}</text>
        </view>

        <view class="profile-card">
          <text class="card-title">资料扩展位</text>
          <text class="row"><text class="label">头像：</text>{{ profile.ext.avatarUrl || '待接入' }}</text>
          <text class="row"><text class="label">简介：</text>{{ profile.ext.bio || '待接入' }}</text>
          <text class="row"><text class="label">可编辑：</text>{{ profile.ext.editable ? '是' : '否' }}</text>
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
  margin-bottom: var(--space-3);
  color: var(--color-text-secondary);
}

.row {
  display: block;
  margin-top: var(--space-1);
}

.label {
  color: var(--color-text-secondary);
}

.retry-btn {
  margin-top: var(--space-2);
  background: var(--color-primary);
  border-radius: var(--radius-md);
  color: #fff;
}
</style>
