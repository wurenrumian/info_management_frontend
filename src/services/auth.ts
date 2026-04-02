import { request } from './request'
import type { AuthToken, UserInfo } from '@/types/user'
import { API_AUTH_LOGIN, API_AUTH_BIND, API_AUTH_DEV_LOGIN, API_AUTH_USER_INFO } from '@/constants/api'

interface BindResult {
  ok: boolean
  message: string
}

export function wechatLogin(code: string) {
  return request<AuthToken>({
    url: API_AUTH_LOGIN,
    method: 'POST',
    withAuth: false,
    data: { code },
  })
}

export function bindStudent(studentId: string, password: string, code: string) {
  return request<BindResult>({
    url: API_AUTH_BIND,
    method: 'POST',
    withAuth: false,
    data: { student_id: studentId, password, code },
  })
}

export function devLogin(studentId: string, role?: number) {
  return request<AuthToken>({
    url: API_AUTH_DEV_LOGIN,
    method: 'POST',
    withAuth: false,
    data: role ? { student_id: studentId, role } : { student_id: studentId },
  })
}

export function getUserInfo() {
  return request<UserInfo>({
    url: API_AUTH_USER_INFO,
    method: 'GET',
  })
}
