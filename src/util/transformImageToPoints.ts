import { matchToSize } from ".";
import {
	dropOut,
	dropOutRandom,
	extractEdgePoints,
	sortByDistance2d,
} from "./points";
import type { TransformConfig } from "./types";

interface IOSizes {
	sourceWidth: number;
	sourceHeight: number;
	targetWidth: number;
	targetHeight: number;
}

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
		const sortedPoints = sortByDistance2d(points, targetWidth, targetHeight);
		const sorted = matchToSize(sortedPoints, {
			sourceWidth,
			sourceHeight,
			targetWidth,
			targetHeight,
		});

		return sorted;
	};
}

export default createTransformImageToPoints;
