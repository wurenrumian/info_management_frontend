<script setup lang="ts">
import { computed, ref } from 'vue'
import LayoutShell from '@/components/layout-shell.vue'
import { searchFiles, getFileList, type UploadedFile, type SearchFileItem } from '@/services/file'
import { batchCreateKnowledge, generateKnowledgeQaPreview, generateKnowledgeQaPreviewStream } from '@/services/knowledge'
import { useUserStore } from '@/stores/user'
import { UserRole } from '@/constants/enums'
import type { KnowledgeAIDraftItem } from '@/types/knowledge'

const DOC_EXT = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx'])
const FILE_LIST_LIMIT = 30
const COUNT_OPTIONS = Array.from({ length: 30 }, (_, index) => index + 1)

interface EditableDraft extends KnowledgeAIDraftItem {
  local_id: string
  selected: boolean
  keywords: string[]
  keyword_input: string
  attachment_input: string
}

const userStore = useUserStore()
const canUseAIGenerate = computed(() => Number(userStore.userInfo?.role || 0) >= UserRole.TEACHER)

const loadingFiles = ref(false)
const generating = ref(false)
const submitting = ref(false)
const streamStatus = ref('')

const fileSearchKeyword = ref('')
const fileSearching = ref(false)
const fileSearchResults = ref<SearchFileItem[]>([])
const recentFiles = ref<UploadedFile[]>([])
const selectedFileIds = ref<number[]>([])

const minCount = ref(5)
const maxCount = ref(12)
const drafts = ref<EditableDraft[]>([])

const minCountIndex = computed(() => Math.max(0, COUNT_OPTIONS.indexOf(minCount.value)))
const maxCountIndex = computed(() => Math.max(0, COUNT_OPTIONS.indexOf(maxCount.value)))

function onMinCountChange(event: unknown) {
  const detail = (event as { detail?: { value?: string | number } })?.detail
  const index = Number(detail?.value)
  const value = COUNT_OPTIONS[index]
  if (!Number.isInteger(value)) {
    return
  }

  minCount.value = value
  if (minCount.value > maxCount.value) {
    maxCount.value = minCount.value
  }
}

function onMaxCountChange(event: unknown) {
  const detail = (event as { detail?: { value?: string | number } })?.detail
  const index = Number(detail?.value)
  const value = COUNT_OPTIONS[index]
  if (!Number.isInteger(value)) {
    return
  }

  maxCount.value = value
  if (maxCount.value < minCount.value) {
    minCount.value = maxCount.value
  }
}

function getExt(name: string) {
  const index = name.lastIndexOf('.')
  return index >= 0 ? name.slice(index + 1).toLowerCase() : ''
}

function isDocFile(file: UploadedFile) {
  return DOC_EXT.has(getExt(String(file.title || '')))
}

function toUniquePositiveNumberArray(items: Array<number | string>) {
  const result: number[] = []
  const seen = new Set<number>()
  for (const item of items) {
    const value = Number(item)
    if (!Number.isInteger(value) || value <= 0 || seen.has(value)) {
      continue
    }
    seen.add(value)
    result.push(value)
  }
  return result
}

function parseAttachmentInput(value: string) {
  return toUniquePositiveNumberArray(value.split(/[\s,，]+/).map((item) => item.trim()).filter(Boolean))
}

function validateGenerateConfig() {
  const fileIds = toUniquePositiveNumberArray(selectedFileIds.value)
  if (fileIds.length === 0) {
    return '请至少选择一个文档'
  }

  const min = Number(minCount.value)
  const max = Number(maxCount.value)
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    return '生成范围必须是整数'
  }
  if (min < 1 || max > 30 || min > max) {
    return '需满足 1 <= min <= max <= 30'
  }

  selectedFileIds.value = fileIds
  minCount.value = min
  maxCount.value = max
  return ''
}

