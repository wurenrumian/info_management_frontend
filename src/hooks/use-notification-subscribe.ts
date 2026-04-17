import { computed, ref } from 'vue'
import { SUBSCRIBE_TEMPLATES } from '@/constants/notification'
import { reportSubscribeResults, type SubscribeReportItem } from '@/services/notification'
import { devLoginAndSendSubscribeCheck } from '@/services/auth'
import { useUserStore } from '@/stores/user'
import type { SubscribeReportStatus, SubscribeSummary, SubscribeTemplateConfig } from '@/types/notification'
import { isWeixinMiniProgram } from '@/utils/platform'

interface RequestSubscribeMessageResult {
  errMsg?: string
  [key: string]: unknown
}

interface SubscribeError {
  errCode?: number
  errMsg?: string
}

const VALID_STATUSES: SubscribeReportStatus[] = ['accept', 'reject', 'ban', 'filter']

function normalizeStatus(value: unknown): SubscribeReportStatus | '' {
  if (typeof value !== 'string') {
    return ''
  }
  if (VALID_STATUSES.includes(value as SubscribeReportStatus)) {
    return value as SubscribeReportStatus
  }
  return ''
}

function getDefaultSummary(): SubscribeSummary {
  return {
    accept: 0,
    reject: 0,
    ban: 0,
    filter: 0,
    report_failed: 0,
  }
}

function requestSubscribeMessage(tmplIds: string[]): Promise<RequestSubscribeMessageResult> {
  return new Promise((resolve, reject) => {
    uni.requestSubscribeMessage({
      tmplIds,
      success: (res) => {
        resolve(res as RequestSubscribeMessageResult)
      },
      fail: (err) => {
        reject(err as SubscribeError)
      },
    })
  })
}

function mapErrorMessage(error: SubscribeError): string {
  if (error.errCode === 20004) {
    return '你已关闭订阅消息主开关，请前往微信设置开启后重试'
  }
  if (error.errCode === 20005) {
    return '当前小程序订阅能力异常，请稍后重试'
  }
  if (error.errCode === 10005) {
    return '当前场景无法展示订阅弹窗，请回到前台后重试'
  }
  if (error.errCode === 10001 || error.errCode === 10004 || error.errCode === 20003) {
    return '订阅模板配置异常，请联系管理员'
  }
  return error.errMsg || '订阅请求失败，请稍后重试'
}

