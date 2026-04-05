import { request, resolveApiUrl } from './request'
import type {
  AdminKnowledgeListParams,
  BindAttachmentResult,
  KnowledgeItem,
  KnowledgeMutationResult,
  KnowledgeSearchParams,
  KnowledgeAttachment,
  PatchKnowledgePayload,
  UpsertKnowledgePayload,
} from '@/types/knowledge'
import type { ListResponse } from '@/types/api'
import {
  API_ADMIN_KNOWLEDGE_DETAIL,
  API_ADMIN_KNOWLEDGE_LIST,
  API_KNOWLEDGE_DETAIL,
  API_KNOWLEDGE_LIST,
  API_KNOWLEDGE_SEARCH,
} from '@/constants/api'

interface LegacyListEnvelope<T> {
  data?: {
    data?: T[]
    total?: number
  }
  total?: number
}

function normalizeListResponse<T>(payload: unknown): ListResponse<T> {
  const raw = payload as Partial<ListResponse<T>> & LegacyListEnvelope<T>
  const legacyList = Array.isArray(raw.data?.data) ? raw.data?.data : undefined
  const directList = Array.isArray(raw.data) ? (raw.data as T[]) : undefined
  const data = (legacyList || directList || []) as T[]
  const totalFromLegacy = Number(raw.data?.total)
  const totalFromDirect = Number(raw.total)
  const total = Number.isFinite(totalFromLegacy)
    ? totalFromLegacy
    : Number.isFinite(totalFromDirect)
      ? totalFromDirect
      : data.length

  return { data, total }
}

function requestList<T>(url: string, data?: Record<string, unknown>) {
  return new Promise<ListResponse<T>>((resolve, reject) => {
    uni.request({
      url: resolveApiUrl(url),
      method: 'GET',
      data,
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${uni.getStorageSync('token') || ''}`,
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
        if (res.statusCode >= 500) {
          reject(new Error('服务异常'))
          return
        }

        const dataPayload = (res.data || {}) as { error?: string }
        if (dataPayload.error) {
          reject(new Error(dataPayload.error))
          return
        }

        try {
          resolve(normalizeListResponse<T>(res.data))
        } catch (e) {
          reject(e)
        }
      },
      fail: (err) => reject(err),
    })
  })
}

export function searchKnowledge(params: KnowledgeSearchParams) {
  return requestList<KnowledgeItem>(API_KNOWLEDGE_SEARCH, params as unknown as Record<string, unknown>)
}

export function getKnowledgeList(params: { limit: number; offset: number; keyword?: string }) {
  return requestList<KnowledgeItem>(API_KNOWLEDGE_LIST, params as unknown as Record<string, unknown>)
}

export function getKnowledgeDetail(id: number) {
  return request<KnowledgeItem>({
    url: `${API_KNOWLEDGE_DETAIL}/${id}`,
    method: 'GET',
  })
}

export function getAdminKnowledgeList(params: AdminKnowledgeListParams) {
  return requestList<KnowledgeItem>(API_ADMIN_KNOWLEDGE_LIST, params as unknown as Record<string, unknown>)
}

export function getAdminKnowledgeDetail(id: number) {
  return request<KnowledgeItem>({
    url: `${API_ADMIN_KNOWLEDGE_DETAIL}/${id}`,
    method: 'GET',
  })
}

export function createKnowledge(payload: UpsertKnowledgePayload) {
  return request<KnowledgeItem>({
    url: API_ADMIN_KNOWLEDGE_LIST,
    method: 'POST',
    data: payload as unknown as Record<string, unknown>,
  })
}

export function patchKnowledge(id: number, payload: PatchKnowledgePayload) {
  return request<KnowledgeMutationResult>({
    url: `${API_ADMIN_KNOWLEDGE_DETAIL}/${id}`,
    method: 'PATCH',
    data: payload as unknown as Record<string, unknown>,
  })
}

export function deleteKnowledge(id: number) {
  return request<KnowledgeMutationResult>({
    url: `${API_ADMIN_KNOWLEDGE_DETAIL}/${id}`,
    method: 'DELETE',
  })
}

export function bindKnowledgeAttachments(id: number, fileIds: number[]) {
  return request<BindAttachmentResult>({
    url: `${API_ADMIN_KNOWLEDGE_DETAIL}/${id}/attachments`,
    method: 'POST',
    data: { file_ids: fileIds } as unknown as Record<string, unknown>,
  })
}

export function getKnowledgeAttachments(id: number) {
  return request<KnowledgeAttachment[]>({
    url: `${API_ADMIN_KNOWLEDGE_DETAIL}/${id}/attachments`,
    method: 'GET',
  })
}

export function detachKnowledgeAttachment(id: number, fileId: number) {
  return request<KnowledgeMutationResult>({
    url: `${API_ADMIN_KNOWLEDGE_DETAIL}/${id}/attachments/${fileId}`,
    method: 'DELETE',
  })
}
