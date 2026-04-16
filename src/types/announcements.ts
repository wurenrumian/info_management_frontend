import type { PaginationParams } from './api'

export type AnnouncementStatus = 'draft' | 'published' | 'archived'
export type AnnouncementAudienceType = 'all' | 'targeted'

export interface AnnouncementExternalLink {
  title: string
  url: string
  source?: string
}

export interface AnnouncementTargetScope {
  grades?: string[]
  majors?: string[]
  class_ids?: number[]
  roles?: number[]
}

export interface AnnouncementListItem {
  id: number
  title: string
  status: AnnouncementStatus
  tags: string[]
  published_at: string | null
}

export interface AnnouncementDetail {
  id: number
  title: string
  content: string
  status: AnnouncementStatus
  audience_type: AnnouncementAudienceType
  target_scope?: AnnouncementTargetScope
  tags: string[]
  attachment_file_ids: number[]
  external_links: AnnouncementExternalLink[]
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface AnnouncementListParams extends PaginationParams {}

export interface AdminAnnouncementListParams extends PaginationParams {
  status?: AnnouncementStatus
}

export interface CreateAnnouncementPayload {
  title: string
  content: string
  audience_type: AnnouncementAudienceType
  target_scope?: AnnouncementTargetScope
  tags?: string[]
  attachment_file_ids?: number[]
  external_links?: AnnouncementExternalLink[]
}

export interface PatchAnnouncementPayload {
  title?: string
  content?: string
  audience_type?: AnnouncementAudienceType
  target_scope?: AnnouncementTargetScope
  tags?: string[]
  attachment_file_ids?: number[]
  external_links?: AnnouncementExternalLink[]
}

export interface PublishAnnouncementPayload {
  send_notification?: boolean
  template_code?: string
}

export interface AnnouncementStatusMutation {
  id: number
  status: AnnouncementStatus
  published_at?: string | null
  updated_at?: string
}
