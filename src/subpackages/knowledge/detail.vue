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
    <view class="detail-page">
      <view v-if="loading" class="card state-card">
        <text>加载中...</text>
      </view>

      <view v-else-if="error" class="card state-card state-card--error">
        <text class="title">加载失败</text>
        <text class="desc">{{ error }}</text>
      </view>

      <view v-else-if="detail" class="card content-card">
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
              <button class="btn" :disabled="!attachment.url" @tap="openAttachment(attachment.url)">
                {{ attachment.url ? '打开附件' : '暂无链接' }}
              </button>
            </view>
          </view>
          <text v-else class="desc">无附件</text>
        </view>
      </view>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.detail-page {
  display: flex;
  flex-direction: column;
}

.card {
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
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

.btn {
  margin: 0;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  background: #fff;
  border-radius: var(--radius-md);
}

.state-card--error {
  border-color: #f3c2c2;
}
</style>
