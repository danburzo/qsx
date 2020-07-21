const getAST = require('./ast-get.js');
const applyAST = require('./ast-apply.js');

module.exports = function qsx(el, selector) {
	let [$root, tree] = getAST(selector);
	return Array.isArray($root)
		? $root.map($r => applyAST(el, $r, tree))
		: applyAST(el, $root, tree);
};
