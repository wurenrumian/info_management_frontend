<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { buildPublicFileUrl, uploadFile } from '@/services/file'
import { getProfileEditableInfo, updateProfile } from '@/services/profile'
import type { UpdateProfilePayload } from '@/types/profile'

type EditFormState = {
  real_name: string
  nickname: string
  major: string
  college: string
  enrollment_year: string
  bio: string
  avatar_url: string
}

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const AVATAR_CACHE_KEY = 'profile_avatar_url'
const uploadedAvatarFile = ref<{ id: number; file_path?: string; title?: string } | null>(null)

const form = reactive<EditFormState>({
  real_name: '',
  nickname: '',
  major: '',
  college: '',
  enrollment_year: '',
  bio: '',
  avatar_url: '',
})

const initialSnapshot = ref('')

const avatarPreview = computed(() => form.avatar_url)

function trimText(value: string) {
  return value.trim()
}

function getCurrentYearUpperBound() {
  return new Date().getFullYear() + 1
}

function toSnapshot() {
  return JSON.stringify({
    nickname: trimText(form.nickname),
    major: trimText(form.major),
    college: trimText(form.college),
    enrollment_year: form.enrollment_year.trim(),
    bio: trimText(form.bio),
    avatar_url: trimText(form.avatar_url),
  })
}

const hasChanged = computed(() => toSnapshot() !== initialSnapshot.value)

function validateForm(): string {
  const nickname = trimText(form.nickname)
  const bio = trimText(form.bio)
  const yearText = form.enrollment_year.trim()

  if (nickname.length > 20) {
    return '昵称不能超过20个字符'
  }
  if (bio.length > 100) {
    return '个性签名不能超过100个字符'
  }
  if (yearText) {
    const year = Number(yearText)
    if (!Number.isInteger(year) || year < 2000 || year > getCurrentYearUpperBound()) {
      return '入学学年格式不正确'
    }
  }

  return ''
}

function applyForm(data: {
  real_name?: string
  name?: string
  nickname?: string
  major?: string
  college?: string
  enrollment_year?: number
  bio?: string
  avatar_url?: string
  avatar_file_path?: string
  extra_attrs?: { remarks?: string }
}) {
  form.real_name = data.real_name || data.name || ''
  form.nickname = data.nickname || ''
  form.major = data.major || ''
  form.college = data.college || ''
  form.enrollment_year = data.enrollment_year ? String(data.enrollment_year) : ''
  form.bio = data.bio || data.extra_attrs?.remarks || ''
  const cachedAvatar = String(uni.getStorageSync(AVATAR_CACHE_KEY) || '').trim()
  form.avatar_url = data.avatar_url || buildPublicFileUrl(data.avatar_file_path || '') || cachedAvatar || ''
}

function buildPayload(): UpdateProfilePayload {
  const payload: UpdateProfilePayload = {}
  const initial = initialSnapshot.value ? JSON.parse(initialSnapshot.value) as Record<string, string> : {}
  const current = JSON.parse(toSnapshot()) as Record<string, string>

  if (current.nickname !== (initial.nickname || '')) {
    payload.nickname = current.nickname || undefined
  }
  if (current.major !== (initial.major || '')) {
    payload.major = current.major || undefined
  }
  if (current.college !== (initial.college || '')) {
    payload.college = current.college || undefined
  }
  if (current.enrollment_year !== (initial.enrollment_year || '')) {
    payload.enrollment_year = current.enrollment_year ? Number(current.enrollment_year) : undefined
  }
  if (current.bio !== (initial.bio || '')) {
    payload.bio = current.bio || undefined
  }
  if (current.avatar_url !== (initial.avatar_url || '')) {
    payload.avatar_url = current.avatar_url || undefined
    if (uploadedAvatarFile.value) {
      payload.avatar_file_id = uploadedAvatarFile.value.id
      payload.avatar_file_path = uploadedAvatarFile.value.file_path
      payload.avatar_file_title = uploadedAvatarFile.value.title
    }
  }

  return payload
}

function markAvatarAsSavedInSnapshot() {
  if (!initialSnapshot.value) {
    initialSnapshot.value = toSnapshot()
    return
  }
  const initial = JSON.parse(initialSnapshot.value) as Record<string, string>
  const current = JSON.parse(toSnapshot()) as Record<string, string>
  initial.avatar_url = current.avatar_url || ''
  initialSnapshot.value = JSON.stringify(initial)
}

async function persistUploadedAvatar(uploaded: { id: number; file_path?: string; title?: string }, publicUrl: string) {
  const payload: UpdateProfilePayload = {
    avatar_url: publicUrl,
    avatar_file_id: uploaded.id,
    avatar_file_path: uploaded.file_path,
    avatar_file_title: uploaded.title,
  }
  await updateProfile(payload)
  markAvatarAsSavedInSnapshot()
  uploadedAvatarFile.value = null
}

