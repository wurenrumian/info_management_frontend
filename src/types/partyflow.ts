import type { PaginationParams } from './api'

export type PartyflowOrgType = 'party' | 'league'
export type PartyflowEventType = 'create' | 'status_change' | 'milestone' | 'import' | 'manual_adjust' | 'reminder_sent'
export type PartyflowAudience = 'student' | 'admin' | 'both'

export interface PartyflowEvent {
  id: number
  event_type: PartyflowEventType
  event_code: string
  from_status?: string
  to_status?: string
  note?: string
  happened_at: string
  metadata?: Record<string, unknown>
}

export interface PartyflowMyStatus {
  id: number
  org_type: PartyflowOrgType
  status: string
  status_started_at: string
  joined_at: string | null
  next_action_hint: string
  history: PartyflowEvent[]
  created_at: string
  updated_at: string
}

export interface PartyflowAdminStatusItem {
  id: number
  user_id: number
  student_id: string
  student_name: string
  org_type: PartyflowOrgType
  status: string
  status_started_at: string
  joined_at: string | null
  next_action_hint: string
  metadata?: Record<string, unknown>
  history?: PartyflowEvent[]
  created_at: string
  updated_at: string
}

export interface PartyflowAdminStatusListParams extends PaginationParams {
  org_type?: PartyflowOrgType
  status?: string
  student_id?: string
}

export interface CreatePartyflowStatusPayload {
  user_id: number
  org_type: PartyflowOrgType
  status: string
  status_started_at: string
  joined_at?: string | null
  next_action_hint?: string
  metadata?: Record<string, unknown>
  note?: string
}

export interface PatchPartyflowStatusPayload {
  status?: string
  status_started_at?: string
  joined_at?: string | null
  next_action_hint?: string
  metadata?: Record<string, unknown>
  note?: string
}

export interface PartyflowImportItem {
  student_id: string
  org_type: PartyflowOrgType
  status: string
  status_started_at: string
  joined_at?: string | null
  next_action_hint?: string
  metadata?: Record<string, unknown>
  note?: string
}

export interface PartyflowImportPayload {
  items: PartyflowImportItem[]
}

export interface PartyflowImportResult {
  success_count: number
  failed_count: number
  failed_items: Array<{ student_id: string; reason: string }>
}

export interface CreatePartyflowEventPayload {
  event_type: 'milestone' | 'manual_adjust'
  event_code: string
  note?: string
  happened_at?: string
  metadata?: Record<string, unknown>
}

export interface PartyflowReminderRule {
  id: number
  rule_code: string
  org_type: PartyflowOrgType
  status: string
  trigger_type: 'status_started' | 'event_completed' | 'fixed_date'
  offset_days: number
  repeat_interval_days: number
  audience: PartyflowAudience
  enabled: boolean
  title: string
  message_template: string
  updated_at?: string
}

export interface PartyflowRuleListParams {
  org_type?: PartyflowOrgType
  enabled?: boolean
}

export interface PatchPartyflowRulePayload {
  enabled?: boolean
  offset_days?: number
  repeat_interval_days?: number
  audience?: PartyflowAudience
  title?: string
  message_template?: string
}

export interface ScanPartyflowRemindersPayload {
  now?: string
}

export interface ScanPartyflowRemindersResult {
  scanned_count: number
  generated_count: number
  sent_count: number
  skipped_count: number
  failed_count: number
}
