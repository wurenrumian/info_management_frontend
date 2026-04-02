export interface KnowledgeItem {
  id: number
  question: string
  answer: string
  keywords: string[]
  attachments?: Array<{ file_id: number; title: string }>
  created_by: number
  updated_at: string
}

export interface KnowledgeSearchParams {
  keyword?: string
  limit: number
  offset: number
}
