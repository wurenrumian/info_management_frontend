<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import LayoutShell from '@/components/layout-shell.vue'

const announcementId = ref(0)

const title = computed(() => (announcementId.value ? `通知 #${announcementId.value}` : '通知详情'))

// TODO: 接入 getAnnouncementDetail 后替换详情来源。
const content = ref('这里是通知正文占位内容，可用于后续对接后端返回的图文正文。')

function goBack() {
  uni.navigateBack()
}

onLoad((query) => {
  announcementId.value = Number(query?.id || 0)
})
</script>

<template>
  <layout-shell current="announcements">
    <view class="page-container detail-page">
      <content-panel :title="title" sub-title="信息发布详情页（占位）">
        <template #default>
          <text class="meta">通知 ID：{{ announcementId || '-' }}</text>
          <text class="content">{{ content }}</text>
          <nut-button plain @click="goBack">返回列表</nut-button>
        </template>
      </content-panel>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.detail-page {
  min-height: 100vh;
}

.meta,
.content {
  display: block;
  color: var(--color-text-secondary);
}

.content {
  margin-top: var(--space-2);
  color: var(--color-text);
  white-space: pre-wrap;
  line-height: 1.8;
}

:deep(.nut-button) {
  margin-top: var(--space-3);
}
</style>
