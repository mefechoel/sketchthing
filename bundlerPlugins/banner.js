/** @type {(banner: string) => import('rollup').Plugin} */
export default function banner(banner) {
	return {
		name: "banner",
		generateBundle(options, bundle) {
			/** @type {[string, import('rollup').OutputAsset | import('rollup').OutputChunk][]} */
			const entries = Object.entries(bundle);
			entries.forEach(([, entry]) => {
				if (entry.type === "asset" && entry.fileName.endsWith(".css")) {
					entry.source = banner + entry.source;
				}
				if (entry.type === "chunk") {
					entry.code = banner + entry.code;
				}
			});
		},
	};
}
