<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import LayoutShell from '@/components/layout-shell.vue'
import { getAdminPartyflowStatuses } from '@/services/partyflow'
import { useUserStore } from '@/stores/user'
import { UserRole } from '@/constants/enums'
import type { PartyflowAdminStatusItem, PartyflowAdminStatusListParams, PartyflowOrgType } from '@/types/partyflow'
import { formatDateTime } from '@/utils/partyflow'

const LIMIT = 20

const userStore = useUserStore()

const hasPermission = computed(() => Number(userStore.userInfo?.role || 0) >= UserRole.LEAGUE_CADRE)

const orgType = ref<PartyflowOrgType | ''>('')
const status = ref('')
const studentId = ref('')

const items = ref<PartyflowAdminStatusItem[]>([])
const total = ref(0)
const offset = ref(0)
const loading = ref(false)
const error = ref('')

const isEmpty = computed(() => !loading.value && !error.value && items.value.length === 0)
const canPrev = computed(() => offset.value > 0)
const canNext = computed(() => offset.value + LIMIT < total.value)

function orgLabel(value: PartyflowOrgType) {
  return value === 'party' ? '党组织' : '团组织'
}

function buildParams(): PartyflowAdminStatusListParams {
  const params: PartyflowAdminStatusListParams = {
    limit: LIMIT,
    offset: offset.value,
  }
  const statusValue = status.value.trim()
  const studentValue = studentId.value.trim()
  if (orgType.value) {
    params.org_type = orgType.value
  }
  if (statusValue) {
    params.status = statusValue
  }
  if (studentValue) {
    params.student_id = studentValue
  }
  return params
}

async function loadList() {
  if (!hasPermission.value) {
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await getAdminPartyflowStatuses(buildParams())
    items.value = res.data
    total.value = res.total
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function onSearch() {
  offset.value = 0
  loadList()
}

function onReset() {
  orgType.value = ''
  status.value = ''
  studentId.value = ''
  offset.value = 0
  loadList()
}

function prevPage() {
  offset.value = Math.max(0, offset.value - LIMIT)
  loadList()
}

function nextPage() {
  offset.value = offset.value + LIMIT
  loadList()
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/subpackages/partyflow/admin/detail?id=${id}` })
}

function goEdit(id: number) {
  uni.navigateTo({ url: `/subpackages/partyflow/admin/form?id=${id}` })
}

function goCreate() {
  uni.navigateTo({ url: '/subpackages/partyflow/admin/form' })
}

function goRules() {
  uni.navigateTo({ url: '/subpackages/partyflow/admin/rules' })
}

function goScan() {
  uni.navigateTo({ url: '/subpackages/partyflow/admin/scan' })
}

function goImport() {
  uni.navigateTo({ url: '/subpackages/partyflow/admin/import' })
}

onShow(() => {
  loadList()
})
</script>

<template>
  <layout-shell current="partyflow">
    <view class="admin-page page-container">
      <content-panel v-if="!hasPermission" title="无权限访问">
        <template #default>
          <nut-noticebar text="仅团学干部及以上角色可管理党团流程" color="danger" />
        </template>
      </content-panel>

      <template v-else>
        <content-panel class="toolbar" title="党团流程管理">
          <template #default>
            <view class="filter-row">
              <nut-button size="small" :type="orgType === '' ? 'primary' : 'default'" @click="orgType = ''">全部</nut-button>
              <nut-button size="small" :type="orgType === 'party' ? 'primary' : 'default'" @click="orgType = 'party'">党组织</nut-button>
              <nut-button size="small" :type="orgType === 'league' ? 'primary' : 'default'" @click="orgType = 'league'">团组织</nut-button>
            </view>

            <view class="input-row">
              <nut-input v-model="studentId" placeholder="按学号筛选（可选）" />
              <nut-input v-model="status" placeholder="按状态筛选（可选）" />
            </view>

            <view class="button-row">
              <nut-button type="primary" :loading="loading" @click="onSearch">搜索</nut-button>
              <nut-button plain :disabled="loading" @click="onReset">重置</nut-button>
              <nut-button plain @click="goCreate">新增</nut-button>
              <nut-button plain @click="goImport">批量导入</nut-button>
              <nut-button plain @click="goRules">提醒规则</nut-button>
              <nut-button plain @click="goScan">扫描提醒</nut-button>
            </view>
          </template>
        </content-panel>

        <nut-noticebar v-if="error" wrapable color="danger" :text="`加载失败：${error}`" />

        <nut-empty v-else-if="isEmpty" image="empty" description="暂无数据" />

        <view v-else class="list-wrap">
          <content-panel v-for="item in items" :key="item.id" class="item-card">
            <template #default>
              <text class="item-title">{{ item.student_name }}（{{ item.student_id }}）</text>
              <text class="item-meta">组织：{{ orgLabel(item.org_type) }} · 状态：{{ item.status }}</text>
              <text class="item-meta">阶段开始：{{ formatDateTime(item.status_started_at) }}</text>
              <text class="item-meta">预计动作：{{ item.next_action_hint || '暂无' }}</text>
              <view class="button-row">
                <nut-button plain size="small" @click="goDetail(item.id)">详情</nut-button>
                <nut-button plain size="small" @click="goEdit(item.id)">编辑</nut-button>
              </view>
            </template>
          </content-panel>

          <content-panel class="pager">
            <template #default>
              <text class="item-meta">共 {{ total }} 条，当前偏移 {{ offset }}</text>
              <view class="button-row">
                <nut-button plain :disabled="!canPrev || loading" @click="prevPage">上一页</nut-button>
                <nut-button plain :disabled="!canNext || loading" @click="nextPage">下一页</nut-button>
              </view>
            </template>
          </content-panel>
        </view>
      </template>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.admin-page {
  min-height: 100vh;
}

.toolbar {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.input-row {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
  flex-wrap: wrap;
}

.list-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.item-title {
  display: block;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

.item-meta {
  display: block;
  margin-top: var(--space-1);
  color: var(--color-text-secondary);
}

:deep(.nut-input) {
  flex: 1;
  min-width: 200px;
}
</style>

