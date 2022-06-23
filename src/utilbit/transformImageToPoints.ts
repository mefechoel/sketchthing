import { matchToSize } from ".";
import {
	dropOut,
	dropOutRandom,
	extractEdgePoints,
	sortByDistance2d,
} from "./points";
import { sort } from "../../pkg";
import type { BitPoint, ListLike, TransformConfig } from "./types";

let sortMode: "ts" | "wasm" = "ts";

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

function createTransformImageToPoints(randomSource?: () => number) {
	function dropOutP5Random<T>(l: T[], percentage: number) {
		return dropOutRandom(l, percentage, randomSource);
	}

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
			sorted = sort(u32, targetWidth, targetHeight, 2, 2);
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

(window as any).sortMode = {
	wasm() {
		sortMode = "wasm";
	},
	ts() {
		sortMode = "ts";
	},
};

export default createTransformImageToPoints;
