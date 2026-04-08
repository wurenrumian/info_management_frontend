<script setup lang="ts">
import LayoutShell from '@/components/layout-shell.vue'
import SubscribePanel from '@/components/notification/SubscribePanel.vue'

type QuickEntry = {
  title: string
  desc: string
  icon: string
  path: string
}

const quickEntries: QuickEntry[] = [
  { title: '审批流程', desc: '发起或处理审批', icon: 'checked', path: '/subpackages/approvals/index' },
  { title: '电子证件', desc: '申请与记录查询', icon: 'tips', path: '/subpackages/certificates/index' },
  { title: '知识库', desc: '问答与资料检索', icon: 'category', path: '/subpackages/knowledge/index' },
  { title: '信息发布', desc: '查看学院通知', icon: 'message', path: '/subpackages/announcements/index' },
  { title: '党团流程', desc: '阶段追踪与提醒', icon: 'notice', path: '/subpackages/partyflow/index' },
  { title: '个人中心', desc: '资料与账号设置', icon: 'my', path: '/pages/profile/index' },
]

function goToStyleShowcase() {
  uni.navigateTo({
    url: '/pages/style-showcase/index',
  })
}

function goToPath(path: string) {
  if (path.startsWith('/pages/')) {
    uni.reLaunch({ url: path })
    return
  }
  uni.navigateTo({ url: path })
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
            <view class="quick-grid">
              <view v-for="item in quickEntries" :key="item.title" class="quick-card" @click="goToPath(item.path)">
                <view class="quick-card__head">
                  <nut-icon :name="item.icon" size="16" />
                  <text class="quick-card__title">{{ item.title }}</text>
                </view>
                <text class="quick-card__desc">{{ item.desc }}</text>
              </view>
            </view>
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

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
}

.quick-card {
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.quick-card__head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.quick-card__title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
}

.quick-card__desc {
  display: block;
  margin-top: 6px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
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

  .quick-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
