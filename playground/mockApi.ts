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
        const seed = Math.floor(Math.random() * 1000);
        let width, height;
        const aspectRatio = Math.random(); // 0-1
 
        if (aspectRatio < 0.33) { // Square
          width = height = 500;
        } else if (aspectRatio < 0.66) { // Landscape
          width = 600 + Math.floor(Math.random() * 400); // 600-1000
          height = 400 + Math.floor(Math.random() * 200); // 400-600
        } else { // Portrait
          width = 400 + Math.floor(Math.random() * 200); // 400-600
          height = 600 + Math.floor(Math.random() * 400); // 600-1000
        }
 
        items.push({
          url: `https://picsum.photos/seed/${seed}/${width}/${height}?random=${i}`,
          thumbUrl: `https://picsum.photos/seed/${seed}/${Math.floor(width/5)}/${Math.floor(height/5)}?random=${i}`, // Generate smaller thumb dimensions
          title: `img-${i}`
        });
      }
      resolve(items)
    }, NETWORK_DELAY)

    signal?.addEventListener('abort', () => {
      clearTimeout(timeout)
      // reject(new DOMException('Aborted2', 'AbortError'))
    })
  })
}
