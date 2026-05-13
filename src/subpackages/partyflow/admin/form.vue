<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import LayoutShell from '@/components/layout-shell.vue'
import { createAdminPartyflowStatus, getAdminPartyflowStatusDetail, patchAdminPartyflowStatus } from '@/services/partyflow'
import { useUserStore } from '@/stores/user'
import { UserRole } from '@/constants/enums'
import type { CreatePartyflowStatusPayload, PartyflowAdminStatusItem, PartyflowOrgType, PatchPartyflowStatusPayload } from '@/types/partyflow'

const userStore = useUserStore()

const hasPermission = computed(() => Number(userStore.userInfo?.role || 0) >= UserRole.LEAGUE_CADRE)

const currentId = ref(0)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const detail = ref<PartyflowAdminStatusItem | null>(null)

const formState = reactive({
  user_id: '',
  org_type: 'party' as PartyflowOrgType,
  status: '',
  status_started_at: '',
  joined_at: '',
  next_action_hint: '',
  note: '',
})

const pageTitle = computed(() => (currentId.value > 0 ? '编辑党团流程状态' : '新增党团流程状态'))

function buildCreatePayload(): CreatePartyflowStatusPayload {
  return {
    user_id: Number(formState.user_id),
    org_type: formState.org_type,
    status: formState.status.trim(),
    status_started_at: formState.status_started_at.trim(),
    joined_at: formState.joined_at.trim() ? formState.joined_at.trim() : null,
    next_action_hint: formState.next_action_hint.trim() || undefined,
    note: formState.note.trim() || undefined,
  }
}

function buildPatchPayload(): PatchPartyflowStatusPayload {
  const payload: PatchPartyflowStatusPayload = {
    status: formState.status.trim() || undefined,
    status_started_at: formState.status_started_at.trim() || undefined,
    joined_at: formState.joined_at.trim() ? formState.joined_at.trim() : undefined,
    next_action_hint: formState.next_action_hint.trim() || undefined,
    note: formState.note.trim() || undefined,
  }
  return payload
}

function validateCreate(payload: CreatePartyflowStatusPayload): string {
  if (!Number.isFinite(payload.user_id) || payload.user_id <= 0) {
    return '请输入正确的用户ID'
  }
  if (!payload.status) {
    return '请输入状态'
  }
  if (!payload.status_started_at) {
    return '请输入阶段开始时间（ISO）'
  }
  return ''
}

async function loadDetail(id: number) {
  if (!hasPermission.value) {
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await getAdminPartyflowStatusDetail(id)
    detail.value = res
    formState.user_id = String(res.user_id)
    formState.org_type = res.org_type
    formState.status = res.status
    formState.status_started_at = String(res.status_started_at || '')
    formState.joined_at = String(res.joined_at || '')
    formState.next_action_hint = String(res.next_action_hint || '')
    formState.note = ''
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function submitForm() {
  if (!hasPermission.value) {
    return
  }
  saving.value = true
  try {
    if (currentId.value > 0) {
      await patchAdminPartyflowStatus(currentId.value, buildPatchPayload())
      uni.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => uni.navigateBack(), 400)
      return
    }
    const payload = buildCreatePayload()
    const validationError = validateCreate(payload)
    if (validationError) {
      uni.showToast({ title: validationError, icon: 'none' })
      return
    }
    const created = await createAdminPartyflowStatus(payload)
    uni.showToast({ title: '创建成功', icon: 'success' })
    setTimeout(() => uni.redirectTo({ url: `/subpackages/partyflow/admin/detail?id=${created.id}` }), 400)
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

onLoad((query) => {
  const id = Number(query?.id || 0)
  currentId.value = id
  if (id > 0) {
    loadDetail(id)
  }
})
</script>

<template>
  <layout-shell current="partyflow">
    <view class="form-page page-container">
      <content-panel v-if="!hasPermission" title="无权限访问" />

      <content-panel v-else :title="pageTitle">
        <template #default>
          <view v-if="loading" class="state-block">
            <nut-empty image="empty" description="加载中..." />
          </view>

          <nut-noticebar v-else-if="error" color="danger" wrapable :text="error" />

          <template v-else>
            <view class="field">
              <text class="label">用户ID</text>
              <nut-input v-model="formState.user_id" :disabled="currentId > 0" placeholder="从列表/详情可看到 user_id" />
            </view>

            <view class="field">
              <text class="label">组织类型</text>
              <view class="select-row">
                <nut-button size="small" :type="formState.org_type === 'party' ? 'primary' : 'default'" @click="formState.org_type = 'party'">党组织</nut-button>
                <nut-button size="small" :type="formState.org_type === 'league' ? 'primary' : 'default'" @click="formState.org_type = 'league'">团组织</nut-button>
              </view>
            </view>

            <view class="field">
              <text class="label">状态</text>
              <nut-input v-model="formState.status" placeholder="例如：activist / development_target" />
            </view>

            <view class="field">
              <text class="label">阶段开始时间（ISO）</text>
              <nut-input v-model="formState.status_started_at" placeholder="例如：2026-04-01T00:00:00Z" />
            </view>

            <view class="field">
              <text class="label">加入时间（ISO，可选）</text>
              <nut-input v-model="formState.joined_at" placeholder="例如：2026-05-01T00:00:00Z" />
            </view>

            <view class="field">
              <text class="label">预计动作（可选）</text>
              <nut-input v-model="formState.next_action_hint" placeholder="例如：每满3个月提交思想汇报" />
            </view>

            <view class="field">
              <text class="label">备注（可选）</text>
              <nut-input v-model="formState.note" placeholder="本次变更原因/说明" />
            </view>

            <nut-button type="primary" block :loading="saving" @click="submitForm">保存</nut-button>
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

.field + .field {
  margin-top: var(--space-3);
}

.label {
  display: block;
  margin-bottom: var(--space-1);
  color: var(--color-text-secondary);
}

.select-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

:deep(.nut-button) {
  margin-top: var(--space-3);
}
</style>

