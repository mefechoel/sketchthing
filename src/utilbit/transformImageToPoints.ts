import type p5 from "p5";
import { matchToSize } from ".";
import {
	dropOut,
	dropOutRandom,
	extractEdgePoints,
	sortByDistance2d,
} from "./points";
import { sort } from "../../pkg";
import type { BitPoint, ListLike, TransformConfig } from "./types";
import type { Ref } from "preact/hooks";

let sortMode: "ts" | "wasm" = "wasm";
let showFrameRate = false;

interface IOSizes {
	sourceWidth: number;
	sourceHeight: number;
	targetWidth: number;
	targetHeight: number;
}

/**
 * Scale the image, such that it covers the whole of the target size
 */
export function fitDimensions(sizes: IOSizes) {
	const { sourceWidth, sourceHeight, targetWidth, targetHeight } = sizes;
	const imgAspect = sourceWidth / sourceHeight;
	const screenAspect = targetWidth / targetHeight;
	const isImgWider = imgAspect > screenAspect;
	const maxDim = isImgWider ? sourceWidth : sourceHeight;
	const maxSize = isImgWider ? targetWidth : targetHeight;
	const scale = maxSize / maxDim;
	const desiredWidth = Math.round(sourceWidth * scale);
	const desiredHeight = Math.round(sourceHeight * scale);
	return { width: desiredWidth, height: desiredHeight };
}

function avg(nums: number[]) {
	return nums.slice().sort((a, b) => a - b)[Math.floor(nums.length / 2)];
}

function createTransformImageToPoints(
	p: p5,
	randomSource?: () => number,
	frameRateDisplayRef?: Ref<HTMLDivElement>,
) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(window as any).toggleFrameRate = () => {
		if (!frameRateDisplayRef?.current) return;
		if (showFrameRate) {
			frameRateDisplayRef.current.style.display = "none";
			showFrameRate = false;
		} else {
			frameRateDisplayRef.current.style.display = "grid";
			showFrameRate = true;
		}
	};

	function dropOutP5Random<T>(l: T[], percentage: number) {
		return dropOutRandom(l, percentage, randomSource);
	}

	const frameRateL = 16;
	const frameRates: number[] = new Array(frameRateL).fill(0);
	let frameI = 0;

	return function transformImageToPoints(config: TransformConfig) {
		const {
			edgeDetectionBitDepth,
			dropOutPercentage,
			randomDropout,
			sourceWidth,
			sourceHeight,
			targetWidth,
			targetHeight,
			getPixelValue,
		} = config;

		if (frameRateDisplayRef?.current && showFrameRate) {
			frameRates[frameI++ % frameRateL] = p.frameRate();
			frameRateDisplayRef.current.innerText = "" + Math.round(avg(frameRates));
		}

		const dropOutFn = randomDropout ? dropOutP5Random : dropOut;

		const edgePoints = extractEdgePoints(
			getPixelValue,
			sourceWidth,
			sourceHeight,
			edgeDetectionBitDepth,
		);
		const points = dropOutFn(edgePoints, dropOutPercentage);

		let sorted: ListLike<BitPoint>;
		if (sortMode === "wasm") {
			const u32 = Uint32Array.from(points);
			sorted = sort(u32, targetWidth, targetHeight, 2);
		} else {
			sorted = sortByDistance2d(points, targetWidth, targetHeight);
		}
		return matchToSize(sorted, {
			sourceWidth,
			sourceHeight,
			targetWidth,
			targetHeight,
		});
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).sortMode = {
	wasm() {
		sortMode = "wasm";
	},
	ts() {
		sortMode = "ts";
	},
};

export default createTransformImageToPoints;
