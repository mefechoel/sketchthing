import type p5 from "p5";
import { useState } from "preact/hooks";
import {
	createBitPoint,
	dropOut,
	extractEdgePoints,
	getX,
	getY,
	sortByDistance2d,
} from "./points";
import type { BitPoint, ListLike } from "./types";

let idCounter = 0;
export const createId = (label: string) => `${label}--${idCounter++}`;

export const resetIdCounter = () => {
	idCounter = 0;
};

export const useId = (label: string) => {
	const [id] = useState(() => createId(label));
	return id;
};

export const focus = (elem: HTMLElement) => {
	if (!elem) return;
	const tabIndex = "tabindex";
	if (!elem.hasAttribute(tabIndex)) {
		elem.setAttribute(tabIndex, "-1");
		const blurListener = () => {
			elem.removeAttribute(tabIndex);
			elem.removeEventListener("blur", blurListener);
		};
		elem.addEventListener("blur", blurListener);
	}
	elem.focus();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<Fn extends (...args: any[]) => any>(
	callback: Fn,
	limit: number,
): Fn {
	let waiting = false;
	const throttled = ((...args) => {
		if (!waiting) {
			callback(...args);
			waiting = true;
			setTimeout(function () {
				waiting = false;
			}, limit);
		}
	}) as Fn;
	return throttled;
}

export function bench(
	fn: () => void,
	{ label = "", log = true, iterations = 1 } = {},
) {
	if (log) {
		// eslint-disable-next-line no-console
		console.log(label, "start");
	}
	const start = performance.now();
	for (let i = 0; i < iterations; i++) {
		fn();
	}
	if (log) {
		// eslint-disable-next-line no-console
		console.log(label, "took ", performance.now() - start, "ms");
	}
}

export function matchToSize(
	list: ListLike<BitPoint>,
	{
		sourceWidth,
		sourceHeight,
		targetWidth,
		targetHeight,
	}: {
		sourceWidth: number;
		sourceHeight: number;
		targetWidth: number;
		targetHeight: number;
	},
): BitPoint[] {
	const widthScale = targetWidth / sourceWidth;
	const heightScale = targetHeight / sourceHeight;
	const out = new Array(list.length);
	for (let i = 0; i < list.length; i++) {
		const point = list[i];
		const x = getX(point);
		const y = getY(point);
		const nextX = Math.floor(x * widthScale);
		const nextY = Math.floor(y * heightScale);
		const matchedPoint = createBitPoint(nextX, nextY);
		out[i] = matchedPoint;
	}
	return out;
	// return list.map((point) => {
	// 	const x = getX(point);
	// 	const y = getY(point);
	// 	const nextX = Math.floor(x * widthScale);
	// 	const nextY = Math.floor(y * heightScale);
	// 	return createBitPoint(nextX, nextY);
	// });
}

export function createPointsFromColorChannel(
	img: p5.Image,
	channel: number,
	bitDepth: number,
	dropOutPercentage: number,
	targetWidth: number,
	targetHeight: number,
	dropOutFn: typeof dropOut = dropOut,
) {
	const channelPoints = extractEdgePoints(
		(x, y) => img.pixels[(x + y * img.width) * 4 + channel],
		img.width,
		img.height,
		bitDepth,
	);
	const sortedPoints = sortByDistance2d(
		dropOutFn(channelPoints, dropOutPercentage),
		targetWidth,
		targetHeight,
	);
	return matchToSize(sortedPoints, {
		sourceWidth: img.width,
		sourceHeight: img.height,
		targetWidth,
		targetHeight,
	});
}
