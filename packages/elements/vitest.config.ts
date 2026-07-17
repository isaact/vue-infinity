import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
	plugins: [vue({ customElement: true })],
	resolve: {
		alias: {
			"vue-infinity": path.resolve(__dirname, "../core/src/index.ts"),
		},
	},
	test: {
		globals: true,
		environment: "happy-dom",
		include: ["test/**/*.test.ts"],
	},
});
