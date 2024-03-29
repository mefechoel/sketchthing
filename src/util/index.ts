import type p5 from "p5";
import { useState } from "preact/hooks";
import { dropOut, extractEdgePoints, sortByDistance2d } from "./points";
import type { Point } from "./types";

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
	// if (log) {
	// 	// eslint-disable-next-line no-console
	// 	console.log(label, "start");
	// }
	const stamps = [];
	const start = performance.now();
	for (let i = 0; i < iterations; i++) {
		const startInner = performance.now();
		fn();
		stamps.push(performance.now() - startInner);
	}
	if (log) {
		const median = stamps.sort((a, b) => a - b)[Math.floor(stamps.length / 2)];
		// eslint-disable-next-line no-console
		console.log(label, "took ", performance.now() - start, "ms. MED:", median);
	}
}

export function downloadString(
	text: string,
	fileType: string,
	fileName: string,
) {
	const blob = new Blob([text], { type: fileType });
	const a = document.createElement("a");
	a.download = fileName;
	a.href = URL.createObjectURL(blob);
	a.dataset.downloadurl = [fileType, a.download, a.href].join(":");
	a.style.display = "none";
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	setTimeout(function () {
		URL.revokeObjectURL(a.href);
	}, 1500);
}

export function matchToSize(
	list: Point[],
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
): Point[] {
	const widthScale = targetWidth / sourceWidth;
	const heightScale = targetHeight / sourceHeight;
	return list.map(({ x, y }) => ({
		x: x * widthScale,
		y: y * heightScale,
	}));
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
