import { request } from './request'
import type { KnowledgeItem, KnowledgeSearchParams } from '@/types/knowledge'
import type { ListResponse } from '@/types/api'
import { API_KNOWLEDGE_SEARCH, API_KNOWLEDGE_DETAIL, API_KNOWLEDGE_LIST } from '@/constants/api'

export function searchKnowledge(params: KnowledgeSearchParams) {
  return request<ListResponse<KnowledgeItem>>({
    url: API_KNOWLEDGE_SEARCH,
    method: 'GET',
    data: params as unknown as Record<string, unknown>,
  })
}

export function getKnowledgeList(params: KnowledgeSearchParams) {
  return request<ListResponse<KnowledgeItem>>({
    url: API_KNOWLEDGE_LIST,
    method: 'GET',
    data: params as unknown as Record<string, unknown>,
  })
}

export function getKnowledgeDetail(id: number) {
  return request<KnowledgeItem>({
    url: `${API_KNOWLEDGE_DETAIL}/${id}`,
    method: 'GET',
  })
}
