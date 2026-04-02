import { request } from './request'
import type { Approval, ApprovalSubmitParams } from '@/types/approvals'
import type { ListResponse, PaginationParams } from '@/types/api'
import { API_APPROVAL_SUBMIT, API_APPROVAL_LIST, API_APPROVAL_DETAIL, API_APPROVAL_ACTION } from '@/constants/api'

export function submitApproval(data: ApprovalSubmitParams) {
  return request<Approval>({
    url: API_APPROVAL_SUBMIT,
    method: 'POST',
    data: data as unknown as Record<string, unknown>,
  })
}

export function getApprovalList(params: PaginationParams & { status?: string }) {
  return request<ListResponse<Approval>>({
    url: API_APPROVAL_LIST,
    method: 'GET',
    data: params as unknown as Record<string, unknown>,
  })
}

export function getApprovalDetail(id: number) {
  return request<Approval>({
    url: `${API_APPROVAL_DETAIL}/${id}`,
    method: 'GET',
  })
}

export function approveApproval(id: number, action: 'approve' | 'reject', comment?: string) {
  return request<Approval>({
    url: `${API_APPROVAL_ACTION}/${id}/action`,
    method: 'POST',
    data: { action, comment },
  })
}

export function withdrawApproval(id: number) {
  return request<Approval>({
    url: `${API_APPROVAL_ACTION}/${id}/withdraw`,
    method: 'POST',
  })
}
