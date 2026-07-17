import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
	resolve: {
		alias: {
			"vue-infinity": path.resolve(
				__dirname,
				"../../packages/core/src/index.ts",
			),
		},
	},
	server: {
		port: 5174,
	},
});
