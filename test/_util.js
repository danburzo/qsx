import { JSDOM } from 'jsdom';

export function dom(content) {
	return new JSDOM(content).window.document;
}

export function traverse($root, tree) {
	if (Array.isArray($root)) {
		return $root.map($r => traverse($r, tree));
	}
	let { [tree.symbol]: _, ...res } = $root;
	let children = tree.childrenToArray($root);
	if (children.length) {
		res.children = traverse(children, tree);
	}
	return res;
}
