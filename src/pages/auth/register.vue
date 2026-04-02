<script setup lang="ts">
import { ref } from 'vue'
import { bindStudent, devLogin, getUserInfo, wechatLogin } from '@/services/auth'
import { useUserStore } from '@/stores/user'
import { isWeixinMiniProgram } from '@/utils/platform'
import type { AuthToken } from '@/types/user'

const userStore = useUserStore()
const loading = ref(false)
const studentId = ref('')
const password = ref('')
const devRole = ref(1)
const isDev = import.meta.env.DEV

function handleDevRoleChange(e: { detail: { value: string | number } }) {
  devRole.value = Number(e.detail.value) + 1
}

async function saveAuth(auth: AuthToken) {
  userStore.setToken(auth.token)
  try {
    const latestUser = await getUserInfo()
    userStore.setUserInfo(latestUser)
  } catch {
    userStore.setUserInfo(auth.user)
  }
  uni.reLaunch({ url: '/pages/profile/index' })
}

function getLoginCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.login({
      success: (res) => {
        if (res.code) {
          resolve(res.code)
          return
        }
        reject(new Error('未获取到微信登录 code'))
      },
      fail: (err) => {
        const errMsg = (err as { errMsg?: string })?.errMsg || '微信登录失败'
        reject(new Error(errMsg))
      },
    })
  })
}

async function handleRegister() {
  if (!studentId.value.trim() || !password.value) {
    uni.showToast({ title: '请输入学号和密码', icon: 'none' })
    return
  }

  loading.value = true
  try {
    if (!isWeixinMiniProgram()) {
      if (isDev) {
        userStore.logout()
        const auth = await devLogin(studentId.value.trim(), devRole.value)
        await saveAuth(auth)
        return
      }
      uni.showToast({ title: '请在微信小程序中完成注册/绑定', icon: 'none' })
      return
    }

    const code = await getLoginCode()
    userStore.logout()
    await bindStudent(studentId.value.trim(), password.value, code)
    const auth = await wechatLogin(code)
    await saveAuth(auth)
  } catch (e) {
    const message = e instanceof Error ? e.message : '注册/绑定失败'
    uni.showToast({ title: message, icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="register-page">
    <view class="register-card">
      <text class="title">注册/绑定</text>
      <text class="subtitle">小程序使用学号密码绑定；开发环境 H5 可用学号快速登录</text>

      <input v-model="studentId" class="input" placeholder="请输入学号" />
      <input v-model="password" class="input" placeholder="请输入密码" password />

      <picker v-if="isDev" class="picker" :range="[1, 2, 3, 4]" :value="devRole - 1" @change="handleDevRoleChange">
        <view class="picker-text">开发角色：{{ devRole }}（1学生 2干部 3教师 4管理员）</view>
      </picker>

      <button class="btn primary" :loading="loading" @tap="handleRegister">提交注册/绑定</button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.register-page {
  min-height: 100vh;
  padding: var(--space-4);
  background: var(--color-bg);
}

.register-card {
  max-width: 520px;
  margin: 0 auto;
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.title {
  display: block;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

.subtitle {
  display: block;
  margin-top: var(--space-1);
  margin-bottom: var(--space-3);
  color: var(--color-text-secondary);
}

.input {
  width: 100%;
  height: 44px;
  margin-top: var(--space-2);
  padding: 0 var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #fff;
  box-sizing: border-box;
}

.picker {
  margin-top: var(--space-2);
}

.picker-text {
  height: 44px;
  line-height: 44px;
  padding: 0 var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #fff;
}

.btn {
  margin-top: var(--space-3);
  border-radius: var(--radius-md);
}

.btn.primary {
  background: var(--color-primary);
  color: #fff;
}
</style>
