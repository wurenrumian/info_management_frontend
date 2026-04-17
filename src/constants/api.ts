export const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export const API_AUTH_LOGIN = '/api/v1/wechat/login'
export const API_AUTH_BIND = '/api/v1/wechat/bind'
export const API_AUTH_PUBLIC_REGISTER = '/api/v1/auth/public-register'
export const API_AUTH_DEV_LOGIN = '/api/v1/dev/register-or-login'
export const API_AUTH_DEV_LOGIN_SUBSCRIBE_CHECK = '/api/v1/dev/login-and-send-subscribe-check'
export const API_AUTH_USER_INFO = '/api/v1/me'
export const API_USER_SUBSCRIBE_REPORT = '/api/v1/user/subscribe/report'

export const API_PROFILE_HOME = '/api/v1/profile/home'
export const API_PROFILE_UPDATE = '/api/v1/me'
export const API_ADMIN_CLASS_LIST = '/api/v1/admin/classes'

export const API_NOTIFICATION_UNREAD_COUNT = '/api/v1/notifications/unread/count'

export const API_KNOWLEDGE_SEARCH = '/api/v1/knowledge/search'
export const API_KNOWLEDGE_DETAIL = '/api/v1/knowledge'
export const API_KNOWLEDGE_LIST = '/api/v1/knowledge'
export const API_ADMIN_KNOWLEDGE_LIST = '/api/v1/admin/knowledge'
export const API_ADMIN_KNOWLEDGE_DETAIL = '/api/v1/admin/knowledge'
export const API_ADMIN_KNOWLEDGE_QA_GENERATE_PREVIEW = '/api/v1/admin/knowledge/qa-generate-preview'
export const API_ADMIN_KNOWLEDGE_QA_GENERATE_PREVIEW_STREAM = '/api/v1/admin/knowledge/qa-generate-preview/stream'
export const API_ADMIN_KNOWLEDGE_BATCH = '/api/v1/admin/knowledge/batch'

export const API_ANNOUNCEMENT_LIST = '/api/v1/announcements'
export const API_ANNOUNCEMENT_DETAIL = '/api/v1/announcements'
export const API_ANNOUNCEMENT_ALL_LIST = '/api/v1/announcements/all'
export const API_ANNOUNCEMENT_ALL_DETAIL = '/api/v1/announcements/all'
export const API_ADMIN_ANNOUNCEMENT_LIST = '/api/v1/admin/announcements'
export const API_ADMIN_ANNOUNCEMENT_DETAIL = '/api/v1/admin/announcements'

export const API_APPROVAL_SUBMIT = '/api/v1/approvals'
export const API_APPROVAL_LIST = '/api/v1/approvals'
export const API_APPROVAL_ME_LIST = '/api/v1/approvals/me'
export const API_APPROVAL_DETAIL = '/api/v1/approvals'
export const API_APPROVAL_ACTION = '/api/v1/approvals'

export const API_PARTYFLOW_PROGRESS = '/api/v1/partyflow/progress'
export const API_PARTYFLOW_REMINDERS = '/api/v1/partyflow/reminders'

export const API_FILE_UPLOAD = '/api/v1/files/upload'
export const API_FILE_DOWNLOAD = '/api/v1/files'
export const API_FILE_SEARCH = '/api/v1/files/search'
