export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}

export interface ListResponse<T = unknown> {
  data: T[]
  total: number
}

export interface PaginationParams {
  limit: number
  offset: number
}
