const TOKENS = {
	GROUP_START: '{',
	GROUP_END: '}',
	SEP: ',',
	FUNC_START: '(',
	FUNC_END: ')',
	ATTR: '@',
	FIRST: '^',
	ALIAS: '>>'
};

const TOKENS_REGEX = new RegExp(
	`\\s*(${Object.values(TOKENS)
		.map(v => `\\${v}`)
		.join('|')})\\s*`,
	'g'
);

const STATE_INITIAL = null;

module.exports = {
	TOKENS,
	TOKENS_REGEX,
	STATE_INITIAL
};
