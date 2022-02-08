import type { JSX, ComponentChild } from "preact";
import type { Ref } from "preact/hooks";
import { useRef } from "preact/hooks";
import cx from "../../cx";
import type { ExtendProps } from "../../util/types";
import style from "./Slider.module.scss";
import type { UseSliderOptions } from "./useSlider";
import useSlider from "./useSlider";

export type SliderOwnProps = Omit<UseSliderOptions, "getThumbWidth"> & {
	className?: string;
	trackClassName?: string;
	thumbClassName?: string;
	track?: ComponentChild;
	thumb?: ComponentChild;
	style?: JSX.CSSProperties;
};

export type SliderProps = ExtendProps<
	SliderOwnProps,
	JSX.HTMLAttributes<HTMLDivElement>
>;

function Slider(props: SliderProps): JSX.Element {
	const {
		min = 0,
		max = 1,
		step = 0.1,
		value = min,
		onChange,
		name,
		className,
		trackClassName,
		thumbClassName,
		track = null,
		thumb = null,
		...restProps
	} = props;
	const trackRef = useRef<HTMLDivElement | null>();
	const thumbRef = useRef<HTMLDivElement | null>();

	const { position, getProps } = useSlider<HTMLDivElement>({
		getThumbWidth: () => thumbRef.current?.getBoundingClientRect().width || 0,
		min,
		max,
		step,
		value,
		name,
		onChange,
	});

	return (
		<div
			{...restProps}
			className={cx(style.slider, className)}
			style={{ ...restProps.style, "--position": position }}
			{...getProps()}
		>
			<div
				ref={trackRef as Ref<HTMLDivElement>}
				className={cx(style.track, trackClassName)}
			>
				{track}
			</div>
			<div
				ref={thumbRef as Ref<HTMLDivElement>}
				className={cx(style.thumb, thumbClassName)}
			>
				{thumb}
			</div>
		</div>
	);
}

export default Slider;
