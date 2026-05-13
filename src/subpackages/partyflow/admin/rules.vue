<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import LayoutShell from '@/components/layout-shell.vue'
import { getAdminPartyflowReminderRules, patchAdminPartyflowReminderRule } from '@/services/partyflow'
import { useUserStore } from '@/stores/user'
import { UserRole } from '@/constants/enums'
import type { PartyflowAudience, PartyflowOrgType, PartyflowReminderRule, PatchPartyflowRulePayload } from '@/types/partyflow'

const userStore = useUserStore()

const hasPermission = computed(() => Number(userStore.userInfo?.role || 0) >= UserRole.LEAGUE_CADRE)

const orgType = ref<PartyflowOrgType | ''>('')
const onlyEnabled = ref(false)

const loading = ref(false)
const error = ref('')
const rules = ref<PartyflowReminderRule[]>([])

const savingIds = ref<Record<number, boolean>>({})

const draftMap = reactive<Record<number, PatchPartyflowRulePayload>>({})

function orgLabel(value: PartyflowOrgType) {
  return value === 'party' ? '党组织' : '团组织'
}

function audienceLabel(value: PartyflowAudience) {
  if (value === 'student') {
    return '学生'
  }
  if (value === 'admin') {
    return '管理端'
  }
  return '双方'
}

function buildParams() {
  return {
    ...(orgType.value ? { org_type: orgType.value } : {}),
    ...(onlyEnabled.value ? { enabled: true } : {}),
  }
}

function ensureDraft(rule: PartyflowReminderRule) {
  if (!draftMap[rule.id]) {
    draftMap[rule.id] = {}
  }
  return draftMap[rule.id]
}

function resetDraft(rule: PartyflowReminderRule) {
  draftMap[rule.id] = {
    enabled: rule.enabled,
    offset_days: rule.offset_days,
    repeat_interval_days: rule.repeat_interval_days,
    audience: rule.audience,
    title: rule.title,
    message_template: rule.message_template,
  }
}

async function loadRules() {
  if (!hasPermission.value) {
    return
  }
  loading.value = true
  error.value = ''
  try {
    const list = await getAdminPartyflowReminderRules(buildParams())
    rules.value = list
    for (const rule of list) {
      resetDraft(rule)
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function saveRule(rule: PartyflowReminderRule) {
  const draft = ensureDraft(rule)
  savingIds.value[rule.id] = true
  try {
    const payload: PatchPartyflowRulePayload = {
      enabled: draft.enabled,
      offset_days: Number(draft.offset_days),
      repeat_interval_days: Number(draft.repeat_interval_days),
      audience: draft.audience,
      title: String(draft.title || '').trim() || undefined,
      message_template: String(draft.message_template || '').trim() || undefined,
    }
    const updated = await patchAdminPartyflowReminderRule(rule.id, payload)
    const nextList = rules.value.map((item) => (item.id === rule.id ? updated : item))
    rules.value = nextList
    resetDraft(updated)
    uni.showToast({ title: '已保存', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '保存失败', icon: 'none' })
  } finally {
    savingIds.value[rule.id] = false
  }
}

onShow(() => {
  loadRules()
})
</script>

<template>
  <layout-shell current="partyflow">
    <view class="rules-page page-container">
      <content-panel v-if="!hasPermission" title="无权限访问" />

      <template v-else>
        <content-panel title="提醒规则管理" sub-title="调整启停、提前天数、重复周期与文案模板">
          <template #default>
            <view class="filter-row">
              <nut-button size="small" :type="orgType === '' ? 'primary' : 'default'" @click="orgType = ''">全部</nut-button>
              <nut-button size="small" :type="orgType === 'party' ? 'primary' : 'default'" @click="orgType = 'party'">党组织</nut-button>
              <nut-button size="small" :type="orgType === 'league' ? 'primary' : 'default'" @click="orgType = 'league'">团组织</nut-button>
            </view>
            <view class="switch-inline">
              <text class="label-no-margin">仅显示启用规则</text>
              <nut-switch v-model="onlyEnabled" @change="loadRules" />
            </view>
            <nut-button plain :loading="loading" @click="loadRules">刷新</nut-button>
          </template>
        </content-panel>

        <nut-noticebar v-if="error" wrapable color="danger" :text="`加载失败：${error}`" />

        <nut-empty v-else-if="!loading && rules.length === 0" image="empty" description="暂无规则" />

        <content-panel v-for="rule in rules" :key="rule.id" class="rule-card" :title="rule.title || rule.rule_code" :sub-title="`${orgLabel(rule.org_type)} · ${rule.status}`">
          <template #default>
            <nut-cell title="规则编码" :desc="rule.rule_code" />
            <nut-cell title="触发方式" :desc="rule.trigger_type" />
            <nut-cell title="受众" :desc="audienceLabel(rule.audience)" />

            <view class="field">
              <view class="switch-inline">
                <text class="label-no-margin">启用</text>
                <nut-switch v-model="ensureDraft(rule).enabled" />
              </view>
            </view>

            <view class="field">
              <text class="label">提前天数 offset_days</text>
              <nut-input v-model="ensureDraft(rule).offset_days" type="number" placeholder="例如：30" />
            </view>

            <view class="field">
              <text class="label">重复周期 repeat_interval_days</text>
              <nut-input v-model="ensureDraft(rule).repeat_interval_days" type="number" placeholder="例如：90" />
            </view>

            <view class="field">
              <text class="label">标题</text>
              <nut-input v-model="ensureDraft(rule).title" placeholder="提醒标题" />
            </view>

            <view class="field">
              <text class="label">消息模板</text>
              <nut-textarea v-model="ensureDraft(rule).message_template" maxlength="500" placeholder="提醒文案模板" />
            </view>

            <view class="field">
              <text class="label">受众</text>
              <view class="filter-row">
                <nut-button
                  size="small"
                  :type="ensureDraft(rule).audience === 'student' ? 'primary' : 'default'"
                  @click="ensureDraft(rule).audience = 'student'"
                >
                  学生
                </nut-button>
                <nut-button size="small" :type="ensureDraft(rule).audience === 'admin' ? 'primary' : 'default'" @click="ensureDraft(rule).audience = 'admin'">
                  管理端
                </nut-button>
                <nut-button size="small" :type="ensureDraft(rule).audience === 'both' ? 'primary' : 'default'" @click="ensureDraft(rule).audience = 'both'">
                  双方
                </nut-button>
              </view>
            </view>

            <nut-button type="primary" block :loading="savingIds[rule.id]" @click="saveRule(rule)">保存本条规则</nut-button>
          </template>
        </content-panel>
      </template>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.rules-page {
  min-height: 100vh;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
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

.switch-inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

:deep(.nut-button) {
  margin-top: var(--space-3);
}
</style>

