const SymbolTree = require('symbol-tree');
const { TOKENS, TOKENS_REGEX } = require('./constants.js');

/*
	Returns the AST of a selector
	-----------------------------
 */
function getAST(selector) {
	const tree = new SymbolTree();
	const node = (_anonymous_root = false) => {
		let res = { ctx: '' };
		if (_anonymous_root) {
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
	while ((token = tokens.shift())) {
		switch (token) {
			case TOKENS.FUNC_START:
				fn_depth++;
				$curr.ctx += token;
				break;
			case TOKENS.FUNC_END:
				if (fn_depth <= 0) {
					throw new Error(`Unexpected ${TOKENS.FUNC_END}`);
				}
				fn_depth--;
				$curr.ctx += token;
				break;
			case TOKENS.GROUP_START:
				ctx_depth++;
				$curr = tree.appendChild($curr, node());
				break;
			case TOKENS.GROUP_END:
				if (ctx_depth <= 0) {
					throw new Error(`Unexpected ${TOKENS.GROUP_END}`);
				}
				ctx_depth--;
				$curr = tree.parent($curr);
				break;
			case TOKENS.SEP:
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
				let attr = (token = tokens.shift());
				if (!attr) {
					throw new Error(`Missing attribute after ${TOKENS.ATTR}`);
				}
				$curr.attr = attr.trim();
				if (!$curr.ctx) {
					$curr.alias = $curr.attr;
				}
				break;
			case TOKENS.FIRST:
				$curr.first = true;
				break;
			case TOKENS.ALIAS:
				let alias = (token = tokens.shift());
				if (!alias) {
					throw new Error(`Missing alias after ${TOKENS.ALIAS}`);
				}
				$curr.alias = alias.trim();
				break;
			default:
				$curr.ctx += token;
		}
	}
	if (!$root.ctx) {
		$root.ctx = ':root';
	}

	// if ($root._anonymous_root) {
	// 	$root = tree.childrenToArray($root);
	// 	console.log($root);
	// }

	return [$root, tree];
}

module.exports = getAST;
