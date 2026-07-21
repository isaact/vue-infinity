import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(__dirname, "..", "..", "..");

const readJson = <T>(relativePath: string): T => {
	const raw = readFileSync(resolve(repoRoot, relativePath), "utf-8");

	try {
		return JSON.parse(raw) as T;
	} catch (error) {
		throw new Error(`Failed to parse ${relativePath}: ${String(error)}`);
	}
};

const readText = (relativePath: string): string =>
	readFileSync(resolve(repoRoot, relativePath), "utf-8");

describe("rename core package", () => {
	it("sets core package name and version", () => {
		const pkg = readJson<{ name: string; version: string }>(
			"packages/core/package.json",
		);

		expect(pkg.name).toBe("vue-infinity");
		expect(pkg.version).toBe("0.9.3");
	});

	it("updates elements package dependency on core", () => {
		const pkg = readJson<{ dependencies?: Record<string, string> }>(
			"packages/elements/package.json",
		);

		expect(pkg.dependencies).toHaveProperty("vue-infinity");
		expect(pkg.dependencies).not.toHaveProperty("@vue-infinity/core");
	});

	it("updates demo-vue package dependency on core", () => {
		const pkg = readJson<{ dependencies?: Record<string, string> }>(
			"apps/demo-vue/package.json",
		);

		expect(pkg.dependencies).toHaveProperty("vue-infinity");
		expect(pkg.dependencies).not.toHaveProperty("@vue-infinity/core");
	});

	it("updates core tsconfig alias", () => {
		const config = readJson<{
			compilerOptions?: { paths?: Record<string, string[]> };
		}>("packages/core/tsconfig.json");

		expect(config.compilerOptions?.paths).toHaveProperty("vue-infinity");
		expect(config.compilerOptions?.paths).not.toHaveProperty(
			"@vue-infinity/core",
		);
	});

	it("updates elements tsconfig alias", () => {
		const config = readJson<{
			compilerOptions?: { paths?: Record<string, string[]> };
		}>("packages/elements/tsconfig.json");

		expect(config.compilerOptions?.paths).toHaveProperty("vue-infinity");
		expect(config.compilerOptions?.paths).not.toHaveProperty(
			"@vue-infinity/core",
		);
	});

	it("updates elements vite alias", () => {
		const config = readText("packages/elements/vite.config.ts");

		expect(config).toContain('"vue-infinity":');
		expect(config).not.toContain("@vue-infinity/core");
	});

	it("updates elements vitest alias", () => {
		const config = readText("packages/elements/vitest.config.ts");

		expect(config).toContain('"vue-infinity":');
		expect(config).not.toContain("@vue-infinity/core");
	});

	it("updates demo-vue vite alias", () => {
		const config = readText("apps/demo-vue/vite.config.ts");

		expect(config).toContain('"vue-infinity":');
		expect(config).not.toContain("@vue-infinity/core");
	});

	it("updates demo-vue vitest alias", () => {
		const config = readText("apps/demo-vue/vitest.config.ts");

		expect(config).toContain('"vue-infinity":');
		expect(config).not.toContain("@vue-infinity/core");
	});

	it("updates demo-elements vite alias", () => {
		const config = readText("apps/demo-elements/vite.config.ts");

		expect(config).toContain('"vue-infinity":');
		expect(config).not.toContain("@vue-infinity/core");
	});

	it("updates demo-elements vitest alias", () => {
		const config = readText("apps/demo-elements/vitest.config.ts");

		expect(config).toContain('"vue-infinity":');
		expect(config).not.toContain("@vue-infinity/core");
	});

	it("updates Gallery custom element import", () => {
		const source = readText("packages/elements/src/Gallery.ce.vue");

		expect(source).toContain("from 'vue-infinity'");
		expect(source).not.toContain("@vue-infinity/core");
	});

	it("updates demo-vue App import", () => {
		const source = readText("apps/demo-vue/App.vue");

		expect(source).toContain("from 'vue-infinity'");
		expect(source).not.toContain("@vue-infinity/core");
	});

	it("updates GhostDemo import", () => {
		const source = readText("apps/demo-vue/GhostDemo.vue");

		expect(source).toContain("from 'vue-infinity'");
		expect(source).not.toContain("@vue-infinity/core");
	});

	it("updates demo-vue test dependency assertion", () => {
		const source = readText("apps/demo-vue/test/demo.test.ts");

		expect(source).toContain("vue-infinity");
		expect(source).not.toContain("@vue-infinity/core");
	});

	it("updates README package name references", () => {
		const readme = readText("README.md");

		expect(readme).not.toContain("@vue-infinity/core");
	});

	it("updates monorepo spec package name references", () => {
		const spec = readText("openspec/specs/01-monorepo/spec.md");

		expect(spec).not.toContain("@vue-infinity/core");
	});
});
