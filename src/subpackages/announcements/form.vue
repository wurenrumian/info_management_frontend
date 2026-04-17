<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import LayoutShell from '@/components/layout-shell.vue'
import { createAnnouncement, getAdminClassOptions, publishAnnouncement } from '@/services/announcements'
import { useUserStore } from '@/stores/user'
import { UserRole } from '@/constants/enums'
import type { AdminClassOption, AnnouncementAudienceType, CreateAnnouncementPayload } from '@/types/announcements'

const userStore = useUserStore()
const submitting = ref(false)
const classOptions = ref<AdminClassOption[]>([])
const classOptionsLoading = ref(false)

const canManage = computed(() => Number(userStore.userInfo?.role || 0) >= UserRole.LEAGUE_CADRE)

const roleOptions = [
  { id: 1, name: '学生' },
  { id: 2, name: '团学干部' },
  { id: 3, name: '教师' },
  { id: 4, name: '超级管理员' },
]

const formState = reactive({
  title: '',
  content: '',
  audience_type: 'all' as AnnouncementAudienceType,
  gradesText: '',
  majorsText: '',
  studentIdsText: '',
  tagsText: '',
  selectedClassIds: [] as number[],
  selectedRoleIds: [] as number[],
  sendNotification: false,
})

function parseCsv(input: string) {
  return input
    .split(/[,\uff0c]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseNumberCsv(input: string) {
  const values = input
    .split(/[,\uff0c]/)
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item > 0)
  return Array.from(new Set(values))
}

function toggleClass(classId: number) {
  if (formState.selectedClassIds.includes(classId)) {
    formState.selectedClassIds = formState.selectedClassIds.filter((item) => item !== classId)
    return
  }
  formState.selectedClassIds = [...formState.selectedClassIds, classId]
}

function toggleRole(roleId: number) {
  if (formState.selectedRoleIds.includes(roleId)) {
    formState.selectedRoleIds = formState.selectedRoleIds.filter((item) => item !== roleId)
    return
  }
  formState.selectedRoleIds = [...formState.selectedRoleIds, roleId]
}

function formatClassName(item: AdminClassOption) {
  const suffix = [item.grade, item.major].filter(Boolean).join(' / ')
  return suffix ? `${item.class_name}（${suffix}）` : item.class_name
}

async function loadClassOptions() {
  classOptionsLoading.value = true
  try {
    const res = await getAdminClassOptions({ limit: 200, offset: 0 })
    classOptions.value = res.data || []
  } catch {
    classOptions.value = []
  } finally {
    classOptionsLoading.value = false
  }
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
    const studentIds = parseNumberCsv(formState.studentIdsText)
    payload.target_scope = {
      ...(grades.length ? { grades } : {}),
      ...(majors.length ? { majors } : {}),
      ...(formState.selectedClassIds.length ? { class_ids: formState.selectedClassIds } : {}),
      ...(formState.selectedRoleIds.length ? { roles: formState.selectedRoleIds } : {}),
      ...(studentIds.length ? { student_ids: studentIds } : {}),
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
    const studentIds = parseNumberCsv(formState.studentIdsText)
    if (!grades.length && !majors.length && !formState.selectedClassIds.length && !formState.selectedRoleIds.length && !studentIds.length) {
      return '定向发布至少填写一项筛选条件'
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
        template_code: 'announcement',
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
    return
  }
  loadClassOptions()
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
              <nut-button :type="formState.audience_type === 'all' ? 'primary' : 'default'" size="small" @click="formState.audience_type = 'all'">
                全体同学
              </nut-button>
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

          <view v-if="formState.audience_type === 'targeted'" class="field">
            <text class="label">定向角色（可多选）</text>
            <view class="selector-row">
              <nut-button
                v-for="role in roleOptions"
                :key="role.id"
                size="small"
                :type="formState.selectedRoleIds.includes(role.id) ? 'primary' : 'default'"
                @click="toggleRole(role.id)"
              >
                {{ role.name }}
              </nut-button>
            </view>
          </view>

          <view v-if="formState.audience_type === 'targeted'" class="field">
            <text class="label">定向班级（按班级名称选择，可多选）</text>
            <view class="selector-row">
              <nut-button
                v-for="item in classOptions"
                :key="item.id"
                size="small"
                :type="formState.selectedClassIds.includes(item.id) ? 'primary' : 'default'"
                @click="toggleClass(item.id)"
              >
                {{ formatClassName(item) }}
              </nut-button>
            </view>
            <text v-if="classOptionsLoading" class="hint">班级加载中...</text>
            <text v-else-if="!classOptions.length" class="hint">暂无班级数据，可继续使用其他定向条件</text>
          </view>

          <view v-if="formState.audience_type === 'targeted'" class="field">
            <text class="label">定向学生号（逗号分隔）</text>
            <nut-input v-model="formState.studentIdsText" placeholder="例如：1001,1002" />
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

          <text v-if="formState.sendNotification" class="hint">发送订阅消息时固定使用模板：announcement</text>

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

.selector-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.hint {
  display: block;
  margin-top: var(--space-1);
  color: var(--color-text-secondary);
}

:deep(.nut-button) {
  margin-top: var(--space-3);
}
</style>
