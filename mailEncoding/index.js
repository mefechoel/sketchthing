/* eslint-disable @typescript-eslint/no-var-requires */
const createEncoding = require("./encoding");

const warnDuplicateArg = (argName) =>
	// eslint-disable-next-line no-console
	console.error(
		`The "${argName}" argument was specified multiple times. The last one will be used.`,
	);

const warnMissingVal = (argName) =>
	// eslint-disable-next-line no-console
	console.error(
		`The value for "${argName}" was not spcified correctly. Please use "--key=value" or "-shorthand=value" notation.`,
	);

const argDefs = [
	{
		name: "key",
		long: "key",
		short: "k",
		isRequired: true,
	},
	{
		name: "input",
		long: "input",
		short: "i",
		isRequired: true,
	},
	{
		name: "decode",
		long: "decode",
		short: "d",
		isRequired: false,
	},
];

const args = process.argv.reduce((acc, arg) => {
	for (const { name, long, short } of argDefs) {
		if (arg.includes(`--${long}`) || arg.includes(`-${short}`)) {
			if (name in acc) {
				warnDuplicateArg(name);
				return acc;
			}
			const value = arg.split("=")[1];
			if (typeof value !== "string") {
				warnMissingVal(name);
				return acc;
			}
			return {
				...acc,
				[name]: value,
			};
		}
	}
	return acc;
}, {});

for (const { name, isRequired } of argDefs) {
	if (isRequired && !(name in args)) {
		// eslint-disable-next-line no-console
		console.error(`Please provide a value for "${name}"`);
	}
}

const { encode, decode } = createEncoding(args.key);

const fn = typeof args.decode === "string" ? decode : encode;

// eslint-disable-next-line no-console
console.log(fn(args.input));
