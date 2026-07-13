import { defineConfig } from "vite";
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
	server: {
		port: 5174,
	},
});
