<script setup lang="ts">
import { computed, ref } from 'vue'
import LayoutShell from '@/components/layout-shell.vue'
import { deleteFile, getFileList, searchFiles, uploadFile, type SearchFileItem, type UploadedFile } from '@/services/file'
import { useUserStore } from '@/stores/user'
import { UserRole } from '@/constants/enums'

const LIMIT = 50
const DOC_EXT = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx'])

const userStore = useUserStore()
const hasPermission = computed(() => Number(userStore.userInfo?.role || 0) >= UserRole.LEAGUE_CADRE)
const isSuperAdmin = computed(() => Number(userStore.userInfo?.role || 0) === UserRole.SUPER_ADMIN)

const loading = ref(true)
const uploading = ref(false)
const files = ref<UploadedFile[]>([])
const searchKeyword = ref('')
const searching = ref(false)
const searchResults = ref<SearchFileItem[]>([])
const searchTotal = ref(0)
const searched = ref(false)
const error = ref('')

function getExt(name: string) {
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : ''
}

function isDocFile(file: UploadedFile) {
  return DOC_EXT.has(getExt(String(file.title || '')))
}

async function loadFiles() {
  if (!hasPermission.value) {
    loading.value = false
    return
  }

  loading.value = true
  error.value = ''
  try {
    const res = await getFileList({ limit: LIMIT, offset: 0 })
    files.value = res.data.filter(isDocFile)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function pickLocalFiles() {
  const chooser = (uni as unknown as { chooseMessageFile?: Function; chooseFile?: Function })
  return new Promise<Array<{ path: string; name: string }>>((resolve, reject) => {
    const onSuccess = (res: { tempFiles?: Array<{ name?: string; path?: string }> }) => {
      const picked = (res.tempFiles || [])
        .map((item) => ({ name: String(item.name || ''), path: String(item.path || '') }))
        .filter((item) => item.path && DOC_EXT.has(getExt(item.name)))
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

async function uploadDocs() {
  if (!hasPermission.value) {
    return
  }

  uploading.value = true
  try {
    const picked = await pickLocalFiles()
    if (picked.length === 0) {
      uni.showToast({ title: '请先选择文档文件', icon: 'none' })
      return
    }

    for (const file of picked) {
      await uploadFile(file.path, 'knowledge')
    }

    uni.showToast({ title: `上传成功 ${picked.length} 个`, icon: 'success' })
    await loadFiles()
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '上传失败', icon: 'none' })
  } finally {
    uploading.value = false
  }
}

async function runSearch() {
  const q = searchKeyword.value.trim()
  if (!q) {
    uni.showToast({ title: '请输入检索关键词', icon: 'none' })
    return
  }

  searching.value = true
  searched.value = true
  try {
    const res = await searchFiles({ q, limit: LIMIT, offset: 0 })
    searchResults.value = res.data.filter((item) => isDocFile(item))
    searchTotal.value = res.total
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '检索失败', icon: 'none' })
  } finally {
    searching.value = false
  }
}

function removeFileItem(file: UploadedFile | SearchFileItem) {
  if (!isSuperAdmin.value) {
    return
  }

  uni.showModal({
    title: '确认删除文档',
    content: `将删除文档「${file.title || `ID ${file.id}`}」，是否继续？`,
    success: async (res) => {
      if (!res.confirm) {
        return
      }

      try {
        await deleteFile(file.id)
        files.value = files.value.filter((item) => item.id !== file.id)
        searchResults.value = searchResults.value.filter((item) => item.id !== file.id)
        searchTotal.value = Math.max(0, searchTotal.value - 1)
        uni.showToast({ title: '删除成功', icon: 'success' })
      } catch (e) {
        uni.showToast({ title: e instanceof Error ? e.message : '删除失败', icon: 'none' })
      }
    },
  })
}

loadFiles()
</script>

<template>
  <layout-shell current="knowledge">
    <view class="files-page page-container">
      <content-panel v-if="!hasPermission" title="无权限访问" />

      <template v-else>
        <content-panel title="知识库文档上传">
          <template #default>
          <text class="desc">支持 Word / Excel / PDF，上传后可在条目“附件管理”中绑定</text>
          <nut-button type="primary" :loading="uploading" @click="uploadDocs">上传文档</nut-button>
          </template>
        </content-panel>

        <content-panel title="文件检索">
          <template #default>
          <text class="desc">按标题和文档正文检索，快速定位历史上传文件</text>
          <view class="search-row">
            <nut-input v-model="searchKeyword" placeholder="例如：奖学金、请假、入党流程" @confirm="runSearch" />
            <nut-button plain :loading="searching" @click="runSearch">检索</nut-button>
          </view>

          <view v-if="searched" class="search-result">
            <text class="meta">共 {{ searchTotal }} 条匹配</text>
            <view v-if="searchResults.length > 0" class="list">
              <view v-for="file in searchResults" :key="`search-${file.id}`" class="row">
                <text class="name">{{ file.title }}</text>
                <text class="meta">ID {{ file.id }} · {{ file.content_type || '-' }}</text>
                <text v-if="file.snippet" class="snippet">{{ file.snippet }}</text>
                <nut-button v-if="isSuperAdmin" type="danger" size="small" @click="removeFileItem(file)">删除文档</nut-button>
              </view>
            </view>
            <text v-else class="desc">没有检索到结果</text>
          </view>
          </template>
        </content-panel>

        <content-panel v-if="loading" title="最近文档">
          <template #default>
            <nut-empty image="empty" description="加载中..." />
          </template>
        </content-panel>

        <nut-noticebar v-else-if="error" color="danger" wrapable :text="error" />

        <content-panel v-else title="最近文档">
          <template #default>
          <view v-if="files.length > 0" class="list">
            <view v-for="file in files" :key="file.id" class="row">
              <text class="name">{{ file.title }}</text>
              <text class="meta">ID {{ file.id }} · {{ file.content_type || '-' }}</text>
              <nut-button v-if="isSuperAdmin" type="danger" size="small" @click="removeFileItem(file)">删除文档</nut-button>
            </view>
          </view>
          <text v-else class="desc">暂无文档</text>
          </template>
        </content-panel>
      </template>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.files-page {
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

.search-row {
  margin-top: var(--space-2);
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.search-result {
  margin-top: var(--space-2);
}

.list {
  margin-top: var(--space-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.row {
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.name {
  display: block;
}

.snippet {
  display: block;
  margin-top: var(--space-1);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

:deep(.nut-input) {
  flex: 1;
}
</style>
