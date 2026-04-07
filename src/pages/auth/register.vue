<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  uni.redirectTo({ url: '/pages/auth/login?mode=public' })
})
</script>

<template>
  <view class="register-page page-container">
    <content-panel class="register-card" title="公开注册/激活">
      <template #default>
        <nut-empty image="empty" description="正在跳转到公开注册/激活..." />
      </template>
    </content-panel>
  </view>
</template>

<style scoped lang="scss">
.register-page {
  min-height: 100vh;
}

.register-card {
  max-width: 520px;
  margin: 0 auto;
}
</style>
