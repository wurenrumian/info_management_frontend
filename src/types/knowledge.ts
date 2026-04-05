export interface KnowledgeAttachment {
  title: string
  url?: string
  file_id?: number
  content_type?: string
  file_size?: number
}

export interface KnowledgeItem {
  id: number
  question: string
  answer: string
  keywords: string[]
  attachments?: KnowledgeAttachment[]
  created_by: number
  updated_by?: number
  created_at?: string
  updated_at: string
}

export interface KnowledgeSearchParams {
  q: string
  limit: number
  offset: number
}

export interface AdminKnowledgeListParams {
  query?: string
  limit: number
  offset: number
}

export interface UpsertKnowledgePayload {
  question: string
  answer: string
  keywords?: string[]
  attachments?: KnowledgeAttachment[]
}

export interface PatchKnowledgePayload {
  question?: string
  answer?: string
  keywords?: string[]
  attachments?: KnowledgeAttachment[]
}

export interface KnowledgeMutationResult {
  updated?: boolean
  deleted?: boolean
}

export interface BindAttachmentPayload {
  file_ids: number[]
}

export interface BindAttachmentResult {
  added_count: number
  already_count: number
  attachments: KnowledgeAttachment[]
}

export interface QaCountRange {
  min: number
  max: number
}

export interface KnowledgeAIDraftItem {
  question: string
  answer: string
  keywords: string[]
  attachment_file_ids: number[]
}

export interface GenerateKnowledgeQaPreviewPayload {
  file_ids: number[]
  qa_count_range: QaCountRange
}

export interface BatchCreateKnowledgePayload {
  items: KnowledgeAIDraftItem[]
}
