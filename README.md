# qsx

Extended CSS selectors for querying the DOM and extracting parts of it. Used by the [`hred` command-line tool](https://github.com/danburzo/hred).

## Installation

The library is currently packaged in CJS (CommonJS) format, for Node.js.

```bash
# with npm
npm install qsx

# with yarn
yarn add qsx
```

## Usage

```js
let qsx = require('qsx');
qsx(el, ':scope > a');
```

In Node.js, which lacks a built-in DOM environment, you can use [`jsdom`](https://github.com/jsdom/jsdom).

## The query language

If you're familiar with CSS selectors and [`Element.querySelectorAll`](https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelectorAll), you are mostly good to go. `qsx` introduces only a few differences and extensions, listed below.

### Commas select parralel data

The CSS selector `h2, h3` matches all elements that are either an `h2` or an `h3`. In `qsx`, however, it selects all `h2` elements, and all `h3` elements, in separate arrays.

```html
<h2>Installation</h2>
<h3>With npm</h3>
<h3>With yarn</h3>
<h2>Usage</h2>
<h3>From the command-line</h3>

<script>

	document.querySelectorAll('h2, h3');
	// =>
	['<h2>Installation</h2>', '<h3>With npm</h3>', ...]

	qsx(document, 'h2, h3');
	// =>
	[
		['<h2>Installation</h2>', '<h2>Usage</h2>'],
		['<h3>With npm</h3>', '<h3>With yarn</h3>', ...]
	]
</script>
```

> Note: The [`:is()` pseudo-class](https://developer.mozilla.org/en-US/docs/Web/CSS/:is) would have provided a mechanism to restore the CSS semantics to the comma. `qsx(el, ':is(h2, h3)')` could have been used to mean `h2, h3`. Unfortunately, at the moment it's unevenly implemented across browsers [and in `jsdom`](https://github.com/jsdom/jsdom/issues/3013).

### Parentheses introduce sub-scopes

Whenever you use a pair of parantheses `{...}`, you create a sub-scope.

Here's a query to pick the first and last columns off each row in the table below:

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

<script>
	qsx(document, `tr { :scope > td:first-child, :scope > td:last-child }`);
	// =>
	[
		[['<td>1.1</td>'], ['<td>1.4</td>']],
		[['<td>2.1</td>'], ['<td>2.4</td>']]
	];
</script>
```

Here's the equivalent query in vanilla `querySelectorAll` and JavaScript:

```js
const arr = Array.from;
arr(document.querySelectorAll('tr')).map(tr => [
	arr(tr.querySelectorAll(':scope > td:firstChild')).map(td => td.outerHTML),
	arr(tr.querySelectorAll(':scope > td:firstChild')).map(td => td.outerHTML)
]);
```

### Extracting HTML attributes and DOM properties

By default, for each leaf element in the query, `qsx()` returns its `.outerHTML`. Instead, we can extract specific attributes and properties:

-   `@attr` extracts the `attr` HTML attribute via `el.getAttribute('attr')`;
-   `@.prop` reads the `prop` DOM property via `el.prop`.

This query extracts the `href` and label off each anchor element:

```html
<ul>
	<li title="item 1"><a href="/first-link">First link</a></li>
	<li title="item 2"><a href="/second-link">Second link</a></li>
</ul>

<script>
	qsx(document, `a { @href, @.textContent }`);
	// =>
	[
		{ href: '/first-link', '.textContent': 'First link' },
		{ href: '/second-link', '.textContent': 'Second link' }
	];
</script>
```

Notice that, to prevent collisions between attribute and property names, the latter are always prefixed with `.` in the resulting JSON, similar to how they were defined in the query.

To simplify the returned JSON structure, whenever for a leaf element we return a single piece of information — be it the default `outerHTML` or a single attribute — we return it as a value rather than an object with a single key:

```js
qsx(document, `a { @.textContent }`);
// =>
['First link', 'Second link'];
```

Attributes, properties and scoped selectors can be combined at will. When present among otehr attributes / properties, scoped selectors are added under the `.scoped` key:

```js
qsx(document, `li { a, @title }`);
// =>
[
	{
		title: 'item 1',
		'.scoped': ['<a href="/first-link">First link</a>']
	},
	{
		title: 'item 2',
		'.scoped': ['<a href="/second-link">Second link</a>']
	}
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
<script>
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
					href: '#ref1',
					'.textContent': 'First term'
				}
			],
			['First definition']
		],
		[
			[
				{
					href: '#ref2',
					'.textContent': 'Second term'
				}
			],
			['Second definition']
		]
	];
</script>
```

### Alias selectors with `>>`

Keys in the resulting JSON can be aliased to any other name, using `>> alias`.

Alias HTML attributes and DOM properties:

```js
qsx(el, 'a { @href >> url, @.textContent >> text }');
```

Alias individual scoped selectors:

```js
qsx(el, 'tr { td:first-child >> first, td:last-child >> last }');
```

Alias whole `.scoped` object:

```js
qsx(el, 'tr { @title, td:first-child, td:last-child } >> cells');
```

The special alias `.` will cause the object to be merged into the current context.

### Pick first result with `^`

For more complex queries where there resulting JSON contains several nested arrays, but for which you want to select a single element, you can prefix a selector with `^` to select just the first matching element — like `querySelector()` rather than `querySelectorAll()`.

```js
qsx(document, `li { ^ a, @title }`);

// =>
[
	{
		title: 'item 1',
		'.scoped': '<a href="/first-link">First link</a>'
	},
	{
		title: 'item 2',
		'.scoped': '<a href="/second-link">Second link</a>'
	}
];
```

Some other situations will trigger first-result behavior even in the absence of the `^` prefix:

-   When requesting a direct attribute in a sub-scope: `a { @href }`
-   When using the `.` alias: `a { @href, @.textContent } >> .`
