import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import url from "@rollup/plugin-url";
import autoprefixer from "autoprefixer";
import cssDeclarationSorter from "css-declaration-sorter";
import banner from "./bundlerPlugins/banner";

const production = process.env.NODE_ENV === "production";
const env = process.env.NODE_ENV || "development";
const ssr = process.env.BUILD_MODE === "ssr";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		preact(),
		production && {
			...url({
				include: [
					"**/*.svg",
					"**/*.png",
					"**/*.jp(e)?g",
					"**/*.gif",
					"**/*.webp",
					"**/*.avif",
				],
				limit: 0,
				publicPath: "/assets/img/",
				destDir: "dist/assets/img/",
				emitFiles: !ssr,
				fileName: "[name].[hash][extname]",
			}),
			enforce: "pre",
		},
		production &&
			banner(
				"/*! Licenses of used libraries, fonts and other software can be found at /lib-licenses.txt */\n",
			),
	],
	define: {
		"process.env.NODE_ENV": JSON.stringify(env),
		"process.env.BUILD_MODE": JSON.stringify(process.env.BUILD_MODE || "spa"),
	},
	css: {
		modules: {
			generateScopedName: production
				? "s[hash:base64:5]"
				: "[name]__[local]__[hash:base64:5]",
		},
		postcss: {
			plugins: [
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				cssDeclarationSorter({ keepOverrides: true }) as any,
				autoprefixer(),
			],
		},
	},
	build: {
		target: "modules",
		manifest: true,
		assetsInlineLimit: 0,
	},
});
