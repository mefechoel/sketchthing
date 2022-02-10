import type p5 from "p5";
import type { SelectName } from "../../../inputs";
import { inputs } from "../../../inputs";
import { createDrawingFunctions } from "../../../util/drawFns";
import { dropOut, dropOutRandom } from "../../../util/points";
import type { Point } from "../../../util/types";
import { highlightColor, themeColor } from "../visuals/helpers";
import type {
	ExtractStateType,
	Visuals,
	VisualSketchFn,
} from "../visuals/types";

function createDrawFn<Name extends SelectName>(
	name: Name,
	draw: (p: p5, w: number, h: number, option: string, i: number) => void,
): VisualSketchFn<ExtractStateType<Name>> {
	return (p, selected) => {
		const { options } = inputs[name];
		p.background(...themeColor);
		const partitionWidth = p.width / options.length;
		const halfHeight = p.height / 2;
		options.forEach((opt, i) => {
			p.push();
			p.translate(i * partitionWidth + partitionWidth / 2, halfHeight);
			if (opt === selected) {
				p.fill(...highlightColor);
				p.noStroke();
				p.rect(-partitionWidth / 2, -halfHeight, partitionWidth, p.height);
			}
			draw(p, partitionWidth, p.height, opt, i);
			p.pop();
		});
	};
}

const drawingModePoints = [
	{ x: -0.7, y: -0.55 },
	{ x: 0.7, y: -0.55 },
	{ x: 0, y: 0.55 },
	{ x: -0.7, y: -0.55 },
];

const visuals: Partial<Visuals<SelectName>> = {
	drawingMode: {
		draw: createDrawFn("drawingMode", (p, _w, h, opt) => {
			const halfHeight = h / 2;
			const sized = drawingModePoints.map(({ x, y }) => ({
				x: Math.round(x * halfHeight),
				y: Math.round(y * halfHeight),
			}));
			const drawingFns = createDrawingFunctions(p, 100);
			const drawingFnMap = {
				points: drawingFns.drawPoints,
				curve: drawingFns.drawCurve,
				pipes: drawingFns.drawPipes,
				lines: drawingFns.drawLines,
			} as const;
			const drawFn = drawingFnMap[opt as keyof typeof drawingFnMap];
			p.noFill();
			p.stroke(255);
			p.strokeWeight(2);
			// I like the shape with seed=2 best
			p.randomSeed(2);
			drawFn(sized);
		}),
	},
	dropoutMode: {
		draw: createDrawFn("dropoutMode", (p, w, h, opt) => {
			const dropOutPercentage = 0.6;
			const strokeWeight = 2;
			const points: Point[] = [];
			const step = strokeWeight * 2;
			for (let y = 0; y < h; y += step) {
				for (let x = 0; x < w; x += step) {
					points.push({ x, y });
				}
			}

			p.push();
			p.translate(-w / 2 + step / 2, -h / 2 + step / 2);

			const drawingFns = createDrawingFunctions(p, 100);
			p.noFill();
			p.stroke(255);
			p.strokeWeight(strokeWeight);
			const dropOutFn = opt === "random" ? dropOutRandom : dropOut;
			drawingFns.drawPoints(dropOutFn(points, dropOutPercentage));

			p.pop();
		}),
	},
};

export default visuals;
