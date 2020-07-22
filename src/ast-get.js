import SymbolTree from 'symbol-tree';
import { TOKENS, TOKENS_REGEX, STATE_INITIAL } from './constants';

/*
	Returns the AST of a selector
	-----------------------------
 */
export default function getAST(selector) {
	const tree = new SymbolTree();
	const node = (anon_route = false) => {
		let res = { ctx: '' };
		if (anon_route) {
			res.first = true;
		}
		return res;
	};
	let $root = node();
	let $curr = $root;

	const tokens = selector
		.replace(/\:is\(/g, ':matches(')
		.split(TOKENS_REGEX)
		.filter(v => v);

	let token;
	let fn_depth = 0;
	let ctx_depth = 0;
	let state = STATE_INITIAL;

	const assertInitialState = () => {
		if (state !== STATE_INITIAL) {
			throw new Error(`Unexpected ${token} after ${state}`);
		}
	};

	while ((token = tokens.shift())) {
		switch (token) {
			case TOKENS.FUNC_START:
				assertInitialState();
				fn_depth++;
				$curr.ctx += token;
				break;
			case TOKENS.FUNC_END:
				assertInitialState();
				if (fn_depth <= 0) {
					throw new Error(`Unexpected ${TOKENS.FUNC_END}`);
				}
				fn_depth--;
				$curr.ctx += token;
				break;
			case TOKENS.GROUP_START:
				assertInitialState();
				ctx_depth++;
				$curr = tree.appendChild($curr, node());
				break;
			case TOKENS.GROUP_END:
				assertInitialState();
				if (ctx_depth <= 0) {
					throw new Error(`Unexpected ${TOKENS.GROUP_END}`);
				}
				ctx_depth--;
				$curr = tree.parent($curr);
				break;
			case TOKENS.SEP:
				assertInitialState();
				if (!fn_depth) {
					if ($curr === $root) {
						$root = node(true);
						tree.appendChild($root, $curr);
					}
					$curr = tree.insertAfter($curr, node());
				} else {
					$curr.ctx += token;
				}
				break;
			case TOKENS.ATTR:
				assertInitialState();
				state = TOKENS.ATTR;
				break;
			case TOKENS.FIRST:
				assertInitialState();
				$curr.first = true;
				break;
			case TOKENS.ALIAS:
				assertInitialState();
				state = TOKENS.ALIAS;
				break;
			default:
				switch (state) {
					case TOKENS.ATTR:
						$curr.attr = token.trim();
						if (!$curr.ctx) {
							$curr.alias = $curr.attr;
						}
						state = STATE_INITIAL;
						break;
					case TOKENS.ALIAS:
						$curr.alias = token.trim();
						state = STATE_INITIAL;
						break;
					default:
						$curr.ctx += token;
				}
		}
	}

	// Some syntax errors
	if (state === TOKENS.ATTR) {
		throw new Error(`Missing <attr> after ${TOKENS.ATTR}`);
	}
	if (state === TOKENS.ALIAS) {
		throw new Error(`Missing <alias> after ${TOKENS.ALIAS}`);
	}
	if (fn_depth) {
		throw new Error(`Missing ${TOKENS.FUNC_END}`);
	}
	if (ctx_depth) {
		throw new Error(`Missing ${TOKENS.GROUP_END}`);
	}

	if (!$root.ctx) {
		$root.ctx = ':root';
	}

	return [$root, tree];
}
