import test from 'node:test';
import assert from 'node:assert';
import { traverse } from './_util.js';
import getAST from '../src/ast-get.js';

test('getAST()', () => {
	assert.deepEqual(traverse(...getAST('a @href')), {
		ctx: 'a',
		attr: 'href'
	});

	assert.deepEqual(traverse(...getAST('a @href => url')), {
		ctx: 'a',
		alias: 'url',
		attr: 'href'
	});

	assert.deepEqual(traverse(...getAST('a { @href }')), {
		ctx: 'a',
		children: [
			{
				ctx: '',
				alias: 'href',
				attr: 'href'
			}
		]
	});

	assert.deepEqual(traverse(...getAST('a { @href, @.textContent }')), {
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

	assert.deepEqual(traverse(...getAST('a { @href => url }')), {
		ctx: 'a',
		children: [
			{
				ctx: '',
				alias: 'url',
				attr: 'href'
			}
		]
	});

	assert.deepEqual(
		traverse(...getAST('a { @href >> url, @.textConten() => text }')),
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

	assert.deepEqual(
		traverse(
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
});

test('commas and CSS semantics', () => {
	assert.deepEqual(traverse(...getAST('h2, h3')), {
		ctx: ':root',
		first: true,
		children: [{ ctx: 'h2' }, { ctx: 'h3' }]
	});
	assert.deepEqual(traverse(...getAST('{ h2, h3 }')), {
		ctx: ':root',
		children: [{ ctx: 'h2' }, { ctx: 'h3' }]
	});

	assert.deepEqual(traverse(...getAST(':is(h2, h3)')), {
		ctx: ':matches(h2,h3)'
	});
});

test('Syntax errors', () => {
	assert.throws(() => {
		getAST('a { @href }}');
	}, /Unexpected \}/);

	assert.throws(() => {
		getAST('li { @title, a { @href }');
	}, /Missing \}/);

	assert.throws(() => {
		getAST('a:is(a, b))');
	}, /Unexpected \)/);

	assert.throws(() => {
		getAST('li:not(a, b');
	}, /Missing \)/);

	assert.throws(() => {
		getAST('a @{href}');
	}, /after \@/);

	assert.throws(() => {
		getAST('a >>{href}');
	}, /after \>\>/);
});

test('^ (first)', () => {
	assert.deepEqual(traverse(...getAST('a[href^="#"]')), {
		ctx: 'a[href^="#"]'
	});

	assert.deepEqual(traverse(...getAST('a { ^ span }')), {
		ctx: 'a',
		children: [
			{
				ctx: 'span',
				first: true
			}
		]
	});
});

test('attribute wildcard', () => {
	assert.deepEqual(traverse(...getAST('a @*')), { ctx: 'a', attr: '*' });

	assert.deepEqual(traverse(...getAST('a { @* => . }')), {
		ctx: 'a',
		children: [{ ctx: '', attr: '*', alias: '.' }]
	});

	assert.deepEqual(traverse(...getAST('a { ...@* }')), {
		ctx: 'a',
		children: [{ ctx: '', attr: '*', alias: '.' }]
	});
});
