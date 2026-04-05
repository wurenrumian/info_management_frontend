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
    <view class="admin-page">
      <view v-if="!hasPermission" class="card state-card state-card--error">
        <text class="title">无权限访问</text>
        <text class="desc">仅团学干部及以上角色可管理知识库</text>
      </view>

      <template v-else>
        <view class="card toolbar">
          <input v-model="keyword" class="input" placeholder="输入关键词筛选" @confirm="onSearch" />
          <view class="button-row">
            <button class="btn primary" @tap="onSearch">搜索</button>
            <button class="btn" @tap="onReset">重置</button>
            <button class="btn" @tap="goCreate">新增</button>
            <button class="btn" @tap="goFileUpload">文档上传</button>
            <button v-if="canUseAIGenerate" class="btn" @tap="goAIGenerate">AI 生成问答</button>
          </view>
        </view>

        <view v-if="error" class="card state-card state-card--error">
          <text class="title">加载失败</text>
          <text class="desc">{{ error }}</text>
        </view>

        <view v-else-if="isEmpty" class="card state-card">
          <text class="title">暂无数据</text>
        </view>

        <view v-else class="list-wrap">
          <view v-for="item in items" :key="item.id" class="card item-card">
            <text class="item-title">{{ item.question }}</text>
            <text class="item-meta">关键词：{{ (item.keywords || []).join(' / ') || '无' }}</text>
            <view class="button-row">
              <button class="btn" @tap="goDetail(item.id)">详情</button>
              <button class="btn" @tap="goEdit(item.id)">编辑</button>
              <button class="btn" @tap="goAttachment(item.id)">附件</button>
              <button v-if="canDeleteKnowledge" class="btn danger" @tap="removeItem(item.id)">删除</button>
            </view>
          </view>

          <view class="card pager">
            <text>共 {{ total }} 条，当前偏移 {{ offset }}</text>
            <view class="button-row">
              <button class="btn" :disabled="!canPrev || loading" @tap="prevPage">上一页</button>
              <button class="btn" :disabled="!canNext || loading" @tap="nextPage">下一页</button>
            </view>
          </view>
        </view>
      </template>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.admin-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.card {
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.toolbar {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.input {
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 var(--space-2);
  background: #fff;
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

.btn {
  margin: 0;
  background: #fff;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  border-radius: var(--radius-md);
}

.btn.primary {
  background: var(--color-primary);
  color: #fff;
}

.btn.danger {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.state-card--error {
  border-color: #f3c2c2;
}
</style>
