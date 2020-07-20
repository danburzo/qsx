# qsx

Extended CSS selectors for querying the DOM.

Installation:

```bash
# with npm
npm install qsx

# with yarn
yarn add qsx
```

Usage:

```js
let qsx = require("qsx");

qsx(el, ":scope > a");
```

In Node.js, which lacks a built-in DOM environment, you can use [`jsdom`](https://github.com/jsdom/jsdom).

## Extensions to CSS Selectors

### Grouping with `{ ... }`

For example:

```js
qsx(
  document,
  `tr { 
	:scope > td:first-child, 
	:scope > td:last-child 
}`
);
```

### Extracting attributes and DOM properties

By default, the `outerHTML` property of each matched element is included in the response. Use `@attr` to extract attributes, and `@.prop` to access DOM properties. For example:

```js
qsx(document, `a { @href, @.textContent }`);
```

### `:scope` and combining selectors

Unlike `querySelectorAll`, `qsx` supports the `:scope + el` and `:scope ~ el` selectors.
