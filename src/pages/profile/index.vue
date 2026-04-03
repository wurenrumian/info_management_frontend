<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import LayoutShell from '@/components/layout-shell.vue'
import { getProfileHomeViewModel, getUnreadNotificationCount, reportSubscribeResult } from '@/services/profile'
import { devLoginAndSendSubscribeCheck, getUserInfo } from '@/services/auth'
import type { ProfileHomeViewModel } from '@/types/profile'
import type { DevLoginSubscribeCheckResult } from '@/types/user'
import type { SubscribeReportStatus } from '@/types/notification'
import { useUserStore } from '@/stores/user'
import { isWeixinMiniProgram } from '@/utils/platform'

const userStore = useUserStore()
const loading = ref(true)
const error = ref('')
const profile = ref<ProfileHomeViewModel | null>(null)
const busy = ref(false)

const isDev = import.meta.env.DEV
const isMpWeixin = isWeixinMiniProgram()

const subscribeTemplateCode = ref('loging_notification')
const subscribeWechatTemplateId = ref('tDO0vkDRDxFHbgIYcuS8U9BY_cAMylqyJlj8Q0HeQpw')
const subscribeLastResult = ref('')
const unreadCount = ref<number | null>(null)

const devOpenId = ref('')
const devPage = ref('/pages/index/index')
const devThing1Value = ref('Profile订阅联调')
const devTime2Value = ref('')
const devCharacterString3Value = ref('127.0.0.1')
const devThing4Value = ref('')
const devStatus = ref<'accept' | 'reject'>('accept')
const devSendResult = ref<DevLoginSubscribeCheckResult | null>(null)

const statusText = computed(() => {
  if (!profile.value) {
    return '未加载'
  }
  return profile.value.account.hasToken ? '已登录' : '未登录'
})

function resolveAutoOpenId(): string {
  const fromUser = userStore.userInfo?.open_id
    || userStore.userInfo?.wechat_openid
    || userStore.userInfo?.extra_attrs?.open_id
    || userStore.userInfo?.extra_attrs?.wechat_openid
    || ''
  if (fromUser) {
    return fromUser
  }

  const storageKeys = ['open_id', 'openid', 'wechat_openid']
  for (const key of storageKeys) {
    const value = String(uni.getStorageSync(key) || '').trim()
    if (value) {
      return value
    }
  }

  return ''
}

function getSubscribeStatusFromResult(result: Record<string, unknown>, templateId: string): SubscribeReportStatus {
  const status = String(result[templateId] || '') as SubscribeReportStatus
  if (status === 'accept' || status === 'reject' || status === 'ban' || status === 'filter') {
    return status
  }
  return 'reject'
}

function requestSubscribeMessage(tmplId: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    uni.requestSubscribeMessage({
      tmplIds: [tmplId],
      success: (res) => resolve(res as unknown as Record<string, unknown>),
      fail: (err) => reject(err),
    })
  })
}

