import type p5 from "p5";
import type { JSX } from "preact";
import { Fragment } from "preact";
import type { Ref } from "preact/hooks";
import { useEffect, useState } from "preact/hooks";
import type { InputName, State } from "./inputs";
import { inputList, inputs, InputType } from "./inputs";

function ControlPanel({
	p5Ref,
	isLoopingRef,
	stateRef,
}: {
	p5Ref: Ref<p5 | null>;
	isLoopingRef: Ref<boolean>;
	stateRef: Ref<State>;
}): JSX.Element {
	const [state, setState] = useState(inputs);
	useEffect(() => {
		stateRef.current = state;
	}, [state, stateRef]);

	const handleLoop = () => {
		isLoopingRef.current = !isLoopingRef.current;
		if (isLoopingRef.current) {
			p5Ref.current?.loop();
		} else {
			p5Ref.current?.noLoop();
		}
	};

	const handleSliderChange: JSX.GenericEventHandler<HTMLInputElement> = (e) => {
		const { name, value } = e.target as EventTarget & {
			name: InputName;
			value: string;
		};
		setState((prevState) => ({
			...prevState,
			[name]: { ...prevState[name], value: Number(value) },
		}));
	};
	const handleSelectChange: JSX.GenericEventHandler<HTMLSelectElement> = (
		e,
	) => {
		const { name, value } = e.target as EventTarget & {
			name: InputName;
			value: string;
		};
		setState((prevState) => ({
			...prevState,
			[name]: { ...prevState[name], value },
		}));
	};

	return (
		<div>
			<button onClick={handleLoop}>loop</button>
			{inputList.map((item) => {
				const { label, name, type } = item;
				if (type === InputType.Slider) {
					const { max, min, step } = item;
					return (
						<Fragment key={name}>
							<br />
							<label htmlFor={name}>
								<div>{label}</div>
								<input
									type="range"
									name={name}
									id={name}
									max={max}
									min={min}
									step={step}
									value={state[name].value as number}
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
								value={state[name].value}
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
	);
}

export default ControlPanel;
