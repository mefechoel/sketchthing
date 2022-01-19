// const inChars =
// 	"ÄÖÜäöüẞß€«»‹›‘’ʼ“”„‚÷←→↖↗↘↙↑↓↩↪✓✗~!@#$%^&*()_+{}|:\"<>?`-=[]\\;',./ ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
// const inChars =
// 	"ÄÖÜäöüẞß€‘’ʼ“”←~!@#$%^&*()_+{}|:\"<>?`-=[]\\;',./ ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function getUnicodeRange(chars) {
	const rawCharCodes = [...chars].map((char) => char.charCodeAt(0));
	const uniqueCharCodes = [...new Set(rawCharCodes)];
	const charCodes = uniqueCharCodes.sort((a, b) => a - b);

	const ranges = [];

	for (const charCode of charCodes) {
		const currentRange = ranges[ranges.length - 1];
		if (currentRange && charCode - currentRange[1] === 1) {
			currentRange[1] = charCode;
		} else {
			ranges.push([charCode, charCode]);
		}
	}

	const unicodeRanges = ranges
		.map(([start, end]) => [
			start.toString(16).toUpperCase(),
			end.toString(16).toUpperCase(),
		])
		.map(([start, end]) => {
			if (start === end) {
				return `U+${start}`;
			}
			return `U+${start}-${end}`;
		})
		.join(",");

	return unicodeRanges;
}
