export interface Point {
	x: number;
	y: number;
}

export type ExtendProps<ComponentProps, ExtendedProps> = ComponentProps &
	Omit<ExtendedProps, keyof ComponentProps>;
