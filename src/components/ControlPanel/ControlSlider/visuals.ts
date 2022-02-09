import type p5 from "p5";
import type { InputDefinitions } from "../../../inputs";
import { createDrawingFunctions } from "../../../util/drawFns";
import type { Point } from "../../../util/types";

function getTranslationX(p: p5, position: number) {
	const trackWidth = p.width;
	const thumbSize = p.height;
	return (trackWidth - thumbSize) * position;
}
function translateToPosition(p: p5, position: number) {
	const x = getTranslationX(p, position);
	p.translate(x, 0);
}
function translateToPositionCentered(p: p5, position: number) {
	const halfThumbSize = p.height * 0.5;
	const x = getTranslationX(p, position) + halfThumbSize;
	p.translate(x, halfThumbSize);
}

interface VisualSketch {
	draw: (p: p5, position: number) => void;
}

type Visuals = {
	[K in keyof InputDefinitions]: VisualSketch;
};

const col: [number, number, number] = [20, 60, 240];

const visuals: Partial<Visuals> = {
	edgeDetectionWidth: {
		draw: (p, position) => {
			translateToPositionCentered(p, position);
			p.rotate(p.PI / 4);
			p.background(...col);

			const minSteps = 4;
			const maxSteps = 9;
			const steps = minSteps + Math.round((maxSteps - minSteps) * position);
			const strokeWeight = 2;
			const r = (p.height - strokeWeight) / 2;
			const points: Point[] = [];
			for (let i = 0; i <= steps; i++) {
				const angle = (i / steps) * p.TWO_PI;
				const x = Math.sin(angle) * r;
				const y = Math.cos(angle) * r;
				points.push({ x, y });
			}
			const d = createDrawingFunctions(p, 100);
			p.stroke(255);
			p.strokeWeight(strokeWeight);
			d.drawLines(points);
		},
	},
	dropOutPercentage: {
		draw: (p, position) => {
			translateToPosition(p, position);

			p.background(...col);
			p.stroke(255);
			const strokeWeight = 2;
			p.strokeWeight(strokeWeight);

			const minLines = 1;
			const maxLines = p.height / strokeWeight / 2;
			const lines = minLines + Math.round((maxLines - minLines) * position);
			for (let i = 0; i < lines; i++) {
				const lineI = i + minLines;
				const segmentPercentage = lineI / (lines + 1);
				const offset = p.height * segmentPercentage;
				const x0 = offset;
				const y0 = 0;
				const x1 = offset;
				const y1 = p.height;
				const x2 = 0;
				const y2 = offset;
				const x3 = p.height;
				const y3 = offset;
				p.line(x0, y0, x1, y1);
				p.line(x2, y2, x3, y3);
			}
		},
	},
	bgAlpha: {
		draw: (p, position) => {
			translateToPositionCentered(p, position);

			p.background(...col, Math.max(20, 255 * position ** 2.5));
			p.stroke(255);
			const strokeWeight = 2;
			p.strokeWeight(strokeWeight);
			p.noFill();

			p.circle(0, 0, p.height - strokeWeight);
		},
	},
	colAlpha: {
		draw: (p, position) => {
			translateToPositionCentered(p, position);

			p.background(...col);
			p.stroke(255, Math.max(40, 255 * position));
			const strokeWeight = 2;
			p.strokeWeight(strokeWeight);
			p.noFill();

			p.circle(0, 0, p.height - strokeWeight);
		},
	},
	strokeWeight: {
		draw: (p, position) => {
			translateToPositionCentered(p, position);
			p.background(...col);

			const minWeight = 1;
			const maxWeight = p.height / 2;
			const strokeWeight =
				minWeight + Math.round((maxWeight - minWeight) * position);
			p.noFill();
			p.stroke(255);
			p.strokeWeight(strokeWeight);
			p.circle(0, 0, p.height - strokeWeight);
		},
	},
	edgeDetectionBitDepth: {
		draw: (p, position) => {
			translateToPosition(p, position);

			p.background(...col);
			p.stroke(255);
			p.noStroke();

			const minSegments = 2;
			const maxSegments = 8;
			const segments =
				minSegments + Math.round((maxSegments - minSegments) * position);
			const size = p.height / segments;
			for (let y = 0; y < segments; y++) {
				const segmentYPercentage = y / segments;
				const offsetY = p.height * segmentYPercentage;
				for (let x = 0; x < segments; x++) {
					const segmentXPercentage = x / segments;
					const offsetX = p.height * segmentXPercentage;
					const diagonal = ((x + y) % segments) + 1;
					const d = Math.abs(diagonal - segments * 0.5);
					const r = d / (segments * 0.5);
					const alpha = r * 255;
					p.fill(255, alpha);
					p.rect(offsetX, offsetY, size, size);
				}
			}
		},
	},
	maxDist: {
		draw: (p, position) => {
			translateToPositionCentered(p, position);

			p.background(...col);
			p.stroke(255);
			const strokeWeight = 2;
			p.strokeWeight(strokeWeight);
			p.noFill();

			p.circle(0, 0, p.height - strokeWeight);
		},
	},
};

export default visuals;
