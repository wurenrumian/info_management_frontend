export type PartyflowOrgType = 'party' | 'league'
export type PartyflowAudience = 'student' | 'admin' | 'both'

export interface PartyflowEvent {
  id: number
  event_type: 'create' | 'status_change' | 'milestone' | 'import' | 'manual_adjust' | 'reminder_sent' | string
  event_code?: string
  from_status?: string | null
  to_status?: string | null
  note?: string | null
  happened_at: string
  metadata?: Record<string, unknown>
}

export interface PartyflowMyStatus {
  id: number
  org_type: PartyflowOrgType
  status: string
  status_started_at: string
  joined_at?: string | null
  next_action_hint?: string | null
  history?: PartyflowEvent[]
  created_at?: string
  updated_at?: string
}

export interface PartyflowAdminStatusItem {
  id: number
  user_id: number
  student_id: string
  student_name: string
  org_type: PartyflowOrgType
  status: string
  status_started_at: string
  joined_at?: string | null
  next_action_hint?: string | null
  metadata?: Record<string, unknown>
  history?: PartyflowEvent[]
  created_at?: string
  updated_at?: string
}

export interface PartyflowAdminStatusListParams {
  org_type?: PartyflowOrgType
  status?: string
  student_id?: string
  limit: number
  offset: number
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

export interface CreatePartyflowEventPayload {
  event_type: PartyflowEvent['event_type']
  event_code: string
  note?: string
  happened_at?: string
  metadata?: Record<string, unknown>
  from_status?: string | null
  to_status?: string | null
}

export interface PartyflowReminderRule {
  id: number
  rule_code: string
  org_type: PartyflowOrgType
  status: string
  trigger_type: string
  offset_days: number
  repeat_interval_days?: number | null
  audience: PartyflowAudience
  enabled: boolean
  title: string
  message_template: string
  updated_at?: string
  created_at?: string
}

export interface PatchPartyflowRulePayload {
  enabled?: boolean
  offset_days?: number
  repeat_interval_days?: number | null
  audience?: PartyflowAudience
  title?: string
  message_template?: string
}

export interface PartyflowImportItem {
  student_id: string
  org_type: PartyflowOrgType
  status: string
  status_started_at: string
  next_action_hint?: string
  joined_at?: string | null
  metadata?: Record<string, unknown>
  note?: string
}

export interface PartyflowImportPayload {
  items: PartyflowImportItem[]
}

export interface PartyflowImportFailedItem {
  student_id: string
  reason: string
}

export interface PartyflowImportResult {
  success_count: number
  failed_count: number
  failed_items: PartyflowImportFailedItem[]
}

export interface ScanPartyflowRemindersResult {
  scanned_count: number
  generated_count: number
  sent_count: number
  skipped_count: number
  failed_count: number
}
