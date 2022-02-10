import { useRef } from "preact/hooks";
import type { SliderName } from "../../../inputs";
import type { ExtendProps } from "../../../util/types";
import type { SliderProps } from "../../Slider";
import visuals from "./visuals";
import cx from "../../../cx";
import useSlider from "../../Slider/useSlider";
import ControlSketch from "../ControlSketch/ControlSketch";
import style from "./ControlSlider.module.scss";

type ControlSliderProps<Name extends SliderName = SliderName> = ExtendProps<
	{ name: Name; onChange?: (event: { value: number; name?: Name }) => void },
	SliderProps
>;

function ControlSlider<Name extends SliderName = SliderName>(
	props: ControlSliderProps<Name>,
) {
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
		onChange: onChange as (event: { value: number; name?: string }) => void,
		sliderRef,
	});

	return (
		<div {...restProps} className={cx(style.slider, className)} {...getProps()}>
			<ControlSketch
				className={style.slider}
				value={props.value}
				draw={(p) => {
					visuals[props.name]?.draw(p, position);
				}}
			/>
		</div>
	);
}

export default ControlSlider;
