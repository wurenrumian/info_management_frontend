<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import LayoutShell from '@/components/layout-shell.vue'
import { createKnowledge, getAdminKnowledgeDetail, patchKnowledge } from '@/services/knowledge'
import { useUserStore } from '@/stores/user'
import { UserRole } from '@/constants/enums'

const MAX_QUESTION_LENGTH = 200
const MAX_ANSWER_LENGTH = 5000
const MAX_KEYWORDS_COUNT = 20
const userStore = useUserStore()
const hasPermission = computed(() => Number(userStore.userInfo?.role || 0) >= UserRole.LEAGUE_CADRE)

const currentId = ref(0)
const loading = ref(false)
const saving = ref(false)
const error = ref('')

const question = ref('')
const answer = ref('')
const keywordsInput = ref('')

const isEdit = computed(() => currentId.value > 0)
const pageTitle = computed(() => (isEdit.value ? '编辑知识' : '新增知识'))

function normalizeKeywords() {
  const dedupe = new Set(
    keywordsInput.value
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean),
  )
  return Array.from(dedupe)
}

function validatePayload() {
  if (!question.value.trim()) {
    return '问题不能为空'
  }
  if (question.value.trim().length > MAX_QUESTION_LENGTH) {
    return `问题长度不能超过${MAX_QUESTION_LENGTH}`
  }
  if (!answer.value.trim()) {
    return '答案不能为空'
  }
  if (answer.value.trim().length > MAX_ANSWER_LENGTH) {
    return `答案长度不能超过${MAX_ANSWER_LENGTH}`
  }

  const keywords = normalizeKeywords()
  if (keywords.length > MAX_KEYWORDS_COUNT) {
    return `关键词不能超过${MAX_KEYWORDS_COUNT}个`
  }

  return ''
}

async function loadDetail(id: number) {
  loading.value = true
  error.value = ''
  try {
    const detail = await getAdminKnowledgeDetail(id)
    question.value = detail.question || ''
    answer.value = detail.answer || ''
    keywordsInput.value = (detail.keywords || []).join(' ')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function submit(goAttachmentAfterSave = false) {
  if (!hasPermission.value) {
    return
  }
  const validateError = validatePayload()
  if (validateError) {
    uni.showToast({ title: validateError, icon: 'none' })
    return
  }

  const payload = {
    question: question.value.trim(),
    answer: answer.value.trim(),
    keywords: normalizeKeywords(),
  }

  let targetId = currentId.value
  saving.value = true
  try {
    if (isEdit.value) {
      await patchKnowledge(currentId.value, payload)
    } else {
      const created = await createKnowledge(payload)
      targetId = Number(created.id || 0)
      currentId.value = targetId
    }
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => {
      if (goAttachmentAfterSave && targetId > 0) {
        uni.redirectTo({ url: `/subpackages/knowledge/admin/import?id=${targetId}` })
        return
      }
      uni.redirectTo({ url: '/subpackages/knowledge/admin/index' })
    }, 400)
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

onLoad((query) => {
  const id = Number(query?.id || 0)
  currentId.value = id
  if (!hasPermission.value) {
    return
  }
  if (id > 0) {
    loadDetail(id)
  }
})
</script>

<template>
  <layout-shell current="knowledge">
    <view class="form-page page-container">
      <content-panel v-if="!hasPermission" title="无权限访问" />

      <content-panel v-else :title="pageTitle">
        <template #default>
        <view v-if="loading" class="state-block">
          <nut-empty image="empty" description="加载中..." />
        </view>

        <nut-noticebar v-else-if="error" color="danger" :text="error" />

        <template v-else>
          <view class="field">
            <text class="label">问题</text>
            <nut-textarea v-model="question" maxlength="200" placeholder="请输入问题" />
          </view>

          <view class="field">
            <text class="label">答案</text>
            <nut-textarea v-model="answer" class="textarea--large" maxlength="5000" placeholder="请输入标准答案" />
          </view>

          <view class="field">
            <text class="label">关键词（空格分隔）</text>
            <nut-textarea v-model="keywordsInput" class="textarea--keywords" placeholder="例如：休学 申请 流程" maxlength="200" />
          </view>

          <text class="tip">附件请在保存后前往“附件管理”页面绑定</text>

          <view class="action-row">
            <nut-button plain :loading="saving" @click="submit(false)">仅保存</nut-button>
            <nut-button type="primary" :loading="saving" @click="submit(true)">保存并管理附件</nut-button>
          </view>
        </template>
        </template>
      </content-panel>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.form-page {
  min-height: 100vh;
}

.title {
  display: block;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.field {
  margin-top: var(--space-3);
}

.label {
  display: block;
  margin-bottom: var(--space-1);
  color: var(--color-text-secondary);
}

:deep(.nut-textarea) {
  margin-top: 4px;
}

.textarea--keywords {
  min-height: 72px;
}

.textarea--large {
  min-height: 180px;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.tip {
  display: block;
  margin-top: var(--space-2);
  color: var(--color-text-secondary);
}

</style>
