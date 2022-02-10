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

	const handleChange = (event: {
		value: number | string;
		name?: InputName;
	}) => {
		const { name, value } = event;
		if (!name) return;
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