async function loadEditableInfo() {
  loading.value = true
  error.value = ''
  try {
    const data = await getProfileEditableInfo()
    applyForm(data)
    initialSnapshot.value = toSnapshot()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '资料加载失败'
  } finally {
    loading.value = false
  }
}

async function chooseAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: async (res) => {
      const filePath = res.tempFilePaths?.[0]
      if (!filePath) {
        uni.showToast({ title: '未选择图片', icon: 'none' })
        return
      }

      try {
        saving.value = true
        const uploaded = await uploadFile(filePath, 'avatar')
        uploadedAvatarFile.value = {
          id: uploaded.id,
          file_path: uploaded.file_path,
          title: uploaded.title,
        }
        const publicUrl = buildPublicFileUrl(uploaded.file_path || '')
        if (!publicUrl) {
          uni.showToast({ title: '上传成功但缺少可展示地址', icon: 'none' })
          return
        }
        form.avatar_url = publicUrl
        uni.setStorageSync(AVATAR_CACHE_KEY, form.avatar_url)
        await persistUploadedAvatar(
          {
            id: uploaded.id,
            file_path: uploaded.file_path,
            title: uploaded.title,
          },
          publicUrl,
        )
        uni.showToast({ title: '头像上传并保存成功', icon: 'none' })
      } catch (e) {
        const message = e instanceof Error ? e.message : '头像上传失败'
        uni.showToast({ title: message, icon: 'none' })
      } finally {
        saving.value = false
      }
    },
  })
}

async function saveProfile() {
  const validationError = validateForm()
  if (validationError) {
    uni.showToast({ title: validationError, icon: 'none' })
    return
  }

  if (!hasChanged.value) {
    uni.showToast({ title: '暂无变更', icon: 'none' })
    return
  }

  const payload = buildPayload()

  if (!Object.keys(payload).length) {
    uni.showToast({ title: '暂无可提交变更', icon: 'none' })
    return
  }

  saving.value = true
  try {
    const saved = await updateProfile(payload)
    applyForm(saved)
    uploadedAvatarFile.value = null
    if (form.avatar_url) {
      uni.setStorageSync(AVATAR_CACHE_KEY, form.avatar_url)
    }
    initialSnapshot.value = toSnapshot()
    uni.showToast({ title: '保存成功', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack({
        fail: () => {
          uni.reLaunch({ url: '/pages/profile/index' })
        },
      })
    }, 300)
  } catch (e) {
    const message = e instanceof Error ? e.message : '保存失败'
    uni.showToast({ title: message, icon: 'none' })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadEditableInfo()
})
</script>

<template>
  <view class="edit-page page-container">
    <content-panel v-if="loading" title="编辑资料">
      <template #default>
        <nut-empty image="empty" description="资料加载中..." />
      </template>
    </content-panel>

    <content-panel v-else-if="error" title="加载失败">
      <template #default>
        <nut-noticebar wrapable color="danger" :text="error" />
        <nut-button type="primary" block @click="loadEditableInfo">重试</nut-button>
      </template>
    </content-panel>

    <content-panel v-else title="编辑个人资料">
      <template #default>
        <view class="avatar-row">
          <image v-if="avatarPreview" class="avatar" :src="avatarPreview" mode="aspectFill" />
          <view v-else class="avatar avatar--placeholder">头像</view>
          <nut-button plain :loading="saving" @click="chooseAvatar">上传头像</nut-button>
        </view>

        <view class="field">
          <text class="label">实名（只读）</text>
          <nut-input v-model="form.real_name" readonly />
        </view>

        <view class="field">
          <text class="label">昵称</text>
          <nut-input v-model="form.nickname" placeholder="请输入昵称" maxlength="20" />
        </view>

        <view class="field">
          <text class="label">专业</text>
          <nut-input v-model="form.major" placeholder="请输入专业" maxlength="50" />
        </view>

        <view class="field">
          <text class="label">学院</text>
          <nut-input v-model="form.college" placeholder="请输入学院" maxlength="50" />
        </view>

        <view class="field">
          <text class="label">入学学年</text>
          <nut-input v-model="form.enrollment_year" type="number" placeholder="例如 2023" maxlength="4" />
        </view>

        <view class="field">
          <text class="label">个性签名</text>
          <nut-textarea v-model="form.bio" maxlength="100" placeholder="写点什么介绍自己" />
          <text class="hint">{{ form.bio.length }}/100</text>
        </view>

        <nut-button type="primary" block :loading="saving" @click="saveProfile">保存</nut-button>
      </template>
    </content-panel>
  </view>
</template>

<style scoped lang="scss">
.edit-page {
  min-height: 100vh;
}

.avatar-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: #fff;
}

.avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

.field {
  margin-top: var(--space-3);
}

.label {
  display: block;
  margin-bottom: var(--space-1);
  color: var(--color-text-secondary);
}

.hint {
  display: block;
  margin-top: var(--space-1);
  text-align: right;
  color: var(--color-text-secondary);
}

:deep(.nut-button) {
  margin-top: 12px;
}
</style>
