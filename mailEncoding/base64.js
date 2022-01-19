const btoa = (str) => Buffer.from(str).toString("base64");

const atob = (base64Str) => Buffer.from(base64Str, "base64").toString();

module.exports = { atob, btoa };
