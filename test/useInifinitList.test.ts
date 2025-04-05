import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useInfiniteList } from '../src/useInfiniteList'

// Fake data for testing
const fakeData = Array.from({ length: 50 }, (_, i) => ({ id: i, title: `Item ${i}` }))

// Mock fetchItems method
const fetchItemsMock = vi.fn((page: number) => {
  const start = page * 10
  const end = start + 10
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
  it('fetches and returns the correct items', async () => {
    const fkData = await fetchItemsMock(0)
    // console.log('fkData', fkData)
    const { data, pending, error, fetchPage } = createComposable()

    // Accessing the first item (index 0) should trigger fetch for page 0
    // expect(fetchItemsMock).not.toHaveBeenCalled() // Initial call should not have been made yet
    expect(pending.value).toBe(false)

    const firstItem = await data.value[0]
    // expect(fetchItemsMock).toHaveBeenCalledTimes(1) // Fetch page 0
    console.log('firstItem', firstItem)
    console.log('fetchItems2', data.value)
    expect(firstItem).toEqual({ id: 0, title: 'Item 0' })

    // Now access item 9 (last item of page 0)
    const lastItemPage0 = data.value[9]
    expect(lastItemPage0).toEqual({ id: 9, title: 'Item 9' })

    // Now access item 10, which should trigger the next page (page 1)
    const firstItemPage1 = data.value[10]
    expect(fetchItemsMock).toHaveBeenCalledTimes(2) // Fetch page 1
    expect(firstItemPage1).toEqual({ id: 10, title: 'Item 10' })

    // Cache check: Ensure pages 0 and 1 are cached
    expect(fetchItemsMock).toHaveBeenCalledTimes(2)

    // Accessing item 15, which should also trigger page 1 if it's evicted
    const item15 = data.value[15]
    expect(fetchItemsMock).toHaveBeenCalledTimes(3) // Page 1 should be refetched if evicted
    expect(item15).toEqual({ id: 15, title: 'Item 15' })
  })

  it('evicts the least used pages from the cache when maxPages is exceeded', async () => {
    const { data } = createComposable()

    // Access items across multiple pages
    await data.value[0] // Page 0
    await data.value[10] // Page 1
    await data.value[20] // Page 2

    // Now, page 0 should be evicted due to maxPages = 2
    // Access item 0 again; it should trigger a fetch for page 0
    expect(fetchItemsMock).toHaveBeenCalledTimes(4) // Should refetch page 0

    // Access items from pages 1 and 2 to check if they are still cached
    const item1 = data.value[10]
    const item2 = data.value[20]
    expect(item1).toEqual({ id: 10, title: 'Item 10' })
    expect(item2).toEqual({ id: 20, title: 'Item 20' })
  })

  it('handles accessing out-of-bounds indices gracefully', async () => {
    const { data } = createComposable()

    const outOfBoundsItem = data.value[100] // Out of bounds
    expect(outOfBoundsItem).toBeUndefined()
  })

  it('handles errors from the API call', async () => {
    const fetchItemsWithErrorMock = vi.fn(() => Promise.reject(new Error('API error')))

    const { data, error } = useInfiniteList({
      fetchItems: fetchItemsWithErrorMock,
      getItemCount: () => fakeData.length,
      itemsPerPage: 10,
      maxPages: 2,
    })

    await data.value[0] // Try to access the first item

    // Ensure the error is captured
    expect(error.value).toBeInstanceOf(Error)
    expect(error.value?.message).toBe('API error')
  })
})
