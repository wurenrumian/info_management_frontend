import { request, resolveApiUrl } from './request'
import type { Approval, ApprovalDetail, ApprovalSubmitParams } from '@/types/approvals'
import type { ListResponse, PaginationParams } from '@/types/api'
import {
  API_APPROVAL_SUBMIT,
  API_APPROVAL_LIST,
  API_APPROVAL_ME_LIST,
  API_APPROVAL_DETAIL,
  API_APPROVAL_REVIEW,
  API_APPROVAL_WITHDRAW,
  API_ADMIN_APPROVAL_LIST,
  API_ADMIN_APPROVAL_DETAIL,
} from '@/constants/api'

interface ApprovalListEnvelope<T> {
  data?: T[] | { data?: T[]; total?: number }
  total?: number
  error?: string
}

function normalizeApprovalList<T>(payload: unknown): ListResponse<T> {
  const raw = payload as ApprovalListEnvelope<T>
  const directList = Array.isArray(raw.data) ? raw.data : undefined
  const nestedList = Array.isArray((raw.data as { data?: T[] } | undefined)?.data)
    ? (raw.data as { data?: T[] }).data
    : undefined
  const data = (directList || nestedList || []) as T[]

  const totalFromNested = Number((raw.data as { total?: number } | undefined)?.total)
  const totalFromDirect = Number(raw.total)
  const total = Number.isFinite(totalFromNested)
    ? totalFromNested
    : Number.isFinite(totalFromDirect)
      ? totalFromDirect
      : data.length

  return { data, total }
}

function requestApprovalList<T>(url: string, params: PaginationParams & Record<string, unknown>) {
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
          reject(new Error('审批接口不存在'))
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

        try {
          resolve(normalizeApprovalList<T>(res.data))
        } catch (e) {
          reject(e)
        }
      },
      fail: (err) => reject(err),
    })
  })
}

export function submitApproval(data: ApprovalSubmitParams) {
  return request<Approval>({
    url: API_APPROVAL_SUBMIT,
    method: 'POST',
    data: data as unknown as Record<string, unknown>,
  })
}

export function getApprovalList(params: PaginationParams & { status?: string }) {
  return requestApprovalList<Approval>(API_APPROVAL_LIST, params as PaginationParams & Record<string, unknown>)
}

export function getMyApprovalList(params: PaginationParams & { status?: string }) {
  return requestApprovalList<Approval>(API_APPROVAL_ME_LIST, params as PaginationParams & Record<string, unknown>)
}

export function getApprovalDetail(id: number) {
  return request<ApprovalDetail>({
    url: `${API_APPROVAL_DETAIL}/${id}`,
    method: 'GET',
  })
}

export function approveApproval(id: number, action: 'approve' | 'reject', comment?: string) {
  return request<Approval>({
    url: `${API_APPROVAL_REVIEW}/${id}/review`,
    method: 'PATCH',
    data: { action, comment },
  })
}

export function withdrawApproval(id: number) {
  return request<Approval>({
    url: `${API_APPROVAL_WITHDRAW}/${id}/withdraw`,
    method: 'POST',
  })
}

export function getAdminApprovalList(params: PaginationParams & { status?: string; approval_type?: string }) {
  return requestApprovalList<Approval>(API_ADMIN_APPROVAL_LIST, params as PaginationParams & Record<string, unknown>)
}

export function getAdminApprovalDetail(id: number) {
  return request<ApprovalDetail>({
    url: `${API_ADMIN_APPROVAL_DETAIL}/${id}`,
    method: 'GET',
  })
}
