import fs from "fs";
import path from "path";
import util from "util";
import cp from "child_process";
import { getUnicodeRange } from "./fontSetup/unicode.mjs";

const exec = util.promisify(cp.exec);
const readFile = util.promisify(fs.readFile);
const readdir = util.promisify(fs.readdir);
const rename = util.promisify(fs.rename);

const defaultConfig = {
	desubroutinize: false,
	recalcBounds: false,
	hinting: true,
	layoutScripts: ["*"],
};

async function main() {
	const config = {
		...defaultConfig,
		...JSON.parse(
			await readFile(path.join(path.resolve(), "./subset.json"), "utf8"),
		),
	};

	const BASE_PATH = "./";
	const inDir = path.join(BASE_PATH, config.inDir);
	const outDir = path.join(BASE_PATH, config.outDir);

	function createCommand(file) {
		const inFile = path.join(inDir, file);
		const unicodeRange = getUnicodeRange(config.charSet);
		const features = config.fontFeatures.join(",");
		const scripts = config.layoutScripts.join(",");
		const outFileParts = file.split(".");
		outFileParts.pop();
		const outFileName = `${outFileParts.join(".")}.subset.ttf`;
		const outFile = path.join(outDir, outFileName);
		const flags = [
			"--flavor=woff2",
			`--unicodes=${unicodeRange}`,
			config.desubroutinize ? "--desubroutinize" : "--no-desubroutinize",
			config.recalcBounds ? "--recalc-bounds" : "--no-recalc-bounds",
			config.hinting ? "--hinting" : "--no-hinting",
			`--layout-features=${features}`,
			`--layout-scripts=${scripts}`,
			`--output-file=${outFile}`,
		];
		return `pyftsubset ${inFile} ${flags.join(" ")}`;
	}

	const dir = await readdir(inDir);
	let i = 0;
	const promises = dir.filter(Boolean).map(async (file, _i, files) => {
		const fileParts = file.split(".");
		const ext = fileParts.pop().toLowerCase();
		const baseName = fileParts.join(".");
		const woff2Name = `${baseName}.subset.woff2`;
		const ttfName = `${baseName}.subset.ttf`;

		if (!["ttf", "woff", "woff2"].includes(ext)) {
			throw new Error(
				`Only ttf, woff and woff2 fonts are supported. Got "${ext}" (${file}).`,
			);
		}

		const command = createCommand(file);
		await exec(command);

		const ttfFile = path.join(outDir, ttfName);
		const outFile = path.join(outDir, woff2Name);
		await rename(ttfFile, outFile);

		// eslint-disable-next-line no-console
		console.log(`Subsetting file ${++i} of ${files.length} complete`);
	});

	return (
		Promise.all(promises)
			// eslint-disable-next-line no-console
			.then(() => console.log("Done!"))
			// eslint-disable-next-line no-console
			.catch((err) => console.error(err))
	);
}

main();
