export const TOKENS = {
	GROUP_START: '{',
	GROUP_END: '}',
	SEP: ',',
	FUNC_START: '(',
	FUNC_END: ')',
	ATTR: '@',
	FIRST: '^',
	ALIAS: '=>',
	ALIAS_LEGACY: '>>',
	SPREAD: '...'
};

export const TOKENS_REGEX = new RegExp(
	`\\s*(${Object.values(TOKENS)
		.map(v =>
			v
				.split('')
				.map(ch => `\\${ch}`)
				.join('')
		)
		.join('|')})\\s*`,
	'g'
);

export const STATE_INITIAL = null;
