import { request } from './request'
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

export function getMyCertificateList(params: PaginationParams & { approval_type?: string }) {
  return wrapNotFound(
    request<ListResponse<CertificateRecord>>({
    url: API_CERTIFICATE_ME_LIST,
    method: 'GET',
    data: params as unknown as Record<string, unknown>,
    }),
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
