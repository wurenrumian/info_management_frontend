import { request } from './request'
import { getAnnouncements } from './announcements'
import { getApprovalList, getMyApprovalList } from './approvals'
import { getUserInfo } from './auth'
import { searchKnowledge } from './knowledge'
import { API_PROFILE_HOME, API_NOTIFICATION_UNREAD_COUNT, API_USER_SUBSCRIBE_REPORT } from '@/constants/api'
import type { ProfileHomeViewModel, ProfileHomeApiResponse } from '@/types/profile'
import type { UserInfo } from '@/types/user'
import type { NotificationUnreadCount, SubscribeReportRequest, SubscribeReportResult } from '@/types/notification'
import { UserRole } from '@/constants/enums'

function toRoleText(role: UserRole): string {
  switch (role) {
    case UserRole.STUDENT:
      return '学生'
    case UserRole.LEAGUE_CADRE:
      return '团学干部'
    case UserRole.TEACHER:
      return '教师'
    case UserRole.SUPER_ADMIN:
      return '超级管理员'
    default:
      return '未知角色'
  }
}

function mapUserToViewModel(user: UserInfo): ProfileHomeViewModel {
  return {
    basic: {
      id: user.id,
      studentId: user.student_id,
      name: user.name,
      roleText: toRoleText(user.role),
      classId: user.class_id,
      grade: user.grade,
      major: user.major,
    },
    account: {
      hasToken: Boolean(uni.getStorageSync('token')),
      wechatBound: true,
    },
    quickEntry: {
      announcementsCount: 0,
      approvalsCount: 0,
      knowledgeCount: 0,
      unreadNotifications: 0,
    },
    ext: {
      avatarUrl: '',
      bio: user.extra_attrs?.remarks || '',
      editable: false,
    },
  }
}

function mapApiResponseToViewModel(data: ProfileHomeApiResponse): ProfileHomeViewModel {
  const user = data.basic
  return {
    basic: {
      id: user.id,
      studentId: user.student_id,
      name: user.name,
      roleText: toRoleText(user.role as UserRole),
      classId: user.class_id,
      grade: user.grade,
      major: user.major,
    },
    account: {
      hasToken: Boolean(uni.getStorageSync('token')),
      wechatBound: data.account?.wechat_bound ?? true,
    },
    quickEntry: {
      announcementsCount: data.quick_entry?.announcements_count ?? 0,
      approvalsCount: data.quick_entry?.approvals_count ?? 0,
      knowledgeCount: data.quick_entry?.knowledge_count ?? 0,
      unreadNotifications: data.quick_entry?.unread_notifications ?? 0,
    },
    ext: {
      avatarUrl: '',
      bio: '',
      editable: false,
    },
  }
}

export async function getProfileHomeViewModel(): Promise<ProfileHomeViewModel> {
  try {
    const data = await request<ProfileHomeApiResponse>({
      url: API_PROFILE_HOME,
      method: 'GET',
    })
    return mapApiResponseToViewModel(data)
  } catch {
    return getFallbackViewModel()
  }
}

export function reportSubscribeResult(payload: SubscribeReportRequest) {
  return request<SubscribeReportResult>({
    url: API_USER_SUBSCRIBE_REPORT,
    method: 'POST',
    data: payload as unknown as Record<string, unknown>,
  })
}

export function getUnreadNotificationCount() {
  return request<NotificationUnreadCount>({
    url: API_NOTIFICATION_UNREAD_COUNT,
    method: 'GET',
  })
}

async function getFallbackViewModel(): Promise<ProfileHomeViewModel> {
  const baseInfo = await getUserInfo()
  const model = mapUserToViewModel(baseInfo)

  const [announcementRes, approvalsRes, knowledgeRes, unreadRes] = await Promise.allSettled([
    getAnnouncements({ limit: 10, offset: 0 }),
    getMyApprovalList({ limit: 10, offset: 0 }).catch(() => getApprovalList({ limit: 10, offset: 0 })),
    searchKnowledge({ limit: 10, offset: 0 }),
    request<{ count: number }>({ url: API_NOTIFICATION_UNREAD_COUNT, method: 'GET' }),
  ])

  if (announcementRes.status === 'fulfilled') {
    model.quickEntry.announcementsCount = announcementRes.value.total
  }

  if (approvalsRes.status === 'fulfilled') {
    model.quickEntry.approvalsCount = approvalsRes.value.total
  }

  if (knowledgeRes.status === 'fulfilled') {
    model.quickEntry.knowledgeCount = knowledgeRes.value.total
  }

  if (unreadRes.status === 'fulfilled') {
    model.quickEntry.unreadNotifications = unreadRes.value.count
  }

  return model
}
