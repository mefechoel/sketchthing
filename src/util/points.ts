import { Circle, QuadTree, Rectangle } from "./QuadTree";
import type { Point } from "./types";

const COLOR_BIT_DEPTH = 8;

export function adjustBitDepth(value: number, bitDepth: number) {
	const loss = 2 ** (COLOR_BIT_DEPTH - bitDepth);
	return Math.floor(value / loss) * loss;
}
export function createBitDepthAdjuster(bitDepth: number) {
	const loss = 2 ** (COLOR_BIT_DEPTH - bitDepth);
	return (value: number) => {
		return Math.floor(value / loss) * loss;
	};
}

export function extractEdgePoints(
	getPixelValue: (x: number, y: number) => number,
	width: number,
	height: number,
	bitDepth = 3,
): Point[] {
	const adjustBitDepth = createBitDepthAdjuster(bitDepth);
	let prevColors: number[] = [];
	let currentColors: number[] = [];
	const edgePoints: Point[] = [];
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const grayscale = getPixelValue(x, y);
			const squashedGrayscale = adjustBitDepth(grayscale);
			currentColors[x] = squashedGrayscale;
			if (x !== 0 && y !== 0) {
				const g0 = squashedGrayscale;
				const gt = prevColors[x];
				const gl = currentColors[x - 1];
				const gtl = prevColors[x - 1];
				if (g0 !== gt || g0 !== gl || g0 !== gtl) {
					edgePoints.push({ x, y });
				}
			}
		}
		const tmp = prevColors;
		prevColors = currentColors;
		currentColors = tmp;
	}
	return edgePoints;
}

export function sqDist(a: Point, b: Point): number {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	return dx * dx + dy * dy;
}
export function dist(a: Point, b: Point): number {
	return Math.sqrt(sqDist(a, b));
}

export function sortByDistance2d(
	points: Point[],
	w: number,
	h: number,
	initialSearchRadius = 2,
	minSize = 4,
	capacity = 32,
): Point[] {
	if (points.length <= 2) return points.map((x) => x);
	const qt = new QuadTree(new Rectangle(w / 2, h / 2, w, h), capacity);
	points.forEach((p) => qt.insert(p));
	const sorted: Point[] = [];
	let point = points[0];
	const searchRange = new Circle(point.x, point.y, initialSearchRadius);

	while (sorted.length < points.length) {
		qt.remove(point);
		let closest: Point = point;
		let searchRadius = initialSearchRadius;
		let r: Point[] = [];
		if (qt.size < minSize) {
			r = [...qt];
		} else {
			searchRange.x = point.x;
			searchRange.y = point.y;
			do {
				searchRange.r = searchRadius;
				searchRange.rSquared = searchRadius * searchRadius;
				r = qt.query(searchRange, r);
				searchRadius *= 2;
			} while (!r.length);
		}
		let closestDist = Infinity;
		for (let i = 0; i < r.length; i++) {
			const element = r[i];
			const d = sqDist(point, element);
			if (d < closestDist) {
				closestDist = d;
				closest = element;
			}
		}
		sorted.push(point);
		point = closest;
	}

	return sorted;
}

export function dropOut<T>(list: T[], percentage: number): T[] {
	return list.filter(
		(item, i) =>
			Math.floor(i * percentage) !==
			Math.floor(Math.max(0, i + 1) * percentage),
	);
}

export function dropOutRandom<T>(
	list: T[],
	percentage: number,
	randomSource: () => number = Math.random,
): T[] {
	return list.filter(() => randomSource() <= percentage);
}
