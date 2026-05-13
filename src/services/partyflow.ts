import { request, resolveApiUrl } from './request'
import type {
  CreatePartyflowEventPayload,
  CreatePartyflowStatusPayload,
  PartyflowAdminStatusItem,
  PartyflowAdminStatusListParams,
  PartyflowEvent,
  PartyflowImportPayload,
  PartyflowImportResult,
  PartyflowMyStatus,
  PartyflowReminderRule,
  PatchPartyflowRulePayload,
  PatchPartyflowStatusPayload,
  ScanPartyflowRemindersResult,
} from '@/types/partyflow'
import type { ListResponse } from '@/types/api'
import {
  API_ADMIN_PARTYFLOW_REMINDER_RULES,
  API_ADMIN_PARTYFLOW_REMINDERS_SCAN,
  API_ADMIN_PARTYFLOW_STATUS_DETAIL,
  API_ADMIN_PARTYFLOW_STATUS_EVENTS,
  API_ADMIN_PARTYFLOW_STATUSES,
  API_PARTYFLOW_ME,
} from '@/constants/api'

function parseListResponse<T>(payload: unknown): ListResponse<T> {
  const raw = (payload || {}) as {
    data?: unknown
    total?: unknown
  }
  const list = Array.isArray(raw.data) ? (raw.data as T[]) : []
  const totalValue = Number(raw.total)
  const total = Number.isFinite(totalValue) ? totalValue : list.length
  return { data: list, total }
}

function requestList<T>(url: string, params?: Record<string, unknown>) {
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
        if (res.statusCode >= 400) {
          const data = (res.data || {}) as { error?: string }
          reject(new Error(data.error || `请求失败(${res.statusCode})`))
          return
        }

        try {
          resolve(parseListResponse<T>(res.data))
        } catch (e) {
          reject(e)
        }
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
    url: `${API_ADMIN_PARTYFLOW_STATUS_DETAIL}/${id}`,
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
    url: `${API_ADMIN_PARTYFLOW_STATUS_DETAIL}/${id}`,
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

export function createAdminPartyflowEvent(id: number, payload: CreatePartyflowEventPayload) {
  return request<PartyflowEvent>({
    url: `${API_ADMIN_PARTYFLOW_STATUS_EVENTS}/${id}/events`,
    method: 'POST',
    data: payload as unknown as Record<string, unknown>,
  })
}

export function getAdminPartyflowReminderRules(params?: Record<string, unknown>) {
  return requestList<PartyflowReminderRule>(API_ADMIN_PARTYFLOW_REMINDER_RULES, params).then((res) => res.data)
}

export function patchAdminPartyflowReminderRule(id: number, payload: PatchPartyflowRulePayload) {
  return request<PartyflowReminderRule>({
    url: `${API_ADMIN_PARTYFLOW_REMINDER_RULES}/${id}`,
    method: 'PATCH',
    data: payload as unknown as Record<string, unknown>,
  })
}

export function scanAdminPartyflowReminders(payload?: { now?: string }) {
  return request<ScanPartyflowRemindersResult>({
    url: API_ADMIN_PARTYFLOW_REMINDERS_SCAN,
    method: 'POST',
    data: payload as Record<string, unknown> | undefined,
  })
}
