import { Circle, QuadTree, Rectangle } from "./QuadTree";
import type { BitPoint } from "./types";

const POINT_BITDEPTH = 15;
const MAX_POINT_VALUE = (1 << POINT_BITDEPTH) - 1;
const POINT_OFFSET = Math.floor(MAX_POINT_VALUE / 2);
const X_BITMASK = 0 | (MAX_POINT_VALUE << POINT_BITDEPTH);
const Y_BITMASK = 0 | MAX_POINT_VALUE;

export function getX(point: BitPoint): number {
	const val = (point & X_BITMASK) >> POINT_BITDEPTH;
	return val - POINT_OFFSET;
}
export function getY(point: BitPoint): number {
	const val = point & Y_BITMASK;
	return val - POINT_OFFSET;
}
// This is gonna go horribly wrong if a points coordinate is
// bigger than 2 ** 15 (~32k), as it will overflow the 15bit
// number we're using for one coordinate component
export function setX(point: BitPoint, x: number): number {
	const xVal = x + POINT_OFFSET;
	return point | ((xVal << POINT_BITDEPTH) & X_BITMASK);
}
export function setY(point: BitPoint, y: number): number {
	const yVal = y + POINT_OFFSET;
	return point | (yVal & Y_BITMASK);
}
export function createBitPoint(x: number, y: number): BitPoint {
	return setY(setX(0, x), y);
}

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
): BitPoint[] {
	const adjustBitDepth = createBitDepthAdjuster(bitDepth);
	let prevColors: number[] = [];
	let currentColors: number[] = [];
	const edgePoints: BitPoint[] = [];
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
					edgePoints.push(createBitPoint(x, y));
				}
			}
		}
		const tmp = prevColors;
		prevColors = currentColors;
		currentColors = tmp;
	}
	return edgePoints;
}

export function sqDist(a: BitPoint, b: BitPoint): number {
	const ax = getX(a);
	const ay = getY(a);
	const bx = getX(b);
	const by = getY(b);
	const dx = bx - ax;
	const dy = by - ay;
	return dx * dx + dy * dy;
}
export function dist(a: BitPoint, b: BitPoint): number {
	return Math.sqrt(sqDist(a, b));
}

export function sortByDistance2d(
	points: BitPoint[],
	w: number,
	h: number,
	initialSearchRadius = 2,
	minSize = 4,
	capacity = 16,
): BitPoint[] {
	if (points.length <= 2) return points.map((x) => x);
	const qt = new QuadTree(new Rectangle(w / 2, h / 2, w, h), capacity);
	points.forEach((p) => qt.insert(p));
	const sorted: BitPoint[] = [];
	let point = points[0];
	const searchRange = new Circle(getX(point), getY(point), initialSearchRadius);

	while (sorted.length < points.length) {
		qt.remove(point);
		let closest: BitPoint = point;
		let searchRadius = initialSearchRadius;
		let r: BitPoint[] = [];
		if (qt.size < minSize) {
			r = [...qt];
		} else {
			searchRange.x = getX(point);
			searchRange.y = getY(point);
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
