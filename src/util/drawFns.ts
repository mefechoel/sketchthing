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

	return {
		drawPoints,
		drawCurve,
		drawPipes,
		drawLines,
	};
}
