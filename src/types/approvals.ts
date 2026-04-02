import type { ApprovalStatus } from '@/constants/enums'

export interface Approval {
  id: number
  applicant_id: number
  type: string
  status: ApprovalStatus
  form_data: Record<string, unknown>
  current_approver_id: number
  history: ApprovalHistoryEntry[]
  semester: string
  created_at: string
  updated_at: string
}

export interface ApprovalHistoryEntry {
  action: string
  operator_id: number
  comment?: string
  created_at: string
}

export interface ApprovalSubmitParams {
  type: string
  form_data: Record<string, unknown>
  semester: string
}
