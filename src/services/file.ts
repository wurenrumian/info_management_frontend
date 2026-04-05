import { request, resolveApiUrl } from './request'
import { API_FILE_UPLOAD, API_FILE_DOWNLOAD, API_FILE_SEARCH } from '@/constants/api'
import type { ListResponse } from '@/types/api'

export interface UploadedFile {
  id: number
  title: string
  file_path?: string
  file_size?: number
  content_type?: string
  uploader_id?: number
  created_at?: string
}

export interface SearchFileItem extends UploadedFile {
  url?: string
  snippet?: string
}

export type UploadScene = 'avatar' | 'knowledge' | 'announcement' | 'document'

interface LegacyUploadResult {
  file_id: number
  title: string
}

function toUploadedFile(payload: unknown): UploadedFile {
  const data = payload as Partial<UploadedFile & LegacyUploadResult>
  const id = Number(data.id ?? data.file_id)
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('上传返回缺少文件ID')
  }

  return {
    id,
    title: String(data.title || ''),
    file_path: data.file_path,
    file_size: data.file_size,
    content_type: data.content_type,
    uploader_id: data.uploader_id,
    created_at: data.created_at,
  }
}

export function uploadFile(filePath: string, scene?: UploadScene) {
  return new Promise<UploadedFile>((resolve, reject) => {
    uni.uploadFile({
      url: resolveApiUrl(API_FILE_UPLOAD),
      filePath,
      name: 'file',
      formData: scene ? { scene } : undefined,
      header: {
        Authorization: `Bearer ${uni.getStorageSync('token') || ''}`,
      },
      success: (res) => {
        const data = JSON.parse(res.data)
        if (data.error) {
          reject(new Error(data.error))
        } else {
          try {
            resolve(toUploadedFile(data.data))
          } catch (e) {
            reject(e)
          }
        }
      },
      fail: reject,
    })
  })
}

export function getFileDownloadUrl(fileId: number) {
  return request<{ url: string }>({
    url: `${API_FILE_DOWNLOAD}/${fileId}`,
    method: 'GET',
  })
}

export function getFileList(params: { limit: number; offset: number }) {
  return requestFileList<UploadedFile>(API_FILE_DOWNLOAD, params)
}

export function searchFiles(params: { q: string; limit: number; offset: number }) {
  return requestFileList<SearchFileItem>(API_FILE_SEARCH, params)
}

export function deleteFile(fileId: number) {
  return request<{ deleted: boolean }>({
    url: `${API_FILE_DOWNLOAD}/${fileId}`,
    method: 'DELETE',
  })
}

function requestFileList<T>(url: string, params: Record<string, unknown>) {
  return new Promise<ListResponse<T>>((resolve, reject) => {
    uni.request({
      url: resolveApiUrl(url),
      method: 'GET',
      data: params,
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

        const payload = (res.data || {}) as { data?: T[]; total?: number; error?: string }
        if (payload.error) {
          reject(new Error(payload.error))
          return
        }

        resolve({
          data: Array.isArray(payload.data) ? payload.data : [],
          total: Number(payload.total || 0),
        })
      },
      fail: (err) => reject(err),
    })
  })
}

export function buildFileDownloadUrl(fileId: number) {
  return resolveApiUrl(`${API_FILE_DOWNLOAD}/${fileId}/download`)
}

function trimSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function resolvePublicBaseUrl() {
  const explicitBase = String(import.meta.env.VITE_FILE_PUBLIC_BASE_URL || '').trim()
  if (explicitBase) {
    return trimSlash(explicitBase)
  }

  const apiBase = String(import.meta.env.VITE_API_BASE_URL || '').trim()
  const proxyTarget = String(import.meta.env.VITE_API_PROXY_TARGET || '').trim()

  const normalized = (proxyTarget || apiBase).replace(/\/api(?:\/v\d+)?\/?$/i, '')

  if (/^https?:\/\//i.test(normalized)) {
    return trimSlash(normalized)
  }

  if (normalized === '/api' || normalized.startsWith('/api/')) {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return trimSlash(window.location.origin)
    }
    return ''
  }

  if (!normalized) {
    return 'http://localhost:8080'
  }

  return trimSlash(normalized)
}

export function buildPublicFileUrl(filePath: string) {
  const normalizedPath = String(filePath || '').replace(/^\/+/, '')
  if (!normalizedPath) {
    return ''
  }

  const base = resolvePublicBaseUrl()
  const isCategorizedPath = /^(avatars|images|knowledge|announcement|documents|document)\//i.test(normalizedPath)
  const path = isCategorizedPath ? `/uploads/${normalizedPath}` : `/uploads/documents/${normalizedPath}`
  return base ? `${base}${path}` : path
}

export function resolveFileAccessUrl(raw: string) {
  const value = String(raw || '').trim()
  if (!value) {
    return ''
  }

  if (/^https?:\/\//i.test(value)) {
    return value
  }

  if (value.startsWith('/uploads/')) {
    const base = resolvePublicBaseUrl()
    return base ? `${base}${value}` : value
  }

  if (value.startsWith('uploads/')) {
    const base = resolvePublicBaseUrl()
    return base ? `${base}/${value}` : `/${value}`
  }

  const normalized = value.replace(/^\/+/, '')
  if (/^(avatars|images|knowledge|announcement|documents|document)\//i.test(normalized)) {
    return buildPublicFileUrl(normalized)
  }

  if (value.startsWith('/')) {
    return resolveApiUrl(value)
  }

  return resolveApiUrl(`/${value}`)
}
