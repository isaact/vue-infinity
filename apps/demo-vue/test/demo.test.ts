import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { resolve } from "path";

describe("demo-vue app", () => {
	it("should have a directory with package.json", async () => {
		const pkg = await import("../package.json");
		expect(pkg.name).toBe("demo-vue");
		expect(pkg.dependencies).toHaveProperty("vue-infinity");
	});

	it("should have a main.ts entry point", () => {
		const mainPath = resolve(__dirname, "../main.ts");
		expect(existsSync(mainPath)).toBe(true);
	});

	it("should have an App.vue component", () => {
		const appPath = resolve(__dirname, "../App.vue");
		expect(existsSync(appPath)).toBe(true);
	});
});
