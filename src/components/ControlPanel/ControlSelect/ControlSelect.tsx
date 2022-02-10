import type { JSX } from "preact";
import { Fragment } from "preact";
import { useCallback } from "preact/hooks";
import { useEffect, useRef } from "react";
import cx from "../../../cx";
import type { SelectName } from "../../../inputs";
import { useId } from "../../../util";
import { useSyncedRef } from "../../../util/hooks";
import { clamp, normalizeRangePosition } from "../../../util/math";
import ControlSketch from "../ControlSketch/ControlSketch";
import visuals from "./visuals";
import style from "./ControlSelect.module.scss";

interface ControlSelectProps<Name extends SelectName = SelectName> {
	name: Name;
	options: string[];
	value: string;
	label: string;
	onChange?: (event: { value: string; name?: Name }) => void;
}

function ControlSelect<Name extends SelectName = SelectName>(
	props: ControlSelectProps<Name>,
): JSX.Element {
	const { name, options, value, label, onChange } = props;
	// This is a bit hacky, but react-p5 does not support passing
	// ids to the wrapping div
	const idClass = useId("control-select");
	const selectRef = useRef<HTMLFieldSetElement | null>(null);
	const nameRef = useSyncedRef(name);
	const onChangeRef = useSyncedRef(onChange);
	const valueRef = useSyncedRef(value);
	const optionsRef = useSyncedRef(options);

	const handleChange = useCallback(
		(nextValue: string) => {
			if (nextValue === valueRef.current) return;
			onChangeRef.current?.({ value: nextValue, name: nameRef.current });
		},
		[nameRef, onChangeRef, valueRef],
	);

	const handleClick = (target: HTMLElement, clientX: number) => {
		const { left, right } = target.getBoundingClientRect();
		const position = normalizeRangePosition(clientX, left, right);
		const nextIndex = clamp(
			Math.floor(options.length * position),
			0,
			options.length - 1,
		);
		const nextValue = options[nextIndex];
		handleChange(nextValue);
	};
	const handleMouseClick: JSX.MouseEventHandler<HTMLFieldSetElement> = (e) => {
		handleClick(e.target as HTMLElement, e.clientX);
	};

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				!selectRef.current?.contains(e.target as Node) &&
				!(e.target as HTMLElement)?.classList.contains(idClass)
			) {
				return;
			}
			const currentIndex = optionsRef.current.indexOf(valueRef.current);
			const length = optionsRef.current.length;
			const indexMap: { [k: string]: number } = {
				ArrowLeft: (currentIndex + length - 1) % length,
				ArrowRight: (currentIndex + 1) % length,
				Home: 0,
				End: length - 1,
			};
			if (e.key in indexMap) {
				handleChange(optionsRef.current[indexMap[e.key]]);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [handleChange, idClass, optionsRef, valueRef]);

	return (
		<fieldset
			ref={selectRef}
			className={style.select}
			onClick={handleMouseClick}
			tabIndex={0}
		>
			<legend className={style.legend}>{label}</legend>
			<ControlSketch
				className={cx(style.sketch, idClass)}
				value={value}
				draw={(p) => {
					visuals[props.name]?.draw(p, value);
				}}
			/>
			{options.map((opt) => (
				<Fragment key={opt}>
					<label className={style.label} htmlFor={`crtlslct__${name}--${opt}`}>
						<input
							tabIndex={-1}
							className={style.radio}
							type="radio"
							name={name}
							value={opt}
							id={`crtlslct__${name}--${opt}`}
							checked={opt === value}
							onChange={() => handleChange(opt)}
						/>
						<span className={style.labelText}>{opt}</span>
					</label>
				</Fragment>
			))}
		</fieldset>
	);
}

export default ControlSelect;
