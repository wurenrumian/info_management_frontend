import type { ApiResponse } from '@/types/api'

function buildRequestUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL || ''
  if (!base) {
    return path
  }

  // Avoid duplicated /api prefix when both base and path include it.
  if (base === '/api' && path.startsWith('/api/')) {
    return path
  }

  return `${base}${path}`
}

function handleResponse<T>(res: UniApp.RequestSuccessCallbackResult): T {
  const data = res.data as ApiResponse<T>
  if (data.error) {
    throw new Error(data.error)
  }
  return data.data as T
}

function getToken(): string {
  return uni.getStorageSync('token') || ''
}

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, unknown>
  header?: Record<string, string>
}

type RequestData = Record<string, unknown>

export function request<T>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, header = {} } = options
  const token = getToken()

  return new Promise((resolve, reject) => {
    uni.request({
      url: buildRequestUrl(url),
      method,
      data: data as RequestData,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...header,
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
        try {
          const result = handleResponse<T>(res)
          resolve(result)
        } catch (e) {
          reject(e)
        }
      },
      fail: (err) => {
        reject(err)
      },
    })
  })
}
