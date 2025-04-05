import { ref, computed } from 'vue'

interface InfiniteListOptions<T> {
  fetchItems: (page: number) => Promise<T[]>
  getItemCount: () => number
  itemsPerPage: number
  maxPages: number // max pages to keep in cache
}

export function useInfiniteList<T>(options: InfiniteListOptions<T>) {
  const { fetchItems, getItemCount, itemsPerPage, maxPages } = options
  type DataType = T | undefined

  const pageCache = new Map<number, T[]>()
  const usageOrder: number[] = [] // LRU tracking
  const pending = ref(false)
  const error = ref<Error | null>(null)
  const data = ref<DataType[]>([]) // Reactive data store

  // AbortController per page for cancellation
  const abortControllers = new Map<number, AbortController>()
  const pendingPages = new Set<number>() // Track pages being fetched

  // Utility: Fetch and cache a page
  async function fetchAndCachePage(pageNum: number) {
    if (pageCache.has(pageNum)) {
      markPageUsed(pageNum)
      return pageCache.get(pageNum)
    }

    // Cancel any in-flight request for this page
    if (abortControllers.has(pageNum)) {
      abortControllers.get(pageNum)?.abort()
      abortControllers.delete(pageNum)
    }

    if (pendingPages.has(pageNum)) return
    pendingPages.add(pageNum)

    const controller = new AbortController()
    abortControllers.set(pageNum, controller)

    pending.value = true
    try {
      const page = await fetchItemsWithAbort(pageNum, controller.signal)
      pageCache.set(pageNum, page)
      markPageUsed(pageNum)
      cleanupCache()
      updateDataArray()
      return page
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        const errorObj = err instanceof Error ? err : new Error(String(err))
        error.value = errorObj
        throw errorObj
      }
    } finally {
      pending.value = false
      pendingPages.delete(pageNum)
      abortControllers.delete(pageNum)
    }
  }

  function updateDataArray() {
    const newData: (T | undefined)[] = []
    const totalItems = getItemCount()
    for (let i = 0; i < totalItems; i++) {
      const page = Math.floor(i / itemsPerPage)
      const indexInPage = i % itemsPerPage
      const pageItems = pageCache.get(page)
      newData[i] = pageItems?.[indexInPage]
    }
    data.value = newData
  }

  async function fetchItemsWithAbort(page: number, signal: AbortSignal): Promise<T[]> {
    const result = await fetchItems(page)
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
    return result
  }

  function markPageUsed(pageNum: number) {
    const index = usageOrder.indexOf(pageNum)
    if (index !== -1) usageOrder.splice(index, 1)
    usageOrder.push(pageNum)
  }

  function cleanupCache() {
    while (usageOrder.length > maxPages) {
      const oldest = usageOrder.shift()
      if (oldest !== undefined) {
        pageCache.delete(oldest)
        abortControllers.get(oldest)?.abort()
        abortControllers.delete(oldest)
      }
    }
  }

  // Prefetch adjacent pages when near boundaries
  function maybePrefetch(index: number) {
    const page = Math.floor(index / itemsPerPage)
    const indexInPage = index % itemsPerPage

    if (page > 0 && indexInPage < 2 && !pendingPages.has(page - 1)) {
      fetchAndCachePage(page - 1)
    } else if (page < Math.ceil(getItemCount() / itemsPerPage) - 1 &&
              indexInPage > itemsPerPage - 3 && !pendingPages.has(page + 1)) {
      fetchAndCachePage(page + 1)
    }
  }

  return {
    data,
    pending,
    error,
    fetchPage: fetchAndCachePage,
    clearCache: () => {
      pageCache.clear()
      usageOrder.splice(0)
      abortControllers.forEach(ctrl => ctrl.abort())
      abortControllers.clear()
      data.value = []
    }
  }
}
