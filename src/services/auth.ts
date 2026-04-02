import { request } from './request'
import type { AuthToken, UserInfo } from '@/types/user'
import { API_AUTH_LOGIN, API_AUTH_BIND, API_AUTH_USER_INFO, API_AUTH_USER_INFO_LEGACY } from '@/constants/api'

export function wechatLogin(code: string) {
  return request<AuthToken>({
    url: API_AUTH_LOGIN,
    method: 'POST',
    data: { code },
  })
}

export function bindStudent(studentId: string, name: string) {
  return request<AuthToken>({
    url: API_AUTH_BIND,
    method: 'POST',
    data: { student_id: studentId, name },
  })
}

export function getUserInfo() {
  return request<UserInfo>({
    url: API_AUTH_USER_INFO,
    method: 'GET',
  }).catch(() => {
    return request<UserInfo>({
      url: API_AUTH_USER_INFO_LEGACY,
      method: 'GET',
    })
  })
}
