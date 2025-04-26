import { reactive } from 'vue'

export interface InfiniteList<T> {
  pages: Record<number, InfiniteListPage<T>>
  notLoadedPages: Set<number>
  getItem: (index: number) => Promise<T | undefined>
  fetchPage: (pageNum: number, abortEarlierFetch?: boolean) => Promise<InfiniteListPage<T> | undefined>
  clearPage: (pageNum: number) => void
  clearPages: () => void
}

export interface InfiniteListOptions<T> {
  fetchItems: (page: number, signal: AbortSignal) => Promise<T[]>
  totalItems: number
  itemsPerPage: number
  maxPagesToCache: number
  onPageUnloaded?: (pageNum: number) => void
}

export interface InfiniteListPage<T> {
  pageNum: number
  items: T[]
  status: 'not-loaded' | 'pending' | 'resolved' | 'error'
  abortController?: AbortController
}

export function useInfiniteList<T>(options: InfiniteListOptions<T>): InfiniteList<T> {
  const { fetchItems, totalItems, itemsPerPage, maxPagesToCache } = options

  const pages = reactive<Record<number, InfiniteListPage<T>>>({})
  const notLoadedPages = reactive<Set<number>>(new Set())
  const usageOrder: number[] = []

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // 👇 Initialize all pages with 'not-loaded'
  for (let i = 0; i < totalPages; i++) {
    pages[i] = reactive({
      pageNum: i,
      items: [],
      status: 'not-loaded'
    })
    notLoadedPages.add(i)
  }

  async function fetchAndCachePage(pageNum: number, abortEarlierFetch = false): Promise<InfiniteListPage<T> | undefined> {
    const page = pages[pageNum]
    // console.log(`Fetching page ${pageNum}...`, page)

    if (page.status === 'resolved') {
      markPageUsed(pageNum)
      return page
    }

    if (page.status === 'pending') {
      if (abortEarlierFetch) {
        page.abortController?.abort()
        page.abortController = undefined
        page.abortController = new AbortController()
      } else {
        return page
      }
    }

    page.status = 'pending'
    page.abortController = new AbortController()
    // console.log(`Fetching page ${pageNum}...`)

    notLoadedPages.delete(pageNum)

    try {
      const items = await fetchItems(pageNum, page.abortController.signal)
      page.items = items
      page.status = 'resolved'
      markPageUsed(pageNum)
      return page
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // console.log(`Fetch aborted for page ${pageNum}`)
      } else {
        // console.error(`Error fetching page ${pageNum}:`, err)
        page.status = 'error'
      }
      return undefined
    }
  }

  async function getItem(index: number): Promise<T | undefined> {
    if (index < 0 || index >= totalItems) return undefined

    const pageNum = Math.floor(index / itemsPerPage)
    const indexInPage = index % itemsPerPage

    const page = await fetchAndCachePage(pageNum)
    return page?.items[indexInPage]
  }

  function markPageUsed(pageNum: number) {
    const index = usageOrder.indexOf(pageNum)
    if (index !== -1) usageOrder.splice(index, 1)
    usageOrder.push(pageNum)
    cleanupCache()
  }

  function cleanupCache() {
    while (usageOrder.length > maxPagesToCache) {
      const oldest = usageOrder.shift()
      // console.log(`Clearing page ${oldest} from cache...`)
      if (oldest !== undefined) {
        clearPage(oldest)
      }
    }
  }

  function clearPage(pageNum: number) {
    const page = pages[pageNum]
    const wasResolved = page.status === 'resolved'
    if (page.status === 'pending') {
      page.abortController?.abort()
      page.abortController = undefined
    } else if (wasResolved && options.onPageUnloaded) {
      options.onPageUnloaded(pageNum)
    }
    page.items.splice(0)
    page.status = 'not-loaded'
    notLoadedPages.add(pageNum)
  }

  function clearPages() {
    for (let i = 0; i < totalPages; i++) {
      clearPage(i)
    }
    usageOrder.length = 0
  }

  return {
    pages,
    notLoadedPages,
    getItem,
    fetchPage: fetchAndCachePage,
    clearPage,
    clearPages
  }
}
