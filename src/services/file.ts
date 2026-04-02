import { request } from './request'
import { API_FILE_UPLOAD, API_FILE_DOWNLOAD } from '@/constants/api'

function buildUploadUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL || ''
  if (!base) {
    return path
  }
  if (base === '/api' && path.startsWith('/api/')) {
    return path
  }
  return `${base}${path}`
}

export function uploadFile(filePath: string) {
  return new Promise<{ file_id: number; title: string }>((resolve, reject) => {
    uni.uploadFile({
      url: buildUploadUrl(API_FILE_UPLOAD),
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
          resolve(data.data)
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
