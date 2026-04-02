import type { PartyFlowType } from '@/constants/enums'

export interface PartyProgress {
  id: number
  user_id: number
  type: PartyFlowType
  stage: string
  stage_updated_at: string
  extra_info?: Record<string, unknown>
}

export interface PartyReminder {
  id: number
  user_id: number
  title: string
  description: string
  due_at: string
  completed: boolean
}
