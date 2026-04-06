export type SubscribeReportStatus = 'accept' | 'reject' | 'ban' | 'filter'

export interface SubscribeReportRequest {
  template_code: string
  wechat_template_id: string
  status: SubscribeReportStatus
}

export interface SubscribeReportResult {
  ok: boolean
  status?: string
  granted_count?: number
  consumed_count?: number
  remaining_count?: number
}

export interface NotificationUnreadCount {
  count: number
}

export interface SubscribeTemplateConfig {
  template_code: string
  wechat_template_id: string
  name: string
  description: string
}

export interface SubscribeSummary {
  accept: number
  reject: number
  ban: number
  filter: number
  report_failed: number
}
