<script setup lang="ts">
import { computed, ref } from 'vue'
import LayoutShell from '@/components/layout-shell.vue'
import { searchKnowledge } from '@/services/knowledge'
import { resolveFileAccessUrl, searchFiles, type SearchFileItem } from '@/services/file'
import type { KnowledgeItem } from '@/types/knowledge'
import { useUserStore } from '@/stores/user'
import { UserRole } from '@/constants/enums'
import { isH5 } from '@/utils/platform'

const LIMIT = 20
type SearchMode = 'knowledge' | 'file'

const userStore = useUserStore()
const mode = ref<SearchMode>('knowledge')
const keyword = ref('')
const knowledgeItems = ref<KnowledgeItem[]>([])
const fileItems = ref<SearchFileItem[]>([])
const total = ref(0)
const offset = ref(0)
const loading = ref(false)
const error = ref('')
const searched = ref(false)

const canManage = computed(() => {
  const role = Number(userStore.userInfo?.role || 0)
  return role >= UserRole.LEAGUE_CADRE
})

const isEmpty = computed(() => searched.value && !loading.value && currentList.value.length === 0 && !error.value)
const hasMore = computed(() => currentList.value.length < total.value)
const currentList = computed(() => (mode.value === 'knowledge' ? knowledgeItems.value : fileItems.value))

const searchTitle = computed(() => (mode.value === 'knowledge' ? '政策知识库' : '文档检索'))
const searchSubtitle = computed(() =>
  mode.value === 'knowledge'
    ? '输入关键词，快速获取标准答案与附件链接'
    : '按标题和文档正文检索历史上传文档',
)

function switchMode(nextMode: SearchMode) {
  if (mode.value === nextMode) {
    return
  }
  mode.value = nextMode
  error.value = ''
  searched.value = false
  total.value = 0
  offset.value = 0
  knowledgeItems.value = []
  fileItems.value = []
}

async function runSearch(append = false) {
  const q = keyword.value.trim()
  if (!q) {
    uni.showToast({ title: '请输入关键词', icon: 'none' })
    return
  }

  loading.value = true
  error.value = ''
  searched.value = true

  try {
    const currentOffset = append ? offset.value : 0
    if (mode.value === 'knowledge') {
      const res = await searchKnowledge({ q, limit: LIMIT, offset: currentOffset })
      total.value = res.total
      knowledgeItems.value = append ? [...knowledgeItems.value, ...res.data] : res.data
    } else {
      const res = await searchFiles({ q, limit: LIMIT, offset: currentOffset })
      total.value = res.total
      fileItems.value = append ? [...fileItems.value, ...res.data] : res.data
    }
    offset.value = currentOffset + LIMIT
  } catch (e) {
    error.value = e instanceof Error ? e.message : '搜索失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/subpackages/knowledge/detail?id=${id}` })
}

function goAdmin() {
  uni.navigateTo({ url: '/subpackages/knowledge/admin/index' })
}

function openFile(url?: string) {
  const finalUrl = resolveFileAccessUrl(String(url || '').trim())
  if (!finalUrl) {
    uni.showToast({ title: '附件链接无效', icon: 'none' })
    return
  }

  if (isH5()) {
    window.open(finalUrl, '_blank')
    return
  }

  uni.downloadFile({
    url: finalUrl,
    success: (res) => {
      uni.openDocument({
        filePath: res.tempFilePath,
        fail: () => uni.setClipboardData({ data: finalUrl }),
      })
    },
    fail: () => uni.setClipboardData({ data: finalUrl }),
  })
}
</script>

<template>
  <layout-shell current="knowledge">
    <view class="knowledge-page page-container">
      <content-panel class="search-card" title="知识检索" :sub-title="searchSubtitle">
        <template #default>
        <view class="mode-row">
          <nut-button :type="mode === 'knowledge' ? 'primary' : 'default'" size="small" @click="switchMode('knowledge')">问答搜索</nut-button>
          <nut-button :type="mode === 'file' ? 'primary' : 'default'" size="small" @click="switchMode('file')">文档搜索</nut-button>
        </view>
        <view class="search-row">
          <nut-input v-model="keyword" placeholder="例如：休学、奖学金、补办证明" @confirm="runSearch(false)" />
          <nut-button type="primary" :loading="loading" @click="runSearch(false)">搜索</nut-button>
        </view>
        </template>
      </content-panel>

      <nut-cell v-if="canManage" title="知识库管理" desc="新增、编辑、删除与导入知识条目" icon="setting" is-link @click="goAdmin" />

      <nut-noticebar v-if="error" wrapable color="danger" :text="`搜索失败：${error}`" />

      <nut-empty v-else-if="isEmpty" image="empty" description="暂无匹配结果，可尝试更短关键词" />

      <view v-else-if="knowledgeItems.length > 0 && mode === 'knowledge'" class="list-wrap">
        <view v-for="item in knowledgeItems" :key="item.id" class="item-card" @tap="goDetail(item.id)">
          <content-panel>
            <template #default>
              <text class="item-title">{{ item.question }}</text>
              <text class="item-meta">关键词：{{ (item.keywords || []).join(' / ') || '无' }}</text>
              <text class="item-meta">更新时间：{{ item.updated_at || '-' }}</text>
            </template>
          </content-panel>
        </view>
        <nut-button v-if="hasMore" plain :loading="loading" @click="runSearch(true)">加载更多</nut-button>
      </view>

      <view v-else-if="fileItems.length > 0 && mode === 'file'" class="list-wrap">
        <content-panel v-for="item in fileItems" :key="`file-${item.id}`" class="item-card">
          <template #default>
            <text class="item-title">{{ item.title }}</text>
            <text class="item-meta">文件ID：{{ item.id }} · {{ item.content_type || '-' }}</text>
            <text v-if="item.snippet" class="item-meta">{{ item.snippet }}</text>
            <nut-button plain @click="openFile(item.url || item.file_path)">打开文档</nut-button>
          </template>
        </content-panel>
        <nut-button v-if="hasMore" plain :loading="loading" @click="runSearch(true)">加载更多</nut-button>
      </view>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.knowledge-page {
  min-height: 100vh;
}

.search-row {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
  align-items: center;
}

.mode-row {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.list-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.item-card {
  cursor: pointer;
}

.item-title {
  display: block;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
}

.item-meta {
  display: block;
  margin-top: var(--space-1);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

:deep(.nut-input) {
  flex: 1;
}
</style>
