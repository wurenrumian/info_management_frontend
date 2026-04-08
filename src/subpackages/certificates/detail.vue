<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import LayoutShell from '@/components/layout-shell.vue'

const recordId = ref(0)

function previewPlaceholder() {
  // TODO: 接入证件预览/下载地址。
  uni.showToast({ title: '预览链接待补全', icon: 'none' })
}

function downloadPlaceholder() {
  // TODO: 接入证件文件下载逻辑。
  uni.showToast({ title: '下载逻辑待补全', icon: 'none' })
}

onLoad((query) => {
  recordId.value = Number(query?.id || 0)
})
</script>

<template>
  <layout-shell current="certificates">
    <view class="page-container detail-page">
      <content-panel :title="`证件详情 #${recordId || '-'}`" sub-title="电子证件详情页（占位）">
        <template #default>
          <nut-cell title="证件类型" desc="在读证明" />
          <nut-cell title="当前状态" desc="已生成" />
          <nut-cell title="生成时间" desc="2026-04-07 19:20" />
          <nut-cell title="关联审批" desc="审批 #3001（可选）" />
        </template>
      </content-panel>

      <content-panel title="证件操作">
        <template #default>
          <view class="action-row">
            <nut-button type="primary" @click="previewPlaceholder">在线预览</nut-button>
            <nut-button plain @click="downloadPlaceholder">下载 PDF</nut-button>
          </view>
        </template>
      </content-panel>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.detail-page {
  min-height: 100vh;
}

.action-row {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

:deep(.nut-button) {
  margin: 0;
}
</style>
