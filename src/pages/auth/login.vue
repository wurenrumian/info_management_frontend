<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { devLogin, getUserInfo, publicRegister, wechatLogin } from '@/services/auth'
import { useUserStore } from '@/stores/user'
import type { AuthToken } from '@/types/user'
import { isWeixinMiniProgram } from '@/utils/platform'

type LoginMode = 'wechat' | 'public' | 'dev'

const userStore = useUserStore()
const loading = ref(false)
const mode = ref<LoginMode>('wechat')
const isDev = import.meta.env.DEV
const isMpWeixin = isWeixinMiniProgram()

const publicStudentId = ref('')
const publicName = ref('')
const bindWechatOnPublicRegister = ref(true)

const devStudentId = ref('2020001')
const devRole = ref(1)

const modeTabs = computed(() => {
  const tabs: Array<{ key: LoginMode; label: string }> = [
    { key: 'wechat', label: '微信登录' },
    { key: 'public', label: '公开注册/激活' },
  ]
  if (isDev) {
    tabs.push({ key: 'dev', label: '开发快捷登录' })
  }
  return tabs
})

onLoad((query) => {
  const qMode = String(query?.mode || '')
  if (qMode === 'public' || (qMode === 'dev' && isDev) || qMode === 'wechat') {
    mode.value = qMode as LoginMode
  }
})

function selectMode(next: LoginMode) {
  if (next === 'dev' && !isDev) {
    return
  }
  mode.value = next
}

function handleDevRoleChange(e: { detail: { value: string | number } }) {
  devRole.value = Number(e.detail.value) + 1
}

function handleBindWechatChange(e: Event) {
  const detail = (e as unknown as { detail?: { value?: boolean } }).detail
  bindWechatOnPublicRegister.value = Boolean(detail?.value)
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

async function persistAuth(auth: AuthToken) {
  userStore.setToken(auth.token)
  try {
    const latestUser = await getUserInfo()
    userStore.setUserInfo(latestUser)
  } catch {
    userStore.setUserInfo(auth.user)
  }
  uni.reLaunch({ url: '/pages/profile/index' })
}

async function handleWechatLogin() {
  if (!isMpWeixin) {
    uni.showToast({ title: '请在微信小程序中使用微信登录', icon: 'none' })
    return
  }

  loading.value = true
  try {
    userStore.logout()
    const code = await getLoginCode()
    const auth = await wechatLogin(code)
    await persistAuth(auth)
  } catch (e) {
    const message = e instanceof Error ? e.message : '微信登录失败'
    if (message.includes('未绑定') || message.includes('绑定')) {
      mode.value = 'public'
      uni.showToast({ title: '该微信未绑定，请先公开注册/激活', icon: 'none' })
      return
    }
    uni.showToast({ title: message, icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function handlePublicRegister() {
  if (!publicStudentId.value.trim() || !publicName.value.trim()) {
    uni.showToast({ title: '请输入学号和姓名', icon: 'none' })
    return
  }

  loading.value = true
  try {
    userStore.logout()
    const payload: { student_id: string; name: string; code?: string } = {
      student_id: publicStudentId.value.trim(),
      name: publicName.value.trim(),
    }

    if (isMpWeixin && bindWechatOnPublicRegister.value) {
      payload.code = await getLoginCode()
    }

    const auth = await publicRegister(payload)
    await persistAuth(auth)
  } catch (e) {
    const message = e instanceof Error ? e.message : '公开注册/激活失败'
    uni.showToast({ title: message, icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function handleDevLogin() {
  if (!isDev) {
    return
  }
  if (!devStudentId.value.trim()) {
    uni.showToast({ title: '请输入学号', icon: 'none' })
    return
  }

  loading.value = true
  try {
    userStore.logout()
    const auth = await devLogin(devStudentId.value.trim(), devRole.value)
    await persistAuth(auth)
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
      <text class="subtitle">集中处理微信登录、公开注册/激活与开发快捷登录</text>

      <view class="tab-row">
        <view
          v-for="tab in modeTabs"
          :key="tab.key"
          class="tab-item"
          :class="{ 'tab-item--active': mode === tab.key }"
          @tap="selectMode(tab.key)"
        >
          {{ tab.label }}
        </view>
      </view>

      <view v-if="mode === 'wechat'" class="panel">
        <text class="panel-title">微信登录</text>
        <text class="panel-hint">适用于已绑定微信账号的用户</text>
        <button class="btn primary" :loading="loading" @tap="handleWechatLogin">微信登录并进入个人主页</button>
        <button class="btn link" @tap="selectMode('public')">未绑定？改用公开注册/激活</button>
      </view>

      <view v-else-if="mode === 'public'" class="panel">
        <text class="panel-title">公开注册/激活</text>
        <text class="panel-hint">输入学号和姓名即可激活账号；小程序可选择同时绑定当前微信</text>
        <input v-model="publicStudentId" class="input" placeholder="请输入学号" />
        <input v-model="publicName" class="input" placeholder="请输入姓名" />

        <label v-if="isMpWeixin" class="switch-row">
          <text>注册时同时绑定当前微信</text>
          <switch :checked="bindWechatOnPublicRegister" @change="handleBindWechatChange" />
        </label>

        <button class="btn primary" :loading="loading" @tap="handlePublicRegister">提交公开注册/激活</button>
      </view>

      <view v-else class="panel">
        <text class="panel-title">开发快捷登录</text>
        <text class="panel-hint">仅开发环境可见，调用 dev/register-or-login</text>
        <input v-model="devStudentId" class="input" placeholder="测试学号" />
        <picker class="picker" :range="[1, 2, 3, 4]" :value="devRole - 1" @change="handleDevRoleChange">
          <view class="picker-text">角色：{{ devRole }}（1学生 2干部 3教师 4管理员）</view>
        </picker>
        <button class="btn" :loading="loading" @tap="handleDevLogin">开发快捷登录</button>
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

.tab-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.tab-item {
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  background: #fff;
}

.tab-item--active {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.panel {
  padding-top: var(--space-3);
  border-top: 1px dashed var(--color-border);
}

.panel-title {
  display: block;
  margin-bottom: var(--space-2);
  font-weight: var(--font-weight-medium);
}

.panel-hint {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
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

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-3);
  color: var(--color-text-secondary);
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