function validateDraftForSubmit(item: EditableDraft, index: number) {
  if (!item.question.trim()) {
    return `第 ${index + 1} 条问题不能为空`
  }
  if (!item.answer.trim()) {
    return `第 ${index + 1} 条答案不能为空`
  }
  if (!Array.isArray(item.keywords) || item.keywords.length < 1) {
    return `第 ${index + 1} 条至少需要 1 个关键词`
  }
  if (!Array.isArray(item.attachment_file_ids) || item.attachment_file_ids.some((id) => !Number.isInteger(id))) {
    return `第 ${index + 1} 条附件ID格式错误`
  }

  return ''
}

function isFileSelected(fileId: number) {
  return selectedFileIds.value.includes(fileId)
}

function toggleFileSelection(fileId: number) {
  if (isFileSelected(fileId)) {
    selectedFileIds.value = selectedFileIds.value.filter((id) => id !== fileId)
    return
  }
  selectedFileIds.value = [...selectedFileIds.value, fileId]
}

function clearSelectedFiles() {
  selectedFileIds.value = []
}

async function loadRecentFiles() {
  if (!canUseAIGenerate.value) {
    return
  }

  loadingFiles.value = true
  try {
    const res = await getFileList({ limit: FILE_LIST_LIMIT, offset: 0 })
    recentFiles.value = res.data.filter((item) => isDocFile(item))
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '加载文档失败', icon: 'none' })
  } finally {
    loadingFiles.value = false
  }
}

async function runFileSearch() {
  const q = fileSearchKeyword.value.trim()
  if (!q) {
    uni.showToast({ title: '请输入文件关键词', icon: 'none' })
    return
  }

  fileSearching.value = true
  try {
    const res = await searchFiles({ q, limit: FILE_LIST_LIMIT, offset: 0 })
    fileSearchResults.value = res.data.filter((item) => isDocFile(item))
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '检索失败', icon: 'none' })
  } finally {
    fileSearching.value = false
  }
}

function resetFileSearch() {
  fileSearchKeyword.value = ''
  fileSearchResults.value = []
}

function buildDraft(item: KnowledgeAIDraftItem, index: number): EditableDraft {
  const dedupedKeywords = Array.from(new Set((item.keywords || []).map((keyword) => String(keyword || '').trim()).filter(Boolean)))
  const attachmentIds = toUniquePositiveNumberArray(item.attachment_file_ids || [])

  return {
    local_id: `${Date.now()}-${index}`,
    selected: true,
    question: String(item.question || ''),
    answer: String(item.answer || ''),
    keywords: dedupedKeywords,
    attachment_file_ids: attachmentIds,
    keyword_input: '',
    attachment_input: attachmentIds.join(', '),
  }
}

async function generateDrafts() {
  const validateError = validateGenerateConfig()
  if (validateError) {
    uni.showToast({ title: validateError, icon: 'none' })
    return
  }

  generating.value = true
  streamStatus.value = ''
  try {
    const payload = {
      file_ids: selectedFileIds.value,
      qa_count_range: {
        min: Number(minCount.value),
        max: Number(maxCount.value),
      },
    }

    const uniPlatform = String(uni.getSystemInfoSync().uniPlatform || '').toLowerCase()
    const isH5 = uniPlatform === 'web' || uniPlatform === 'h5'
    const res = isH5
      ? await generateKnowledgeQaPreviewStream(payload, {
          onStatus: (status) => {
            if (status === 'connecting') streamStatus.value = '正在连接流式生成通道...'
            else if (status === 'receiving') streamStatus.value = 'AI 正在流式生成草稿...'
            else if (status.startsWith('parsed-')) streamStatus.value = `已接收草稿 ${status.slice(7)} 条`
            else if (status === 'done') streamStatus.value = '流式生成完成'
          },
        })
      : await generateKnowledgeQaPreview(payload)

    drafts.value = res.data.map((item, index) => buildDraft(item, index))
    uni.showToast({ title: `已生成 ${res.total} 条草稿`, icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '生成失败', icon: 'none' })
  } finally {
    streamStatus.value = ''
    generating.value = false
  }
}

