import SymbolTree from 'symbol-tree';

var TOKENS = {
	GROUP_START: '{',
	GROUP_END: '}',
	SEP: ',',
	FUNC_START: '(',
	FUNC_END: ')',
	ATTR: '@',
	FIRST: '^',
	ALIAS: '>>'
};

var TOKENS_REGEX = new RegExp(
	'\\s*(' +
		Object.values(TOKENS)
			.map(function (v) {
				return '\\' + v;
			})
			.join('|') +
		')\\s*',
	'g'
);

var STATE_INITIAL = null;

/*
	Returns the AST of a selector
	-----------------------------
 */
function getAST(selector) {
	var tree = new SymbolTree();
	var node = function (anon_route) {
		if (anon_route === void 0) anon_route = false;

		var res = { ctx: '' };
		if (anon_route) {
			res.first = true;
		}
		return res;
	};
	var $root = node();
	var $curr = $root;

	var tokens = selector
		.replace(/\:is\(/g, ':matches(')
		.split(TOKENS_REGEX)
		.filter(function (v) {
			return v;
		});

	var token;
	var fn_depth = 0;
	var ctx_depth = 0;
	var state = STATE_INITIAL;

	var assertInitialState = function () {
		if (state !== STATE_INITIAL) {
			throw new Error('Unexpected ' + token + ' after ' + state);
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
					throw new Error('Unexpected ' + TOKENS.FUNC_END);
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
					throw new Error('Unexpected ' + TOKENS.GROUP_END);
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
		throw new Error('Missing <attr> after ' + TOKENS.ATTR);
	}
	if (state === TOKENS.ALIAS) {
		throw new Error('Missing <alias> after ' + TOKENS.ALIAS);
	}
	if (fn_depth) {
		throw new Error('Missing ' + TOKENS.FUNC_END);
	}
	if (ctx_depth) {
		throw new Error('Missing ' + TOKENS.GROUP_END);
	}

	if (!$root.ctx) {
		$root.ctx = ':root';
	}

	return [$root, tree];
}

/*
	Query selector on an element
	----------------------------

	Thin wrapper on top of querySelectorAll,
	to enable extensions such as:

		:scope + el
		:scope ~ el
 */
function query(el, selector) {
	var scope_combi_re = /^\s*:scope\s+(\+|\~)(.+)/;
	var m = selector.match(scope_combi_re);
	if (!m) {
		return Array.from(el.querySelectorAll(selector));
	}
	if (m[1] === '+') {
		// next sibling combinator
		return el.nextElementSibling.matches(m[2])
			? [el.nextElementSibling]
			: [];
	}
	if (m[1] === '~') {
		// subsequent sibling combinator
		els = [];
		var sibling = el.nextElementSibling;
		while (sibling) {
			if (sibling.matches(m[2])) {
				els.push(sibling);
			}
			sibling = sibling.nextElementSibling;
		}
		return els;
	}
	throw new Error('Invalid combinator: ' + m[1]);
}

/*
	Apply a query to an element
	---------------------------

	@param root_el — query scope 
	@param $node — current node in the query AST
	@param tree — reference to the query AST
	@param clean — (bool) 
 */
function applyAST(root_el, $node, tree) {
	/*
		Start by fetching the elements matching 
		the current selector. Attribute selectors don't have a context 
		of their own, and they apply to the root_el directly.
	 */
	var matching_elements = $node.ctx ? query(root_el, $node.ctx) : [root_el];
	var matches = matching_elements.map(function (element) {
		// Attribute selector
		if ($node.attr) {
			var key = $node.attr;
			return key.indexOf('.') === 0
				? element[key.slice(1)]
				: element.getAttribute(key);
		}

		// Element selector, with possible children
		var $subselectors = tree.childrenToArray($node);
		if (!$subselectors.length) {
			return element.outerHTML;
		}
		var result = {};
		var sequential = [];
		$subselectors.forEach(function ($subselector) {
			var subselector_result = applyAST(element, $subselector, tree);
			if ($subselector.alias) {
				if ($subselector.alias === '.') {
					result = Object.assign({}, result, subselector_result);
				} else {
					result[$subselector.alias] = subselector_result;
				}
			} else {
				sequential.push(subselector_result);
			}
		});
		if (sequential.length) {
			// If there's a single sequential subselector,
			// flatten the wrapper array.
			if (sequential.length === 1) {
				sequential = sequential[0];
			}
			if (Object.keys(result).length === 0) {
				return sequential;
			}
			result[$node.alias || '.scoped'] = sequential;
		}
		return result;
	});

	/*
		Only return the first of the matches
		when the node is marked as such.
	 */
	var first = $node.first || !$node.ctx || $node.alias === '.';
	return first ? matches[0] : matches;
}

function qsx(el, selector) {
	var ref = getAST(selector);
	var $root = ref[0];
	var tree = ref[1];
	return Array.isArray($root)
		? $root.map(function ($r) {
				return applyAST(el, $r, tree);
		  })
		: applyAST(el, $root, tree);
}

export default qsx;
