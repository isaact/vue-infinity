/// <reference types="vitest" />
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";
import path from "path";

export default defineConfig({
	plugins: [vue({ customElement: true }), dts({ include: ["src"] })],
	define: {
		"process.env.NODE_ENV": '"production"',
		__VUE_OPTIONS_API__: "false",
		__VUE_PROD_DEVTOOLS__: "false",
	},
	resolve: {
		alias: {
			"@vue-infinity/core": path.resolve(__dirname, "../core/src/index.ts"),
			vue: "@vue/runtime-dom",
		},
	},
	build: {
		lib: {
			entry: path.resolve(__dirname, "src/index.ts"),
			formats: ["es"],
			fileName: "gallery-ce",
		},
		// NO external — Vue runtime is bundled for drop-in usage
		minify: "esbuild",
		cssCodeSplit: false,
	},
});
