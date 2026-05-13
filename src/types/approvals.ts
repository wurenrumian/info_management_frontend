import type { ApprovalStatus } from '@/constants/enums'

export interface Approval {
  id: number
  applicant_id: number
  approval_type: string
  title: string
  status: ApprovalStatus
  current_step?: string
  form_data: Record<string, unknown>
  current_approver_id?: number
  due_at?: string
  history?: ApprovalHistoryEntry[]
  semester?: string
  submitted_at?: string
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
  approval_type: string
  title: string
  form_data: Record<string, unknown>
  attachment_file_ids?: number[]
  template_file_id?: number
  semester?: string
}

export interface ApprovalAction {
  id?: number
  action?: string
  action_type?: string
  operator_id?: number
  operator_name?: string
  from_status?: string
  to_status?: string
  comment?: string
  created_at?: string
}

export interface CertificateRecordRef {
  id: number
  type?: string
  status?: string
  created_at?: string
}

export interface ApprovalDetail {
  approval: Approval
  actions: ApprovalAction[]
  certificate_records: CertificateRecordRef[]
}
