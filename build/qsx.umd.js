!(function (e, r) {
	'object' == typeof exports && 'undefined' != typeof module
		? (module.exports = r(require('symbol-tree')))
		: 'function' == typeof define && define.amd
		? define(['symbol-tree'], r)
		: ((e = e || self).qsx = r(e.SymbolTree));
})(this, function (e) {
	'use strict';
	e = e && Object.prototype.hasOwnProperty.call(e, 'default') ? e.default : e;
	var r = {
			GROUP_START: '{',
			GROUP_END: '}',
			SEP: ',',
			FUNC_START: '(',
			FUNC_END: ')',
			ATTR: '@',
			FIRST: '^',
			ALIAS: '>>'
		},
		t = new RegExp(
			'\\s*(' +
				Object.values(r)
					.map(function (e) {
						return '\\' + e;
					})
					.join('|') +
				')\\s*',
			'g'
		);
	function n(e, r, t) {
		var i = (r.ctx
			? (function (e, r) {
					var t = r.match(/^\s*:scope\s+(\+|\~)(.+)/);
					if (!t) return Array.from(e.querySelectorAll(r));
					if ('+' === t[1])
						return e.nextElementSibling.matches(t[2])
							? [e.nextElementSibling]
							: [];
					if ('~' === t[1]) {
						els = [];
						for (var n = e.nextElementSibling; n; )
							n.matches(t[2]) && els.push(n),
								(n = n.nextElementSibling);
						return els;
					}
					throw new Error('Invalid combinator: ' + t[1]);
			  })(e, r.ctx)
			: [e]
		).map(function (e) {
			if (r.attr) {
				var i = r.attr;
				return 0 === i.indexOf('.') ? e[i.slice(1)] : e.getAttribute(i);
			}
			var a = t.childrenToArray(r);
			if (!a.length) return e.outerHTML;
			var s = {},
				c = [];
			if (
				(a.forEach(function (r) {
					var i = n(e, r, t);
					r.alias
						? '.' === r.alias
							? (s = Object.assign({}, s, i))
							: (s[r.alias] = i)
						: c.push(i);
				}),
				c.length)
			) {
				if ((1 === c.length && (c = c[0]), 0 === Object.keys(s).length))
					return c;
				s[r.alias || '.scoped'] = c;
			}
			return s;
		});
		return r.first || !r.ctx || '.' === r.alias ? i[0] : i;
	}
	return function (i, a) {
		var s = (function (n) {
				for (
					var i,
						a = new e(),
						s = function (e) {
							void 0 === e && (e = !1);
							var r = { ctx: '' };
							return e && (r.first = !0), r;
						},
						c = s(),
						o = c,
						l = n
							.replace(/\:is\(/g, ':matches(')
							.split(t)
							.filter(function (e) {
								return e;
							}),
						f = 0,
						u = 0,
						A = null,
						h = function () {
							if (null !== A)
								throw new Error(
									'Unexpected ' + i + ' after ' + A
								);
						};
					(i = l.shift());

				)
					switch (i) {
						case r.FUNC_START:
							h(), f++, (o.ctx += i);
							break;
						case r.FUNC_END:
							if ((h(), f <= 0))
								throw new Error('Unexpected ' + r.FUNC_END);
							f--, (o.ctx += i);
							break;
						case r.GROUP_START:
							h(), u++, (o = a.appendChild(o, s()));
							break;
						case r.GROUP_END:
							if ((h(), u <= 0))
								throw new Error('Unexpected ' + r.GROUP_END);
							u--, (o = a.parent(o));
							break;
						case r.SEP:
							h(),
								f
									? (o.ctx += i)
									: (o === c &&
											((c = s(!0)), a.appendChild(c, o)),
									  (o = a.insertAfter(o, s())));
							break;
						case r.ATTR:
							h(), (A = r.ATTR);
							break;
						case r.FIRST:
							h(), (o.first = !0);
							break;
						case r.ALIAS:
							h(), (A = r.ALIAS);
							break;
						default:
							switch (A) {
								case r.ATTR:
									(o.attr = i.trim()),
										o.ctx || (o.alias = o.attr),
										(A = null);
									break;
								case r.ALIAS:
									(o.alias = i.trim()), (A = null);
									break;
								default:
									o.ctx += i;
							}
					}
				if (A === r.ATTR)
					throw new Error('Missing <attr> after ' + r.ATTR);
				if (A === r.ALIAS)
					throw new Error('Missing <alias> after ' + r.ALIAS);
				if (f) throw new Error('Missing ' + r.FUNC_END);
				if (u) throw new Error('Missing ' + r.GROUP_END);
				return c.ctx || (c.ctx = ':root'), [c, a];
			})(a),
			c = s[0],
			o = s[1];
		return Array.isArray(c)
			? c.map(function (e) {
					return n(i, e, o);
			  })
			: n(i, c, o);
	};
});
