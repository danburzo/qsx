import test from 'node:test';
import assert from 'node:assert';
import qsx from '../src/index.js';
import { dom } from './_util.js';

test('qsx()', () => {
	let doc = dom(`
	<dl>
		<dt><a href='#1' title='Go to term 1'>Term 1</a></dt>
		<dd><strong>Very</strong>Def 1</dd>

		<dt><a href='#wo' title='Go to term w/o'>Term w/o def</a></dt>
		
		<dt><a href='#2' title='Go to term 1'>Term 2</a></dt>
		<dd><strong>Very</strong>Def 2</dd>
		
	</dl>
`);

	assert.deepStrictEqual(qsx(doc, 'dt { a, :scope + dd }'), [
		[
			[`<a href="#1" title="Go to term 1">Term 1</a>`],
			[`<dd><strong>Very</strong>Def 1</dd>`]
		],
		[[`<a href="#wo" title="Go to term w/o">Term w/o def</a>`], []],
		[
			[`<a href="#2" title="Go to term 1">Term 2</a>`],
			[`<dd><strong>Very</strong>Def 2</dd>`]
		]
	]);

	assert.deepStrictEqual(qsx(doc, 'a @href'), ['#1', '#wo', '#2']);
});

test('qsx() dont include .scoped when only attrs', () => {
	let doc = dom(`
		<img src='/path' alt='alternative text'/>
	`);
	assert.deepStrictEqual(qsx(doc, 'img { @alt, @src }'), [
		{ alt: 'alternative text', src: '/path' }
	]);
});

test('README examples', () => {
	let headings = dom`
		<h2>Installation</h2>
		<h3>With npm</h3>
		<h3>With yarn</h3>
		<h2>Usage</h2>
		<h3>From the command-line</h3>
	`;

	assert.deepStrictEqual(qsx(headings, 'h2, h3'), [
		['<h2>Installation</h2>', '<h2>Usage</h2>'],
		[
			'<h3>With npm</h3>',
			'<h3>With yarn</h3>',
			'<h3>From the command-line</h3>'
		]
	]);

	assert.deepStrictEqual(qsx(headings, 'h2 => h2s, h3 => h3s'), {
		h2s: ['<h2>Installation</h2>', '<h2>Usage</h2>'],
		h3s: [
			'<h3>With npm</h3>',
			'<h3>With yarn</h3>',
			'<h3>From the command-line</h3>'
		]
	});

	// assert.deepStrictEqual(
	// 	qsx(headings, ':is(h2, h3)'),
	// 	['<h2>Installation</h2>', '<h3>With npm</h3>', '<h3>With yarn</h3>', '<h2>Usage</h2>', '<h3>From the command-line</h3>'],
	// 	':is() behaves like normal CSS semantics'
	// );

	let table = dom(`
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
	`);

	assert.deepStrictEqual(
		qsx(table, 'tr { :scope > td:first-child, :scope > td:last-child }'),
		[
			[['<td>1.1</td>'], ['<td>1.4</td>']],
			[['<td>2.1</td>'], ['<td>2.4</td>']]
		]
	);

	let links = dom(`
		<ul>
			<li title='item 1'><a href="/first-link">First link</a></li>
			<li title='item 2'><a href="/second-link">Second link</a></li>
		</ul>
	`);

	assert.deepStrictEqual(qsx(links, 'a { @href, @.textContent }'), [
		{ href: '/first-link', '.textContent': 'First link' },
		{ href: '/second-link', '.textContent': 'Second link' }
	]);

	assert.deepStrictEqual(qsx(links, 'a @.textContent'), [
		'First link',
		'Second link'
	]);

	assert.deepStrictEqual(qsx(links, 'a { @.textContent }'), [
		{ '.textContent': 'First link' },
		{ '.textContent': 'Second link' }
	]);

	assert.deepStrictEqual(qsx(links, `li { a, @title }`), [
		{
			title: 'item 1',
			'.scoped': ['<a href="/first-link">First link</a>']
		},
		{
			title: 'item 2',
			'.scoped': ['<a href="/second-link">Second link</a>']
		}
	]);

	assert.deepStrictEqual(qsx(links, `li { a, @title }`), [
		{
			title: 'item 1',
			'.scoped': ['<a href="/first-link">First link</a>']
		},
		{
			title: 'item 2',
			'.scoped': ['<a href="/second-link">Second link</a>']
		}
	]);

	assert.deepStrictEqual(qsx(links, `li { ^ a, @title }`), [
		{
			title: 'item 1',
			'.scoped': '<a href="/first-link">First link</a>'
		},
		{
			title: 'item 2',
			'.scoped': '<a href="/second-link">Second link</a>'
		}
	]);

	let terms = dom(`
		<dl>
			<dt><a href='#ref1'>First term</a></dt>
			<dd>First definition</dd>

			<dt><a href='#ref2'>Second term</a></dt>
			<dd>Second definition</dd>
		</dl>
	`);

	assert.deepStrictEqual(
		qsx(
			terms,
			`dt { 
			a { @href, @.textContent },
			:scope + dd @.textContent
		}`
		),
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
		]
	);
});

