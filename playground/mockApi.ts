export interface GalleryItem {
  url: string
  thumbUrl: string
  title?: string
}

const NETWORK_DELAY = 200 // ms

export async function fetchMockImages(
  totalImages: number,
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
      const endIndex = Math.min(startIndex + itemsPerPage, totalImages)
      if (startIndex >= totalImages) {
        resolve([])
        return
      }
      
      const items: GalleryItem[] = []
      for (let i = startIndex; i < endIndex; i++) {
        const seed = Math.floor(Math.random() * 1000)
        items.push({
          url: `https://picsum.photos/seed/${seed}/500/500?random=${i}`,
          thumbUrl: `https://picsum.photos/seed/${seed}/100/100?random=${i}`,
          title: `img-${i}`
        })
      }
      resolve(items)
    }, NETWORK_DELAY)

    signal?.addEventListener('abort', () => {
      clearTimeout(timeout)
      // reject(new DOMException('Aborted2', 'AbortError'))
    })
  })
}
