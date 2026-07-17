import { registerElements } from "@vue-infinity/elements";
import { fetchMockImages } from "./mockApi";
import type { GalleryItem } from "./mockApi";

// Register custom elements without createApp or Vue imports
registerElements();

const initGallery = async () => {
	const gallery = document.querySelector("gallery-ce") as
		| (HTMLElement & { updateImages?: (items: GalleryItem[]) => void })
		| null;

	if (!gallery || typeof gallery.updateImages !== "function") {
		return;
	}

	const abortController = new AbortController();

	try {
		const items = await fetchMockImages(300, 0, 30, abortController.signal);
		gallery.updateImages(items);
	} catch (error) {
		if (error instanceof DOMException && error.name === "AbortError") {
			console.log("Gallery init aborted");
			return;
		}
		console.error("Failed to fetch gallery images:", error);
	}
};

initGallery();

console.log("Demo-elements: registered <gallery-ce> custom element");
