import tape from 'tape';
import astToJson from './util-ast-to-json';
import getAST from '../src/ast-get';

tape('getAST()', t => {
	t.deepEqual(astToJson(...getAST('a @href')), {
		ctx: 'a',
		attr: 'href'
	});

	t.deepEqual(astToJson(...getAST('a @href => url')), {
		ctx: 'a',
		alias: 'url',
		attr: 'href'
	});

	t.deepEqual(astToJson(...getAST('a { @href }')), {
		ctx: 'a',
		children: [
			{
				ctx: '',
				alias: 'href',
				attr: 'href'
			}
		]
	});

	t.deepEqual(astToJson(...getAST('a { @href, @.textContent }')), {
		ctx: 'a',
		children: [
			{
				ctx: '',
				alias: 'href',
				attr: 'href'
			},
			{
				ctx: '',
				alias: '.textContent',
				attr: '.textContent'
			}
		]
	});

	t.deepEqual(astToJson(...getAST('a { @href => url }')), {
		ctx: 'a',
		children: [
			{
				ctx: '',
				alias: 'url',
				attr: 'href'
			}
		]
	});

	t.deepEqual(
		astToJson(...getAST('a { @href >> url, @.textContent => text }')),
		{
			ctx: 'a',
			children: [
				{
					ctx: '',
					attr: 'href',
					alias: 'url'
				},
				{
					ctx: '',
					attr: '.textContent',
					alias: 'text'
				}
			]
		}
	);

	t.deepEqual(
		astToJson(
			...getAST(`dt { 
			a { @href, @.textContent },
			:scope + dd @.textContent
		}`)
		),
		{
			ctx: 'dt',
			children: [
				{
					ctx: 'a',
					children: [
						{
							ctx: '',
							alias: 'href',
							attr: 'href'
						},
						{
							ctx: '',
							alias: '.textContent',
							attr: '.textContent'
						}
					]
				},
				{
					ctx: ':scope + dd',
					attr: '.textContent'
				}
			]
		}
	);
	t.end();
});

tape('commas and CSS semantics', t => {
	t.deepEqual(
		astToJson(...getAST('h2, h3')),
		{
			ctx: ':root',
			first: true,
			children: [{ ctx: 'h2' }, { ctx: 'h3' }]
		},
		'commas'
	);
	t.deepEqual(
		astToJson(...getAST('{ h2, h3 }')),
		{
			ctx: ':root',
			children: [{ ctx: 'h2' }, { ctx: 'h3' }]
		},
		'commas w/ group'
	);

	t.deepEqual(
		astToJson(...getAST(':is(h2, h3)')),
		{
			ctx: ':matches(h2,h3)'
		},
		':is()'
	);
	t.end();
});

tape('Syntax errors', t => {
	t.throws(() => {
		getAST('a { @href }}');
	}, /Unexpected \}/);

	t.throws(() => {
		getAST('li { @title, a { @href }');
	}, /Missing \}/);

	t.throws(() => {
		getAST('a:is(a, b))');
	}, /Unexpected \)/);

	t.throws(() => {
		getAST('li:not(a, b');
	}, /Missing \)/);

	t.throws(() => {
		getAST('a @{href}');
	}, /after \@/);

	t.throws(() => {
		getAST('a >>{href}');
	}, /after \>\>/);

	t.end();
});

tape('^ (first)', t => {
	t.deepEqual(
		astToJson(...getAST('a[href^="#"]')),
		{
			ctx: 'a[href^="#"]'
		},
		'ignore ^ unless first token'
	);

	t.deepEqual(
		astToJson(...getAST('a { ^ span }')),
		{
			ctx: 'a',
			children: [
				{
					ctx: 'span',
					first: true
				}
			]
		},
		'identify ^ as first'
	);

	t.end();
});

tape('read attributes @*', t => {
	t.deepEqual(astToJson(...getAST('a @*')), { ctx: 'a', attr: '*' });

	t.deepEqual(
		astToJson(...getAST('a { @* => . }')),
		{ ctx: 'a', children: [{ ctx: '', attr: '*', alias: '.' }] },
		'attribute spread'
	);

	t.deepEqual(
		astToJson(...getAST('a { ...@* }')),
		{ ctx: 'a', children: [{ ctx: '', attr: '*', alias: '.' }] },
		'attribute spread ellipsis'
	);
	t.end();
});
