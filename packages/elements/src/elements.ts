import { defineCustomElement } from "vue";
import GalleryCe from "./Gallery.ce.vue";
import type { GalleryImage } from "./types";

// Define custom elements
const Gallery = defineCustomElement(GalleryCe);

// Export individual elements
export { Gallery, type GalleryImage };

export function registerElements() {
	// Register custom elements
	customElements.define("gallery-ce", Gallery);
}
