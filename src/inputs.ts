export enum InputType {
	Slider,
	Select,
}
export interface BaseState {
	label: string;
	type: InputType;
}
export interface SliderState extends BaseState {
	min: number;
	max: number;
	step: number;
	type: InputType.Slider;
	value: number;
}
export interface SelectState extends BaseState {
	options: string[];
	type: InputType.Select;
	value: string;
}
export type InputState<Type extends InputType> = Type extends InputType.Slider
	? SliderState
	: Type extends InputType.Select
	? SelectState
	: never;

export const inputs = {
	edgeDetectionWidth: {
		label: "Input resolution",
		min: 20,
		max: 500,
		value: 150,
		step: 10,
		type: InputType.Slider,
	},
	edgeDetectionBitDepth: {
		label: "Edge strength",
		min: 1,
		max: 7,
		value: 2,
		step: 1,
		type: InputType.Slider,
	},
	maxDist: {
		label: "Max line length",
		min: 0,
		max: 600,
		value: 80,
		step: 5,
		type: InputType.Slider,
	},
	dropOutPercentage: {
		label: "Output resolution",
		min: 0.001,
		max: 1,
		value: 0.6,
		step: 0.01,
		type: InputType.Slider,
	},
	bgAlpha: {
		label: "Background opacity",
		min: 0,
		max: 255,
		value: 255,
		step: 5,
		type: InputType.Slider,
	},
	colAlpha: {
		label: "Line opacity",
		min: 0,
		max: 255,
		value: 255,
		step: 5,
		type: InputType.Slider,
	},
	strokeWeight: {
		label: "Line weight",
		min: 0,
		max: 20,
		value: 1,
		step: 0.5,
		type: InputType.Slider,
	},
	drawingMode: {
		label: "Drawing mode",
		options: ["points", "curve", "pipes", "lines"],
		value: "pipes",
		type: InputType.Select,
	},
	dropoutMode: {
		label: "Output resolution reduction",
		options: ["sequential", "random"],
		value: "sequential",
		type: InputType.Select,
	},
	colorMode: {
		label: "Color mode",
		options: ["black and white", "white and black"],
		value: "black and white",
		type: InputType.Select,
	},
};

export type State = typeof inputs;
export type InputName = keyof State;
export type InputItem<Type extends InputType> = InputState<Type> & {
	name: InputName;
};
export type InputList<Type extends InputType> = InputItem<Type>[];

export const inputList = Object.entries(inputs).map(([name, slider]) => ({
	name,
	...slider,
})) as InputList<InputType>;

export interface ColorMode {
	bg: number;
	stroke: number;
}
const colorModes: Record<string, ColorMode> = {
	"black and white": { bg: 0, stroke: 255 },
	"white and black": { bg: 255, stroke: 0 },
};
const defaultColorMode: ColorMode = { bg: 0, stroke: 255 };

export function getStateValues(state: State) {
	return {
		edgeDetectionWidth: state.edgeDetectionWidth.value,
		edgeDetectionBitDepth: state.edgeDetectionBitDepth.value,
		maxDist: state.maxDist.value,
		dropOutPercentage: state.dropOutPercentage.value,
		bgAlpha: state.bgAlpha.value,
		colAlpha: state.colAlpha.value,
		strokeWeight: state.strokeWeight.value,
		drawingFnName: state.drawingMode.value,
		randomDropout: state.dropoutMode.value === "random",
		colors: colorModes[state.colorMode.value] || defaultColorMode,
	};
}
