/* eslint-disable no-bitwise, @typescript-eslint/no-var-requires */
const { atob, btoa } = require("./base64");

const createEncoding = (key) => {
	const delim = "%";
	return {
		encode: (str) => {
			const codeList = [...str].map((char, i) => {
				const charCode = char.charCodeAt(0);
				const keyCode = key.charAt(i % key.length).charCodeAt(0);
				const cypherCode = charCode ^ keyCode;
				return cypherCode;
			});
			const codeListStr = codeList.join(delim);
			const code = btoa(codeListStr);
			return code;
		},
		decode: (encodedStr) => {
			const codeListStr = atob(encodedStr);
			const codeList = codeListStr.split(delim).map(Number);
			const charList = codeList.map((code, i) => {
				const keyCode = key.charAt(i % key.length).charCodeAt(0);
				const charCode = code ^ keyCode;
				return String.fromCharCode(charCode);
			});
			return charList.join("");
		},
	};
};

module.exports = createEncoding;
