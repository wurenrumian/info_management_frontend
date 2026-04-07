<script setup lang="ts">
const statusList = [
  { label: '待处理', type: 'pending' },
  { label: '进行中', type: 'progress' },
  { label: '已完成', type: 'success' },
  { label: '已驳回', type: 'danger' },
]
</script>

<template>
  <view class="showcase-page page-container">
    <content-panel title="样式预览" sub-title="用于页面样式自检">
      <template #default>
        <text class="intro-text">当前页面用于快速检查按钮、标签、表单和空态的展示效果。</text>
      </template>
    </content-panel>

    <content-panel title="按钮">
      <template #default>
        <view class="button-row">
          <nut-button type="primary">主按钮</nut-button>
          <nut-button plain>次按钮</nut-button>
          <nut-button type="danger">危险按钮</nut-button>
        </view>
      </template>
    </content-panel>

    <content-panel title="标签与状态">
      <template #default>
        <view class="status-row">
          <nut-tag v-for="item in statusList" :key="item.label" :type="item.type === 'danger' ? 'danger' : 'primary'">
            {{ item.label }}
          </nut-tag>
        </view>
      </template>
    </content-panel>

    <content-panel title="表单组件">
      <template #default>
        <nut-input placeholder="请输入请假事由" />
        <nut-textarea placeholder="请输入详细说明" />
      </template>
    </content-panel>

    <content-panel title="空态">
      <template #default>
        <nut-empty image="empty" description="暂无新的通知" />
      </template>
    </content-panel>
  </view>
</template>

<style scoped lang="scss">
.showcase-page {
  min-height: 100vh;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.intro-text {
  display: block;
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.status-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

:deep(.nut-textarea) {
  margin-top: 10px;
}
</style>
