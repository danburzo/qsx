const SymbolTree = require("symbol-tree");

const T = {
  GROUP_START: "{",
  GROUP_END: "}",
  SEP: ",",
  FUNC_START: "(",
  FUNC_END: ")",
  ATTR: "@",
};

const RE = new RegExp(
  `\\s*(${Object.values(T)
    .map((v) => `\\${v}`)
    .join("|")})\\s*`,
  "g"
);

function query(el, selector) {
  let scope_combi_re = /^\s*:scope\s+(\+|\~)(.+)/;
  let m = selector.match(scope_combi_re);
  if (!m) {
    return el.querySelectorAll(selector);
  }
  if (m[1] === "+") {
    // next sibling
    return el.nextElementSibling.matches(m[2]) ? [el.nextElementSibling] : [];
  }
  if (m[1] === "~") {
    // subsequent sibling
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

function qsa(el, $node, tree) {
  let elements = Array.from(query(el, $node.ctx || ":root"));
  let attrs = $node.attrs;
  let $children = tree.childrenToArray($node);

  return elements.map((element) => {
    let scoped_els;
    if ($children.length) {
      scoped_els = $children.map(($child) => qsa(element, $child, tree));
    }

    /* By default, select outerHTML from element */
    if (!$children.length && !attrs.length) {
      return element.outerHTML;
    }

    let res = {
      ...(attrs.length
        ? attrs.reduce((acc, k) => {
            acc[k] =
              k.indexOf(".") === 0
                ? element[k.slice(1)]
                : element.getAttribute(k);
            return acc;
          }, {})
        : undefined),
      ...($children.length ? { ".scoped": scoped_els } : undefined),
    };
    let keys = Object.keys(res);
    if (keys.length === 1) {
      return res[keys[0]];
    }
    return res;
  });
}

module.exports = function qsx(el, selector) {
  const tree = new SymbolTree();
  const $root = {
    ctx: "",
    attrs: [],
  };
  let $curr = $root;

  const tokens = selector
    .replace(/\:is\(/g, ":matches(")
    .split(RE)
    .filter((v) => v);

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
        $curr = tree.appendChild($curr, { ctx: "", attrs: [] });
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
        $curr = $parent;
        break;
      case T.SEP:
        if (!fn_depth && ctx_depth) {
          let $sibling = tree.insertAfter($curr, { ctx: "", attrs: [] });
          if (!$curr.ctx) {
            tree.remove($curr);
          }
          $curr = $sibling;
        } else {
          $curr.ctx += token;
        }
        break;
      case T.ATTR:
        let attr = (token = tokens.shift());
        if (!attr) {
          throw new Error(`Missing attribute after ${T.ATTR}`);
        }
        tree.parent($curr).attrs.push(attr.trim());
        break;
      default:
        $curr.ctx += token;
    }
  }
  return qsa(el, $root, tree);
};
