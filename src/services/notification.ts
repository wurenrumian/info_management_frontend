import { request } from './request'
import { API_NOTIFICATION_UNREAD_COUNT, API_USER_SUBSCRIBE_REPORT } from '@/constants/api'
import type { NotificationUnreadCount, SubscribeReportRequest, SubscribeReportResult } from '@/types/notification'

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
