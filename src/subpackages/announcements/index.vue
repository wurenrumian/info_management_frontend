<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import LayoutShell from '@/components/layout-shell.vue'
import { getAllAnnouncements, getAnnouncements } from '@/services/announcements'
import { useUserStore } from '@/stores/user'
import { UserRole } from '@/constants/enums'
import type { AnnouncementListItem } from '@/types/announcements'

const LIMIT = 20

const userStore = useUserStore()
const announcements = ref<AnnouncementListItem[]>([])
const total = ref(0)
const offset = ref(0)
const loading = ref(false)
const error = ref('')
const inited = ref(false)
const isAdminView = ref(false)

const canManage = computed(() => Number(userStore.userInfo?.role || 0) >= UserRole.LEAGUE_CADRE)
const canViewAllPublished = computed(() => Number(userStore.userInfo?.role || 0) > UserRole.LEAGUE_CADRE)
const showEmpty = computed(() => inited.value && !loading.value && !error.value && announcements.value.length === 0)
const hasMore = computed(() => announcements.value.length < total.value)

function formatPublishAt(item: AnnouncementListItem) {
  return item.published_at || '未发布'
}

function statusText(status: AnnouncementListItem['status']) {
  if (status === 'published') {
    return '已发布'
  }
  if (status === 'draft') {
    return '草稿'
  }
  return '已归档'
}

async function loadAnnouncements(append = false) {
  loading.value = true
  error.value = ''
  try {
    const currentOffset = append ? offset.value : 0
    const requestFn = canViewAllPublished.value && isAdminView.value ? getAllAnnouncements : getAnnouncements
    const res = await requestFn({ limit: LIMIT, offset: currentOffset })
    total.value = res.total
    announcements.value = append ? [...announcements.value, ...res.data] : res.data
    offset.value = currentOffset + LIMIT
    inited.value = true
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载公告失败'
  } finally {
    loading.value = false
  }
}

function goDetail(id: number) {
  const viewMode = canViewAllPublished.value && isAdminView.value ? 'admin' : 'student'
  uni.navigateTo({ url: `/subpackages/announcements/detail?id=${id}&view_mode=${viewMode}` })
}

function toggleViewMode(value: boolean) {
  if (!canViewAllPublished.value) {
    return
  }
  isAdminView.value = value
  announcements.value = []
  total.value = 0
  offset.value = 0
  inited.value = false
  loadAnnouncements(false)
}

watch(isAdminView, (value, oldValue) => {
  if (value === oldValue) {
    return
  }
  toggleViewMode(value)
})

function goPublish() {
  uni.navigateTo({ url: '/subpackages/announcements/form' })
}

onShow(() => {
  loadAnnouncements(false)
})
</script>

<template>
  <layout-shell current="announcements">
    <view class="page-container announcements-page">
      <content-panel title="信息发布" sub-title="学院通知、活动与事务消息">
        <template #default>
          <view class="action-row">
            <nut-button v-if="canManage" type="primary" @click="goPublish">发布通知</nut-button>
            <nut-button plain :loading="loading" @click="loadAnnouncements(false)">刷新列表</nut-button>
          </view>

          <view v-if="canViewAllPublished" class="view-mode-row">
            <text class="view-mode-label">管理视角（查看全部已发布）</text>
            <nut-switch v-model="isAdminView" />
          </view>
          <text v-if="canViewAllPublished && isAdminView" class="view-mode-hint">
            当前为管理视角：显示全部已发布公告（不按定向范围过滤）
          </text>
        </template>
      </content-panel>

      <nut-noticebar v-if="error" wrapable color="danger" :text="`加载失败：${error}`" />

      <content-panel v-if="announcements.length" title="最新通知">
        <template #default>
          <view class="list-wrap">
            <view v-for="item in announcements" :key="item.id" class="item-card" @click="goDetail(item.id)">
              <view class="item-header">
                <text class="item-title">{{ item.title }}</text>
                <nut-tag :type="item.status === 'published' ? 'success' : 'primary'">{{ statusText(item.status) }}</nut-tag>
              </view>
              <view class="tag-row">
                <nut-tag v-for="tag in item.tags || []" :key="`${item.id}-${tag}`" plain type="primary">{{ tag }}</nut-tag>
              </view>
              <text class="item-meta">发布时间：{{ formatPublishAt(item) }}</text>
            </view>
            <nut-button v-if="hasMore" plain :loading="loading" @click="loadAnnouncements(true)">加载更多</nut-button>
          </view>
        </template>
      </content-panel>

      <content-panel v-else-if="showEmpty" title="通知列表">
        <template #default>
          <nut-empty image="empty" description="暂无通知" />
        </template>
      </content-panel>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.announcements-page {
  min-height: 100vh;
}

.action-row {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.view-mode-row {
  margin-top: var(--space-2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.view-mode-label,
.view-mode-hint {
  color: var(--color-text-secondary);
}

.view-mode-hint {
  display: block;
  margin-top: var(--space-1);
}

.list-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.item-card {
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.item-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

.item-summary,
.item-meta {
  display: block;
  margin-top: var(--space-1);
  color: var(--color-text-secondary);
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: var(--space-2);
}
</style>
