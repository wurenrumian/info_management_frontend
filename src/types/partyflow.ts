import type { PartyFlowType } from '@/constants/enums'

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
  org_type: PartyFlowType
  status: string
  status_started_at: string
  joined_at?: string | null
  next_action_hint?: string | null
  history?: PartyflowEvent[]
  created_at?: string
  updated_at?: string
}
