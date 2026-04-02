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
