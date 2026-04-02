export interface ProfileBasicInfo {
  id: number
  studentId: string
  name: string
  roleText: string
  classId: number
  grade: string
  major: string
}

export interface ProfileAccountStatus {
  hasToken: boolean
  wechatBound: boolean
}

export interface ProfileQuickEntry {
  announcementsCount: number
  approvalsCount: number
  knowledgeCount: number
  unreadNotifications: number
}

export interface ProfileExt {
  avatarUrl: string
  bio: string
  editable: boolean
}

export interface ProfileHomeViewModel {
  basic: ProfileBasicInfo
  account: ProfileAccountStatus
  quickEntry: ProfileQuickEntry
  ext: ProfileExt
}

export interface ProfileHomeApiResponse {
  basic: {
    id: number
    student_id: string
    name: string
    role: number
    class_id: number
    grade: string
    major: string
  }
  account?: {
    wechat_bound: boolean
  }
  quick_entry?: {
    announcements_count: number
    approvals_count: number
    knowledge_count: number
    unread_notifications: number
  }
}
