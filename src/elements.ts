
import { defineCustomElement } from 'vue'
import GalleryCe from './components/Gallery.ce.vue'

// Define custom elements
const Gallery = defineCustomElement(GalleryCe)

// Export individual elements
export { Gallery }

export function registerElements() {
  // Register custom elements
  customElements.define('vue-gallery', Gallery)
}