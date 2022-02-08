import type p5 from "react-p5/node_modules/@types/p5";
import { Fragment } from "preact";
import type { JSX } from "preact";
import type { Ref } from "preact/hooks";
import { useEffect, useState } from "preact/hooks";
import type { SelectName, SliderName, State } from "../../inputs";
import {
	createStateHash,
	inputList,
	initialState,
	InputType,
} from "../../inputs";
import ControlSlider from "./ControlSlider";
import style from "./ControlPanel.module.scss";

function ControlPanel({
	p5Ref,
	isLoopingRef,
	stateRef,
}: {
	p5Ref: Ref<p5 | null>;
	isLoopingRef: Ref<boolean>;
	stateRef: Ref<State>;
}): JSX.Element {
	const [state, setState] = useState(initialState);
	useEffect(() => {
		stateRef.current = state;
	}, [state, stateRef]);

	useEffect(() => {
		if (!isLoopingRef.current) {
			p5Ref.current?.redraw();
		}
	}, [isLoopingRef, p5Ref, state]);

	const handleLoop = () => {
		isLoopingRef.current = !isLoopingRef.current;
		if (isLoopingRef.current) {
			p5Ref.current?.loop();
		} else {
			p5Ref.current?.noLoop();
		}
	};

	const handleSliderChange = (event: { value: number; name?: string }) => {
		const { name, value } = event as {
			name: SliderName;
			value: number;
		};
		setState((prevState) => ({ ...prevState, [name]: value }));
	};
	const handleSelectChange: JSX.GenericEventHandler<HTMLSelectElement> = (
		e,
	) => {
		const { name, value } = e.target as EventTarget & {
			name: SelectName;
			value: string;
		};
		setState((prevState) => ({ ...prevState, [name]: value }));
	};

	const handleSave = () => {
		const hash = createStateHash(state);
		p5Ref.current?.saveCanvas(`sketch__${hash}.png`);
	};

	return (
		<div>
			<div className={style.buttonGroup}>
				<button onClick={handleLoop}>loop</button>
				<button onClick={handleSave}>save</button>
			</div>
			<div className={style.panel}>
				{inputList.map((item) => {
					const { label, name, type } = item;
					if (type === InputType.Slider) {
						const { max, min, step } = item;
						return (
							<Fragment key={name}>
								<br />
								<label id={name}>
									<div>{label}</div>
									<ControlSlider
										name={name as SliderName}
										aria-labelledby={name}
										max={max}
										min={min}
										step={step}
										value={state[name] as number}
										onChange={handleSliderChange}
									/>
								</label>
							</Fragment>
						);
					}
					const { options } = item;
					return (
						<Fragment key={name}>
							<br />
							<label htmlFor={name}>
								<div>{label}</div>
								<select
									name={name}
									id={name}
									value={state[name]}
									onChange={handleSelectChange}
								>
									{options.map((option) => (
										<option key={option}>{option}</option>
									))}
								</select>
							</label>
						</Fragment>
					);
				})}
			</div>
		</div>
	);
}

export default ControlPanel;
