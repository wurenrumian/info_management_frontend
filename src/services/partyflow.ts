import { request } from './request'
import type { ListResponse } from '@/types/api'
import type {
  CreatePartyflowEventPayload,
  CreatePartyflowStatusPayload,
  PartyflowAdminStatusItem,
  PartyflowAdminStatusListParams,
  PartyflowImportPayload,
  PartyflowImportResult,
  PartyflowMyStatus,
  PartyflowReminderRule,
  PartyflowRuleListParams,
  PatchPartyflowRulePayload,
  PatchPartyflowStatusPayload,
  ScanPartyflowRemindersPayload,
  ScanPartyflowRemindersResult,
} from '@/types/partyflow'
import {
  API_ADMIN_PARTYFLOW_RULES,
  API_ADMIN_PARTYFLOW_SCAN_REMINDERS,
  API_ADMIN_PARTYFLOW_STATUSES,
  API_PARTYFLOW_ME,
} from '@/constants/api'
import { resolveApiUrl } from './request'

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
          reject(new Error('接口不存在'))
          return
        }
        if (res.statusCode >= 400) {
          const data = (res.data || {}) as { error?: string }
          reject(new Error(data.error || `请求失败(${res.statusCode})`))
          return
        }
        const data = (res.data || {}) as { data?: T[]; total?: number; error?: string }
        if (data.error) {
          reject(new Error(data.error))
          return
        }
        const list = Array.isArray(data.data) ? data.data : []
        const totalValue = Number(data.total)
        resolve({
          data: list,
          total: Number.isFinite(totalValue) ? totalValue : list.length,
        })
      },
      fail: (err) => reject(err),
    })
  })
}

export function getPartyflowMine() {
  return request<PartyflowMyStatus[]>({
    url: API_PARTYFLOW_ME,
    method: 'GET',
  })
}

export function getAdminPartyflowStatuses(params: PartyflowAdminStatusListParams) {
  return requestList<PartyflowAdminStatusItem>(API_ADMIN_PARTYFLOW_STATUSES, params as unknown as Record<string, unknown>)
}

export function getAdminPartyflowStatusDetail(id: number) {
  return request<PartyflowAdminStatusItem>({
    url: `${API_ADMIN_PARTYFLOW_STATUSES}/${id}`,
    method: 'GET',
  })
}

export function createAdminPartyflowStatus(payload: CreatePartyflowStatusPayload) {
  return request<PartyflowAdminStatusItem>({
    url: API_ADMIN_PARTYFLOW_STATUSES,
    method: 'POST',
    data: payload as unknown as Record<string, unknown>,
  })
}

export function patchAdminPartyflowStatus(id: number, payload: PatchPartyflowStatusPayload) {
  return request<PartyflowAdminStatusItem>({
    url: `${API_ADMIN_PARTYFLOW_STATUSES}/${id}`,
    method: 'PATCH',
    data: payload as unknown as Record<string, unknown>,
  })
}

export function importAdminPartyflowStatuses(payload: PartyflowImportPayload) {
  return request<PartyflowImportResult>({
    url: `${API_ADMIN_PARTYFLOW_STATUSES}/import`,
    method: 'POST',
    data: payload as unknown as Record<string, unknown>,
  })
}

export function createAdminPartyflowEvent(statusId: number, payload: CreatePartyflowEventPayload) {
  return request<PartyflowAdminStatusItem>({
    url: `${API_ADMIN_PARTYFLOW_STATUSES}/${statusId}/events`,
    method: 'POST',
    data: payload as unknown as Record<string, unknown>,
  })
}

export function getAdminPartyflowReminderRules(params: PartyflowRuleListParams = {}) {
  return request<PartyflowReminderRule[]>({
    url: API_ADMIN_PARTYFLOW_RULES,
    method: 'GET',
    data: params as unknown as Record<string, unknown>,
  })
}

export function patchAdminPartyflowReminderRule(id: number, payload: PatchPartyflowRulePayload) {
  return request<PartyflowReminderRule>({
    url: `${API_ADMIN_PARTYFLOW_RULES}/${id}`,
    method: 'PATCH',
    data: payload as unknown as Record<string, unknown>,
  })
}

export function scanAdminPartyflowReminders(payload: ScanPartyflowRemindersPayload = {}) {
  return request<ScanPartyflowRemindersResult>({
    url: API_ADMIN_PARTYFLOW_SCAN_REMINDERS,
    method: 'POST',
    data: payload as unknown as Record<string, unknown>,
  })
}
