import { UserRole } from '@/constants/enums'
import { getAnnouncements } from './announcements'
import { getApprovalList, getMyApprovalList } from './approvals'
import { getUserInfo } from './auth'
import { searchKnowledge } from './knowledge'
import type { ProfileHomeViewModel } from '@/types/profile'
import type { UserInfo } from '@/types/user'

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

function toViewModel(user: UserInfo): ProfileHomeViewModel {
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
    },
    ext: {
      avatarUrl: '',
      bio: user.extra_attrs?.remarks || '',
      editable: false,
    },
  }
}

export async function getProfileHomeViewModel(): Promise<ProfileHomeViewModel> {
  const baseInfo = await getUserInfo()
  const model = toViewModel(baseInfo)

  const [announcementRes, approvalsRes, knowledgeRes] = await Promise.allSettled([
    getAnnouncements({ limit: 10, offset: 0 }),
    getMyApprovalList({ limit: 10, offset: 0 }).catch(() => getApprovalList({ limit: 10, offset: 0 })),
    searchKnowledge({ limit: 10, offset: 0 }),
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

  return model
}
