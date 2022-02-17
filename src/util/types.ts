export interface Point {
	x: number;
	y: number;
}

export type ExtendProps<ComponentProps, ExtendedProps> = ComponentProps &
	Omit<ExtendedProps, keyof ComponentProps>;

export interface TransformConfig {
	edgeDetectionBitDepth: number;
	dropOutPercentage: number;
	randomDropout: boolean;
	sourceWidth: number;
	sourceHeight: number;
	targetWidth: number;
	targetHeight: number;
	getPixelValue: (x: number, y: number) => number;
}
