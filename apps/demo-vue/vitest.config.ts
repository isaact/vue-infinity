import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: {
			"@vue-infinity/core": path.resolve(
				__dirname,
				"../../packages/core/src/index.ts",
			),
		},
	},
	test: {
		globals: true,
		environment: "happy-dom",
		include: ["test/**/*.test.ts"],
	},
});
