/*
	Query selector on an element
	----------------------------

	Thin wrapper on top of querySelectorAll,
	to enable extensions such as:

		:scope + el
		:scope ~ el
 */
export default function query(el, selector) {
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
		let els = [];
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
