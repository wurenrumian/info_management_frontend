<script setup lang="ts">
import LayoutShell from '@/components/layout-shell.vue'

function goApply() {
  uni.navigateTo({ url: '/subpackages/certificates/form' })
}

function goRecords() {
  uni.navigateTo({ url: '/subpackages/certificates/records' })
}
</script>

<template>
  <layout-shell current="certificates">
    <view class="page-container certificates-page">
      <content-panel title="电子证件" sub-title="证明申请、记录查询与下载入口">
        <template #default>
          <view class="action-row">
            <nut-button type="primary" @click="goApply">发起证件申请</nut-button>
            <nut-button plain @click="goRecords">查看我的证件</nut-button>
          </view>
        </template>
      </content-panel>

      <content-panel title="支持类型（占位）">
        <template #default>
          <nut-cell title="在读证明" desc="自动填充学号、姓名、学院等信息" icon="tips" />
          <nut-cell title="团员/党员相关证明" desc="结合党团流程信息生成" icon="tips" />
          <nut-cell title="其他学院证明" desc="后续可扩展模板" icon="tips" />
        </template>
      </content-panel>

      <content-panel title="说明">
        <template #default>
          <text class="intro">当前为前端页面骨架，后续可直接接入证件生成与审批联动 API。</text>
        </template>
      </content-panel>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.certificates-page {
  min-height: 100vh;
}

.action-row {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.intro {
  display: block;
  color: var(--color-text-secondary);
  line-height: 1.7;
}
</style>
