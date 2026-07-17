declare module "@vue-infinity/elements" {
	export interface GalleryImage {
		url: string;
		thumbUrl?: string;
		title?: string;
	}

	export function registerElements(): void;

	export class Gallery extends HTMLElement {
		updateImages(items: string | any[]): void;
		scrollToItem(index: number): void;
	}
}
