if (!Object.fromEntries) {
	const fromEntries = (entries: [string, unknown][]) => {
		const obj: { [key: string]: unknown } = {};
		entries.forEach((entry) => {
			obj[entry[0]] = entry[1];
		});
		return obj;
	};
	Object.fromEntries = fromEntries;
}

export {};
