import { useRef, useLayoutEffect } from "preact/hooks";
import type p5 from "p5";
import Sketch from "react-p5";
import type { SliderName } from "../../../inputs";
import type { ExtendProps } from "../../../util/types";
import type { SliderProps } from "../../Slider";
import visuals from "./visuals";
import style from "./ControlSlider.module.scss";
import cx from "../../../cx";
import useSlider from "../../Slider/useSlider";

type ControlSliderProps = ExtendProps<{ name: SliderName }, SliderProps>;

function ControlSlider(props: ControlSliderProps) {
	const {
		min = 0,
		max = 1,
		step = 0.1,
		value = min,
		onChange,
		name,
		className,
		...restProps
	} = props;
	const sliderRef = useRef<HTMLDivElement | null>();

	const { position, getProps } = useSlider<HTMLDivElement>({
		getThumbWidth: () => sliderRef.current?.getBoundingClientRect().height || 0,
		min,
		max,
		step,
		value,
		name,
		onChange,
		sliderRef,
	});

	const p5Ref = useRef<p5 | null>(null);

	useLayoutEffect(() => {
		p5Ref.current?.redraw();
	}, [props.value]);

	return (
		<div {...restProps} className={cx(style.slider, className)} {...getProps()}>
			<Sketch
				className={style.slider}
				setup={(p, canvasParentRef) => {
					const { width = 0, height = 0 } =
						sliderRef.current?.getBoundingClientRect() || {};
					p.createCanvas(width, height).parent(canvasParentRef);
					p.background(0);
					p.noLoop();
					p5Ref.current = p;
				}}
				draw={(p) => {
					const { width = 0, height = 0 } =
						sliderRef.current?.getBoundingClientRect() || {};
					if (p.width !== width || p.height !== height) {
						p.resizeCanvas(width, height);
					}
					// const { max, min } = inputs[props.name];
					// const position = ((props.value as number) - min) / (max - min);
					visuals[props.name]?.draw(p, position);
				}}
			/>
		</div>
	);
}

export default ControlSlider;
