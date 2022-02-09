import "./index.scss";
import type p5 from "p5";
import type { JSX } from "preact";
import { useRef } from "preact/hooks";
import Sketch from "react-p5";
import cx from "./cx";
import {
	dropOut,
	dropOutRandom,
	extractEdgePoints,
	sortByDistance2d,
} from "./util/points";
import { createDrawingFunctions } from "./util/drawFns";
import { matchToSize } from "./util";
import { getStateValues, initialState } from "./inputs";
import ControlPanel from "./components/ControlPanel";
import style from "./App.module.scss";

function App(): JSX.Element {
	const captureRef = useRef<p5.Element | null>(null);
	const isLoopingRef = useRef(true);
	const imgRef = useRef<p5.Image | null>(null);
	const p5Ref = useRef<p5 | null>(null);
	const stateRef = useRef(initialState);
	const seed = 72;

	const setup = (p: p5, canvasParentRef: Element) => {
		p5Ref.current = p;
		p.createCanvas(window.innerWidth, window.innerHeight).parent(
			canvasParentRef,
		);
		p.randomSeed(seed);
		p.background(0);
		// Init cam
		const cam = p.createCapture(p.VIDEO, () => {
			const { videoWidth, videoHeight } = cam.elt as HTMLVideoElement;
			const aspect = videoHeight / (videoWidth || 1);
			const camWidth = Math.min(videoWidth, 600);
			const camHeight = Math.round(camWidth * aspect);
			cam.size(camWidth, camHeight);
			captureRef.current = cam;
		});
		cam.hide();
	};

	const draw = (p: p5) => {
		// When cam is ready and we're looping, set the current camera input
		// as the input to the drawing algorithm
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const isCamReady = Boolean((captureRef.current as any)?.loadedmetadata);
		if (isCamReady && isLoopingRef.current) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			imgRef.current = (captureRef.current as any).get();
		}
		const img = imgRef.current;
		const {
			edgeDetectionWidth,
			edgeDetectionBitDepth,
			maxDist,
			dropOutPercentage,
			bgAlpha,
			colAlpha,
			strokeWeight,
			drawingFnName,
			randomDropout,
			colors,
		} = getStateValues(stateRef.current);

		if (!img) return;
		const imgAspect = img.width / img.height;
		const screenAspect = window.innerWidth / window.innerHeight;
		const isImgWider = imgAspect > screenAspect;
		const maxDim = isImgWider ? img.width : img.height;
		const maxSize = isImgWider ? window.innerWidth : window.innerHeight;
		const scale = maxSize / maxDim;
		const desiredWidth = Math.round(img.width * scale);
		const desiredHeight = Math.round(img.height * scale);
		if (p.width !== desiredWidth || p.height !== desiredHeight) {
			p.resizeCanvas(desiredWidth, desiredHeight);
		}

		if (!randomDropout) {
			p.randomSeed(seed);
		}
		function dropOutP5Random<T>(l: T[], percentage: number) {
			return dropOutRandom(l, percentage, () => p.random(1));
		}
		const dropOutFn = randomDropout ? dropOutP5Random : dropOut;
		const drawingFns = createDrawingFunctions(p, maxDist);
		const drawingFn = {
			points: drawingFns.drawPoints,
			curve: drawingFns.drawCurve,
			pipes: drawingFns.drawPipes,
			lines: drawingFns.drawLines,
		}[drawingFnName];

		img.resize(edgeDetectionWidth, 0);
		img.loadPixels();

		const { width: imgWidth, pixels: imgPixels } = img;
		const edgePoints = extractEdgePoints(
			(x, y) => {
				const i = (x + y * imgWidth) * 4;
				return (imgPixels[i] + imgPixels[i + 1] + imgPixels[i + 2]) / 3;
			},
			img.width,
			img.height,
			edgeDetectionBitDepth,
		);
		const points = dropOutFn(edgePoints, dropOutPercentage);
		const sortedPoints = sortByDistance2d(points, p.width, p.height);
		const sorted = matchToSize(sortedPoints, {
			sourceWidth: img.width,
			sourceHeight: img.height,
			targetWidth: p.width,
			targetHeight: p.height,
		});

		p.background(colors.bg, bgAlpha);
		p.stroke(colors.stroke, colAlpha);
		p.strokeWeight(strokeWeight);
		drawingFn?.(sorted);
	};

	const handleResize = () => {
		if (!isLoopingRef.current) {
			p5Ref.current?.redraw();
		}
	};

	return (
		<main className={cx(style.pageWrapper)}>
			<div>
				<Sketch
					className={style.canvasWrapper}
					setup={setup}
					draw={draw}
					windowResized={handleResize}
				/>
			</div>
			<ControlPanel
				isLoopingRef={isLoopingRef}
				p5Ref={p5Ref}
				stateRef={stateRef}
			/>
		</main>
	);
}

export default App;
