import type p5 from "p5";
import { sqDist } from "./points";
import type { Point } from "./types";

export function createDrawingFunctions(p: p5, maxDistance: number) {
	const sqMaxDistance = maxDistance * maxDistance;

	const drawPoints = (list: Point[]) => {
		const l = list.length;
		for (let i = 0; i < l; i++) {
			const p0 = list[i];
			p.point(p0.x, p0.y);
		}
	};

	const drawCurve = (list: Point[]) => {
		p.noFill();
		p.beginShape();
		const l = list.length;
		for (let i = 0; i < l; i++) {
			const p0 = list[i];
			p.curveVertex(p0.x, p0.y);
			if (i !== l - 1 && sqDist(p0, list[i + 1]) >= sqMaxDistance) {
				p.endShape();
				p.beginShape();
			}
		}
		p.endShape();
	};

	const drawPipes = (list: Point[]) => {
		p.noFill();
		p.beginShape();
		const l = list.length;
		for (let i = 0; i < l - 1; i++) {
			const p0 = list[i];
			const p1 = list[i + 1];
			p.vertex(p0.x, p0.y);
			if (sqDist(p0, p1) >= sqMaxDistance) {
				p.endShape();
				p.beginShape();
			} else {
				if (p.random(1) < 0.5) {
					p.vertex(p0.x, p1.y);
				} else {
					p.vertex(p1.x, p0.y);
				}
			}
		}
		p.endShape();
	};

	const drawLines = (list: Point[]) => {
		p.noFill();
		p.beginShape();
		const l = list.length;
		for (let i = 0; i < l; i++) {
			const p0 = list[i];
			p.vertex(p0.x, p0.y);
			if (i !== l - 1 && sqDist(p0, list[i + 1]) >= sqMaxDistance) {
				p.endShape();
				p.beginShape();
			}
		}
		p.endShape();
	};

	const drawBezier = (list: p5.Vector[]) => {
		const l = list.length;
		for (let i = 0; i < l; i++) {
			const pm1 = list[(l + i - 1) % l].copy();
			const p0 = list[(l + i + 0) % l].copy();
			const p1 = list[(l + i + 1) % l].copy();
			const p2 = list[(l + i + 2) % l].copy();

			const a0 = pm1.copy().sub(p0).rotate(Math.PI).add(p0);
			const a1 = p1.copy().sub(p0).rotate(Math.PI).add(p0);
			const a = a0
				.copy()
				.add(a1)
				.div(2)
				.sub(p0)
				.rotate(-Math.PI / 2.0)
				.add(p0);
			const b = p0.copy();
			const c = p1.copy();
			const d0 = p0.copy().sub(p1).rotate(-Math.PI).add(p1);
			const d1 = p2.copy().sub(p1).rotate(-Math.PI).add(p1);
			const d = d0
				.copy()
				.add(d1)
				.div(2)
				.sub(c)
				.rotate(Math.PI / 2.0)
				.add(c);

			const steps = 50;
			for (let j = 0; j < steps; j++) {
				const t0 = j / steps;
				const t1 = (j + 1) / steps;
				const x0 = p.bezierPoint(b.x, a.x, d.x, c.x, t0);
				const y0 = p.bezierPoint(b.y, a.y, d.y, c.y, t0);
				const x1 = p.bezierPoint(b.x, a.x, d.x, c.x, t1);
				const y1 = p.bezierPoint(b.y, a.y, d.y, c.y, t1);
				p.line(x0, y0, x1, y1);
			}
		}
	};

	return {
		drawPoints,
		drawCurve,
		drawPipes,
		drawLines,
		drawBezier,
	};
}