function addKeywords(draft: EditableDraft) {
  const words = draft.keyword_input
    .split(/[\s,，]+/)
    .map((item) => item.trim())
    .filter(Boolean)

  if (words.length === 0) {
    return
  }

  draft.keywords = Array.from(new Set([...draft.keywords, ...words]))
  draft.keyword_input = ''
}

function removeKeyword(draft: EditableDraft, keyword: string) {
  draft.keywords = draft.keywords.filter((item) => item !== keyword)
}

function applyAttachmentInput(draft: EditableDraft) {
  draft.attachment_file_ids = parseAttachmentInput(draft.attachment_input)
  draft.attachment_input = draft.attachment_file_ids.join(', ')
}

function removeAttachmentId(draft: EditableDraft, fileId: number) {
  draft.attachment_file_ids = draft.attachment_file_ids.filter((id) => id !== fileId)
  draft.attachment_input = draft.attachment_file_ids.join(', ')
}

function useSelectedFilesForDraft(draft: EditableDraft) {
  draft.attachment_file_ids = toUniquePositiveNumberArray(selectedFileIds.value)
  draft.attachment_input = draft.attachment_file_ids.join(', ')
}

function deleteDraft(localId: string) {
  drafts.value = drafts.value.filter((item) => item.local_id !== localId)
}

const selectedDraftCount = computed(() => drafts.value.filter((item) => item.selected).length)
const allDraftSelected = computed(() => drafts.value.length > 0 && selectedDraftCount.value === drafts.value.length)

function selectAllDrafts() {
  drafts.value = drafts.value.map((item) => ({ ...item, selected: true }))
}

function invertDraftSelection() {
  drafts.value = drafts.value.map((item) => ({ ...item, selected: !item.selected }))
}

function onDraftSelectChange(draft: EditableDraft, event: unknown) {
  const detail = (event as { detail?: { value?: boolean } })?.detail
  draft.selected = Boolean(detail?.value)
}

