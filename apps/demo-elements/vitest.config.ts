import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
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
