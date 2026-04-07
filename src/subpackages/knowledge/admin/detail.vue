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
    <view class="detail-page page-container">
      <content-panel v-if="!hasPermission" title="无权限访问" />

      <content-panel v-else-if="loading" title="管理详情">
        <template #default>
          <nut-empty image="empty" description="加载中..." />
        </template>
      </content-panel>

      <nut-noticebar v-else-if="error" color="danger" wrapable :text="error" />

      <content-panel v-else-if="detail" :title="detail.question" sub-title="管理详情">
        <template #default>
          <nut-cell title="答案" :desc="detail.answer" />
          <nut-cell title="关键词" :desc="(detail.keywords || []).join(' / ') || '无'" />
          <nut-cell title="附件" :desc="attachments.map((item) => item.title).join('、') || '无'" />
          <nut-cell title="创建人" :desc="String(detail.created_by)" />
          <nut-cell title="更新人" :desc="String(detail.updated_by || '-')" />
          <nut-cell title="创建时间" :desc="String(detail.created_at || '-')" />
          <nut-cell title="更新时间" :desc="String(detail.updated_at || '-')" />
          <view class="action-group">
            <nut-button plain @click="goEdit">编辑条目</nut-button>
            <nut-button plain @click="goAttachmentManage">管理附件</nut-button>
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

</style>
