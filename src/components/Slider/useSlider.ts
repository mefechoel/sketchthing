import type { Ref } from "preact/hooks";
import { useCallback, useEffect, useMemo, useRef } from "preact/hooks";
import type { JSX } from "preact";
import { useSyncedRef } from "../../util/hooks";
import { clamp, normalizeRangePosition, round } from "../../util/math";

export interface UseSliderOptions {
	getThumbWidth: () => number;
	min?: number;
	max?: number;
	step?: number;
	value?: number;
	name?: string;
	onChange?: (event: { value: number; name?: string }) => void;
}

function useSlider<ElementType extends HTMLElement = HTMLElement>(
	options: UseSliderOptions,
) {
	const {
		min = 0,
		max = 1,
		step = 0.1,
		value = min,
		onChange,
		name,
		getThumbWidth,
	} = options;
	const minRef = useSyncedRef(min);
	const maxRef = useSyncedRef(max);
	const stepRef = useSyncedRef(step);
	const valueRef = useSyncedRef(value);
	const onChangeRef = useSyncedRef(onChange);
	const nameRef = useSyncedRef(name);
	const getThumbWidthRef = useSyncedRef(getThumbWidth);
	const position = round(normalizeRangePosition(value, min, max), 4);
	const sliderRef = useRef<HTMLElement | null>();
	const isMousePressedRef = useRef(false);

	const handleChange = useCallback(
		(val: number) => {
			const clamped = clamp(val, minRef.current, maxRef.current);
			onChangeRef.current?.({ value: clamped, name: nameRef.current });
		},
		[maxRef, minRef, nameRef, onChangeRef],
	);

	const handleKeyDown: JSX.KeyboardEventHandler<ElementType> = useCallback(
		(e) => {
			const m: { [k: string]: number } = {
				ArrowLeft: valueRef.current - stepRef.current,
				ArrowRight: valueRef.current + stepRef.current,
				Home: minRef.current,
				End: maxRef.current,
			};
			if (e.key in m) {
				handleChange(m[e.key]);
			}
		},
		[handleChange, maxRef, minRef, stepRef, valueRef],
	);

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			const slider = sliderRef.current;
			if (!slider || !isMousePressedRef.current) return;
			const { left: xMin, right: xMax } = slider.getBoundingClientRect();
			const thumbWidth = getThumbWidthRef.current();
			const pxWidth = xMax - xMin - thumbWidth;
			const xOffset = e.clientX - xMin - thumbWidth / 2;
			const mousePosition = clamp(xOffset / pxWidth, 0, 1);
			const rangeWidth = maxRef.current - minRef.current;
			const maxNumSteps = rangeWidth / stepRef.current;
			const closestStep = Math.round(mousePosition * maxNumSteps);
			const nextValue = closestStep * stepRef.current + minRef.current;
			handleChange(nextValue);
		};

		const handleMouseDown = (e: MouseEvent) => {
			if (!sliderRef.current?.contains(e.target as Node | null)) return;
			isMousePressedRef.current = true;
			handleMouseMove(e);
		};

		const handleMouseUp = (e: MouseEvent) => {
			handleMouseMove(e);
			isMousePressedRef.current = false;
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mousedown", handleMouseDown);
		document.addEventListener("mouseup", handleMouseUp);
		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mousedown", handleMouseDown);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [getThumbWidthRef, handleChange, maxRef, minRef, stepRef]);

	const slider = useMemo(() => {
		const getProps = () => ({
			ref: sliderRef as Ref<ElementType>,
			tabIndex: 0,
			role: "slider",
			"aria-valuemin": min,
			"aria-valuemax": max,
			"aria-valuenow": round(value, 4),
			"data-step": step,
			"data-name": name,
			onKeyDown: handleKeyDown,
		});
		return {
			min,
			max,
			step,
			value,
			name,
			position,
			getProps,
		};
	}, [handleKeyDown, max, min, name, position, step, value]);

	return slider;
}

export default useSlider;
