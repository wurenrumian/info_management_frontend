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
    <view class="files-page">
      <view v-if="!hasPermission" class="card state-card state-card--error">
        <text class="title">无权限访问</text>
      </view>

      <template v-else>
        <view class="card">
          <text class="title">知识库文档上传</text>
          <text class="desc">支持 Word / Excel / PDF，上传后可在条目“附件管理”中绑定</text>
          <button class="btn primary" :loading="uploading" @tap="uploadDocs">上传文档</button>
        </view>

        <view class="card">
          <text class="title">文件检索</text>
          <text class="desc">按标题和文档正文检索，快速定位历史上传文件</text>
          <view class="search-row">
            <input v-model="searchKeyword" class="input" placeholder="例如：奖学金、请假、入党流程" @confirm="runSearch" />
            <button class="btn" :loading="searching" @tap="runSearch">检索</button>
          </view>

          <view v-if="searched" class="search-result">
            <text class="meta">共 {{ searchTotal }} 条匹配</text>
            <view v-if="searchResults.length > 0" class="list">
              <view v-for="file in searchResults" :key="`search-${file.id}`" class="row">
                <text class="name">{{ file.title }}</text>
                <text class="meta">ID {{ file.id }} · {{ file.content_type || '-' }}</text>
                <text v-if="file.snippet" class="snippet">{{ file.snippet }}</text>
                <button v-if="isSuperAdmin" class="btn danger" @tap="removeFileItem(file)">删除文档</button>
              </view>
            </view>
            <text v-else class="desc">没有检索到结果</text>
          </view>
        </view>

        <view v-if="loading" class="card state-card">
          <text>加载中...</text>
        </view>

        <view v-else-if="error" class="card state-card state-card--error">
          <text class="title">加载失败</text>
          <text class="desc">{{ error }}</text>
        </view>

        <view v-else class="card">
          <text class="title">最近文档</text>
          <view v-if="files.length > 0" class="list">
            <view v-for="file in files" :key="file.id" class="row">
              <text class="name">{{ file.title }}</text>
              <text class="meta">ID {{ file.id }} · {{ file.content_type || '-' }}</text>
              <button v-if="isSuperAdmin" class="btn danger" @tap="removeFileItem(file)">删除文档</button>
            </view>
          </view>
          <text v-else class="desc">暂无文档</text>
        </view>
      </template>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.files-page {
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
}

.input {
  flex: 1;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 var(--space-2);
  background: #fff;
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

.btn {
  margin-top: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  background: #fff;
}

.btn.primary {
  background: var(--color-primary);
  color: #fff;
}

.state-card--error {
  border-color: #f3c2c2;
}
</style>
