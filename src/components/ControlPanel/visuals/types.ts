import type p5 from "p5";
import type { InputName, SelectName, SliderName } from "../../../inputs";

export type VisualSketchFn<StateType> = (p: p5, position: StateType) => void;

export interface VisualSketch<StateType> {
	draw: VisualSketchFn<StateType>;
}

export type ExtractStateType<ControlType extends InputName> =
	ControlType extends SliderName
		? number
		: ControlType extends SelectName
		? string
		: never;

export type Visuals<ControlType extends InputName> = {
	[K in ControlType]: VisualSketch<ExtractStateType<ControlType>>;
};
