import type { UserRole } from '@/constants/enums'

export interface UserInfo {
  id: number
  student_id: string
  name: string
  real_name?: string
  nickname?: string
  open_id?: string
  wechat_openid?: string
  role: UserRole
  class_id: number
  grade: string
  major: string
  college?: string
  enrollment_year?: number
  bio?: string
  avatar_url?: string
  avatar_file_path?: string
  extra_attrs?: {
    status?: string
    special_identities?: string[]
    remarks?: string
    open_id?: string
    wechat_openid?: string
  }
}

export interface AuthToken {
  token: string
  user: UserInfo
}

export interface PublicRegisterRequest {
  student_id: string
  name: string
  code?: string
}

export type SubscribeCheckStatus = 'accept' | 'reject'

export interface DevLoginSubscribeCheckRequest {
  student_id: string
  role?: number
  template_code?: string
  wechat_template_id?: string
  status?: SubscribeCheckStatus
  open_id?: string
  page?: string
  template_data?: Record<string, { value: string }>
}

export interface DevLoginSubscribeCheckUser {
  id: number
  student_id: string
  name?: string
  role?: UserRole
  class_id?: number
  grade?: string
  major?: string
}

export interface DevLoginSubscribeCheckResult {
  token: string
  user: DevLoginSubscribeCheckUser
  template_code: string
  subscription_status: string
  send_ok: boolean
  send_error: string
}
