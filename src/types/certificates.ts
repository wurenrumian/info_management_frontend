export interface CertificateRecord {
  id: number
  approval_id?: number
  applicant_id?: number
  template_id?: number
  approval_type?: 'leave' | 'budget' | string
  document_stage: 'application' | 'approval_certificate' | string
  certificate_no?: string
  verification_code?: string
  document_id?: number
  seal_status?: 'none' | 'internal_seal_applied' | string
  status: 'generated' | 'failed' | 'revoked' | string
  error_message?: string
  generated_at?: string
  revoked_at?: string
  created_at?: string
  updated_at?: string
}

export interface CertificateVerifyResult {
  record_id: number
  approval_id?: number
  applicant_id?: number
  approval_type?: 'leave' | 'budget' | string
  document_stage: 'application' | 'approval_certificate' | string
  certificate_no?: string
  verification_code?: string
  status: 'generated' | 'failed' | 'revoked' | string
  generated_at?: string
}

export interface CertificateTemplate {
  id: number
  code: string
  name: string
  approval_type?: 'leave' | 'budget' | string
  document_stage: 'application' | 'approval_certificate' | string
  status?: string
  created_at?: string
  updated_at?: string
}