test('aliases', () => {
	let table = dom(`
		<table>
		  <tbody>
		    <tr title='Row 1'>
		      <td>1.1</td>
		      <td>1.2</td>
		      <td>1.3</td>
		      <td>1.4</td>
		    </tr>
		    <tr title='Row 2'>
		      <td>2.1</td>
		      <td>2.2</td>
		      <td>2.3</td>
		      <td>2.4</td>
		    </tr>
		  </tbody>
		</table>
	`);

	assert.deepStrictEqual(
		qsx(table, 'tr { ^ td:first-child => first, ^ td:last-child => last }'),
		[
			{ first: '<td>1.1</td>', last: '<td>1.4</td>' },
			{ first: '<td>2.1</td>', last: '<td>2.4</td>' }
		]
	);

	assert.deepStrictEqual(
		qsx(table, 'tr { td:first-child => first, td:last-child => last } => .'),
		{ first: ['<td>1.1</td>'], last: ['<td>1.4</td>'] }
	);

	assert.deepStrictEqual(
		qsx(table, 'tr ...{ td:first-child => first, td:last-child }'),
		{ first: ['<td>1.1</td>'], '.scoped': ['<td>1.4</td>'] }
	);

	assert.deepStrictEqual(
		qsx(
			table,
			'tr { @title => caption, ^ td:first-child, ^ td:last-child } => cells'
		),
		[
			{
				caption: 'Row 1',
				cells: ['<td>1.1</td>', '<td>1.4</td>']
			},
			{
				caption: 'Row 2',
				cells: ['<td>2.1</td>', '<td>2.4</td>']
			}
		]
	);

	assert.deepStrictEqual(
		qsx(
			table,
			'tr => cells { @title => caption, ^ td:first-child, ^ td:last-child }'
		),
		[
			{
				caption: 'Row 1',
				cells: ['<td>1.1</td>', '<td>1.4</td>']
			},
			{
				caption: 'Row 2',
				cells: ['<td>2.1</td>', '<td>2.4</td>']
			}
		]
	);
});

test('Netscape Bookmark File', () => {
	let nbf = dom(`
		<dl>
			<dt><a href='/link' add_date='123'>Link title</a></dt>
			<dd name='descr'>Description</dd>
		</dl>
	`);

	assert.deepStrictEqual(
		qsx(
			nbf,
			`dt { 
				^ a @add_date => dateAdded,  
				^ :scope + dd @.textConten() => description
			}`
		),
		[
			{
				dateAdded: '123',
				description: 'Description'
			}
		]
	);

	assert.deepStrictEqual(
		qsx(
			nbf,
			`dt { 
				^ a @add_date => dateAdded,  
				:scope + dd ...{ @.textContent, @name }
			}`
		),
		[
			{
				dateAdded: '123',
				name: 'descr',
				'.textContent': 'Description'
			}
		]
	);
});

test('attribute wildcard', () => {
	let links = dom`
	<div>
		<a href="#dummy" data-hello="world" attr="value">text1</a>
		<a href="#dummy2" data-hello="world2" attr="value2">text2</a>
	</div>
	`;

	assert.deepStrictEqual(
		qsx(links, 'a @*'),
		[
			{ href: '#dummy', 'data-hello': 'world', attr: 'value' },
			{ href: '#dummy2', 'data-hello': 'world2', attr: 'value2' }
		],
		'used at top level'
	);

	assert.deepStrictEqual(
		qsx(links, 'a { @* => . }'),
		[
			{ href: '#dummy', 'data-hello': 'world', attr: 'value' },
			{ href: '#dummy2', 'data-hello': 'world2', attr: 'value2' }
		],
		'spread via alias'
	);

	assert.deepStrictEqual(
		qsx(links, 'a { ...@* }'),
		[
			{ href: '#dummy', 'data-hello': 'world', attr: 'value' },
			{ href: '#dummy2', 'data-hello': 'world2', attr: 'value2' }
		],
		'spread via ellipsis'
	);

	assert.deepStrictEqual(qsx(links, 'a { @.textConten() => _tc, ...@* }'), [
		{
			_tc: 'text1',
			href: '#dummy',
			'data-hello': 'world',
			attr: 'value'
		},
		{
			_tc: 'text2',
			href: '#dummy2',
			'data-hello': 'world2',
			attr: 'value2'
		}
	]);

	assert.deepStrictEqual(qsx(links, 'a { ...@*, @.textConten() => href }'), [
		{ href: 'text1', 'data-hello': 'world', attr: 'value' },
		{ href: 'text2', 'data-hello': 'world2', attr: 'value2' }
	]);

	assert.deepStrictEqual(qsx(links, '^div { a @* }'), [
		{ href: '#dummy', 'data-hello': 'world', attr: 'value' },
		{ href: '#dummy2', 'data-hello': 'world2', attr: 'value2' }
	]);
});
