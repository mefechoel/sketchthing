import type p5 from "p5";
import { Fragment } from "preact";
import type { JSX } from "preact";
import type { Ref, MutableRef } from "preact/hooks";
import { useEffect, useState } from "preact/hooks";
import type { InputName, SelectName, SliderName, State } from "../../inputs";
import {
	createStateHash,
	inputList,
	initialState,
	InputType,
} from "../../inputs";
import ControlSlider from "./ControlSlider";
import ControlSelect from "./ControlSelect";
import style from "./ControlPanel.module.scss";
import cx from "../../cx";

function ControlPanel({
	p5Ref,
	isLoopingRef,
	stateRef,
}: {
	p5Ref: Ref<p5 | null>;
	isLoopingRef: MutableRef<boolean>;
	stateRef: MutableRef<State>;
}): JSX.Element {
	const [state, setState] = useState(initialState);
	useEffect(() => {
		stateRef.current = state;
	}, [state, stateRef]);

	const [isOpen, setIsOpen] = useState(window.innerWidth > 1000);
	const [isLooping, setIsLooping] = useState(isLoopingRef.current);

	useEffect(() => {
		if (!isLoopingRef.current) {
			p5Ref.current?.redraw();
		}
	}, [isLoopingRef, p5Ref, state]);

	const handleLoop = () => {
		isLoopingRef.current = !isLoopingRef.current;
		setIsLooping((prev) => !prev);
		if (isLoopingRef.current) {
			p5Ref.current?.loop();
		} else {
			p5Ref.current?.noLoop();
		}
	};

	const handleChange = (event: {
		value: number | string;
		name?: InputName;
	}) => {
		const { name, value } = event;
		if (!name) return;
		setState((prevState) => ({ ...prevState, [name]: value }));
	};

	const handleToggle = () => {
		setIsOpen((prev) => !prev);
	};

	const handleSave = () => {
		const hash = createStateHash(state);
		p5Ref.current?.saveCanvas(`sketch__${hash}.png`);
	};

	return (
		<div>
			<div className={style.buttonGroup}>
				<button className={style.button} onClick={handleLoop}>
					<span className={style.buttonLabel}>loop</span>
					{isLooping ? (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							strokeWidth="2"
							stroke="currentColor"
							fill="none"
						>
							<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
							<rect x="6" y="5" width="4" height="14" rx="1"></rect>
							<rect x="14" y="5" width="4" height="14" rx="1"></rect>
						</svg>
					) : (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							strokeWidth="2"
							stroke="currentColor"
							fill="none"
						>
							<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
							<path d="M7 4v16l13 -8z"></path>
						</svg>
					)}
				</button>
				<button className={style.button} onClick={handleToggle}>
					<span className={style.buttonLabel}>settings</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						strokeWidth="2"
						stroke="currentColor"
						fill="none"
					>
						<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
						<circle cx="14" cy="6" r="2"></circle>
						<line x1="4" y1="6" x2="12" y2="6"></line>
						<line x1="16" y1="6" x2="20" y2="6"></line>
						<circle cx="8" cy="12" r="2"></circle>
						<line x1="4" y1="12" x2="6" y2="12"></line>
						<line x1="10" y1="12" x2="20" y2="12"></line>
						<circle cx="17" cy="18" r="2"></circle>
						<line x1="4" y1="18" x2="15" y2="18"></line>
						<line x1="19" y1="18" x2="20" y2="18"></line>
					</svg>
				</button>
				<button className={style.button} onClick={handleSave}>
					<span className={style.buttonLabel}>save</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						strokeWidth="2"
						stroke="currentColor"
						fill="none"
					>
						<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
						<path d="M6 4h10l4 4v10a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2"></path>
						<circle cx="12" cy="14" r="2"></circle>
						<polyline points="14 4 14 8 8 8 8 4"></polyline>
					</svg>
				</button>
			</div>
			<div className={cx(style.panel, isOpen && style.isOpen)}>
				{inputList
					.filter((item) => !item.hide)
					.map((item) => {
						const { label, name, type } = item;
						if (type === InputType.Slider) {
							const { max, min, step } = item;
							return (
								<Fragment key={name}>
									<br />
									<label id={name}>
										<div className={style.labelText}>{label}</div>
										<ControlSlider
											name={name as SliderName}
											aria-labelledby={name}
											max={max}
											min={min}
											step={step}
											value={state[name] as number}
											onChange={handleChange}
										/>
									</label>
								</Fragment>
							);
						}
						const { options } = item;
						return (
							<Fragment key={name}>
								<br />
								<ControlSelect
									label={label}
									name={name as SelectName}
									options={options}
									value={state[name] as string}
									onChange={handleChange}
								/>
							</Fragment>
						);
					})}
			</div>
		</div>
	);
}

export default ControlPanel;
