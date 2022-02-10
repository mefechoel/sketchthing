import type { JSX } from "preact";
import { useLayoutEffect, useRef } from "preact/hooks";
import type p5 from "p5";
import Sketch from "react-p5";
import cx from "../../../cx";
import style from "./ControlSketch.module.scss";

function ControlSketch(props: {
	className?: string;
	value: unknown;
	draw?: (p: p5) => void;
}): JSX.Element {
	const p5Ref = useRef<p5 | null>(null);
	const wrapperRef = useRef<HTMLDivElement | null>(null);

	useLayoutEffect(() => {
		p5Ref.current?.redraw();
	}, [props.value]);

	return (
		<Sketch
			className={cx(style.sketch, props.className)}
			setup={(p, canvasParentRef) => {
				wrapperRef.current = canvasParentRef as HTMLDivElement;
				const { width = 0, height = 0 } =
					wrapperRef.current?.getBoundingClientRect() || {};
				p.createCanvas(width, height).parent(canvasParentRef);
				p.background(0);
				p.noLoop();
				p5Ref.current = p;
			}}
			draw={(p) => {
				const { width = 0, height = 0 } =
					wrapperRef.current?.getBoundingClientRect() || {};
				if (p.width !== width || p.height !== height) {
					p.resizeCanvas(width, height);
				}
				props.draw?.(p);
			}}
		/>
	);
}

export default ControlSketch;
