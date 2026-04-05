<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import LayoutShell from '@/components/layout-shell.vue'
import { getAdminKnowledgeDetail, getKnowledgeAttachments } from '@/services/knowledge'
import type { KnowledgeAttachment, KnowledgeItem } from '@/types/knowledge'
import { useUserStore } from '@/stores/user'
import { UserRole } from '@/constants/enums'

const userStore = useUserStore()
const loading = ref(true)
const error = ref('')
const detail = ref<KnowledgeItem | null>(null)
const attachments = ref<KnowledgeAttachment[]>([])
const currentId = ref(0)

const hasPermission = computed(() => Number(userStore.userInfo?.role || 0) >= UserRole.LEAGUE_CADRE)

async function loadDetail(id: number) {
  if (!hasPermission.value) {
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  try {
    const [detailRes, attachmentRes] = await Promise.all([getAdminKnowledgeDetail(id), getKnowledgeAttachments(id)])
    detail.value = detailRes
    attachments.value = attachmentRes
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function goEdit() {
  if (!currentId.value) {
    return
  }
  uni.navigateTo({ url: `/subpackages/knowledge/admin/form?id=${currentId.value}` })
}

function goAttachmentManage() {
  if (!currentId.value) {
    return
  }
  uni.navigateTo({ url: `/subpackages/knowledge/admin/import?id=${currentId.value}` })
}

onLoad((query) => {
  const id = Number(query?.id || 0)
  currentId.value = id
  if (!id) {
    loading.value = false
    error.value = '参数错误：缺少知识ID'
    return
  }
  loadDetail(id)
})
</script>

<template>
  <layout-shell current="knowledge">
    <view class="detail-page">
      <view v-if="!hasPermission" class="card state-card state-card--error">
        <text class="title">无权限访问</text>
      </view>

      <view v-else-if="loading" class="card state-card">
        <text>加载中...</text>
      </view>

      <view v-else-if="error" class="card state-card state-card--error">
        <text class="title">加载失败</text>
        <text class="desc">{{ error }}</text>
      </view>

      <view v-else-if="detail" class="card content-card">
        <text class="title">{{ detail.question }}</text>
        <text class="row"><text class="label">答案：</text>{{ detail.answer }}</text>
        <text class="row"><text class="label">关键词：</text>{{ (detail.keywords || []).join(' / ') || '无' }}</text>
        <text class="row"><text class="label">附件：</text>{{ attachments.map((item) => item.title).join('、') || '无' }}</text>
        <text class="row"><text class="label">创建人：</text>{{ detail.created_by }}</text>
        <text class="row"><text class="label">更新人：</text>{{ detail.updated_by || '-' }}</text>
        <text class="row"><text class="label">创建时间：</text>{{ detail.created_at || '-' }}</text>
        <text class="row"><text class="label">更新时间：</text>{{ detail.updated_at || '-' }}</text>
        <button class="btn" @tap="goEdit">编辑条目</button>
        <button class="btn" @tap="goAttachmentManage">管理附件</button>
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

.row {
  display: block;
  margin-top: var(--space-2);
  white-space: pre-wrap;
}

.label,
.desc {
  color: var(--color-text-secondary);
}

.btn {
  margin-top: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  background: #fff;
}

.state-card--error {
  border-color: #f3c2c2;
}
</style>
