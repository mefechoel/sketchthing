import type p5 from "react-p5/node_modules/@types/p5";
import type { InputDefinitions } from "../../../inputs";
import { createDrawingFunctions } from "../../../util/drawFns";
import type { Point } from "../../../util/types";

interface VisualSketch {
	draw: (p: p5, state: number) => void;
}

type Visuals = {
	[K in keyof InputDefinitions]: {
		thumb?: VisualSketch;
		track?: VisualSketch;
	};
};

const visuals: Partial<Visuals> = {
	edgeDetectionWidth: {
		thumb: {
			draw: (p, state) => {
				const minSteps = 4;
				const maxSteps = 9;

				p.translate(p.width / 2, p.height / 2);
				p.rotate(p.PI / 4);
				p.background(0);

				const steps = minSteps + Math.round((maxSteps - minSteps) * state);
				const r = p.width / 2;
				const points: Point[] = [];
				for (let i = 0; i <= steps; i++) {
					const angle = (i / steps) * p.TWO_PI;
					const x = Math.sin(angle) * r;
					const y = Math.cos(angle) * r;
					points.push({ x, y });
				}
				const d = createDrawingFunctions(p, 100);
				p.stroke(255);
				p.strokeWeight(2);
				p.fill(0);
				d.drawLines(points);
			},
		},
	},
	dropOutPercentage: {
		thumb: {
			draw: (p, state) => {
				const minLines = 2;
				const maxLines = 16;

				p.translate(p.width / 2, p.height / 2);
				p.rotate(p.PI / 4);
				p.background(0);
				p.stroke(255);
				p.strokeWeight(2);
				p.noFill();

				const r = p.width / 2;
				const lines = minLines + Math.round((maxLines - minLines) * state);
				for (let i = 0; i <= lines; i++) {
					const x0 = p.sin(p.random(0, p.TWO_PI)) * r;
					const y0 = p.cos(p.random(0, p.TWO_PI)) * r;
					const x1 = p.sin(p.random(0, p.TWO_PI)) * r;
					const y1 = p.cos(p.random(0, p.TWO_PI)) * r;
					p.line(x0, y0, x1, y1);
				}
			},
		},
	},
};

export default visuals;
