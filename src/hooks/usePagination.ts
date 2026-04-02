import { shallowRef, ref } from 'vue'

export function usePagination<T>(fetchFn: (params: { limit: number; offset: number }) => Promise<{ data: T[]; total: number }>) {
  const list = shallowRef<T[]>([])
  const total = ref(0)
  const loading = ref(false)
  const limit = 20
  let offset = 0
  let hasMore = true

  async function loadMore() {
    if (loading.value || !hasMore) return
    loading.value = true
    try {
      const result = await fetchFn({ limit, offset })
      list.value = [...list.value, ...result.data]
      total.value = result.total
      offset += limit
      hasMore = list.value.length < result.total
    } finally {
      loading.value = false
    }
  }

  function reset() {
    list.value = []
    total.value = 0
    offset = 0
    hasMore = true
    loadMore()
  }

  return { list, total, loading, hasMore, loadMore, reset }
}
