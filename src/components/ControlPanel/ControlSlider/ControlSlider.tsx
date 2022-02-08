import { useRef, useLayoutEffect } from "preact/hooks";
import type p5 from "react-p5/node_modules/@types/p5";
import Sketch from "react-p5";
import type { SliderName } from "../../../inputs";
import { inputs } from "../../../inputs";
import type { ExtendProps } from "../../../util/types";
import type { SliderProps } from "../../Slider";
import Slider from "../../Slider";
import visuals from "./visuals";
import style from "./ControlSlider.module.scss";
import cx from "../../../cx";

type ControlSliderProps = ExtendProps<{ name: SliderName }, SliderProps>;

function ControlSlider(props: ControlSliderProps) {
	const thumbP5Ref = useRef<p5 | null>(null);
	const trackP5Ref = useRef<p5 | null>(null);

	useLayoutEffect(() => {
		trackP5Ref.current?.redraw();
		thumbP5Ref.current?.redraw();
	}, [props.value]);

	return (
		<Slider
			{...props}
			trackClassName={cx(style.track, props.trackClassName)}
			thumbClassName={cx(style.thumb, props.thumbClassName)}
			// track={
			// 	<Sketch
			// 		setup={(p, canvasParentRef) => {
			// 			p.createCanvas(18, 18).parent(canvasParentRef);
			// 			p.background(255);
			// 			p.noLoop();
			// 			trackP5Ref.current = p;
			// 		}}
			// 		draw={(p) => {
			// 			const { max, min } = inputs[props.name];
			// 			const position = ((props.value as number) - min) / (max - min);
			// 			visuals[props.name]?.track?.draw(p, position);
			// 		}}
			// 	/>
			// }
			thumb={
				<Sketch
					setup={(p, canvasParentRef) => {
						p.createCanvas(18, 18).parent(canvasParentRef);
						p.background(255);
						p.noLoop();
						thumbP5Ref.current = p;
					}}
					draw={(p) => {
						const { max, min } = inputs[props.name];
						const position = ((props.value as number) - min) / (max - min);
						visuals[props.name]?.thumb?.draw(p, position);
					}}
				/>
			}
		/>
	);
}

export default ControlSlider;
