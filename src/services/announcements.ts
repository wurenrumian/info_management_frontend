import { request } from './request'
import type {
  AdminAnnouncementListParams,
  AnnouncementDetail,
  AnnouncementListItem,
  AnnouncementListParams,
  AnnouncementStatusMutation,
  CreateAnnouncementPayload,
  PatchAnnouncementPayload,
  PublishAnnouncementPayload,
} from '@/types/announcements'
import type { ListResponse } from '@/types/api'
import {
  API_ADMIN_ANNOUNCEMENT_DETAIL,
  API_ADMIN_ANNOUNCEMENT_LIST,
  API_ANNOUNCEMENT_DETAIL,
  API_ANNOUNCEMENT_LIST,
} from '@/constants/api'
import { resolveApiUrl } from './request'

function parseListPayload<T>(payload: unknown): ListResponse<T> {
  const raw = (payload || {}) as {
    data?: unknown
    total?: unknown
  }
  const list = Array.isArray(raw.data) ? (raw.data as T[]) : []
  const totalValue = Number(raw.total)
  const total = Number.isFinite(totalValue) ? totalValue : list.length

  return {
    data: list,
    total,
  }
}

function requestList<T>(url: string, params: Record<string, unknown>) {
  return new Promise<ListResponse<T>>((resolve, reject) => {
    const token = uni.getStorageSync('token') || ''
    uni.request({
      url: resolveApiUrl(url),
      method: 'GET',
      data: params,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success: (res) => {
        if (res.statusCode === 401) {
          uni.removeStorageSync('token')
          uni.redirectTo({ url: '/pages/auth/login' })
          reject(new Error('未登录'))
          return
        }
        if (res.statusCode === 403) {
          reject(new Error('无权限'))
          return
        }
        if (res.statusCode === 404) {
          reject(new Error('公告接口不存在'))
          return
        }
        if (res.statusCode >= 400) {
          const data = (res.data || {}) as { error?: string }
          reject(new Error(data.error || `请求失败(${res.statusCode})`))
          return
        }

        const payload = (res.data || {}) as { error?: string }
        if (payload.error) {
          reject(new Error(payload.error))
          return
        }

        resolve(parseListPayload<T>(res.data))
      },
      fail: (err) => reject(err),
    })
  })
}

export function getAnnouncements(params: AnnouncementListParams) {
  return requestList<AnnouncementListItem>(API_ANNOUNCEMENT_LIST, params as unknown as Record<string, unknown>)
}

export function getAnnouncementDetail(id: number) {
  return request<AnnouncementDetail>({
    url: `${API_ANNOUNCEMENT_DETAIL}/${id}`,
    method: 'GET',
  })
}

export function getAdminAnnouncements(params: AdminAnnouncementListParams) {
  return requestList<AnnouncementListItem>(API_ADMIN_ANNOUNCEMENT_LIST, params as unknown as Record<string, unknown>)
}

export function getAdminAnnouncementDetail(id: number) {
  return request<AnnouncementDetail>({
    url: `${API_ADMIN_ANNOUNCEMENT_DETAIL}/${id}`,
    method: 'GET',
  })
}

export function createAnnouncement(payload: CreateAnnouncementPayload) {
  return request<AnnouncementDetail>({
    url: API_ADMIN_ANNOUNCEMENT_LIST,
    method: 'POST',
    data: payload as unknown as Record<string, unknown>,
  })
}

export function patchAnnouncement(id: number, payload: PatchAnnouncementPayload) {
  return request<AnnouncementDetail>({
    url: `${API_ADMIN_ANNOUNCEMENT_DETAIL}/${id}`,
    method: 'PATCH',
    data: payload as unknown as Record<string, unknown>,
  })
}

export function publishAnnouncement(id: number, payload: PublishAnnouncementPayload) {
  return request<AnnouncementStatusMutation>({
    url: `${API_ADMIN_ANNOUNCEMENT_DETAIL}/${id}/publish`,
    method: 'POST',
    data: payload as unknown as Record<string, unknown>,
  })
}

export function archiveAnnouncement(id: number) {
  return request<AnnouncementStatusMutation>({
    url: `${API_ADMIN_ANNOUNCEMENT_DETAIL}/${id}/archive`,
    method: 'POST',
  })
}
