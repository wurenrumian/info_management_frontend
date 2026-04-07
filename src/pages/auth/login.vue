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
  uni.reLaunch({ url: '/pages/home/index' })
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
  <view class="login-page page-container">
    <content-panel class="login-card" title="登录" sub-title="微信登录、公开注册/激活与开发快捷登录">
      <template #default>
        <view class="tab-row">
          <nut-button
            v-for="tab in modeTabs"
            :key="tab.key"
            :type="mode === tab.key ? 'primary' : 'default'"
            size="small"
            @click="selectMode(tab.key)"
          >
            {{ tab.label }}
          </nut-button>
        </view>

        <view v-if="mode === 'wechat'" class="panel">
          <view class="panel-title-row">
            <nut-icon name="my" />
            <text class="panel-title">微信登录</text>
          </view>
          <text class="panel-hint">适用于已绑定微信账号的用户</text>
          <nut-button type="primary" block :loading="loading" @click="handleWechatLogin">微信登录并进入个人主页</nut-button>
          <nut-button plain block @click="selectMode('public')">未绑定？改用公开注册/激活</nut-button>
        </view>

        <view v-else-if="mode === 'public'" class="panel">
          <view class="panel-title-row">
            <nut-icon name="people" />
            <text class="panel-title">公开注册/激活</text>
          </view>
          <text class="panel-hint">输入学号和姓名即可激活账号；小程序可选择同时绑定当前微信</text>
          <nut-input v-model="publicStudentId" placeholder="请输入学号" />
          <nut-input v-model="publicName" placeholder="请输入姓名" />

          <label v-if="isMpWeixin" class="switch-row">
            <text>注册时同时绑定当前微信</text>
            <switch :checked="bindWechatOnPublicRegister" @change="handleBindWechatChange" />
          </label>

          <nut-button type="primary" block :loading="loading" @click="handlePublicRegister">提交公开注册/激活</nut-button>
        </view>

        <view v-else class="panel">
          <view class="panel-title-row">
            <nut-icon name="setting" />
            <text class="panel-title">开发快捷登录</text>
          </view>
          <text class="panel-hint">仅开发环境可见，调用 dev/register-or-login</text>
          <nut-input v-model="devStudentId" placeholder="测试学号" />
          <picker class="picker" :range="[1, 2, 3, 4]" :value="devRole - 1" @change="handleDevRoleChange">
            <view class="picker-text">角色：{{ devRole }}（1学生 2干部 3教师 4管理员）</view>
          </picker>
          <nut-button block :loading="loading" @click="handleDevLogin">开发快捷登录</nut-button>
        </view>
      </template>
    </content-panel>
  </view>
</template>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  padding-top: var(--space-4);
  padding-bottom: var(--space-4);
}

.login-card {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
}

.tab-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: var(--space-3);
}

.panel {
  padding-top: var(--space-3);
  border-top: 1px dashed var(--color-border);
}

.panel-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.panel-title {
  font-weight: var(--font-weight-medium);
}

.panel-hint {
  display: block;
  margin: var(--space-2) 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

:deep(.nut-input) {
  margin-top: 8px;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-3);
  color: var(--color-text-secondary);
  gap: var(--space-2);
}

.picker {
  margin: var(--space-2) 0;
}

.picker-text {
  height: 44px;
  line-height: 44px;
  padding: 0 var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #fff;
}

:deep(.nut-button) {
  margin-top: 10px;
}

@media (max-width: 767px) {
  .login-page {
    padding-top: var(--space-3);
  }

  .login-card {
    max-width: none;
  }

  .panel-title-row {
    gap: 8px;
  }

  .panel-title {
    font-size: var(--font-size-md);
  }

  .panel-hint,
  .switch-row,
  .picker-text {
    font-size: 14px;
  }
}

@media (min-width: 1024px) {
  .login-page {
    justify-content: center;
    padding-top: 4vh;
    padding-bottom: 4vh;
  }

  .login-card {
    max-width: var(--content-narrow-width);
  }

  .tab-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: var(--space-4);
  }

  .panel {
    padding-top: var(--space-4);
  }

  .panel-title {
    font-size: 18px;
  }

  .panel-hint,
  .switch-row,
  .picker-text {
    font-size: 15px;
  }

  :deep(.nut-input) {
    margin-top: 12px;
  }
}
</style>
