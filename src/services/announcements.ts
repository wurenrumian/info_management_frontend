import { request } from './request'
import type { Announcement, AnnouncementListParams } from '@/types/announcements'
import type { ListResponse } from '@/types/api'
import { API_ANNOUNCEMENT_LIST, API_ANNOUNCEMENT_DETAIL } from '@/constants/api'

export function getAnnouncements(params: AnnouncementListParams) {
  return request<ListResponse<Announcement>>({
    url: API_ANNOUNCEMENT_LIST,
    method: 'GET',
    data: params as unknown as Record<string, unknown>,
  })
}

export function getAnnouncementDetail(id: number) {
  return request<Announcement>({
    url: `${API_ANNOUNCEMENT_DETAIL}/${id}`,
    method: 'GET',
  })
}
