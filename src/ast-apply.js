const SymbolTree = require('symbol-tree');
let query = require('./query.js');

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
	let matching_elements = $node.ctx ? query(root_el, $node.ctx) : [root_el];
	let matches = matching_elements.map(element => {
		// Attribute selector
		if ($node.attr) {
			let key = $node.attr;
			return key.indexOf('.') === 0
				? element[key.slice(1)]
				: element.getAttribute(key);
		}

		// Element selector, with possible children
		let $subselectors = tree.childrenToArray($node);
		if (!$subselectors.length) {
			return element.outerHTML;
		}
		let result = {};
		let sequential = [];
		$subselectors.forEach($subselector => {
			let subselector_result = applyAST(element, $subselector, tree);
			if ($subselector.alias) {
				if ($subselector.alias === '.') {
					result = {
						...result,
						...subselector_result
					};
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
	let first = $node.first || !$node.ctx || $node.alias === '.';
	return first ? matches[0] : matches;
}

module.exports = applyAST;
