import type p5 from "p5";
import { getX, getY, sqDist } from "./points";
import type { BitPoint } from "./types";

export function createDrawingFunctions(p: p5, maxDistance: number) {
	const sqMaxDistance = maxDistance * maxDistance;

	const drawPoints = (list: BitPoint[]) => {
		const l = list.length;
		for (let i = 0; i < l; i++) {
			const p0 = list[i];
			p.point(getX(p0), getY(p0));
		}
	};

	const drawCurve = (list: BitPoint[]) => {
		p.noFill();
		p.beginShape();
		const l = list.length;
		for (let i = 0; i < l; i++) {
			const p0 = list[i];
			p.curveVertex(getX(p0), getY(p0));
			if (i !== l - 1 && sqDist(p0, list[i + 1]) >= sqMaxDistance) {
				p.endShape();
				p.beginShape();
			}
		}
		p.endShape();
	};

	const drawPipes = (list: BitPoint[]) => {
		p.noFill();
		p.beginShape();
		const l = list.length;
		for (let i = 0; i < l - 1; i++) {
			const p0 = list[i];
			const p1 = list[i + 1];
			p.vertex(getX(p0), getY(p0));
			if (sqDist(p0, p1) >= sqMaxDistance) {
				p.endShape();
				p.beginShape();
			} else {
				if (p.random(1) < 0.5) {
					p.vertex(getX(p0), getY(p1));
				} else {
					p.vertex(getX(p1), getY(p0));
				}
			}
		}
		p.endShape();
	};

	const drawLines = (list: BitPoint[]) => {
		p.noFill();
		p.beginShape();
		const l = list.length;
		for (let i = 0; i < l; i++) {
			const p0 = list[i];
			p.vertex(getX(p0), getY(p0));
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
