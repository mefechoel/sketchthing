import "./index.scss";
import type p5 from "p5";
import type { JSX } from "preact";
import { useRef } from "preact/hooks";
import Sketch from "react-p5";
import cx from "./cx";
import { createDrawingFunctions } from "./utilbit/drawFns";
import { getStateValues, initialState } from "./inputs";
import ControlPanel from "./components/ControlPanel";
import createTransformImageToPointsBit, {
	fitDimensions,
} from "./utilbit/transformImageToPoints";
import style from "./App.module.scss";

function App(): JSX.Element {
	const captureRef = useRef<p5.Element | null>(null);
	const isLoopingRef = useRef(true);
	const frameRateDisplayRef = useRef<HTMLDivElement>(null);
	const imgRef = useRef<p5.Image | null>(null);
	const p5Ref = useRef<p5 | null>(null);
	const transformBitRef =
		useRef<ReturnType<typeof createTransformImageToPointsBit>>();
	const stateRef = useRef(initialState);
	const seed = 72;

	const setup = (p: p5, canvasParentRef: Element) => {
		p5Ref.current = p;
		p.createCanvas(window.innerWidth, window.innerHeight).parent(
			canvasParentRef,
		);
		p.randomSeed(seed);
		transformBitRef.current = createTransformImageToPointsBit(
			p,
			() => p.random(1),
			frameRateDisplayRef,
		);
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
		const dimensions = fitDimensions({
			sourceWidth: img.width,
			sourceHeight: img.height,
			targetWidth: window.innerWidth,
			targetHeight: window.innerHeight,
		});
		if (p.width !== dimensions.width || p.height !== dimensions.height) {
			p.resizeCanvas(dimensions.width, dimensions.height);
		}

		if (!randomDropout) {
			p.randomSeed(seed);
		}

		const drawingFnsBit = createDrawingFunctions(p, maxDist);
		const drawingFnBit = {
			points: drawingFnsBit.drawPoints,
			curve: drawingFnsBit.drawCurve,
			pipes: drawingFnsBit.drawPipes,
			lines: drawingFnsBit.drawLines,
		}[drawingFnName];

		img.resize(edgeDetectionWidth, 0);
		img.loadPixels();

		const { width: imgWidth, pixels: imgPixels } = img;
		const bitpoints = transformBitRef.current?.({
			edgeDetectionBitDepth,
			dropOutPercentage,
			randomDropout,
			getPixelValue: (x, y) => {
				const i = (x + y * imgWidth) * 4;
				return (imgPixels[i] + imgPixels[i + 1] + imgPixels[i + 2]) / 3;
			},
			sourceWidth: img.width,
			sourceHeight: img.height,
			targetWidth: p.width,
			targetHeight: p.height,
		});

		p.background(colors.bg, bgAlpha);
		p.stroke(colors.stroke, colAlpha);
		p.strokeWeight(strokeWeight);

		drawingFnBit?.(bitpoints || []);
	};

	const handleResize = () => {
		if (!isLoopingRef.current) {
			p5Ref.current?.redraw();
		}
	};

	return (
		<main className={cx(style.pageWrapper)}>
			<div ref={frameRateDisplayRef} className={style.frameRate}></div>
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
