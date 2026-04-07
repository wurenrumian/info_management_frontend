<script setup lang="ts">
import LayoutShell from '@/components/layout-shell.vue'
import SubscribePanel from '@/components/notification/SubscribePanel.vue'

function goToStyleShowcase() {
  uni.navigateTo({
    url: '/pages/style-showcase/index',
  })
}

function goToProfile() {
  uni.reLaunch({
    url: '/pages/profile/index',
  })
}
</script>

<template>
  <layout-shell current="home">
    <view class="home page-container">
      <view class="home-grid">
        <content-panel class="hero-panel" title="学院事务一站式系统" sub-title="通知、审批与流程统一入口">
          <template #default>
            <view class="hero-actions">
              <nut-button type="primary" block @click="goToProfile">
                <nut-icon name="my" />
                <text class="btn-text">前往个人主页</text>
              </nut-button>
              <nut-button plain block @click="goToStyleShowcase">
                <nut-icon name="tips" />
                <text class="btn-text">查看样式预览页</text>
              </nut-button>
            </view>
          </template>
        </content-panel>

        <content-panel title="快捷入口" sub-title="常用功能快速到达">
          <template #default>
            <nut-cell title="个人信息维护" is-link icon="my" @click="goToProfile" />
            <nut-cell title="风格验收页" is-link icon="service" @click="goToStyleShowcase" />
          </template>
        </content-panel>

        <subscribe-panel class="subscribe-panel" />
      </view>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.home {
  min-height: 100vh;
}

.home-grid {
  display: grid;
  gap: var(--space-3);
}

.hero-panel {
  overflow: hidden;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: var(--space-3);
}

.btn-text {
  margin-left: 6px;
}

@media (min-width: 1024px) {
  .home-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-4);
  }

  .hero-panel {
    min-height: 100%;
  }

  .hero-actions {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-top: var(--space-4);
  }
}
</style>
