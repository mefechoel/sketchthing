//
// Adapted from https://github.com/CodingTrain/QuadTree
// MIT LICENSE: https://github.com/CodingTrain/QuadTree/blob/main/LICENSE
//
import type { Point } from "./types";

export function pointSquareDistance(a: Point, b: Point): number {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	return dx * dx + dy * dy;
}
export function pointDistance(a: Point, b: Point): number {
	return Math.sqrt(pointSquareDistance(a, b));
}

export type Quadrant = "ne" | "nw" | "se" | "sw";

export interface Queryable {
	intersects(range: Rectangle): boolean;
	contains(point: Point): boolean;
}

export class Rectangle implements Queryable {
	x: number;
	y: number;
	w: number;
	h: number;
	left: number;
	right: number;
	top: number;
	bottom: number;

	constructor(x: number, y: number, w: number, h: number) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.left = x - w / 2;
		this.right = x + w / 2;
		this.top = y - h / 2;
		this.bottom = y + h / 2;
	}

	contains(point: Point) {
		return (
			this.left <= point.x &&
			point.x <= this.right &&
			this.top <= point.y &&
			point.y <= this.bottom
		);
	}

	intersects(range: Rectangle) {
		return !(
			this.right < range.left ||
			range.right < this.left ||
			this.bottom < range.top ||
			range.bottom < this.top
		);
	}

	subdivide(quadrant: Quadrant) {
		switch (quadrant) {
			case "ne":
				return new Rectangle(
					this.x + this.w / 4,
					this.y - this.h / 4,
					this.w / 2,
					this.h / 2,
				);
			case "nw":
				return new Rectangle(
					this.x - this.w / 4,
					this.y - this.h / 4,
					this.w / 2,
					this.h / 2,
				);
			case "se":
				return new Rectangle(
					this.x + this.w / 4,
					this.y + this.h / 4,
					this.w / 2,
					this.h / 2,
				);
			case "sw":
				return new Rectangle(
					this.x - this.w / 4,
					this.y + this.h / 4,
					this.w / 2,
					this.h / 2,
				);
		}
	}
}

// circle class for a circle shaped query
export class Circle implements Queryable {
	x: number;
	y: number;
	r: number;
	rSquared: number;

	constructor(x: number, y: number, r: number) {
		this.x = x;
		this.y = y;
		this.r = r;
		this.rSquared = this.r * this.r;
	}

	contains(point: Point) {
		// check if the point is in the circle by checking if the euclidean distance of
		// the point and the center of the circle if smaller or equal to the radius of
		// the circle
		const d = Math.pow(point.x - this.x, 2) + Math.pow(point.y - this.y, 2);
		return d <= this.rSquared;
	}

	intersects(range: Rectangle) {
		const xDist = Math.abs(range.x - this.x);
		const yDist = Math.abs(range.y - this.y);

		// radius of the circle
		const r = this.r;

		const w = range.w / 2;
		const h = range.h / 2;

		const edges = Math.pow(xDist - w, 2) + Math.pow(yDist - h, 2);

		// no intersection
		if (xDist > r + w || yDist > r + h) return false;

		// intersection within the circle
		if (xDist <= w || yDist <= h) return true;

		// intersection on the edge of the circle
		return edges <= this.rSquared;
	}
}

const DEFAULT_CAPACITY = 32;

export class QuadTree {
	size = 0;
	boundary: Rectangle;
	capacity: number;
	points: Point[];
	divided: boolean;
	northeast: QuadTree | null;
	northwest: QuadTree | null;
	southeast: QuadTree | null;
	southwest: QuadTree | null;

	constructor(boundary: Rectangle, capacity = DEFAULT_CAPACITY) {
		this.boundary = boundary;
		this.capacity = capacity;
		this.points = [];
		this.divided = false;
		this.northeast = null;
		this.northwest = null;
		this.southeast = null;
		this.southwest = null;
	}

	subdivide() {
		this.northeast = new QuadTree(this.boundary.subdivide("ne"), this.capacity);
		this.northwest = new QuadTree(this.boundary.subdivide("nw"), this.capacity);
		this.southeast = new QuadTree(this.boundary.subdivide("se"), this.capacity);
		this.southwest = new QuadTree(this.boundary.subdivide("sw"), this.capacity);

		this.divided = true;
	}

	insert(point: Point): boolean {
		if (!this.boundary.contains(point)) {
			return false;
		}

		if (this.points.length < this.capacity) {
			this.points.push(point);
			this.size++;
			return true;
		}

		if (!this.divided) {
			this.subdivide();
		}

		const wasInserted = !!(
			this.northeast?.insert(point) ||
			this.northwest?.insert(point) ||
			this.southeast?.insert(point) ||
			this.southwest?.insert(point)
		);
		this.size += wasInserted as unknown as number;
		return wasInserted;
	}

	remove(point: Point): boolean {
		if (!this.boundary.contains(point)) {
			return false;
		}

		const i = this.points.findIndex((p) => p.x === point.x && p.y === point.y);
		if (i !== -1) {
			this.points.splice(i, 1);
			this.size--;
			return true;
		}

		const wasRemoved = !!(
			this.northeast?.remove(point) ||
			this.northwest?.remove(point) ||
			this.southeast?.remove(point) ||
			this.southwest?.remove(point)
		);
		this.size -= wasRemoved as unknown as number;
		return wasRemoved;
	}

	query(range: Queryable, found: Point[] = []) {
		if (!range.intersects(this.boundary)) {
			return found;
		}

		for (const p of this.points) {
			if (range.contains(p)) {
				found.push(p);
			}
		}
		this.northwest?.query(range, found);
		this.northeast?.query(range, found);
		this.southwest?.query(range, found);
		this.southeast?.query(range, found);

		return found;
	}

	*[Symbol.iterator](): IterableIterator<Point> {
		yield* this.points[Symbol.iterator]();
		if (this.divided) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			yield* this.northeast![Symbol.iterator]();
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			yield* this.northwest![Symbol.iterator]();
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			yield* this.southeast![Symbol.iterator]();
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			yield* this.southwest![Symbol.iterator]();
		}
	}
}
