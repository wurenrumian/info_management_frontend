import { request, resolveApiUrl } from './request'
import type { ListResponse, PaginationParams } from '@/types/api'
import type { CertificateRecord, CertificateTemplate, CertificateVerifyResult } from '@/types/certificates'
import {
  API_ADMIN_CERTIFICATE_REVOKE,
  API_ADMIN_CERTIFICATE_TEMPLATES,
  API_CERTIFICATE_DETAIL,
  API_CERTIFICATE_ME_LIST,
  API_CERTIFICATE_VERIFY,
} from '@/constants/api'

function wrapNotFound<T>(promise: Promise<T>, hint: string) {
  return promise.catch((e) => {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('接口不存在')) {
      throw new Error(`接口不存在：${hint}`)
    }
    throw e
  })
}

function parseCertificateListPayload<T>(payload: unknown): ListResponse<T> {
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

function requestCertificateList<T>(url: string, params: PaginationParams & Record<string, unknown>) {
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
          reject(new Error('证书接口不存在'))
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

        resolve(parseCertificateListPayload<T>(res.data))
      },
      fail: (err) => reject(err),
    })
  })
}

export function getMyCertificateList(params: PaginationParams & { approval_type?: string }) {
  return wrapNotFound(
    requestCertificateList<CertificateRecord>(
      API_CERTIFICATE_ME_LIST,
      params as PaginationParams & Record<string, unknown>,
    ),
    `GET ${API_CERTIFICATE_ME_LIST}`,
  )
}

export function getCertificateDetail(id: number) {
  return wrapNotFound(
    request<CertificateRecord>({
      url: `${API_CERTIFICATE_DETAIL}/${id}`,
      method: 'GET',
    }),
    `GET ${API_CERTIFICATE_DETAIL}/:id`,
  )
}

export function verifyCertificate(code: string) {
  return wrapNotFound(
    request<CertificateVerifyResult>({
      url: `${API_CERTIFICATE_VERIFY}?code=${encodeURIComponent(code)}`,
      method: 'GET',
      withAuth: false,
    }),
    `GET ${API_CERTIFICATE_VERIFY}?code=xxx`,
  )
}

export function getCertificateTemplates() {
  return wrapNotFound(
    request<CertificateTemplate[]>({
      url: API_ADMIN_CERTIFICATE_TEMPLATES,
      method: 'GET',
    }),
    `GET ${API_ADMIN_CERTIFICATE_TEMPLATES}`,
  )
}

export function activateCertificateTemplate(id: number) {
  return wrapNotFound(
    request<Record<string, unknown>>({
      url: `${API_ADMIN_CERTIFICATE_TEMPLATES}/${id}/activate`,
      method: 'POST',
    }),
    `POST ${API_ADMIN_CERTIFICATE_TEMPLATES}/:id/activate`,
  )
}

export function deactivateCertificateTemplate(id: number) {
  return wrapNotFound(
    request<Record<string, unknown>>({
      url: `${API_ADMIN_CERTIFICATE_TEMPLATES}/${id}/deactivate`,
      method: 'POST',
    }),
    `POST ${API_ADMIN_CERTIFICATE_TEMPLATES}/:id/deactivate`,
  )
}

export function revokeCertificate(id: number, reason: string) {
  return wrapNotFound(
    request<Record<string, unknown>>({
      url: `${API_ADMIN_CERTIFICATE_REVOKE}/${id}/revoke`,
      method: 'POST',
      data: { reason },
    }),
    `POST ${API_ADMIN_CERTIFICATE_REVOKE}/:id/revoke`,
  )
}
