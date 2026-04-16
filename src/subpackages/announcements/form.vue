<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import LayoutShell from '@/components/layout-shell.vue'
import { createAnnouncement, publishAnnouncement } from '@/services/announcements'
import { useUserStore } from '@/stores/user'
import { UserRole } from '@/constants/enums'
import type { AnnouncementAudienceType, CreateAnnouncementPayload } from '@/types/announcements'

const userStore = useUserStore()
const submitting = ref(false)

const canManage = computed(() => Number(userStore.userInfo?.role || 0) >= UserRole.LEAGUE_CADRE)

const formState = reactive({
  title: '',
  content: '',
  audience_type: 'all' as AnnouncementAudienceType,
  gradesText: '',
  majorsText: '',
  tagsText: '',
  templateCode: 'announcement_publish',
  sendNotification: false,
})

function parseCsv(input: string) {
  return input
    .split(/[,\uff0c]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildPayload(): CreateAnnouncementPayload {
  const payload: CreateAnnouncementPayload = {
    title: formState.title.trim(),
    content: formState.content.trim(),
    audience_type: formState.audience_type,
    tags: parseCsv(formState.tagsText),
  }

  if (formState.audience_type === 'targeted') {
    const grades = parseCsv(formState.gradesText)
    const majors = parseCsv(formState.majorsText)
    payload.target_scope = {
      ...(grades.length ? { grades } : {}),
      ...(majors.length ? { majors } : {}),
    }
  }

  return payload
}

function validate(): string {
  if (!formState.title.trim()) {
    return '请输入标题'
  }
  if (!formState.content.trim()) {
    return '请输入正文'
  }
  if (formState.audience_type === 'targeted') {
    const grades = parseCsv(formState.gradesText)
    const majors = parseCsv(formState.majorsText)
    if (!grades.length && !majors.length) {
      return '定向发布至少填写年级或专业'
    }
  }
  return ''
}

async function submitForm() {
  const validationError = validate()
  if (validationError) {
    uni.showToast({ title: validationError, icon: 'none' })
    return
  }

  submitting.value = true
  try {
    const created = await createAnnouncement(buildPayload())
    if (created?.id) {
      await publishAnnouncement(created.id, {
        send_notification: formState.sendNotification,
        template_code: formState.templateCode.trim() || 'announcement_publish',
      })
    }
    uni.showToast({ title: '发布成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  } catch (e) {
    const message = e instanceof Error ? e.message : '提交失败'
    uni.showToast({ title: message, icon: 'none' })
  } finally {
    submitting.value = false
  }
}

onLoad(() => {
  if (!canManage.value) {
    uni.showToast({ title: '无权限访问', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 300)
  }
})
</script>

<template>
  <layout-shell current="announcements">
    <view class="page-container announcements-form-page">
      <content-panel title="发布通知" sub-title="创建草稿并可选同步触达订阅消息">
        <template #default>
          <view class="field">
            <text class="label">标题</text>
            <nut-input v-model="formState.title" maxlength="200" placeholder="请输入通知标题" />
          </view>

          <view class="field">
            <text class="label">正文</text>
            <nut-textarea v-model="formState.content" maxlength="2000" placeholder="请输入通知正文" />
          </view>

          <view class="field">
            <text class="label">发布范围</text>
            <view class="switch-row">
              <nut-button :type="formState.audience_type === 'all' ? 'primary' : 'default'" size="small" @click="formState.audience_type = 'all'">全体同学</nut-button>
              <nut-button
                :type="formState.audience_type === 'targeted' ? 'primary' : 'default'"
                size="small"
                @click="formState.audience_type = 'targeted'"
              >
                定向发布
              </nut-button>
            </view>
          </view>

          <view v-if="formState.audience_type === 'targeted'" class="field">
            <text class="label">定向年级（逗号分隔）</text>
            <nut-input v-model="formState.gradesText" placeholder="例如：2023,2024" />
          </view>

          <view v-if="formState.audience_type === 'targeted'" class="field">
            <text class="label">定向专业（逗号分隔）</text>
            <nut-input v-model="formState.majorsText" placeholder="例如：信息管理,会计学" />
          </view>

          <view class="field">
            <text class="label">标签（逗号分隔）</text>
            <nut-input v-model="formState.tagsText" placeholder="例如：假期,安全" />
          </view>

          <view class="field">
            <view class="switch-inline">
              <text class="label-no-margin">发布后发送订阅消息</text>
              <nut-switch v-model="formState.sendNotification" />
            </view>
          </view>

          <view v-if="formState.sendNotification" class="field">
            <text class="label">订阅模板编码</text>
            <nut-input v-model="formState.templateCode" placeholder="announcement_publish" />
          </view>

          <nut-button type="primary" block :loading="submitting" @click="submitForm">提交</nut-button>
        </template>
      </content-panel>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.announcements-form-page {
  min-height: 100vh;
}

.field + .field {
  margin-top: var(--space-3);
}

.label {
  display: block;
  margin-bottom: var(--space-1);
  color: var(--color-text-secondary);
}

.label-no-margin {
  color: var(--color-text-secondary);
}

.switch-row {
  display: flex;
  gap: var(--space-2);
}

.switch-inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

:deep(.nut-button) {
  margin-top: var(--space-3);
}
</style>
