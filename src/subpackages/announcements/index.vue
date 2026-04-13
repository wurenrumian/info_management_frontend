<script setup lang="ts">
import { ref } from 'vue'
import LayoutShell from '@/components/layout-shell.vue'

interface AnnouncementDemoItem {
  id: number
  title: string
  tag: string
  publishAt: string
  summary: string
}

const announcements = ref<AnnouncementDemoItem[]>([
  {
    id: 101,
    title: '2026 届就业信息填报提醒',
    tag: '就业',
    publishAt: '2026-04-06 10:00',
    summary: '请相关年级同学在本周内完成填报，逾期将影响后续手续办理。',
  },
  {
    id: 102,
    title: '五一假期离校登记通知',
    tag: '假期',
    publishAt: '2026-04-04 09:30',
    summary: '离校和返校均需在系统登记，外出同学请注意安全。',
  },
])

function goDetail(id: number) {
  if (!id) {
    return
  }
  uni.navigateTo({ url: `/subpackages/announcements/detail?id=${id}` })
}

function showTodo() {
  uni.showToast({ title: '发布功能待补全', icon: 'none' })
}
</script>

<template>
  <layout-shell current="announcements">
    <view class="page-container announcements-page">
      <content-panel title="信息发布" sub-title="学院通知、活动与事务消息">
        <template #default>
          <view class="action-row">
            <nut-button type="primary" @click="showTodo">发布通知（占位）</nut-button>
            <nut-button plain @click="showTodo">筛选条件（占位）</nut-button>
          </view>
        </template>
      </content-panel>

      <content-panel v-if="announcements.length" title="最新通知">
        <template #default>
          <view class="list-wrap">
            <view v-for="item in announcements" :key="item.id" class="item-card" @click="goDetail(item.id)">
              <view class="item-header">
                <text class="item-title">{{ item.title }}</text>
                <nut-tag type="primary">{{ item.tag }}</nut-tag>
              </view>
              <view class="item-summary">{{ item.summary }}</view>
              <view class="item-meta">发布时间：{{ item.publishAt }}</view>
            </view>
          </view>
        </template>
      </content-panel>

      <content-panel v-else title="通知列表">
        <template #default>
          <nut-empty image="empty" description="暂无通知" />
        </template>
      </content-panel>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.announcements-page {
  display: grid;
  gap: var(--space-3);
}

.action-row {
  display: flex;
  gap: var(--space-2);
}

.list-wrap {
  display: grid;
  gap: var(--space-3);
}

.item-card {
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: #fff;
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.item-title {
  font-weight: var(--font-weight-semibold);
}

.item-summary {
  margin-top: var(--space-2);
  color: var(--color-text-secondary);
}

.item-meta {
  margin-top: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>