function formatWechatDateTime(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

function hasPlaceholderTemplateConfig(): boolean {
  return SUBSCRIBE_TEMPLATES.some(
    (item) => item.template_code.includes('TODO_') || item.wechat_template_id.includes('TODO_')
  )
}

function getSubscribeTemplates(): SubscribeTemplateConfig[] {
  return SUBSCRIBE_TEMPLATES
    .map((item) => ({
      ...item,
      template_code: item.template_code.trim(),
      wechat_template_id: item.wechat_template_id.trim(),
    }))
    .filter((item) => item.template_code.length > 0 && item.wechat_template_id.length > 0)
}

export function useNotificationSubscribe() {
  const userStore = useUserStore()
  const loading = ref(false)
  const errorMessage = ref('')
  const summary = ref<SubscribeSummary>(getDefaultSummary())
  const failedReportItems = ref<SubscribeReportItem[]>([])
  const manualSendLoading = ref(false)
  const manualSendMessage = ref('')

  const isSupported = computed(() => isWeixinMiniProgram())
  const hasFailedReports = computed(() => failedReportItems.value.length > 0)

  async function requestAndReport() {
    if (loading.value) {
      return
    }

    if (!isSupported.value) {
      errorMessage.value = '仅微信小程序支持订阅消息'
      return
    }

    if (hasPlaceholderTemplateConfig()) {
      errorMessage.value = '通知模板尚未配置完成，请先替换真实模板信息'
      return
    }

    const subscribeTemplates = getSubscribeTemplates()
    const tmplIds = subscribeTemplates.map((item) => item.wechat_template_id)

    if (!tmplIds.length) {
      errorMessage.value = '订阅模板未配置，请联系管理员'
      return
    }

    if (new Set(tmplIds).size !== tmplIds.length) {
      errorMessage.value = '订阅模板配置重复，请联系管理员检查模板 ID'
      return
    }

    loading.value = true
    errorMessage.value = ''
    summary.value = getDefaultSummary()
    failedReportItems.value = []

    try {
      const result = await requestSubscribeMessage(
        tmplIds
      )

      const reportItems: SubscribeReportItem[] = []
      const nextSummary = getDefaultSummary()

      subscribeTemplates.forEach((template) => {
        const status = normalizeStatus(result[template.wechat_template_id])
        if (!status) {
          return
        }

        reportItems.push({
          template_code: template.template_code,
          wechat_template_id: template.wechat_template_id,
          status,
        })

        nextSummary[status] += 1
      })

      summary.value = nextSummary

      const reportResult = await reportSubscribeResults(reportItems)
      failedReportItems.value = reportResult.failedItems
      summary.value = {
        ...nextSummary,
        report_failed: reportResult.failedItems.length,
      }
    } catch (error) {
      errorMessage.value = mapErrorMessage(error as SubscribeError)
    } finally {
      loading.value = false
    }
  }

  async function retryFailedReports() {
    if (loading.value || !failedReportItems.value.length) {
      return
    }

    loading.value = true
    errorMessage.value = ''

    try {
      const reportResult = await reportSubscribeResults(failedReportItems.value)
      failedReportItems.value = reportResult.failedItems
      summary.value = {
        ...summary.value,
        report_failed: reportResult.failedItems.length,
      }
    } catch {
      errorMessage.value = '重试上报失败，请稍后再试'
    } finally {
      loading.value = false
    }
  }

  async function sendManualLoginNotification() {
    if (manualSendLoading.value) {
      return
    }

    manualSendMessage.value = ''

    if (hasPlaceholderTemplateConfig()) {
      manualSendMessage.value = '通知模板尚未配置完成，无法发送登录通知'
      return
    }

    const currentUser = userStore.userInfo
    if (!currentUser?.student_id) {
      manualSendMessage.value = '请先登录后再发送登录通知'
      return
    }

    const template =
      SUBSCRIBE_TEMPLATES.find((item) => item.template_code === 'login_sucessful') ||
      SUBSCRIBE_TEMPLATES[0]
    if (!template) {
      manualSendMessage.value = '未找到可用模板，请检查模板配置'
      return
    }

    manualSendLoading.value = true
    try {
      const result = await devLoginAndSendSubscribeCheck({
        student_id: currentUser.student_id,
        role: Number(currentUser.role),
        template_code: template.template_code,
        wechat_template_id: template.wechat_template_id,
        status: 'accept',
        open_id: currentUser.wechat_openid || currentUser.open_id || currentUser.extra_attrs?.wechat_openid,
        page: '/pages/home/index',
        template_data: {
          thing1: { value: '微信小程序登录' },
          time2: { value: formatWechatDateTime(new Date()) },
          character_string3: { value: '127.0.0.1' },
          thing4: { value: `${currentUser.real_name || ''}(${currentUser.student_id || ''})`.slice(0, 20) },
        },
      })

      const countText =
        typeof result.granted_count === 'number' &&
          typeof result.consumed_count === 'number' &&
          typeof result.remaining_count === 'number'
          ? `（累计授权 ${result.granted_count}，累计消耗 ${result.consumed_count}，剩余 ${result.remaining_count}）`
          : ''

      manualSendMessage.value = result.send_ok
        ? `登录通知已发送（调试）${countText}`
        : `发送失败：${result.send_error || '未知错误'}${countText}`
    } catch (error) {
      manualSendMessage.value = error instanceof Error ? error.message : '发送失败，请稍后重试'
    } finally {
      manualSendLoading.value = false
    }
  }

  return {
    loading,
    errorMessage,
    summary,
    isSupported,
    hasFailedReports,
    manualSendLoading,
    manualSendMessage,
    requestAndReport,
    retryFailedReports,
    sendManualLoginNotification,
  }
}
