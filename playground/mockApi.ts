export interface GalleryItem {
  url: string
  id: string
}

const TOTAL_IMAGES = 1000
const NETWORK_DELAY = 300 // ms

export async function fetchMockImages(
  page: number, 
  itemsPerPage: number,
  signal?: AbortSignal
): Promise<GalleryItem[]> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const timeout = setTimeout(() => {
      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }

      const startIndex = page * itemsPerPage
      const endIndex = Math.min(startIndex + itemsPerPage, TOTAL_IMAGES)
      
      const items: GalleryItem[] = []
      for (let i = startIndex; i < endIndex; i++) {
        items.push({
          url: `https://picsum.photos/500/500?random=${i}`,
          id: `img-${i}`
        })
      }
      resolve(items)
    }, NETWORK_DELAY)

    signal?.addEventListener('abort', () => {
      clearTimeout(timeout)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
}

export async function getMockImageCount(): Promise<number> {
  return new Promise(resolve => {
    setTimeout(() => resolve(TOTAL_IMAGES), NETWORK_DELAY)
  })
}