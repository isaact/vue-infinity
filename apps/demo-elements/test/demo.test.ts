import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { resolve } from "path";

describe("demo-elements app", () => {
	it("should have a directory with package.json", async () => {
		const pkg = await import("../package.json");
		expect(pkg.name).toBe("demo-elements");
		expect(pkg.dependencies).toHaveProperty("@vue-infinity/elements");
	});

	it("should have a main.ts entry point", () => {
		const mainPath = resolve(__dirname, "../main.ts");
		expect(existsSync(mainPath)).toBe(true);
	});

	it("should have a proper index.html", () => {
		const htmlPath = resolve(__dirname, "../index.html");
		expect(existsSync(htmlPath)).toBe(true);
	});
});
