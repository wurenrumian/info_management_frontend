<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import LayoutShell from '@/components/layout-shell.vue'
import { createAdminPartyflowEvent, getAdminPartyflowStatusDetail } from '@/services/partyflow'
import { useUserStore } from '@/stores/user'
import { UserRole } from '@/constants/enums'
import type { CreatePartyflowEventPayload, PartyflowAdminStatusItem, PartyflowEvent } from '@/types/partyflow'
import { compareIsoDesc, formatDateTime } from '@/utils/partyflow'

const userStore = useUserStore()

const hasPermission = computed(() => Number(userStore.userInfo?.role || 0) >= UserRole.LEAGUE_CADRE)

const currentId = ref(0)
const loading = ref(false)
const error = ref('')
const detail = ref<PartyflowAdminStatusItem | null>(null)

const creatingEvent = ref(false)
const eventForm = reactive<CreatePartyflowEventPayload>({
  event_type: 'milestone',
  event_code: '',
  note: '',
})

function orgLabel(value: string) {
  if (value === 'party') {
    return '党组织'
  }
  if (value === 'league') {
    return '团组织'
  }
  return value
}

const sortedHistory = computed(() => {
  const list = detail.value?.history || []
  return [...list].sort((a, b) => compareIsoDesc(a.happened_at, b.happened_at))
})

async function loadDetail(id: number) {
  if (!hasPermission.value) {
    return
  }
  loading.value = true
  error.value = ''
  try {
    detail.value = await getAdminPartyflowStatusDetail(id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function goEdit() {
  uni.navigateTo({ url: `/subpackages/partyflow/admin/form?id=${currentId.value}` })
}

function goBack() {
  uni.navigateBack()
}

function validateEvent(payload: CreatePartyflowEventPayload): string {
  if (!payload.event_code.trim()) {
    return '请输入事件编码'
  }
  return ''
}

async function submitEvent() {
  if (!detail.value) {
    return
  }
  const validationError = validateEvent(eventForm)
  if (validationError) {
    uni.showToast({ title: validationError, icon: 'none' })
    return
  }
  creatingEvent.value = true
  try {
    await createAdminPartyflowEvent(detail.value.id, {
      event_type: eventForm.event_type,
      event_code: eventForm.event_code.trim(),
      note: String(eventForm.note || '').trim() || undefined,
    })
    eventForm.event_code = ''
    eventForm.note = ''
    uni.showToast({ title: '已添加事件', icon: 'success' })
    loadDetail(detail.value.id)
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '添加失败', icon: 'none' })
  } finally {
    creatingEvent.value = false
  }
}

function eventTitle(evt: PartyflowEvent) {
  const note = String(evt.note || '').trim()
  if (note) {
    return note
  }
  const code = String(evt.event_code || '').trim()
  if (code) {
    return code
  }
  return evt.event_type || '事件'
}

function eventDesc(evt: PartyflowEvent) {
  const meta = evt.from_status && evt.to_status ? `${evt.from_status} -> ${evt.to_status}` : ''
  const base = formatDateTime(evt.happened_at)
  return meta ? `${base} · ${meta}` : base
}

onLoad((query) => {
  const id = Number(query?.id || 0)
  currentId.value = id
  if (!id) {
    error.value = '参数错误：缺少状态ID'
    return
  }
  loadDetail(id)
})
</script>

<template>
  <layout-shell current="partyflow">
    <view class="detail-page page-container">
      <content-panel v-if="!hasPermission" title="无权限访问" />

      <content-panel v-else-if="loading" title="党团流程详情">
        <template #default>
          <nut-empty image="empty" description="加载中..." />
        </template>
      </content-panel>

      <nut-noticebar v-else-if="error" color="danger" wrapable :text="error" />

      <template v-else-if="detail">
        <content-panel :title="`${detail.student_name}（${detail.student_id}）`" sub-title="党团流程详情">
          <template #default>
            <nut-cell title="用户ID" :desc="String(detail.user_id)" />
            <nut-cell title="组织类型" :desc="orgLabel(detail.org_type)" />
            <nut-cell title="当前状态" :desc="detail.status" />
            <nut-cell title="阶段开始" :desc="formatDateTime(detail.status_started_at)" />
            <nut-cell title="加入时间" :desc="detail.joined_at ? formatDateTime(detail.joined_at) : '-'" />
            <nut-cell title="预计动作" :desc="detail.next_action_hint || '-'" />
            <nut-cell title="更新时间" :desc="formatDateTime(detail.updated_at)" />
            <view class="button-row">
              <nut-button plain @click="goBack">返回</nut-button>
              <nut-button plain @click="goEdit">编辑状态</nut-button>
            </view>
          </template>
        </content-panel>

        <content-panel title="历史事件">
          <template #default>
            <nut-cell v-for="evt in sortedHistory" :key="evt.id" :title="eventTitle(evt)" :desc="eventDesc(evt)" icon="list" />
            <nut-empty v-if="!sortedHistory.length" image="empty" description="暂无事件记录" />
          </template>
        </content-panel>

        <content-panel title="添加事件" sub-title="用于里程碑或人工调整记录">
          <template #default>
            <view class="field">
              <text class="label">事件类型</text>
              <view class="select-row">
                <nut-button size="small" :type="eventForm.event_type === 'milestone' ? 'primary' : 'default'" @click="eventForm.event_type = 'milestone'">
                  milestone
                </nut-button>
                <nut-button
                  size="small"
                  :type="eventForm.event_type === 'manual_adjust' ? 'primary' : 'default'"
                  @click="eventForm.event_type = 'manual_adjust'"
                >
                  manual_adjust
                </nut-button>
              </view>
            </view>

            <view class="field">
              <text class="label">事件编码</text>
              <nut-input v-model="eventForm.event_code" placeholder="例如：party_publicity_done" />
            </view>

            <view class="field">
              <text class="label">备注（可选）</text>
              <nut-input v-model="eventForm.note" placeholder="例如：已完成公示" />
            </view>

            <nut-button type="primary" block :loading="creatingEvent" @click="submitEvent">提交事件</nut-button>
          </template>
        </content-panel>
      </template>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.detail-page {
  min-height: 100vh;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
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

