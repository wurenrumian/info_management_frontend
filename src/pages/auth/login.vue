<script setup lang="ts">
import { ref } from 'vue'
import { bindStudent, devLogin, getUserInfo, wechatLogin } from '@/services/auth'
import { useUserStore } from '@/stores/user'
import type { AuthToken } from '@/types/user'

const userStore = useUserStore()

const loading = ref(false)
const bindVisible = ref(false)
const bindCode = ref('')
const studentId = ref('')
const password = ref('')
const devStudentId = ref('2020001')
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

function goToRegister() {
  uni.navigateTo({ url: '/pages/auth/register' })
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

async function handleWechatLogin() {
  loading.value = true
  try {
    userStore.logout()
    const code = await getLoginCode()
    bindCode.value = code
    const auth = await wechatLogin(code)
    await saveAuth(auth)
  } catch (e) {
    const message = e instanceof Error ? e.message : '微信登录失败'
    // Keep a full trace in console to distinguish SDK/login failures from API failures.
    console.error('[auth] wechat login failed before API request', e)
    if (message.includes('未绑定') || message.includes('绑定')) {
      bindVisible.value = true
      uni.showToast({ title: '账号未绑定，请先绑定', icon: 'none' })
      return
    }
    uni.showToast({ title: message, icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function handleBind() {
  if (!studentId.value || !password.value) {
    uni.showToast({ title: '请输入学号和密码', icon: 'none' })
    return
  }

  loading.value = true
  try {
    const code = bindCode.value || (await getLoginCode())
    await bindStudent(studentId.value.trim(), password.value, code)
    uni.showToast({ title: '绑定成功，正在登录', icon: 'none' })
    await handleWechatLogin()
  } catch (e) {
    const message = e instanceof Error ? e.message : '绑定失败'
    uni.showToast({ title: message, icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function handleDevLogin() {
  if (!devStudentId.value.trim()) {
    uni.showToast({ title: '请输入学号', icon: 'none' })
    return
  }

  loading.value = true
  try {
    userStore.logout()
    const auth = await devLogin(devStudentId.value.trim(), devRole.value)
    await saveAuth(auth)
  } catch (e) {
    const message = e instanceof Error ? e.message : '开发登录失败'
    uni.showToast({ title: message, icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="login-page">
    <view class="login-card">
      <text class="title">登录</text>
      <text class="subtitle">先登录后可访问个人主页与业务数据</text>

      <button class="btn primary" :loading="loading" @tap="handleWechatLogin">微信登录</button>
      <button class="btn link" @tap="goToRegister">未绑定？前往注册/绑定</button>

      <view v-if="bindVisible" class="bind-panel">
        <text class="panel-title">绑定学号</text>
        <input v-model="studentId" class="input" placeholder="请输入学号" />
        <input v-model="password" class="input" placeholder="请输入密码" password />
        <button class="btn" :loading="loading" @tap="handleBind">提交绑定</button>
      </view>

      <view v-if="isDev" class="dev-panel">
        <text class="panel-title">开发模式快捷登录</text>
        <input v-model="devStudentId" class="input" placeholder="测试学号" />
        <picker class="picker" :range="[1, 2, 3, 4]" :value="devRole - 1" @change="handleDevRoleChange">
          <view class="picker-text">角色：{{ devRole }}（1学生 2干部 3教师 4管理员）</view>
        </picker>
        <button class="btn" :loading="loading" @tap="handleDevLogin">开发登录</button>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  padding: var(--space-4);
  background: var(--color-bg);
}

.login-card {
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

.bind-panel,
.dev-panel {
  margin-top: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px dashed var(--color-border);
}

.panel-title {
  display: block;
  margin-bottom: var(--space-2);
  font-weight: var(--font-weight-medium);
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
  background: #fff;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
}

.btn.primary {
  background: var(--color-primary);
  color: #fff;
}

.btn.link {
  border: none;
  color: var(--color-text-secondary);
}
</style>
