import getAST from './ast-get.js';
import applyAST from './ast-apply.js';

export default function qsx(el, selector) {
	let [$root, tree] = getAST(selector);
	return Array.isArray($root)
		? $root.map($r => applyAST(el, $r, tree))
		: applyAST(el, $root, tree);
}
