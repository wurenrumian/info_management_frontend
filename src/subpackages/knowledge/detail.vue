<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import LayoutShell from '@/components/layout-shell.vue'
import { getKnowledgeDetail } from '@/services/knowledge'
import { resolveFileAccessUrl } from '@/services/file'
import { isH5 } from '@/utils/platform'
import type { KnowledgeItem } from '@/types/knowledge'

const loading = ref(true)
const error = ref('')
const detail = ref<KnowledgeItem | null>(null)

async function loadDetail(id: number) {
  loading.value = true
  error.value = ''
  try {
    detail.value = await getKnowledgeDetail(id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function openAttachment(url?: string) {
  const link = String(url || '').trim()
  if (!link) {
    uni.showToast({ title: '该附件暂无可用链接', icon: 'none' })
    return
  }

  const finalUrl = resolveFileAccessUrl(link)

  if (isH5()) {
    window.open(finalUrl, '_blank')
    return
  }

  uni.downloadFile({
    url: finalUrl,
    success: (res) => {
      uni.openDocument({
        filePath: res.tempFilePath,
        fail: () => {
          uni.setClipboardData({ data: finalUrl })
        },
      })
    },
    fail: () => {
      uni.setClipboardData({ data: finalUrl })
    },
  })
}

onLoad((query) => {
  const id = Number(query?.id || 0)
  if (!id) {
    error.value = '参数错误：缺少知识ID'
    loading.value = false
    return
  }
  loadDetail(id)
})
</script>

<template>
  <layout-shell current="knowledge">
    <view class="detail-page page-container">
      <content-panel v-if="loading" title="知识详情">
        <template #default>
          <nut-empty image="empty" description="加载中..." />
        </template>
      </content-panel>

      <content-panel v-else-if="error" title="加载失败">
        <template #default>
          <nut-noticebar wrapable color="danger" :text="error" />
        </template>
      </content-panel>

      <content-panel v-else-if="detail" :title="detail.question" sub-title="知识问答详情">
        <template #default>
        <text class="title">{{ detail.question }}</text>
        <text class="desc">{{ detail.answer }}</text>

        <view class="section">
          <text class="label">关键词</text>
          <text class="desc">{{ (detail.keywords || []).join(' / ') || '无' }}</text>
        </view>

        <view class="section">
          <text class="label">附件</text>
          <view v-if="(detail.attachments || []).length > 0" class="attachment-list">
            <view v-for="(attachment, index) in detail.attachments" :key="`${attachment.title}-${index}`" class="attachment-item">
              <text class="attachment-title">{{ attachment.title }}</text>
              <nut-button plain :disabled="!attachment.url" @click="openAttachment(attachment.url)">
                {{ attachment.url ? '打开附件' : '暂无链接' }}
              </nut-button>
            </view>
          </view>
          <text v-else class="desc">无附件</text>
        </view>
        </template>
      </content-panel>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.detail-page {
  min-height: 100vh;
}

.title {
  display: block;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.label {
  display: block;
  margin-bottom: var(--space-1);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.desc {
  display: block;
  margin-top: var(--space-2);
  color: var(--color-text-primary);
  white-space: pre-wrap;
}

.section {
  margin-top: var(--space-3);
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.attachment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.attachment-title {
  flex: 1;
}

:deep(.nut-button) {
  margin: 0;
}
</style>
