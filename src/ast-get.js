import { tokenize, parse } from 'selery';

/*
	Returns the AST of a selector
	-----------------------------
 */

const delim = (tok, ch) => tok && tok.type === 'delim' && tok.value === ch;
const ident = tok => tok && tok.type === 'ident';

export default function getAST(selector) {
	let tokens = tokenize(selector);
	const next = () => tokens.shift();
	const peek = ch => tokens[ch || 0];

	const qsx_tokens = [];

	let tok;
	while ((tok = next())) {
		// DOM property selector
		if (delim(tok, '@') && delim(peek(), '.') && ident(peek(1))) {
			next(); // consume .
			tok = next(); // consume ident
			qsx_tokens.push(
				{
					type: 'colon'
				},
				{
					type: 'function',
					value: 'qsx-extract'
				},
				{
					type: 'ident',
					value: '.' + tok.value
				},
				{
					type: ')'
				}
			);
			continue;
		}

		// HTML attribute selector
		if (tok.type === 'at-keyword') {
			qsx_tokens.push(
				{
					type: 'colon'
				},
				{
					type: 'function',
					value: '-qsx-extract'
				},
				{
					type: 'ident',
					value: tok.value
				},
				{
					type: ')'
				}
			);
			continue;
		}

		// spread operator
		if (
			delim(tok, '.') &&
			delim(peek(), '.') &&
			delim(peek(1), '.') &&
			peek(2) &&
			peek(2).type === '{'
		) {
			next(); // consume 2nd dot
			next(); // consume 3rd dot
			qsx_tokens.push(
				{
					type: 'colon'
				},
				{
					type: 'function',
					value: '-qsx-spread'
				}
			);
			// TODO how to push closing ) ??
			continue;
		}

		if (tok.type === '{') {
			qsx_tokens.push(
				{
					type: 'colon'
				},
				{
					type: 'function',
					value: '-qsx-select'
				}
			);
			continue;
		}

		if (tok.type === '}') {
			qsx_tokens.push({ type: ')' });
			continue;
		}

		// alias combinator: current (=>) & legacy (>>)
		if ((delim(tok, '=') || delim(tok, '>')) && delim(peek(), '>')) {
			next(); // consume >
			qsx_tokens.push({
				type: 'delim',
				value: '⇒'
			});
			// TODO handle '.' alias here
			continue;
		}

		// TODO ^ (first)

		qsx_tokens.push(tok);
	}

	let ast = parse(qsx_tokens, {
		syntaxes: {
			':-qsx-select': 'SelectorList'
		}
	});
	return ast.selectors.length === 1
		? ast.selectors[0]
		: ast.selectors.length
		? ast.selectors
		: undefined;
}
