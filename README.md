# qsx

Extended CSS selectors for querying the DOM and extracting parts of it.

## Installation

```bash
# with npm
npm install qsx

# with yarn
yarn add qsx
```

## Usage

```js
let qsx = require("qsx");
qsx(el, ":scope > a");
```

In Node.js, which lacks a built-in DOM environment, you can use [`jsdom`](https://github.com/jsdom/jsdom).

## The query language

`qsx` works like [`Element.querySelectorAll`](https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelectorAll), but returns a JSON array instead of a `NodeList`, and adds some syntax that makes it useful for extracting things from HTML.

The additional features are listed below.

### Sub-scopes

Whenever you use a pair of parantheses `{...}`, you create a sub-scope.

On the HTML document:

```html
<table>
  <tbody>
    <tr>
      <td>1.1</td>
      <td>1.2</td>
      <td>1.3</td>
      <td>1.4</td>
    </tr>
    <tr>
      <td>2.1</td>
      <td>2.2</td>
      <td>2.3</td>
      <td>2.4</td>
    </tr>
  </tbody>
</table>
```

A query to pick the first and last columns off each row in the table:

```js
qsx(document, `tr { :scope > td:first-child, :scope > td:last-child }`);
// =>
[
  [["<td>1.1</td>"], ["<td>1.4</td>"]],
  [["<td>2.1</td>"], ["<td>2.4</td>"]],
];
```

Here's the equivalent query in vanilla `querySelectorAll` and JavaScript:

```js
const arr = Array.from;
arr(document.querySelectorAll("tr")).map((tr) => [
  arr(tr.querySelectorAll(":scope > td:firstChild")).map((td) => td.outerHTML),
  arr(tr.querySelectorAll(":scope > td:firstChild")).map((td) => td.outerHTML),
]);
```

### Extracting HTML attributes and DOM properties

By default, for each leaf element in the query, `qsx()` returns its `.outerHTML`. Instead, we can extract specific attributes and properties:

- `@attr` extracts the `attr` HTML attribute via `el.getAttribute('attr')`;
- `@.prop` reads the `prop` DOM property via `el.prop`.

Given the markup:

```html
<ul>
  <li title="item 1"><a href="/first-link">First link</a></li>
  <li title="item 2"><a href="/second-link">Second link</a></li>
</ul>
```

This query extracts the `href` and label off each anchor element:

```js
qsx(document, `a { @href, @.textContent }`);
// =>
[
  { href: "/first-link", ".textContent": "First link" },
  { href: "/second-link", ".textContent": "Second link" },
];
```

Notice that, to prevent collisions between attribute and property names, the latter are always prefixed with `.` in the resulting JSON, similar to how they were defined in the query.

To simplify the returned JSON structure, whenever for a leaf element we return a single piece of information — be it the default `outerHTML` or a single attribute — we return it as a value rather than an object with a single key:

```js
qsx(document, `a { @.textContent }`);
// =>
["First link", "Second link"];
```

Attributes, properties and scoped selectors can be combined at will. When present among otehr attributes / properties, scoped selectors are added under the `.scoped` key:

```js
qsx(document, `li { a, @title }`);
// =>
[
  {
    title: "item 1",
    ".scoped": [['<a href="/first-link">First link</a>']],
  },
  {
    title: "item 2",
    ".scoped": [['<a href="/second-link">Second link</a>']],
  },
];
```

### `:scope` and combining selectors

In stock `Element.querySelectorAll`, the `:scope` selector cannot be combined with the _next-sibling selector_ (`:scope + el`), nor the _subsequent-sibling selector_ (`:scope ~ el`).

`qsx` does not impose this limitation, so you can group attributes from things like definition lists:

```html
<dl>
  <dt><a href="#ref1">First term</a></dt>
  <dd>First definition</dd>

  <dt><a href="#ref2">Second term</a></dt>
  <dd>Second definition</dd>
</dl>
```

```js
qsx(
  document,
  `dt { 
	a { @href, @.textContent },
	:scope + dd { @.textContent }
}`
);
// =>
[
  [
    [
      {
        href: "#ref1",
        ".textContent": "First term",
      },
    ],
    ["First definition"],
  ],
  [
    [
      {
        href: "#ref2",
        ".textContent": "Second term",
      },
    ],
    ["Second definition"],
  ],
];
```
