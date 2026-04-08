<script setup lang="ts">
import { ref } from 'vue'
import LayoutShell from '@/components/layout-shell.vue'

type StageItem = {
  name: string
  done: boolean
}

// TODO: 接入 partyflow 模块 API 后，替换阶段与提醒数据。
const partyStages = ref<StageItem[]>([
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
      <content-panel title="党团流程" sub-title="展示当前阶段与关键节点提醒">
        <template #default>
          <text class="intro">当前页面先提供稳定流程展示骨架，后续可接入实时进度与规则提醒。</text>
        </template>
      </content-panel>

      <content-panel title="入党流程（示例）">
        <template #default>
          <view class="stage-list">
            <view v-for="(stage, index) in partyStages" :key="stage.name" class="stage-item">
              <view class="stage-dot" :class="{ 'stage-dot--done': stage.done }">{{ index + 1 }}</view>
              <view class="stage-content">
                <text class="stage-title">{{ stage.name }}</text>
                <text class="stage-status">{{ stage.done ? '已完成' : '待完成' }}</text>
              </view>
            </view>
          </view>
        </template>
      </content-panel>

      <content-panel title="关键提醒">
        <template #default>
          <nut-cell v-for="item in reminders" :key="item" :title="item" icon="notice" />
        </template>
      </content-panel>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.partyflow-page {
  min-height: 100vh;
}

.intro {
  display: block;
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.stage-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.stage-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.stage-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.stage-dot--done {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.stage-content {
  flex: 1;
  min-width: 0;
}

.stage-title,
.stage-status {
  display: block;
}

.stage-status {
  margin-top: 2px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
</style>
