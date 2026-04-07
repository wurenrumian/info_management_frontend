<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import LayoutShell from '@/components/layout-shell.vue'
import { getFileList, uploadFile, type UploadedFile } from '@/services/file'
import { bindKnowledgeAttachments, detachKnowledgeAttachment, getKnowledgeAttachments } from '@/services/knowledge'
import type { KnowledgeAttachment } from '@/types/knowledge'
import { useUserStore } from '@/stores/user'
import { UserRole } from '@/constants/enums'

const LIMIT = 50

const userStore = useUserStore()
const hasPermission = computed(() => Number(userStore.userInfo?.role || 0) >= UserRole.LEAGUE_CADRE)

const knowledgeId = ref(0)
const loading = ref(true)
const saving = ref(false)
const uploading = ref(false)
const error = ref('')

const uploadedFiles = ref<UploadedFile[]>([])
const selectedIds = ref<number[]>([])
const boundAttachments = ref<KnowledgeAttachment[]>([])

async function loadData() {
  if (!hasPermission.value || !knowledgeId.value) {
    loading.value = false
    return
  }

  loading.value = true
  error.value = ''
  try {
    const [filesRes, attachedRes] = await Promise.all([
      getFileList({ limit: LIMIT, offset: 0 }),
      getKnowledgeAttachments(knowledgeId.value),
    ])
    uploadedFiles.value = filesRes.data
    boundAttachments.value = attachedRes
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function toggleFile(fileId: number) {
  const index = selectedIds.value.indexOf(fileId)
  if (index >= 0) {
    selectedIds.value.splice(index, 1)
    return
  }
  selectedIds.value.push(fileId)
}

async function bindSelected() {
  if (!knowledgeId.value) {
    return
  }
  if (selectedIds.value.length === 0) {
    uni.showToast({ title: '请先选择文件', icon: 'none' })
    return
  }

  saving.value = true
  try {
    const res = await bindKnowledgeAttachments(knowledgeId.value, selectedIds.value)
    selectedIds.value = []
    boundAttachments.value = res.attachments || []
    uni.showToast({ title: `绑定完成，新增${res.added_count}`, icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '绑定失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

function pickLocalFiles() {
  const chooser = (uni as unknown as { chooseMessageFile?: Function; chooseFile?: Function })
  return new Promise<Array<{ path: string; name: string }>>((resolve, reject) => {
    const onSuccess = (res: { tempFiles?: Array<{ name?: string; path?: string; size?: number }> }) => {
      const picked = (res.tempFiles || [])
        .map((item) => ({
          name: String(item.name || ''),
          path: String(item.path || ''),
        }))
        .filter((item) => item.path)
      resolve(picked)
    }

    const onFail = (err: unknown) => reject(err)

    if (typeof chooser.chooseMessageFile === 'function') {
      chooser.chooseMessageFile({ count: 10, type: 'file', success: onSuccess, fail: onFail })
      return
    }

    if (typeof chooser.chooseFile === 'function') {
      chooser.chooseFile({ count: 10, type: 'all', success: onSuccess, fail: onFail })
      return
    }

    reject(new Error('当前端不支持文件选择'))
  })
}

async function uploadAndRefresh() {
  if (!hasPermission.value) {
    return
  }

  uploading.value = true
  try {
    const picked = await pickLocalFiles()
    if (picked.length === 0) {
      return
    }

    for (const item of picked) {
      await uploadFile(item.path, 'knowledge')
    }

    uni.showToast({ title: `上传成功 ${picked.length} 个`, icon: 'success' })
    const filesRes = await getFileList({ limit: LIMIT, offset: 0 })
    uploadedFiles.value = filesRes.data
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '上传失败', icon: 'none' })
  } finally {
    uploading.value = false
  }
}

async function detachOne(fileId?: number) {
  const id = Number(fileId || 0)
  if (!knowledgeId.value || !id) {
    return
  }

  try {
    await detachKnowledgeAttachment(knowledgeId.value, id)
    uni.showToast({ title: '已解绑', icon: 'success' })
    boundAttachments.value = boundAttachments.value.filter((item) => Number(item.file_id || 0) !== id)
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '解绑失败', icon: 'none' })
  }
}

onLoad((query) => {
  const id = Number(query?.id || 0)
  knowledgeId.value = id
  if (!id) {
    loading.value = false
    error.value = '参数错误：缺少知识条目ID'
    return
  }
  loadData()
})
</script>

<template>
  <layout-shell current="knowledge">
    <view class="bind-page page-container">
      <content-panel v-if="!hasPermission" title="无权限访问" />

      <content-panel v-else-if="loading" title="附件管理">
        <template #default>
          <nut-empty image="empty" description="加载中..." />
        </template>
      </content-panel>

      <nut-noticebar v-else-if="error" color="danger" wrapable :text="error" />

      <template v-else>
        <content-panel title="当前已绑定附件">
          <template #default>
          <view v-if="boundAttachments.length > 0" class="list">
            <view v-for="item in boundAttachments" :key="`${item.file_id}-${item.title}`" class="row">
              <view class="col">
                <text class="name">{{ item.title }}</text>
                <text class="meta">file_id: {{ item.file_id || '-' }}</text>
              </view>
              <nut-button type="danger" size="small" @click="detachOne(item.file_id)">解绑</nut-button>
            </view>
          </view>
          <text v-else class="meta">暂无绑定附件</text>
          </template>
        </content-panel>

        <content-panel title="从已上传文件中选择并绑定">
          <template #default>
          <text class="meta">仅展示最近 {{ LIMIT }} 条上传记录</text>
          <nut-button plain :loading="uploading" @click="uploadAndRefresh">上传新文件</nut-button>
          <view v-if="uploadedFiles.length > 0" class="list">
            <view
              v-for="file in uploadedFiles"
              :key="file.id"
              class="row selectable"
              :class="{ 'row--active': selectedIds.includes(file.id) }"
              @tap="toggleFile(file.id)"
            >
              <view class="col">
                <text class="name">{{ file.title }}</text>
                <text class="meta">ID {{ file.id }} · {{ file.content_type || '-' }}</text>
              </view>
              <nut-tag :type="selectedIds.includes(file.id) ? 'primary' : 'default'">{{ selectedIds.includes(file.id) ? '已选择' : '点击选择' }}</nut-tag>
            </view>
          </view>
          <text v-else class="meta">暂无可绑定文件，请先在文件模块上传</text>

          <nut-button type="primary" block :loading="saving" @click="bindSelected">绑定所选文件</nut-button>
          </template>
        </content-panel>
      </template>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.bind-page {
  min-height: 100vh;
}

.title {
  display: block;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.desc,
.meta {
  display: block;
  margin-top: var(--space-1);
  color: var(--color-text-secondary);
}

.list {
  margin-top: var(--space-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.row.selectable {
  cursor: pointer;
}

.row--active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}

.col {
  flex: 1;
}

.name {
  display: block;
}

</style>