async function loadProfile() {
  loading.value = true
  error.value = ''
  try {
    profile.value = await getProfileHomeViewModel()
    if (!devOpenId.value) {
      devOpenId.value = resolveAutoOpenId()
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败，请重试'
  } finally {
    loading.value = false
  }
}

function goHome() {
  uni.reLaunch({ url: '/pages/home/index' })
}

function handleLogout() {
  userStore.logout()
  uni.reLaunch({ url: '/pages/auth/login' })
}

async function fillOpenIdFromDetected() {
  let detected = resolveAutoOpenId()
  if (!detected) {
    try {
      const latestUser = await getUserInfo()
      userStore.setUserInfo(latestUser)
      detected = resolveAutoOpenId()
    } catch {
      // Ignore network failures and keep the fallback toast below.
    }
  }

  devOpenId.value = detected
  uni.showToast({ title: detected ? '已自动填充 openid' : '未检测到 openid（可手动输入）', icon: 'none' })
}

function handleDevStatusChange(e: { detail: { value: string | number } }) {
  devStatus.value = Number(e.detail.value) === 0 ? 'accept' : 'reject'
}

function formatNowForWechatTemplate(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mi = String(now.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

async function handleRequestAndReportSubscribe() {
  if (!isMpWeixin) {
    uni.showToast({ title: '仅微信小程序可拉起订阅弹窗', icon: 'none' })
    return
  }

  const templateCode = subscribeTemplateCode.value.trim()
  const wechatTemplateId = subscribeWechatTemplateId.value.trim()
  if (!templateCode || !wechatTemplateId) {
    uni.showToast({ title: '请填写 template_code 和模板ID', icon: 'none' })
    return
  }

  busy.value = true
  try {
    const rawResult = await requestSubscribeMessage(wechatTemplateId)
    const finalStatus = getSubscribeStatusFromResult(rawResult, wechatTemplateId)

    await reportSubscribeResult({
      template_code: templateCode,
      wechat_template_id: wechatTemplateId,
      status: finalStatus,
    })

    subscribeLastResult.value = `订阅结果：${finalStatus}，已上报后端`
    uni.showToast({ title: '订阅结果已上报', icon: 'none' })
  } catch (e) {
    const errMsg = (e as { errMsg?: string })?.errMsg || (e instanceof Error ? e.message : '订阅请求失败')
    subscribeLastResult.value = `失败：${errMsg}`
    uni.showToast({ title: errMsg, icon: 'none' })
  } finally {
    busy.value = false
  }
}

async function handleQueryUnreadCount() {
  busy.value = true
  try {
    const res = await getUnreadNotificationCount()
    unreadCount.value = res.count
    uni.showToast({ title: `未读数：${res.count}`, icon: 'none' })
  } catch (e) {
    const message = e instanceof Error ? e.message : '查询未读失败'
    uni.showToast({ title: message, icon: 'none' })
  } finally {
    busy.value = false
  }
}

async function handleDevSubscribeSend() {
  if (!isDev) {
    return
  }

  const studentId = profile.value?.basic.studentId || userStore.userInfo?.student_id || ''
  if (!studentId) {
    uni.showToast({ title: '缺少学号，无法发起联调', icon: 'none' })
    return
  }

  busy.value = true
  devSendResult.value = null
  try {
    const result = await devLoginAndSendSubscribeCheck({
      student_id: studentId,
      role: userStore.userInfo?.role,
      template_code: subscribeTemplateCode.value.trim() || 'dev_login_check',
      wechat_template_id: subscribeWechatTemplateId.value.trim() || 'tmpl_dev_login_check',
      status: devStatus.value,
      open_id: devOpenId.value.trim() || undefined,
      page: devPage.value.trim() || '/pages/index/index',
      template_data: {
        thing1: {
          value: devThing1Value.value.trim() || 'Profile订阅联调',
        },
        time2: {
          value: devTime2Value.value.trim() || formatNowForWechatTemplate(),
        },
        character_string3: {
          value: devCharacterString3Value.value.trim() || '127.0.0.1',
        },
        thing4: {
          value: devThing4Value.value.trim() || `${profile.value?.basic.name || '用户'}(${studentId})`,
        },
      },
    })
    devSendResult.value = result
    uni.showToast({ title: result.send_ok ? '服务端发送成功' : `发送失败：${result.send_error || '未知错误'}`, icon: 'none' })
  } catch (e) {
    const message = e instanceof Error ? e.message : '联调发送失败'
    uni.showToast({ title: message, icon: 'none' })
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <layout-shell current="profile">
    <view class="profile-page">
      <view v-if="loading" class="state-card">
        <text>个人主页加载中...</text>
      </view>

      <view v-else-if="error" class="state-card state-card--error">
        <text class="state-title">加载失败</text>
        <text class="state-desc">{{ error }}</text>
        <button class="btn primary" @tap="loadProfile">重试</button>
      </view>

      <view v-else-if="profile" class="profile-grid">
        <view class="profile-card profile-card--hero">
          <text class="hero-name">{{ profile.basic.name }}</text>
          <text class="hero-meta">{{ profile.basic.roleText }} · 学号 {{ profile.basic.studentId }}</text>
          <text class="hero-meta">{{ profile.basic.grade || '未填写年级' }} · {{ profile.basic.major || '未填写专业' }}</text>
        </view>

        <view class="profile-card">
          <text class="card-title">账号状态</text>
          <text class="row"><text class="label">登录状态：</text>{{ statusText }}</text>
          <text class="row"><text class="label">微信绑定：</text>{{ profile.account.wechatBound ? '已绑定' : '未绑定' }}</text>
          <text class="row"><text class="label">班级ID：</text>{{ profile.basic.classId || 0 }}</text>
        </view>

        <view class="profile-card">
          <text class="card-title">我的数据</text>
          <text class="row"><text class="label">公告：</text>{{ profile.quickEntry.announcementsCount }}</text>
          <text class="row"><text class="label">审批：</text>{{ profile.quickEntry.approvalsCount }}</text>
          <text class="row"><text class="label">知识库：</text>{{ profile.quickEntry.knowledgeCount }}</text>
          <text class="row"><text class="label">未读通知：</text>{{ profile.quickEntry.unreadNotifications }}</text>
        </view>

        <view class="profile-card">
          <text class="card-title">订阅消息测试</text>
          <text class="panel-hint">登录后可手动拉起订阅并上报，开发环境可选 openid 做服务端发送联调</text>
          <input v-model="subscribeTemplateCode" class="input" placeholder="template_code（如 deadline_remind）" />
          <input v-model="subscribeWechatTemplateId" class="input" placeholder="wechat_template_id（如 tmpl_xxx）" />
          <button class="btn" :loading="busy" @tap="handleRequestAndReportSubscribe">拉起订阅并上报结果</button>
          <button class="btn" :loading="busy" @tap="handleQueryUnreadCount">查询未读消息数</button>
          <text v-if="subscribeLastResult" class="row"><text class="label">最近结果：</text>{{ subscribeLastResult }}</text>
          <text v-if="unreadCount !== null" class="row"><text class="label">未读数量：</text>{{ unreadCount }}</text>

          <view v-if="isDev" class="dev-panel">
            <text class="panel-title">开发联调（服务端发送）</text>
            <input v-model="devOpenId" class="input" placeholder="open_id（可手动输入，留空走后端默认）" />
            <button class="btn" :loading="busy" @tap="fillOpenIdFromDetected">尝试自动检测 openid</button>
            <picker class="picker" :range="['accept', 'reject']" :value="devStatus === 'accept' ? 0 : 1" @change="handleDevStatusChange">
              <view class="picker-text">status：{{ devStatus }}</view>
            </picker>
            <input v-model="devPage" class="input" placeholder="page（默认 /pages/index/index）" />
            <input v-model="devThing1Value" class="input" placeholder="template_data.thing1.value" />
            <input v-model="devTime2Value" class="input" placeholder="template_data.time2.value（默认当前时间）" />
            <input v-model="devCharacterString3Value" class="input" placeholder="template_data.character_string3.value（默认 127.0.0.1）" />
            <input v-model="devThing4Value" class="input" placeholder="template_data.thing4.value（默认 用户名+学号）" />
            <button class="btn" :loading="busy" @tap="handleDevSubscribeSend">调用登录并发送订阅联调</button>

            <view v-if="devSendResult" class="result-panel">
              <text class="row"><text class="label">template_code：</text>{{ devSendResult.template_code }}</text>
              <text class="row"><text class="label">subscription_status：</text>{{ devSendResult.subscription_status }}</text>
              <text class="row"><text class="label">send_ok：</text>{{ devSendResult.send_ok ? 'true' : 'false' }}</text>
              <text class="row"><text class="label">send_error：</text>{{ devSendResult.send_error || '-' }}</text>
            </view>
          </view>
        </view>

        <view class="profile-card">
          <text class="card-title">账号操作</text>
          <button class="btn" @tap="loadProfile">刷新数据</button>
          <button class="btn" @tap="goHome">返回首页</button>
          <button class="btn danger" @tap="handleLogout">退出登录</button>
        </view>
      </view>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.profile-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.profile-grid {
  display: grid;
  gap: var(--space-3);
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.profile-card,
.state-card {
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.profile-card--hero {
  grid-column: 1 / -1;
}

.hero-name {
  display: block;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

.hero-meta {
  display: block;
  margin-top: var(--space-1);
  color: var(--color-text-secondary);
}

.state-card--error {
  border-color: #f0c5c5;
}

.card-title,
.state-title,
.panel-title {
  display: block;
  margin-bottom: var(--space-3);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.state-desc,
.panel-hint {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--color-text-secondary);
}

.row {
  display: block;
  margin-top: var(--space-1);
}

.label {
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

.dev-panel {
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px dashed var(--color-border);
}

.result-panel {
  margin-top: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #fff;
}

.btn {
  margin-top: var(--space-2);
  background: #fff;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
}

.btn.primary {
  background: var(--color-primary);
  color: #fff;
}

.btn.danger {
  border-color: var(--color-danger);
  color: var(--color-danger);
}
</style>
