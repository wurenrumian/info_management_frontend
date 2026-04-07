import { request, resolveApiUrl } from './request'
import type {
  AdminKnowledgeListParams,
  BatchCreateKnowledgePayload,
  BindAttachmentResult,
  GenerateKnowledgeQaPreviewPayload,
  KnowledgeAIDraftItem,
  KnowledgeItem,
  KnowledgeMutationResult,
  KnowledgeSearchParams,
  KnowledgeAttachment,
  PatchKnowledgePayload,
  UpsertKnowledgePayload,
} from '@/types/knowledge'
import type { ListResponse } from '@/types/api'
import {
  API_ADMIN_KNOWLEDGE_BATCH,
  API_ADMIN_KNOWLEDGE_DETAIL,
  API_ADMIN_KNOWLEDGE_LIST,
  API_ADMIN_KNOWLEDGE_QA_GENERATE_PREVIEW,
  API_ADMIN_KNOWLEDGE_QA_GENERATE_PREVIEW_STREAM,
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

interface SSEEventChunk {
  event: string
  data: string
}

interface StreamDraftsPayload<T> {
  items?: T[]
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

function requestListWithBody<T>(url: string, method: 'POST', data?: Record<string, unknown>) {
  return new Promise<ListResponse<T>>((resolve, reject) => {
    uni.request({
      url: resolveApiUrl(url),
      method,
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

function normalizeDraftItems<T>(payload: unknown): ListResponse<T> {
  const raw = payload as StreamDraftsPayload<T>
  const data = Array.isArray(raw.items) ? raw.items : []
  const totalValue = Number(raw.total)
  const total = Number.isFinite(totalValue) ? totalValue : data.length
  return { data, total }
}

function parseSSEChunks(buffer: string): { events: SSEEventChunk[]; rest: string } {
  const events: SSEEventChunk[] = []
  let rest = buffer

  while (true) {
    const separatorIndex = rest.indexOf('\n\n')
    if (separatorIndex < 0) {
      break
    }

    const block = rest.slice(0, separatorIndex)
    rest = rest.slice(separatorIndex + 2)

    const normalized = block.replace(/\r/g, '')
    const lines = normalized.split('\n')
    let eventName = 'message'
    const dataLines: string[] = []

    for (const line of lines) {
      if (!line || line.startsWith(':')) {
        continue
      }
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim() || 'message'
        continue
      }
      if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim())
      }
    }

    events.push({ event: eventName, data: dataLines.join('\n') })
  }

  return { events, rest }
}

export async function generateKnowledgeQaPreviewStream(
  payload: GenerateKnowledgeQaPreviewPayload,
  handlers?: {
    onDrafts?: (result: ListResponse<KnowledgeAIDraftItem>) => void
    onStatus?: (message: string) => void
  },
) {
  handlers?.onStatus?.('connecting')
  const token = uni.getStorageSync('token') || ''
  const response = await fetch(resolveApiUrl(API_ADMIN_KNOWLEDGE_QA_GENERATE_PREVIEW_STREAM), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  })

  if (response.status === 401) {
    uni.removeStorageSync('token')
    uni.redirectTo({ url: '/pages/auth/login' })
    throw new Error('未登录')
  }
  if (response.status === 403) {
    throw new Error('无权限')
  }
  if (!response.ok) {
    throw new Error('服务异常')
  }

  if (!response.body) {
    throw new Error('流式响应不可用')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let parsedResult: ListResponse<KnowledgeAIDraftItem> | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    handlers?.onStatus?.('receiving')

    buffer += decoder.decode(value, { stream: true })
    const { events, rest } = parseSSEChunks(buffer)
    buffer = rest

    for (const chunk of events) {
      if (chunk.event === 'done' && chunk.data === '[DONE]') {
        handlers?.onStatus?.('done')
        continue
      }
      if (chunk.event !== 'drafts') {
        continue
      }

      try {
        const data = JSON.parse(chunk.data)
        parsedResult = normalizeDraftItems<KnowledgeAIDraftItem>(data)
        handlers?.onStatus?.(`parsed-${parsedResult.total}`)
        handlers?.onDrafts?.(parsedResult)
      } catch {
        throw new Error('解析流式草稿数据失败')
      }
    }
  }

  return parsedResult || { data: [], total: 0 }
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

export function generateKnowledgeQaPreview(payload: GenerateKnowledgeQaPreviewPayload) {
  return requestListWithBody<KnowledgeAIDraftItem>(
    API_ADMIN_KNOWLEDGE_QA_GENERATE_PREVIEW,
    'POST',
    payload as unknown as Record<string, unknown>,
  )
}

export function batchCreateKnowledge(payload: BatchCreateKnowledgePayload) {
  return requestListWithBody<KnowledgeItem>(API_ADMIN_KNOWLEDGE_BATCH, 'POST', payload as unknown as Record<string, unknown>)
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
