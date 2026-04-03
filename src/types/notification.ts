export type SubscribeReportStatus = 'accept' | 'reject' | 'ban' | 'filter'

export interface SubscribeReportRequest {
  template_code: string
  wechat_template_id: string
  status: SubscribeReportStatus
}

export interface SubscribeReportResult {
  ok: boolean
}

export interface NotificationUnreadCount {
  count: number
}
