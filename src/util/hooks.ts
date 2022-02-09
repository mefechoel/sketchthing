import type { StateUpdater } from "preact/hooks";
import { useEffect, useRef, useState } from "preact/hooks";

export function useSyncedRef<T>(value: T): { current: T } {
	const ref = useRef(value);
	useEffect(() => {
		ref.current = value;
	}, [value]);
	return ref;
}

export function useSyncedState<T>(value: T): [T, StateUpdater<T>] {
	const [state, setState] = useState(value);
	useEffect(() => {
		setState(value);
	}, [value]);
	return [state, setState];
}
