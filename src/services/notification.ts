import { request } from './request'
import { API_NOTIFICATION_UNREAD_COUNT, API_USER_SUBSCRIBE_REPORT } from '@/constants/api'
import type {
  NotificationUnreadCount,
  SubscribeReportRequest,
  SubscribeReportResult,
  SubscribeReportStatus,
} from '@/types/notification'

export function reportSubscribeResult(payload: SubscribeReportRequest) {
  return request<SubscribeReportResult>({
    url: API_USER_SUBSCRIBE_REPORT,
    method: 'POST',
    data: payload as unknown as Record<string, unknown>,
  })
}

export function getUnreadNotificationCount() {
  return request<NotificationUnreadCount>({
    url: API_NOTIFICATION_UNREAD_COUNT,
    method: 'GET',
  })
}

export interface SubscribeReportItem {
  template_code: string
  wechat_template_id: string
  status: SubscribeReportStatus
}

export interface SubscribeReportBatchResult {
  successCount: number
  failedItems: SubscribeReportItem[]
}

export async function reportSubscribeResults(items: SubscribeReportItem[]): Promise<SubscribeReportBatchResult> {
  if (!items.length) {
    return { successCount: 0, failedItems: [] }
  }

  const settled = await Promise.allSettled(
    items.map((item) => reportSubscribeResult(item))
  )
  const failedItems = items.filter((_, index) => settled[index]?.status === 'rejected')

  return {
    successCount: settled.filter((item) => item.status === 'fulfilled').length,
    failedItems,
  }
}
