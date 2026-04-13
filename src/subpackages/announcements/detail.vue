<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import LayoutShell from '@/components/layout-shell.vue'

const announcementId = ref(0)
const content = ref('这里是通知正文占位内容，可用于后续对接后端返回的图文正文。')

const title = computed(() => (announcementId.value ? `通知 #${announcementId.value}` : '通知详情'))

onLoad((query) => {
  const id = Number(String(query?.id || '').trim())
  announcementId.value = Number.isFinite(id) && id > 0 ? id : 0
})

function backToList() {
  uni.navigateBack()
}
</script>

<template>
  <layout-shell current="announcements">
    <view class="page-container announcements-detail-page">
      <content-panel :title="title" sub-title="信息发布详情页（占位）">
        <template #default>
          <view class="detail-meta">通知 ID：{{ announcementId || '-' }}</view>
          <view class="detail-content">{{ content }}</view>
          <nut-button plain block @click="backToList">返回通知列表</nut-button>
        </template>
      </content-panel>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.announcements-detail-page {
  display: grid;
  gap: var(--space-3);
}

.detail-meta {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.detail-content {
  margin-top: var(--space-3);
  white-space: pre-wrap;
  line-height: 1.7;
}
</style>
