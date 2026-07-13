import { defineConfig } from "vite";
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
	server: {
		port: 5173,
	},
});
