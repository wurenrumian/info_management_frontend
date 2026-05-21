<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import LayoutShell from '@/components/layout-shell.vue'
import { getMyCertificateList } from '@/services/certificates'
import type { CertificateRecord } from '@/types/certificates'

const records = ref<CertificateRecord[]>([])
const loading = ref(false)
const error = ref('')
const filterApprovalType = ref<'all' | 'leave' | 'budget'>('all')

function stageLabel(stage: string) {
  return stage === 'application' ? '申请材料' : stage === 'approval_certificate' ? '审批凭证' : stage || '-'
}
function sealLabel(seal: string) {
  return seal === 'none' ? '未盖章' : seal === 'internal_seal_applied' ? '已盖章' : seal || '-'
}
function statusLabel(status: string) {
  return status === 'generated' ? '已生成' : status === 'failed' ? '生成失败' : status === 'revoked' ? '已作废' : status || '-'
}

async function fetchRecords() {
  loading.value = true
  error.value = ''
  try {
    const res = await getMyCertificateList({
      limit: 20,
      offset: 0,
      approval_type: filterApprovalType.value === 'all' ? undefined : filterApprovalType.value,
    })
    records.value = res.data || []
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载证件记录失败'
  } finally {
    loading.value = false
  }
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/subpackages/certificates/detail?id=${id}` })
}

onShow(() => {
  fetchRecords()
})
</script>

<template>
  <layout-shell current="certificates">
    <view class="page-container records-page">
      <content-panel title="我的证件" sub-title="申请材料与审批凭证记录">
        <template #default>
          <view class="filter-row">
            <nut-button size="small" :type="filterApprovalType === 'all' ? 'primary' : 'default'" @click="filterApprovalType = 'all'; fetchRecords()">全部</nut-button>
            <nut-button size="small" :type="filterApprovalType === 'leave' ? 'primary' : 'default'" @click="filterApprovalType = 'leave'; fetchRecords()">请假</nut-button>
            <nut-button size="small" :type="filterApprovalType === 'budget' ? 'primary' : 'default'" @click="filterApprovalType = 'budget'; fetchRecords()">预算</nut-button>
          </view>
          <nut-noticebar v-if="error" wrapable color="danger" :text="`加载失败：${error}`" />
          <nut-cell
            v-for="item in records"
            :key="item.id"
            :title="`${stageLabel(item.document_stage)} · ${item.certificate_no || '-'}`"
            :desc="`${sealLabel(item.seal_status || '')} · ${statusLabel(item.status)} · ${item.generated_at || '-'}`"
            icon="checked"
            is-link
            @click="goDetail(item.id)"
          />
          <nut-empty v-if="!loading && !records.length && !error" image="empty" description="暂无证件记录" />
        </template>
      </content-panel>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.records-page {
  min-height: 100vh;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}
</style>
