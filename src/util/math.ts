export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

export function round(n: number, precision = 2): number {
	return Math.round(n * 10 ** precision) / 10 ** precision;
}

export function normalizeRangePosition(
	value: number,
	min: number,
	max: number,
): number {
	return (value - min) / (max - min);
}
