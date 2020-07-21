import tape from 'tape';
import qsx from '../src/index.js';
import dom from './util-dom.js';

tape('qsx()', t => {
	let doc = dom(`
	<dl>
		<dt><a href='#1' title='Go to term 1'>Term 1</a></dt>
		<dd><strong>Very</strong>Def 1</dd>

		<dt><a href='#wo' title='Go to term w/o'>Term w/o def</a></dt>
		
		<dt><a href='#2' title='Go to term 1'>Term 2</a></dt>
		<dd><strong>Very</strong>Def 2</dd>
		
	</dl>
`);

	t.deepEqual(qsx(doc, 'dt { a, :scope + dd }'), [
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

	t.deepEqual(qsx(doc, 'a @href'), ['#1', '#wo', '#2']);
	t.end();
});

tape('qsx() dont include .scoped when only attrs', t => {
	let doc = dom(`
		<img src='/path' alt='alternative text'/>
	`);
	t.deepEqual(qsx(doc, 'img { @alt, @src }'), [
		{ alt: 'alternative text', src: '/path' }
	]);
	t.end();
});

tape('README examples', t => {
	let headings = dom`
		<h2>Installation</h2>
		<h3>With npm</h3>
		<h3>With yarn</h3>
		<h2>Usage</h2>
		<h3>From the command-line</h3>
	`;

	t.deepEqual(
		qsx(headings, 'h2, h3'),
		[
			['<h2>Installation</h2>', '<h2>Usage</h2>'],
			[
				'<h3>With npm</h3>',
				'<h3>With yarn</h3>',
				'<h3>From the command-line</h3>'
			]
		],
		'commas select parallel sets of headings'
	);

	t.deepEqual(
		qsx(headings, 'h2 >> h2s, h3 >> h3s'),
		{
			h2s: ['<h2>Installation</h2>', '<h2>Usage</h2>'],
			h3s: [
				'<h3>With npm</h3>',
				'<h3>With yarn</h3>',
				'<h3>From the command-line</h3>'
			]
		},
		'commas select parallel sets of headings (with aliases)'
	);

	// t.deepEqual(
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

	t.deepEqual(
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

	t.deepEqual(qsx(links, 'a { @href, @.textContent }'), [
		{ href: '/first-link', '.textContent': 'First link' },
		{ href: '/second-link', '.textContent': 'Second link' }
	]);

	t.deepEqual(qsx(links, 'a @.textContent'), ['First link', 'Second link']);

	t.deepEqual(qsx(links, 'a { @.textContent }'), [
		{ '.textContent': 'First link' },
		{ '.textContent': 'Second link' }
	]);

	t.deepEqual(qsx(links, `li { a, @title }`), [
		{
			title: 'item 1',
			'.scoped': ['<a href="/first-link">First link</a>']
		},
		{
			title: 'item 2',
			'.scoped': ['<a href="/second-link">Second link</a>']
		}
	]);

	t.deepEqual(qsx(links, `li { a, @title }`), [
		{
			title: 'item 1',
			'.scoped': ['<a href="/first-link">First link</a>']
		},
		{
			title: 'item 2',
			'.scoped': ['<a href="/second-link">Second link</a>']
		}
	]);

	t.deepEqual(qsx(links, `li { ^ a, @title }`), [
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

	t.deepEqual(
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

	t.end();
});

tape('aliases', t => {
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

	t.deepEqual(
		qsx(table, 'tr { ^ td:first-child >> first, ^ td:last-child >> last }'),
		[
			{ first: '<td>1.1</td>', last: '<td>1.4</td>' },
			{ first: '<td>2.1</td>', last: '<td>2.4</td>' }
		]
	);

	t.deepEqual(
		qsx(
			table,
			'tr { @title >> caption, ^ td:first-child, ^ td:last-child } >> cells'
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

	t.deepEqual(
		qsx(
			table,
			'tr >> cells { @title >> caption, ^ td:first-child, ^ td:last-child }'
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

	t.end();
});

tape('Netscape Bookmark File', t => {
	let nbf = dom(`
		<dl>
			<dt><a href='/link' add_date='123'>Link title</a></dt>
			<dd name='descr'>Description</dd>
		</dl>
	`);

	t.deepEqual(
		qsx(
			nbf,
			`dt { 
				^ a @add_date >> dateAdded,  
				^ :scope + dd @.textContent >> description
			}`
		),
		[
			{
				dateAdded: '123',
				description: 'Description'
			}
		]
	);

	t.deepEqual(
		qsx(
			nbf,
			`dt { 
				^ a @add_date >> dateAdded,  
				:scope + dd { @.textContent, @name } >> .
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

	t.end();
});
