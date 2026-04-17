<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import LayoutShell from '@/components/layout-shell.vue'
import { getAllAnnouncementDetail, getAnnouncementDetail } from '@/services/announcements'
import type { AnnouncementDetail } from '@/types/announcements'
import { isH5 } from '@/utils/platform'
import { useUserStore } from '@/stores/user'
import { UserRole } from '@/constants/enums'

const userStore = useUserStore()
const announcementId = ref(0)
const detail = ref<AnnouncementDetail | null>(null)
const loading = ref(false)
const error = ref('')
const viewMode = ref<'student' | 'admin'>('student')

const canViewAllPublished = computed(() => Number(userStore.userInfo?.role || 0) > UserRole.LEAGUE_CADRE)

const title = computed(() => detail.value?.title || (announcementId.value ? `通知 #${announcementId.value}` : '通知详情'))

async function loadDetail() {
  if (!announcementId.value) {
    error.value = '参数缺失'
    return
  }

  loading.value = true
  error.value = ''
  try {
    const shouldUseAdminView = viewMode.value === 'admin' && canViewAllPublished.value
    detail.value = shouldUseAdminView
      ? await getAllAnnouncementDetail(announcementId.value)
      : await getAnnouncementDetail(announcementId.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载详情失败'
  } finally {
    loading.value = false
  }
}

function goBack() {
  uni.navigateBack()
}

function openLink(url: string) {
  const link = String(url || '').trim()
  if (!link) {
    return
  }
  if (isH5()) {
    window.open(link, '_blank')
    return
  }
  uni.setClipboardData({ data: link })
  uni.showToast({ title: '链接已复制', icon: 'none' })
}

onLoad((query) => {
  announcementId.value = Number(query?.id || 0)
  viewMode.value = query?.view_mode === 'admin' ? 'admin' : 'student'
  loadDetail()
})
</script>

<template>
  <layout-shell current="announcements">
    <view class="page-container detail-page">
      <content-panel :title="title" sub-title="信息发布详情">
        <template #default>
          <text class="meta">通知 ID：{{ announcementId || '-' }}</text>
          <text v-if="detail?.published_at" class="meta">发布时间：{{ detail.published_at }}</text>
          <text v-if="loading" class="meta">加载中...</text>
          <nut-noticebar v-if="error" wrapable color="danger" :text="`加载失败：${error}`" />

          <view v-if="detail" class="detail-body">
            <view class="tag-row">
              <nut-tag v-for="tag in detail.tags || []" :key="`tag-${tag}`" plain type="primary">{{ tag }}</nut-tag>
            </view>
            <text class="content">{{ detail.content }}</text>

            <view v-if="detail.external_links?.length" class="section">
              <text class="section-title">相关链接</text>
              <view v-for="(link, idx) in detail.external_links" :key="`${link.url}-${idx}`" class="link-item">
                <text class="link-title">{{ link.title || '外部链接' }}</text>
                <nut-button plain size="small" @click="openLink(link.url)">打开</nut-button>
              </view>
            </view>

            <view v-if="detail.attachment_file_ids?.length" class="section">
              <text class="section-title">附件ID</text>
              <text class="meta">{{ detail.attachment_file_ids.join(', ') }}</text>
            </view>
          </view>
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

.detail-body {
  margin-top: var(--space-2);
}

.content {
  margin-top: var(--space-2);
  color: var(--color-text);
  white-space: pre-wrap;
  line-height: 1.8;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.section {
  margin-top: var(--space-3);
}

.section-title {
  display: block;
  margin-bottom: var(--space-1);
  font-weight: var(--font-weight-medium);
}

.link-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-top: var(--space-1);
}

.link-title {
  color: var(--color-text-secondary);
}

:deep(.nut-button) {
  margin-top: var(--space-3);
}
</style>
