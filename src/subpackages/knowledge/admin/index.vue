<script setup lang="ts">
import { computed, ref } from 'vue'
import LayoutShell from '@/components/layout-shell.vue'
import { deleteKnowledge, getAdminKnowledgeList } from '@/services/knowledge'
import type { KnowledgeItem } from '@/types/knowledge'
import { useUserStore } from '@/stores/user'
import { UserRole } from '@/constants/enums'

const LIMIT = 20

const userStore = useUserStore()
const keyword = ref('')
const items = ref<KnowledgeItem[]>([])
const total = ref(0)
const offset = ref(0)
const loading = ref(false)
const error = ref('')

const hasPermission = computed(() => Number(userStore.userInfo?.role || 0) >= UserRole.LEAGUE_CADRE)
const canUseAIGenerate = computed(() => Number(userStore.userInfo?.role || 0) >= UserRole.TEACHER)
const canDeleteKnowledge = computed(() => Number(userStore.userInfo?.role || 0) >= UserRole.TEACHER)
const isEmpty = computed(() => !loading.value && items.value.length === 0 && !error.value)
const canPrev = computed(() => offset.value > 0)
const canNext = computed(() => offset.value + LIMIT < total.value)

async function loadList() {
  if (!hasPermission.value) {
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await getAdminKnowledgeList({ query: keyword.value.trim(), limit: LIMIT, offset: offset.value })
    items.value = res.data
    total.value = res.total
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function onSearch() {
  offset.value = 0
  loadList()
}

function onReset() {
  keyword.value = ''
  offset.value = 0
  loadList()
}

function prevPage() {
  if (!canPrev.value) {
    return
  }
  offset.value = Math.max(0, offset.value - LIMIT)
  loadList()
}

function nextPage() {
  if (!canNext.value) {
    return
  }
  offset.value += LIMIT
  loadList()
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/subpackages/knowledge/admin/detail?id=${id}` })
}

function goCreate() {
  uni.navigateTo({ url: '/subpackages/knowledge/admin/form' })
}

function goEdit(id: number) {
  uni.navigateTo({ url: `/subpackages/knowledge/admin/form?id=${id}` })
}

function goAttachment(id: number) {
  uni.navigateTo({ url: `/subpackages/knowledge/admin/import?id=${id}` })
}

function goFileUpload() {
  uni.navigateTo({ url: '/subpackages/knowledge/admin/files' })
}

function goAIGenerate() {
  uni.navigateTo({ url: '/subpackages/knowledge/admin/ai-generate' })
}

function removeItem(id: number) {
  uni.showModal({
    title: '确认删除',
    content: '删除后不可恢复，是否继续？',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      try {
        await deleteKnowledge(id)
        uni.showToast({ title: '删除成功', icon: 'success' })
        if (items.value.length === 1 && offset.value > 0) {
          offset.value = Math.max(0, offset.value - LIMIT)
        }
        loadList()
      } catch (e) {
        uni.showToast({ title: e instanceof Error ? e.message : '删除失败', icon: 'none' })
      }
    },
  })
}

loadList()
</script>

<template>
  <layout-shell current="knowledge">
    <view class="admin-page page-container">
      <content-panel v-if="!hasPermission" title="无权限访问">
        <template #default>
          <nut-noticebar text="仅团学干部及以上角色可管理知识库" color="danger" />
        </template>
      </content-panel>

      <template v-else>
        <content-panel class="toolbar" title="知识库管理">
          <template #default>
          <nut-input v-model="keyword" placeholder="输入关键词筛选" @confirm="onSearch" />
          <view class="button-row">
            <nut-button type="primary" @click="onSearch">搜索</nut-button>
            <nut-button plain @click="onReset">重置</nut-button>
            <nut-button plain @click="goCreate">新增</nut-button>
            <nut-button plain @click="goFileUpload">文档上传</nut-button>
            <nut-button v-if="canUseAIGenerate" plain @click="goAIGenerate">AI 生成问答</nut-button>
          </view>
          </template>
        </content-panel>

        <nut-noticebar v-if="error" wrapable color="danger" :text="`加载失败：${error}`" />

        <nut-empty v-else-if="isEmpty" image="empty" description="暂无数据" />

        <view v-else class="list-wrap">
          <content-panel v-for="item in items" :key="item.id" class="item-card">
            <template #default>
            <text class="item-title">{{ item.question }}</text>
            <text class="item-meta">关键词：{{ (item.keywords || []).join(' / ') || '无' }}</text>
            <view class="button-row">
              <nut-button plain @click="goDetail(item.id)">详情</nut-button>
              <nut-button plain @click="goEdit(item.id)">编辑</nut-button>
              <nut-button plain @click="goAttachment(item.id)">附件</nut-button>
              <nut-button v-if="canDeleteKnowledge" type="danger" @click="removeItem(item.id)">删除</nut-button>
            </view>
            </template>
          </content-panel>

          <content-panel class="pager">
            <template #default>
            <text>共 {{ total }} 条，当前偏移 {{ offset }}</text>
            <view class="button-row">
              <nut-button plain :disabled="!canPrev || loading" @click="prevPage">上一页</nut-button>
              <nut-button plain :disabled="!canNext || loading" @click="nextPage">下一页</nut-button>
            </view>
            </template>
          </content-panel>
        </view>
      </template>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.admin-page {
  min-height: 100vh;
}

.toolbar {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.list-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.item-title,
.title {
  display: block;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

.item-meta,
.desc {
  display: block;
  margin-top: var(--space-1);
  color: var(--color-text-secondary);
}

:deep(.nut-input) {
  margin-bottom: 10px;
}
</style>
