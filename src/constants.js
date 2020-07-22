export const TOKENS = {
	GROUP_START: '{',
	GROUP_END: '}',
	SEP: ',',
	FUNC_START: '(',
	FUNC_END: ')',
	ATTR: '@',
	FIRST: '^',
	ALIAS: '>>'
};

export const TOKENS_REGEX = new RegExp(
	`\\s*(${Object.values(TOKENS)
		.map(v => `\\${v}`)
		.join('|')})\\s*`,
	'g'
);

export const STATE_INITIAL = null;
