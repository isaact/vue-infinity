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
  status: 'not-loaded' | 'pending' | 'resolved' | 'error'
  abortController?: AbortController
}

function createDefaultRecordProxy<K extends PropertyKey, V>(
  defaultFactory: (key: K) => V // Default factory that takes the key (pageNum) and returns the default value
): Record<K, V> {
  // Create a reactive object to hold our data
  const store = reactive({}) as Record<K, V>;

  return new Proxy(store, {
    // Intercept get operations (when a page is accessed)
    get(target, prop: string | symbol) {
      // Log the key being accessed
      // console.log(`Accessed key: ${String(prop)}`);

      // If it's a symbol, let it pass through
      if (typeof prop === 'symbol') {
        return Reflect.get(target, prop);
      }

      // If the key exists in the store, return it
      if (prop in target) {
        // console.log(`Key ${prop} exists! Returning value.`);
        return target[prop as K];
      }

      // If the key doesn't exist, return the default value (but don't store it)
      // console.log(`Key ${prop} not found. Returning default value.`);
      const defaultValue = defaultFactory(prop as K);

      // Set the default value in the store so it becomes reactive
      target[prop as K] = defaultValue;
      return defaultValue;
    },

    // Intercept set operations (when a value is assigned)
    set(target, prop, value) {
      // console.log(`Setting key ${String(prop)} to`, value);
      target[prop as K] = value;
      return true;
    }
  });
}

export function useInfiniteList<T>(options: InfiniteListOptions<T>) {
  const { fetchItems, totalItems, itemsPerPage, maxPagesToCache } = options

  // const pages = reactive<Record<number, InfiniteListPage<T>>>({})
  // Create a defaultDict-like object for pages
  // Create a defaultDict-like object for pages
  const pages = createDefaultRecordProxy<number, InfiniteListPage<T>>((pageNum) => ({
    pageNum,               // Set the requested page number
    items: [],             // Default items as an empty array
    status: 'not-loaded',  // Default status as 'not-loaded'
    abortController: undefined, // Default abort controller
  }));

  const usageOrder: number[] = [] // LRU tracking

  // Initialize all pages
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  function initializePages() {
    for (let i = 0; i < totalPages; i++) {
      pages[i] = reactive({
        pageNum: i,
        items: [],
        status: 'not-loaded',
        abortController: undefined
      })
    }
  }
  initializePages()

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
        clearPage(oldest)
        console.log('Evicted page from cache:', oldest)
      }
    }
  }

  function clearPage(pageNum: number) {
    if (pages[pageNum].status in ['resolved', 'error', 'pending']) {
      if(pages[pageNum].status === 'pending') {
        pages[pageNum].abortController?.abort() // Abort the fetch if it's pending
      }
      pages[pageNum].items.splice(0, pages[pageNum].items.length) // Clear items
      pages[pageNum].status = 'not-loaded' // Reset status
      console.log('Cleared page from cache:', pageNum)
    }
  }

  function clearPages() {
    for (const key in pages) {
      clearPage(Number(key))
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