async function submitBatch() {
  const picked = drafts.value.filter((item) => item.selected)
  if (picked.length === 0) {
    uni.showToast({ title: '请至少勾选一条草稿', icon: 'none' })
    return
  }

  const normalized = picked.map((item) => ({
    question: item.question.trim(),
    answer: item.answer.trim(),
    keywords: Array.from(new Set(item.keywords.map((keyword) => keyword.trim()).filter(Boolean))),
    attachment_file_ids: toUniquePositiveNumberArray(item.attachment_file_ids),
  }))

  for (let i = 0; i < normalized.length; i += 1) {
    const error = validateDraftForSubmit(
      {
        local_id: '',
        selected: true,
        keyword_input: '',
        attachment_input: '',
        ...normalized[i],
      },
      i,
    )
    if (error) {
      uni.showToast({ title: error, icon: 'none' })
      return
    }
  }

  submitting.value = true
  try {
    await batchCreateKnowledge({ items: normalized })
    uni.showToast({ title: '批量入库成功', icon: 'success' })
    setTimeout(() => {
      uni.redirectTo({ url: '/subpackages/knowledge/admin/index' })
    }, 400)
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '批量入库失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

loadRecentFiles()
</script>

<template>
  <layout-shell current="knowledge">
    <view class="ai-page">
      <view v-if="!canUseAIGenerate" class="card state-card state-card--error">
        <text class="title">无权限访问</text>
        <text class="desc">仅教师及超级管理员可使用 AI 生成问答</text>
      </view>

      <template v-else>
        <view class="card section">
          <text class="title">生成配置</text>
          <text class="desc">步骤：选择文档、设置生成范围、生成草稿并编辑后批量提交</text>

          <view class="range-row">
            <view class="field">
              <text class="label">最小数量</text>
              <picker class="picker" :range="COUNT_OPTIONS" :value="minCountIndex" @change="onMinCountChange">
                <view class="picker-value">{{ minCount }}</view>
              </picker>
            </view>
            <view class="field">
              <text class="label">最大数量</text>
              <picker class="picker" :range="COUNT_OPTIONS" :value="maxCountIndex" @change="onMaxCountChange">
                <view class="picker-value">{{ maxCount }}</view>
              </picker>
            </view>
          </view>

          <nut-input v-model="fileSearchKeyword" class="input" placeholder="输入关键词筛选文档" @confirm="runFileSearch" />
          <view class="button-row">
            <nut-button plain :loading="fileSearching" @click="runFileSearch">检索</nut-button>
            <nut-button plain @click="resetFileSearch">重置</nut-button>
          </view>

          <view class="selected-bar">
            <text class="meta">已选文档 ID：{{ selectedFileIds.join(', ') || '无' }}</text>
            <nut-button class="btn mini" plain @click="clearSelectedFiles">清空</nut-button>
          </view>

          <view class="list-wrap">
            <text class="subtitle">最近文档</text>
            <text v-if="loadingFiles" class="meta">加载中...</text>
            <view v-else-if="recentFiles.length > 0" class="file-list">
              <view
                v-for="file in recentFiles"
                :key="`recent-${file.id}`"
                class="file-item"
                :class="{ 'file-item--selected': isFileSelected(file.id) }"
                @tap="toggleFileSelection(file.id)"
              >
                <text class="name">{{ file.title }}</text>
                <text class="meta">ID {{ file.id }}</text>
              </view>
            </view>
            <text v-else class="meta">暂无可选文档</text>
          </view>

          <view v-if="fileSearchKeyword.trim()" class="list-wrap">
            <text class="subtitle">检索结果</text>
            <view v-if="fileSearchResults.length > 0" class="file-list">
              <view
                v-for="file in fileSearchResults"
                :key="`search-${file.id}`"
                class="file-item"
                :class="{ 'file-item--selected': isFileSelected(file.id) }"
                @tap="toggleFileSelection(file.id)"
              >
                <text class="name">{{ file.title }}</text>
                <text class="meta">ID {{ file.id }}</text>
                <text v-if="file.snippet" class="snippet">{{ file.snippet }}</text>
              </view>
            </view>
            <text v-else-if="!fileSearching" class="meta">暂无匹配文档</text>
          </view>

          <nut-button type="primary" :loading="generating" :disabled="generating" @click="generateDrafts">生成草稿</nut-button>
          <text v-if="streamStatus" class="meta">{{ streamStatus }}</text>
        </view>

        <view class="card section">
          <view class="preview-head">
            <text class="title">草稿预览</text>
            <text class="meta">共 {{ drafts.length }} 条，已勾选 {{ selectedDraftCount }} 条</text>
          </view>

          <view v-if="drafts.length === 0" class="state-card">
            <text class="desc">请先生成草稿</text>
          </view>

          <template v-else>
            <view class="button-row">
              <nut-button plain :disabled="allDraftSelected" @click="selectAllDrafts">全选</nut-button>
              <nut-button plain @click="invertDraftSelection">反选</nut-button>
            </view>

            <view class="draft-list">
              <view v-for="draft in drafts" :key="draft.local_id" class="draft-card">
                <view class="draft-top">
                  <label class="check-item">
                    <switch :checked="draft.selected" @change="onDraftSelectChange(draft, $event)" />
                    <text>提交此条</text>
                  </label>
                  <nut-button class="btn mini danger" type="danger" @click="deleteDraft(draft.local_id)">删除</nut-button>
                </view>

                <view class="field">
                  <text class="label">问题</text>
                  <nut-textarea v-model="draft.question" class="textarea" maxlength="200" placeholder="请输入问题" />
                </view>

                <view class="field">
                  <text class="label">答案</text>
                  <nut-textarea v-model="draft.answer" class="textarea textarea--large" maxlength="5000" placeholder="请输入答案" />
                </view>

                <view class="field">
                  <text class="label">关键词（回车添加）</text>
                  <view class="keyword-input-row">
                    <nut-input v-model="draft.keyword_input" class="input" placeholder="输入关键词后回车" @confirm="addKeywords(draft)" />
                    <nut-button class="btn mini" plain @click="addKeywords(draft)">添加</nut-button>
                  </view>
                  <view class="tag-wrap">
                    <view v-for="keyword in draft.keywords" :key="`${draft.local_id}-${keyword}`" class="tag">
                      <text>{{ keyword }}</text>
                      <text class="tag-close" @tap="removeKeyword(draft, keyword)">×</text>
                    </view>
                  </view>
                </view>

                <view class="field">
                  <text class="label">附件文件 ID（逗号分隔）</text>
                  <view class="attachment-row">
                    <nut-input
                      v-model="draft.attachment_input"
                      class="input"
                      placeholder="例如：12, 18"
                      @confirm="applyAttachmentInput(draft)"
                      @blur="applyAttachmentInput(draft)"
                    />
                    <nut-button class="btn mini" plain @click="useSelectedFilesForDraft(draft)">使用已选文档</nut-button>
                  </view>
                  <view class="tag-wrap">
                    <view v-for="fileId in draft.attachment_file_ids" :key="`${draft.local_id}-${fileId}`" class="tag">
                      <text>{{ fileId }}</text>
                      <text class="tag-close" @tap="removeAttachmentId(draft, fileId)">×</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </template>
        </view>

        <view class="card section submit-card">
          <nut-button type="primary" :loading="submitting" :disabled="submitting" @click="submitBatch">批量提交</nut-button>
          <text class="desc">批量提交使用事务语义，任一条失败将整体回滚</text>
        </view>
      </template>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.ai-page {
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

.subtitle,
.label,
.name {
  display: block;
}

.subtitle,
.label {
  color: var(--color-text-secondary);
}

.desc,
.meta,
.snippet {
  display: block;
  margin-top: var(--space-1);
  color: var(--color-text-secondary);
}

.range-row,
.selected-bar,
.button-row,
.keyword-input-row,
.attachment-row,
.draft-top {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
  align-items: center;
  flex-wrap: wrap;
}

.field {
  margin-top: var(--space-2);
}

.input,
.textarea {
  width: 100%;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #fff;
  padding: 0 var(--space-2);
  box-sizing: border-box;
}

.picker-value {
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #fff;
  padding: 0 var(--space-2);
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.range-row .field {
  flex: 1;
  min-width: 120px;
}

.keyword-input-row .input,
.attachment-row .input {
  flex: 1;
}

.textarea {
  height: auto;
  min-height: 96px;
  padding: var(--space-2);
}

.textarea--large {
  min-height: 180px;
}

.btn {
  margin: 0;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  background: #fff;
}

.btn.primary {
  background: var(--color-primary);
  color: #fff;
}

.btn.mini {
  padding: 0 12px;
  font-size: var(--font-size-sm);
  line-height: 32px;
}

.btn.danger {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.list-wrap {
  margin-top: var(--space-2);
}

.file-list,
.draft-list,
.tag-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.file-item,
.draft-card,
.state-card {
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.file-item--selected {
  border-color: var(--color-primary);
  background: rgba(41, 98, 255, 0.06);
}

.preview-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.check-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tag-wrap {
  flex-direction: row;
  flex-wrap: wrap;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: #fff;
}

.tag-close {
  color: var(--color-danger);
  font-size: var(--font-size-md);
}

.submit-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.state-card--error {
  border-color: #f3c2c2;
}

@media (max-width: 768px) {
  .preview-head {
    align-items: flex-start;
  }
}
</style>
