import { reactive } from 'vue'

export interface InfiniteList<T> {
  pages: Record<number, InfiniteListPage<T>>
  itemsPerPage: number
  getItem: (index: number) => Promise<T | undefined>
  fetchPage: (pageNum: number, abortEarlierFetch?: boolean) => Promise<InfiniteListPage<T> | undefined>
  clearPage: (pageNum: number) => void
  clearPages: () => void
  updatePages: (preloadedPages: Record<number, InfiniteListPage<T>>) => void
  maxPagesToCache: number // Make this mutable
  updateMaxPagesToCache: (newMax: number) => void
}

export interface InfiniteListOptions<T> {
  fetchItems: (page: number, signal: AbortSignal) => Promise<T[]>
  itemsPerPage: number
  maxPagesToCache: number
  onPageUnloaded?: (pageNum: number) => void
  preloadedPages?: Record<number, InfiniteListPage<T>>
}

export interface InfiniteListPage<T> {
  pageNum: number
  items: T[]
  status: 'not-loaded' | 'pending' | 'resolved' | 'error'
  abortController?: AbortController
  lastUsed?: number // Add timestamp for LRU
}

export function useInfiniteList<T>(options: InfiniteListOptions<T>): InfiniteList<T> {
  const { fetchItems, itemsPerPage } = options
  let { maxPagesToCache } = options // Make maxPagesToCache mutable

  const pages = reactive<Record<number, InfiniteListPage<T>>>(options.preloadedPages || {})
  // const notLoadedPages = reactive<Set<number>>(new Set())
  // const usageOrder: number[] = [] // No longer needed for timestamp LRU

 // If preloaded pages are provided, mark them as resolved and update timestamp
 if (options.preloadedPages) {
   for (const pageNumStr in options.preloadedPages) {
     const pageNum = Number(pageNumStr)
     pages[pageNum].status = 'resolved'
     markPageUsed(pageNum) // Mark preloaded pages as used
   }
 }

 async function fetchAndCachePage(pageNum: number, abortEarlierFetch = false): Promise<InfiniteListPage<T> | undefined> {
    const page = pages[pageNum] || (pages[pageNum] = reactive({
      pageNum,
      items: [],
      status: 'not-loaded'
    }))

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

    // notLoadedPages.delete(pageNum)

    try {
      const items = await fetchItems(pageNum, page.abortController.signal)
      // console.log(`Fetched page ${pageNum}:`, items.length)
      if(items.length === 0) {
        page.status = 'error'
        return page
      }
      page.items = items
      page.status = 'resolved'
      markPageUsed(pageNum)
      return page
    } catch (err) {
      console.error(`Error fetching page ${pageNum}:`, err)
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
    if (index < 0) return undefined

    const pageNum = Math.floor(index / itemsPerPage)
    const indexInPage = index % itemsPerPage

    const page = await fetchAndCachePage(pageNum)
    return page?.items[indexInPage]
  }

  function markPageUsed(pageNum: number) {
    const page = pages[pageNum]
    if (page) {
      page.lastUsed = Date.now() // Update timestamp
    }
    cleanupCache()
  }

  function cleanupCache() {
    const cachedPages = Object.values(pages).filter(page => page.status === 'resolved' && page.lastUsed !== undefined)
    if (cachedPages.length > maxPagesToCache) {
      console.log(`Cleaning up cache: ${cachedPages.length} cached pages, max allowed is ${maxPagesToCache}`)
      // Sort by lastUsed timestamp ascending (oldest first)
      cachedPages.sort((a, b) => (a.lastUsed || 0) - (b.lastUsed || 0))

      const pagesToClearCount = cachedPages.length - maxPagesToCache
      for (let i = 0; i < pagesToClearCount; i++) {
        const oldestPage = cachedPages[i]
        // console.log(`Clearing page ${oldestPage.pageNum} from cache (LRU)...`)
        clearPage(oldestPage.pageNum)
      }
    }
  }

  function clearPage(pageNum: number) {
    const page = pages[pageNum]
    const wasResolved = page.status === 'resolved'
    console.log(`Clearing page ${pageNum}...`)
    if (page.status === 'pending') {
      page.abortController?.abort()
      page.abortController = undefined
    } else if (wasResolved && options.onPageUnloaded) {
      options.onPageUnloaded(pageNum)
    }
    page.items.splice(0)
    page.status = 'not-loaded'
  }

  function clearPages() {
    for (const pageNum in pages) {
      clearPage(Number(pageNum))
    }
  }

  function updatePages(preloadedPages: Record<number, InfiniteListPage<T>>) {
    console.log('Updating pages with preloaded data:', preloadedPages)
    for (const pageNumStr in preloadedPages) {
      const pageNum = Number(pageNumStr)
      const preloadedPage = preloadedPages[pageNum]
      if (preloadedPage) {
        if (!pages[pageNum]) {
          pages[pageNum] = reactive({
            pageNum: preloadedPage.pageNum,
            items: [], // Initialize with empty array
            status: 'not-loaded' // Initial status
          })
        }
        // Update properties individually to maintain reactivity and type
        pages[pageNum].items = preloadedPage.items
        pages[pageNum].status = 'resolved'
        pages[pageNum].abortController = preloadedPage.abortController
        markPageUsed(pageNum) // Add to usage order
      }
    }
  }

  function updateMaxPagesToCache(newMax: number) {
    maxPagesToCache = newMax
    cleanupCache() // Run cleanup immediately after updating the max
  }

  return {
    pages,
    itemsPerPage,
    getItem,
    fetchPage: fetchAndCachePage,
    clearPage,
    clearPages,
    updatePages,
    maxPagesToCache, // Expose the mutable maxPagesToCache
    updateMaxPagesToCache // Return the new method
  }
}
