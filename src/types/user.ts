import type { UserRole } from '@/constants/enums'

export interface UserInfo {
  id: number
  student_id: string
  name: string
  role: UserRole
  class_id: number
  grade: string
  major: string
  extra_attrs?: {
    status?: string
    special_identities?: string[]
    remarks?: string
  }
}

export interface AuthToken {
  token: string
  user: UserInfo
}
