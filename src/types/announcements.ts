export interface Announcement {
  id: number
  title: string
  content: string
  author_id: number
  tags: string[]
  target_grades: string[]
  target_majors: string[]
  attachments?: Array<{ file_id: number; title: string; file_size: number }>
  published_at: string
}

export interface AnnouncementListParams {
  tag?: string
  grade?: string
  major?: string
  limit: number
  offset: number
}
