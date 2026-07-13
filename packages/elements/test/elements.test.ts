import { describe, it, expect } from "vitest";

describe("@vue-infinity/elements", () => {
	it("should export registerElements function from elements module", async () => {
		const mod = await import("../src/elements");
		expect(mod).toBeDefined();
		expect(typeof mod.registerElements).toBe("function");
		expect(mod.Gallery).toBeDefined();
	});

	it("should have GalleryImage type export from types module", async () => {
		const typesMod = await import("../src/types");
		expect(typesMod).toBeDefined();
	});
});
