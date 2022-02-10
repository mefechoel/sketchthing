import type p5 from "p5";

export function getTranslationX(p: p5, position: number) {
	const trackWidth = p.width;
	const thumbSize = p.height;
	return (trackWidth - thumbSize) * position;
}

export function translateToPosition(p: p5, position: number) {
	const x = getTranslationX(p, position);
	p.translate(x, 0);
}

export function translateToPositionCentered(p: p5, position: number) {
	const halfHeight = p.height * 0.5;
	const x = getTranslationX(p, position) + halfHeight;
	p.translate(x, halfHeight);
}

export const themeColor: [number, number, number] = [20, 90, 200];
export const highlightColor: [number, number, number] = [160, 30, 100];
