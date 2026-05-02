<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import LayoutShell from '@/components/layout-shell.vue'
import { getPartyflowMine } from '@/services/partyflow'
import type { PartyflowEvent, PartyflowMyStatus } from '@/types/partyflow'

const STAGE_ORDER: Record<string, string[]> = {
  party: ['none', 'applicant', 'activist', 'development_target', 'probationary_member', 'full_member'],
  league: ['none', 'applicant', 'activist', 'development_target', 'member'],
}

const STAGE_LABEL: Record<string, string> = {
  none: '未开始',
  applicant: '申请人',
  activist: '积极分子',
  development_target: '发展对象',
  probationary_member: '预备党员',
  full_member: '正式党员',
  member: '成员',
}

const ORG_LABEL: Record<string, string> = {
  party: '党组织',
  league: '团组织',
}

const loading = ref(false)
const error = ref('')
const statuses = ref<PartyflowMyStatus[]>([])

const reminderEvents = computed(() => {
  const out: Array<PartyflowEvent & { org_type: string }> = []
  for (const item of statuses.value) {
    for (const evt of item.history || []) {
      if (evt.event_type === 'reminder_sent') {
        out.push({ ...evt, org_type: item.org_type })
      }
    }
  }
  return out.sort((a, b) => String(b.happened_at).localeCompare(String(a.happened_at)))
})

function stageLabel(status: string) {
  return STAGE_LABEL[status] || status
}

function orgLabel(orgType: string) {
  return ORG_LABEL[orgType] || orgType
}

function stagesFor(item: PartyflowMyStatus) {
  const order = STAGE_ORDER[item.org_type] || []
  const currentIndex = order.indexOf(item.status)
  return order.map((status, index) => ({
    status,
    name: stageLabel(status),
    done: currentIndex >= 0 && index <= currentIndex,
    current: currentIndex === index,
  }))
}

async function loadPartyflow() {
  loading.value = true
  error.value = ''
  try {
    statuses.value = await getPartyflowMine()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载党团流程失败'
  } finally {
    loading.value = false
  }
}

onShow(() => {
  loadPartyflow()
})
</script>

<template>
  <layout-shell current="partyflow">
    <view class="page-container partyflow-page">
      <content-panel title="党团流程" sub-title="展示当前阶段与关键节点提醒">
        <template #default>
          <text class="intro">可查看你在党组织/团组织中的当前阶段、历史事件与提醒记录。</text>
          <nut-button plain :loading="loading" @click="loadPartyflow">刷新</nut-button>
        </template>
      </content-panel>

      <nut-noticebar v-if="error" wrapable color="danger" :text="`加载失败：${error}`" />

      <content-panel v-if="statuses.length === 0 && !loading && !error" title="党团流程">
        <template #default>
          <nut-empty image="empty" description="暂无流程数据" />
        </template>
      </content-panel>

      <content-panel v-for="item in statuses" :key="item.id" :title="`${orgLabel(item.org_type)}流程`" :sub-title="`当前阶段：${stageLabel(item.status)}`">
        <template #default>
          <text class="meta">阶段开始：{{ item.status_started_at || '-' }}</text>
          <text class="meta">预计动作：{{ item.next_action_hint || '暂无' }}</text>
          <view class="stage-list">
            <view v-for="(stage, index) in stagesFor(item)" :key="stage.status" class="stage-item">
              <view class="stage-dot" :class="{ 'stage-dot--done': stage.done, 'stage-dot--current': stage.current }">{{ index + 1 }}</view>
              <view class="stage-content">
                <text class="stage-title">{{ stage.name }}</text>
                <text class="stage-status">{{ stage.current ? '当前阶段' : stage.done ? '已完成' : '待完成' }}</text>
              </view>
            </view>
          </view>

          <view class="history-wrap">
            <text class="history-title">历史事件</text>
            <nut-cell
              v-for="evt in item.history || []"
              :key="`${item.id}-${evt.id}`"
              :title="`${evt.event_code || evt.event_type}`"
              :desc="`${evt.happened_at}${evt.note ? ` · ${evt.note}` : ''}`"
              icon="list"
            />
          </view>
        </template>
      </content-panel>

      <content-panel title="关键提醒">
        <template #default>
          <nut-cell
            v-for="evt in reminderEvents"
            :key="`reminder-${evt.id}`"
            :title="evt.note || evt.event_code"
            :desc="`${orgLabel(evt.org_type)} · ${evt.happened_at}`"
            icon="notice"
          />
          <nut-empty v-if="!reminderEvents.length" image="empty" description="暂无提醒记录" />
        </template>
      </content-panel>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.partyflow-page {
  min-height: 100vh;
}

.intro {
  display: block;
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.meta {
  display: block;
  margin-bottom: var(--space-1);
  color: var(--color-text-secondary);
}

.stage-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.stage-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.stage-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.stage-dot--done {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.stage-dot--current {
  box-shadow: 0 0 0 2px rgba(16, 39, 122, 0.2);
}

.stage-content {
  flex: 1;
  min-width: 0;
}

.stage-title,
.stage-status {
  display: block;
}

.stage-status {
  margin-top: 2px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.history-wrap {
  margin-top: var(--space-3);
}

.history-title {
  display: block;
  margin-bottom: var(--space-1);
  font-weight: var(--font-weight-medium);
}
</style>
