<script setup lang="ts">
const statusList = [
  { label: '待处理', type: 'pending' },
  { label: '进行中', type: 'progress' },
  { label: '已完成', type: 'success' },
  { label: '已驳回', type: 'danger' },
]
</script>

<template>
  <view class="showcase-page">
    <view class="section card">
      <text class="section-title">色板</text>
      <view class="swatch-grid">
        <view class="swatch">
          <view class="color color-primary" />
          <text class="swatch-label">主色 #9D2933</text>
        </view>
        <view class="swatch">
          <view class="color color-soft" />
          <text class="swatch-label">主色浅阶 #F6E9EA</text>
        </view>
        <view class="swatch">
          <view class="color color-bg" />
          <text class="swatch-label">背景 #F7F4F1</text>
        </view>
        <view class="swatch">
          <view class="color color-border" />
          <text class="swatch-label">边框 #E7E2DD</text>
        </view>
      </view>
    </view>

    <view class="section card">
      <text class="section-title">文字层级</text>
      <text class="title-xl">一级标题：学院事务通知中心</text>
      <text class="title-lg">二级标题：本周重点通知</text>
      <text class="body-text">正文：请在规定时间内完成材料提交，逾期将影响审核进度。</text>
      <text class="caption-text">说明：发布时间 2026-04-02 14:30</text>
    </view>

    <view class="section card">
      <text class="section-title">按钮</text>
      <view class="button-row">
        <button class="btn btn-primary">主按钮</button>
        <button class="btn btn-secondary">次按钮</button>
      </view>
      <view class="button-row">
        <button class="btn btn-danger">危险按钮</button>
        <button class="btn btn-disabled" disabled>禁用按钮</button>
      </view>
    </view>

    <view class="section card">
      <text class="section-title">卡片与标签</text>
      <view class="notice-card">
        <view class="notice-head">
          <text class="notice-title">关于近期学业奖学金评定安排的通知</text>
          <text class="tag tag-primary">重要</text>
        </view>
        <text class="notice-desc">请符合条件的同学于本周五前提交申请材料，具体流程见附件说明。</text>
        <text class="notice-time">发布于 2026-04-02</text>
      </view>
    </view>

    <view class="section card">
      <text class="section-title">流程状态</text>
      <view class="status-row">
        <view
          v-for="item in statusList"
          :key="item.label"
          class="status-chip"
          :class="`status-${item.type}`"
        >
          {{ item.label }}
        </view>
      </view>
    </view>

    <view class="section card">
      <text class="section-title">表单与空状态</text>
      <view class="field-wrap">
        <text class="field-label">请假事由</text>
        <input class="field-input" placeholder="请输入请假事由" />
      </view>
      <view class="empty-box">
        <text class="empty-title">暂无新的通知</text>
        <text class="empty-desc">系统将在有新消息时第一时间提醒你</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
@use '../../styles/mixins.scss' as mixins;

.showcase-page {
  min-height: 100vh;
  padding: var(--space-3);
}

.section {
  margin-bottom: var(--space-3);
}

.card {
  @include mixins.card-base;
  padding: var(--space-3);
}

.section-title {
  display: block;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-2);
}

.swatch-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
}

.swatch {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.color {
  height: 48px;
}

.color-primary {
  background: var(--color-primary);
}

.color-soft {
  background: var(--color-primary-soft);
}

.color-bg {
  background: var(--color-bg);
}

.color-border {
  background: var(--color-border);
}

.swatch-label {
  display: block;
  font-size: var(--font-size-xs);
  padding: var(--space-1);
  color: var(--color-text-secondary);
}

.title-xl {
  display: block;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

.title-lg {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
}

.body-text {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--font-size-md);
}

.caption-text {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.button-row {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.btn {
  flex: 1;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.btn-primary {
  @include mixins.button-primary;
}

.btn-secondary {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
}

.btn-danger {
  border: 1px solid var(--color-danger);
  background: var(--color-danger);
  color: #fff;
}

.btn-disabled {
  border: 1px solid var(--color-border);
  background: #f0efed;
  color: #a1a1a1;
}

.notice-card {
  @include mixins.card-base;
  padding: var(--space-2);
}

.notice-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
}

.notice-title {
  flex: 1;
  font-weight: var(--font-weight-semibold);
  @include mixins.ellipsis-double;
}

.notice-desc {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  @include mixins.ellipsis-double;
}

.notice-time {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.tag {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: var(--font-size-xs);
}

.tag-primary {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.status-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.status-chip {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: var(--font-size-xs);
}

.status-pending {
  background: #efe7db;
  color: var(--color-warning);
}

.status-progress {
  background: #e8eefc;
  color: #2f4c99;
}

.status-success {
  background: #e6f3ea;
  color: var(--color-success);
}

.status-danger {
  background: #f8eaea;
  color: var(--color-danger);
}

.field-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.field-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.field-input {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  height: 40px;
  padding: 0 var(--space-2);
}

.empty-box {
  margin-top: var(--space-3);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-primary-soft);
  padding: var(--space-3);
  text-align: center;
}

.empty-title {
  display: block;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
}

.empty-desc {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>
