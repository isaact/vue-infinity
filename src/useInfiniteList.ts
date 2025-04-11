import { reactive } from 'vue'

export interface InfiniteListOptions<T> {
  fetchItems: (page: number, signal: AbortSignal) => Promise<T[]>
  totalItems: number
  itemsPerPage: number
  maxPagesToCache: number // max pages to keep in cache
}

export interface InfiniteListPage<T> {
  pageNum: number
  items: T[]
  status: 'pending' | 'resolved' | 'error'
  abortController?: AbortController
}

export function useInfiniteList<T>(options: InfiniteListOptions<T>) {
  const { fetchItems, totalItems, itemsPerPage, maxPagesToCache } = options

  const pages = reactive<Record<number, InfiniteListPage<T>>>({})
  const usageOrder: number[] = [] // LRU tracking

  // Initialize all pages
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // Utility: Fetch and cache a page
  async function fetchAndCachePage(pageNum: number, abortEarlierFetch: boolean = false): Promise<InfiniteListPage<T> | undefined> {
    return new Promise<InfiniteListPage<T> | undefined>(async (resolve, reject) => {
      if(pages[pageNum]){
        if (pages[pageNum].status === 'resolved') {
          markPageUsed(pageNum)
          resolve(pages[pageNum])
        }else if (pages[pageNum].status === 'pending') {
          if(abortEarlierFetch) {
            console.log('Aborted previous fetch for page:', pageNum)
            pages[pageNum].abortController?.abort() // Abort the previous request if it's pending
            pages[pageNum].abortController = new AbortController() // Create a new controller
          } else {
            resolve(pages[pageNum]) // Return the pending page
          }
        }
      } else {
        pages[pageNum] = reactive({
          pageNum,
          items: [],
          status: 'pending',
          abortController: new AbortController()
        })
      }
      const items = await fetchItems(pageNum, pages[pageNum].abortController!.signal)
      if (items) {
        // Use splice to maintain reactivity for array updates
        pages[pageNum].items.splice(0, pages[pageNum].items.length, ...items)
        Object.assign(pages[pageNum], { status: 'resolved' })
        markPageUsed(pageNum)
        resolve(pages[pageNum])
      } else {
        Object.assign(pages[pageNum], { status: 'error' })
      }
    })
  }

  async function getItem(index: number): Promise<T | undefined> {
    if (index < 0 || index >= totalItems) {
      return undefined // Index out of bounds
    }

    const pageNum = Math.floor(index / itemsPerPage)
    const indexInPage = index % itemsPerPage

    try {
      // Ensure page is loaded, await the fetch if necessary
      const page = await fetchAndCachePage(pageNum)

      if (!page) {
        // Fetch might have been aborted or failed, or is pending
        console.warn('Page not loaded or fetch aborted:', pageNum)
        return undefined
      }
      return page.items[indexInPage]

    } catch (err) {
      // Error already set in fetchAndCachePage, just return undefined
      console.error('Error fetching item:', err)
      return undefined
    }
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
      if (oldest !== undefined) {
        if(pages[oldest]?.status === 'pending') {
          pages[oldest].abortController?.abort() // Abort the fetch if it's pending
        }
        delete pages[oldest] // Remove from cache
        console.log('Evicted page from cache:', oldest)
      }
    }
  }
  function clearPages() {
    for (const key in pages) {
      delete pages[key]
    }
    usageOrder.splice(0)
  }

  return {
    pages,
    getItem,
    fetchPage: fetchAndCachePage, // Expose fetchPage for manual triggering if needed
    clearPages
  }
}
