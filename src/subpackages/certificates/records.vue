<script setup lang="ts">
import { ref } from 'vue'
import LayoutShell from '@/components/layout-shell.vue'

type CertificateRecord = {
  id: number
  type: string
  status: string
  createdAt: string
}

// TODO: 接入“我的证件记录”查询 API。
const records = ref<CertificateRecord[]>([
  { id: 5001, type: '在读证明', status: '已生成', createdAt: '2026-04-07 19:20' },
  { id: 5002, type: '团员证明', status: '审核中', createdAt: '2026-04-08 08:30' },
])

function goDetail(id: number) {
  uni.navigateTo({ url: `/subpackages/certificates/detail?id=${id}` })
}
</script>

<template>
  <layout-shell current="certificates">
    <view class="page-container records-page">
      <content-panel title="我的证件" sub-title="申请记录与状态查询">
        <template #default>
          <nut-cell
            v-for="item in records"
            :key="item.id"
            :title="item.type"
            :desc="`${item.status} · ${item.createdAt}`"
            icon="checked"
            is-link
            @click="goDetail(item.id)"
          />
          <nut-empty v-if="!records.length" image="empty" description="暂无证件记录" />
        </template>
      </content-panel>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.records-page {
  min-height: 100vh;
}
</style>
