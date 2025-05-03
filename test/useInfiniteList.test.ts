import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useInfiniteList } from '../src/composables/useInfiniteList'

describe('useInfiniteList', () => {
  const mockFetchItems = vi.fn()
  const mockTotalItems = 100

  beforeEach(() => {
    mockFetchItems.mockReset()
  })


  it('should fetch and cache a page', async () => {
    const testItems = Array(10).fill(0).map((_, i) => ({ id: i }))
    mockFetchItems.mockResolvedValue(testItems)

    const { fetchPage, pages } = useInfiniteList({
      fetchItems: mockFetchItems,
      itemsPerPage: 10,
      maxPagesToCache: 3
    })

    const page = await fetchPage(1)
    expect(page).toBeDefined()
    expect(page?.items).toEqual(testItems)
    expect(pages[1].status).toBe('resolved')
    expect(mockFetchItems).toHaveBeenCalledWith(1, expect.any(AbortSignal))
  })

  it('should abort previous pending fetch for same page', async () => {
    const testItems = Array(10).fill(0).map((_, i) => ({ id: i }))
    const abortSignals: AbortSignal[] = []
    
    // Mock with delay to allow abort to happen
    mockFetchItems.mockImplementation((_, signal) => {
      abortSignals.push(signal)
      return new Promise(resolve => {
        setTimeout(() => resolve(testItems), 100)
      })
    })

    const { fetchPage } = useInfiniteList({
      fetchItems: mockFetchItems,
      itemsPerPage: 10,
      maxPagesToCache: 3
    })

    // First fetch (will be pending)
    const firstFetch = fetchPage(1)
    // Second fetch should abort first
    const secondFetch = fetchPage(1, true)
    
    await Promise.all([firstFetch, secondFetch])
    expect(mockFetchItems).toHaveBeenCalledTimes(2)
    expect(abortSignals[0].aborted).toBe(true) // First signal should be aborted
    expect(abortSignals[1].aborted).toBe(false) // Second signal should not be aborted
  })

  it('should evict oldest pages when maxPages exceeded', async () => {
    const testItems = Array(10).fill(0).map((_, i) => ({ id: i }))
    mockFetchItems.mockResolvedValue(testItems)

    const { fetchPage, pages } = useInfiniteList({
      fetchItems: mockFetchItems,
      itemsPerPage: 10,
      maxPagesToCache: 2
    })

    await fetchPage(1)
    await fetchPage(2)
    await fetchPage(3) // Should evict page 1

    expect(pages[1].status).toBe('not-loaded') // Page 1 should be reset
    expect(pages[2].status).toBe('resolved')
    expect(pages[3].status).toBe('resolved')
  })

  it('should get item by index', async () => {
    const testItems = Array(10).fill(0).map((_, i) => ({ id: i }))
    mockFetchItems.mockResolvedValue(testItems)

    const { getItem } = useInfiniteList({
      fetchItems: mockFetchItems,
      itemsPerPage: 10,
      maxPagesToCache: 3
    })

    const item = await getItem(15) // Page 1, index 5
    expect(item).toEqual({ id: 5 })
  })

  it('should clear all pages', async () => {
    const testItems = Array(10).fill(0).map((_, i) => ({ id: i }))
    mockFetchItems.mockResolvedValue(testItems)

    const { fetchPage, pages, clearPages } = useInfiniteList({
      fetchItems: mockFetchItems,
      itemsPerPage: 10,
      maxPagesToCache: 3
    })

    await fetchPage(1)
    expect(pages[1].status).toBe('resolved')
    
    clearPages()
    expect(pages[1].status).toBe('not-loaded')
  })

  it('should return undefined for out of bounds index', async () => {
    const { getItem } = useInfiniteList({
      fetchItems: mockFetchItems,
      itemsPerPage: 10,
      maxPagesToCache: 3
    })

    expect(await getItem(-1)).toBeUndefined()
    expect(await getItem(100)).toBeUndefined()
  })
})
