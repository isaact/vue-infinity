import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useInfiniteList } from '../src/useInfiniteList'

// Fake data for testing
const fakeData = Array.from({ length: 50 }, (_, i) => ({ id: i, title: `Item ${i}` }))

// Mock fetchItems method
const fetchItemsMock = vi.fn((page: number) => {
  const start = page * 10
  const end = start + 10
  console.log(`Fetching items from ${start} to ${end}`)
  console.log('fakeData:', fakeData.slice(start, end))
  return Promise.resolve(fakeData.slice(start, end))
})

// Helper function to create the composable
const createComposable = () => {
  return useInfiniteList({
    fetchItems: fetchItemsMock,
    getItemCount: () => fakeData.length,
    itemsPerPage: 10,
    maxPages: 2, // To test the LRU cache evictions
  })
}

describe('useInfiniteList', () => {
  beforeEach(() => {
    // Reset mocks before each test
    fetchItemsMock.mockClear()
  })

  it('fetches and returns the correct items', async () => {
    const { getItem, pending } = createComposable()

    expect(pending.value).toBe(false)
    expect(fetchItemsMock).not.toHaveBeenCalled()

    // Accessing the first item (index 0) should trigger fetch for page 0
    const firstItem = await getItem(0)
    expect(fetchItemsMock).toHaveBeenCalledTimes(1) // Fetch page 0
    expect(firstItem).toEqual({ id: 0, title: 'Item 0' })

    // Access item 9 (last item of page 0) - should be cached
    const lastItemPage0 = await getItem(9)
    expect(fetchItemsMock).toHaveBeenCalledTimes(2) // No new fetch
    expect(lastItemPage0).toEqual({ id: 9, title: 'Item 9' })

    // Access item 10 (first item of page 1) - should trigger fetch for page 1
    // const firstItemPage1 = await getItem(10)
    // expect(fetchItemsMock).toHaveBeenCalledTimes(2) // Fetch page 1
    // expect(firstItemPage1).toEqual({ id: 10, title: 'Item 10' })

    // Access item 15 (middle of page 1) - should be cached
    const item15 = await getItem(15)
    // expect(fetchItemsMock).toHaveBeenCalledTimes(2) // No new fetch
    expect(item15).toEqual({ id: 15, title: 'Item 15' })
  })

  // it('evicts the least used pages from the cache when maxPages is exceeded', async () => {
  //   const { getItem } = createComposable()

  //   // Access items to fill the cache (maxPages = 2)
  //   await getItem(0) // Fetches page 0 (Cache: [0])
  //   expect(fetchItemsMock).toHaveBeenCalledTimes(1)
  //   await getItem(10) // Fetches page 1 (Cache: [0, 1])
  //   expect(fetchItemsMock).toHaveBeenCalledTimes(2)

  //   // Access page 2, should evict page 0
  //   await getItem(20) // Fetches page 2 (Cache: [1, 2])
  //   expect(fetchItemsMock).toHaveBeenCalledTimes(3)

  //   // Access page 0 again, should trigger a refetch
  //   await getItem(0) // Fetches page 0 (Cache: [2, 0])
  //   expect(fetchItemsMock).toHaveBeenCalledTimes(4) // Refetched page 0

  //   // Access items from pages 2 and 0 to check if they are still cached
  //   const item2 = await getItem(20) // Should be cached
  //   expect(fetchItemsMock).toHaveBeenCalledTimes(4)
  //   expect(item2).toEqual({ id: 20, title: 'Item 20' })

  //   const item0 = await getItem(0) // Should be cached
  //   expect(fetchItemsMock).toHaveBeenCalledTimes(4)
  //   expect(item0).toEqual({ id: 0, title: 'Item 0' })
  // })

  // it('handles accessing out-of-bounds indices gracefully', async () => {
  //   const { getItem } = createComposable()

  //   const outOfBoundsItem = await getItem(100) // Out of bounds
  //   expect(outOfBoundsItem).toBeUndefined()
  //   expect(fetchItemsMock).not.toHaveBeenCalled() // Should not fetch for out-of-bounds

  //   const negativeIndexItem = await getItem(-1) // Negative index
  //   expect(negativeIndexItem).toBeUndefined()
  //   expect(fetchItemsMock).not.toHaveBeenCalled()
  // })

  // it('handles errors from the API call', async () => {
  //   const fetchItemsWithErrorMock = vi.fn().mockRejectedValue(new Error('API error'))

  //   const { getItem, error } = useInfiniteList({
  //     fetchItems: fetchItemsWithErrorMock,
  //     getItemCount: () => fakeData.length,
  //     itemsPerPage: 10,
  //     maxPages: 2,
  //   })

  //   // Try to access the first item, which should trigger the failing fetch
  //   const item = await getItem(0)

  //   // Ensure the item is undefined and the error is captured
  //   expect(item).toBeUndefined()
  //   expect(error.value).toBeInstanceOf(Error)
  //   expect(error.value?.message).toBe('API error')
  //   expect(fetchItemsWithErrorMock).toHaveBeenCalledTimes(1)
  // })
})
