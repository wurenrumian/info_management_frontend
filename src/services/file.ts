import { request, resolveApiUrl } from './request'
import { API_FILE_UPLOAD, API_FILE_DOWNLOAD } from '@/constants/api'

export interface UploadedFile {
  id: number
  title: string
  file_path?: string
  file_size?: number
  content_type?: string
  uploader_id?: number
  created_at?: string
}

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

export function uploadFile(filePath: string) {
  return new Promise<UploadedFile>((resolve, reject) => {
    uni.uploadFile({
      url: resolveApiUrl(API_FILE_UPLOAD),
      filePath,
      name: 'file',
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
  const path = `/uploads/documents/${normalizedPath}`
  return base ? `${base}${path}` : path
}
