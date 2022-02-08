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

export type SliderName =
	| "edgeDetectionWidth"
	| "edgeDetectionBitDepth"
	| "maxDist"
	| "dropOutPercentage"
	| "bgAlpha"
	| "colAlpha"
	| "strokeWeight";
export type SelectName = "drawingMode" | "dropoutMode" | "colorMode";
export type InputName = SliderName | SelectName;
export type InputDefinitions = {
	[K in InputName]: K extends SliderName
		? InputState<InputType.Slider>
		: K extends SelectName
		? InputState<InputType.Select>
		: never;
};

export const inputs: InputDefinitions = {
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

export type State = {
	[K in InputName]: K extends SliderName
		? number
		: K extends SelectName
		? string
		: never;
};

export const initialState = Object.fromEntries(
	Object.entries(inputs).map(([key, def]) => [key, def.value]),
) as State;

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
		edgeDetectionWidth: state.edgeDetectionWidth,
		edgeDetectionBitDepth: state.edgeDetectionBitDepth,
		maxDist: state.maxDist,
		dropOutPercentage: state.dropOutPercentage,
		bgAlpha: state.bgAlpha,
		colAlpha: state.colAlpha,
		strokeWeight: state.strokeWeight,
		drawingFnName: state.drawingMode,
		randomDropout: state.dropoutMode === "random",
		colors: colorModes[state.colorMode] || defaultColorMode,
	};
}

export function createStateHash(state: State) {
	const {
		edgeDetectionWidth: w,
		edgeDetectionBitDepth: bd,
		maxDist: d,
		dropOutPercentage: pc,
		bgAlpha: ba,
		colAlpha: ca,
		strokeWeight: s,
		drawingFnName: fn,
		randomDropout: r,
	} = getStateValues(state);
	const hash = [
		w,
		bd,
		d,
		pc.toString().replace(".", ""),
		ba,
		ca,
		s,
		Number(r),
		fn,
	].join("-");
	return hash;
}
