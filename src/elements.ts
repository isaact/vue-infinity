
import { defineCustomElement } from 'vue'
import GalleryCe from './components/Gallery.ce.vue'
import type { GalleryImage } from './types'

// Define custom elements
const Gallery = defineCustomElement(GalleryCe)

// Export individual elements
export { Gallery, GalleryImage }

export function registerElements() {
  // Register custom elements
  customElements.define('gallery-ce', Gallery)
}