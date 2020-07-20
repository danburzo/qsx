const SymbolTree = require('symbol-tree');

const T = {
	GROUP_START: '{',
	GROUP_END: '}',
	SEP: ',',
	FUNC_START: '(',
	FUNC_END: ')',
	ATTR: '@',
	FIRST: '^',
	ALIAS: '>>'
};

const RE = new RegExp(
	`\\s*(${Object.values(T)
		.map(v => `\\${v}`)
		.join('|')})\\s*`,
	'g'
);

module.exports = function qsx(el, selector) {
	let [tree, $root] = getAST(selector);
	let res = applyAST(el, $root, tree);
	return Array.isArray(res) ? res.map(firstKeyIfOnly) : firstKeyIfOnly(res);
};

/*
	Returns the AST of a selector
	-----------------------------
 */
function getAST(selector) {
	const tree = new SymbolTree();
	const node = () => ({
		ctx: '',
		attrs: [],
		first: false,
		alias: null
	});
	const $root = node();
	let alias_target;
	let $curr = (alias_target = $root);

	const tokens = selector
		.replace(/\:is\(/g, ':matches(')
		.split(RE)
		.filter(v => v);

	let token;
	let fn_depth = 0;
	let ctx_depth = 0;
	while ((token = tokens.shift())) {
		switch (token) {
			case T.FUNC_START:
				fn_depth++;
				$curr.ctx += token;
				break;
			case T.FUNC_END:
				if (fn_depth <= 0) {
					throw new Error(`Unexpected ${T.FUNC_END}`);
				}
				fn_depth--;
				$curr.ctx += token;
				break;
			case T.GROUP_START:
				ctx_depth++;
				$curr = alias_target = tree.appendChild($curr, node());
				break;
			case T.GROUP_END:
				if (ctx_depth <= 0) {
					throw new Error(`Unexpected ${T.GROUP_END}`);
				}
				ctx_depth--;
				let $parent = tree.parent($curr);
				if (!$curr.ctx) {
					tree.remove($curr);
				}
				$curr = alias_target = $parent;
				break;
			case T.SEP:
				if (!fn_depth && ctx_depth) {
					let $sibling = tree.insertAfter($curr, node());
					if (!$curr.ctx) {
						tree.remove($curr);
					}
					$curr = alias_target = $sibling;
				} else {
					$curr.ctx += token;
				}
				break;
			case T.ATTR:
				let attr = (token = tokens.shift());
				if (!attr) {
					throw new Error(`Missing attribute after ${T.ATTR}`);
				}
				if ($curr.ctx) {
					$curr.ctx += T.ATTR + attr;
				} else {
					alias_target = {
						attr: attr.trim(),
						alias: null
					};
					tree.parent($curr).attrs.push(alias_target);
				}
				break;
			case T.FIRST:
				$curr.first = true;
				break;
			case T.ALIAS:
				let alias = (token = tokens.shift());
				if (!alias) {
					throw new Error(`Missing alias after ${T.ALIAS}`);
				}
				alias_target.alias = alias.trim();
				break;
			default:
				$curr.ctx += token;
		}
	}
	return [tree, $root];
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
		the current selector
	 */
	let matching_elements = query(root_el, $node.ctx || ':root');

	let attrs = $node.attrs;
	let $children = tree.childrenToArray($node);

	let matches = matching_elements.map(element => {
		let result = {};

		// mix in requested attributes from the element
		attrs.forEach(item => {
			let k = item.attr;
			let v =
				k.indexOf('.') === 0
					? element[k.slice(1)]
					: element.getAttribute(k);
			// use alias as key, if any
			result[item.alias || k] = v;
		});

		let sequential = [];
		let to_merge = [];
		$children.forEach($child => {
			let child_result = applyAST(element, $child, tree);
			if (Array.isArray(child_result)) {
				child_result = child_result.map(firstKeyIfOnly);
			}
			if ($child.alias) {
				if ($child.alias === '.') {
					to_merge.push(child_result);
				} else {
					result[$child.alias] = firstKeyIfOnly(child_result);
				}
			} else {
				sequential.push(firstKeyIfOnly(child_result));
			}
		});

		if (sequential.length) {
			result[$node.alias || '.scoped'] = sequential.map(firstKeyIfOnly);
		}

		to_merge.forEach(obj => {
			result = { ...result, ...obj };
		});

		/* By default, select outerHTML from element */
		if (Object.keys(result).length === 0) {
			return element.outerHTML;
		}

		return result;
	});

	/*
		Only return the first of the matches
		when the node is marked as such.
	 */
	return $node.first ? matches[0] : matches;
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
	let scope_combi_re = /^\s*:scope\s+(\+|\~)(.+)/;
	let m = selector.match(scope_combi_re);
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
		let sibling = el.nextElementSibling;
		while (sibling) {
			if (sibling.matches(m[2])) {
				els.push(sibling);
			}
			sibling = sibling.nextElementSibling;
		}
		return els;
	}
	throw new Error(`Invalid combinator: ${m[1]}`);
}

/*
	If the object has a single key/value pair, 
	return its only value instead.
 */
function firstKeyIfOnly(o) {
	let keys;
	if (!Array.isArray(o) && (keys = Object.keys(o)).length === 1) {
		return o[keys[0]];
	}
	return o;
}
