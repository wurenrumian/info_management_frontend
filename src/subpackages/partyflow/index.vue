<script setup lang="ts">
import { ref } from 'vue'
import LayoutShell from '@/components/layout-shell.vue'

const stages = ref([
  { name: '入党申请人', done: true },
  { name: '积极分子', done: true },
  { name: '发展对象', done: false },
  { name: '预备党员', done: false },
  { name: '正式党员', done: false },
])

const reminders = ref([
  '请在本月 20 日前提交思想汇报（占位提醒）',
  '本周五前完成党课学习打卡（占位提醒）',
])
</script>

<template>
  <layout-shell current="partyflow">
    <view class="page-container partyflow-page">
      <content-panel title="党团流程" sub-title="阶段进度与关键提醒">
        <template #default>
          <view class="intro">当前页面先提供稳定流程展示骨架，后续可接入实时进度与规则提醒。</view>
        </template>
      </content-panel>

      <content-panel title="入党流程（示例）">
        <template #default>
          <view class="stage-list">
            <view v-for="(item, index) in stages" :key="item.name" class="stage-item">
              <view class="stage-dot" :class="{ 'stage-dot--done': item.done }">{{ index + 1 }}</view>
              <view class="stage-content">
                <view class="stage-title">{{ item.name }}</view>
                <view class="stage-status">{{ item.done ? '已完成' : '待完成' }}</view>
              </view>
            </view>
          </view>
        </template>
      </content-panel>

      <content-panel title="关键提醒">
        <template #default>
          <nut-cell
            v-for="item in reminders"
            :key="item"
            :title="item"
            icon="notice"
          />
        </template>
      </content-panel>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.partyflow-page {
  display: grid;
  gap: var(--space-3);
}

.intro {
  color: var(--color-text-secondary);
}

.stage-list {
  display: grid;
  gap: var(--space-3);
}

.stage-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.stage-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  background: #fff;
}

.stage-dot--done {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.stage-content {
  flex: 1;
}

.stage-title {
  font-weight: var(--font-weight-semibold);
}

.stage-status {
  margin-top: 2px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
</style>
