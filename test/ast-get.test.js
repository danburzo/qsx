import tape from 'tape';
import getAST from '../src/ast-get';

let tests = [
	{
		selector: 'a @href',
		result: {
			type: 'ComplexSelector',
			left: { type: 'TypeSelector', identifier: 'a' },
			combinator: ' ',
			right: {
				type: 'PseudoClassSelector',
				identifier: '-qsx-extract',
				argument: [{ type: 'ident', value: 'href' }]
			}
		}
	},
	{
		selector: 'a @href => url',
		result: {
			type: 'ComplexSelector',
			left: {
				type: 'ComplexSelector',
				left: { type: 'TypeSelector', identifier: 'a' },
				combinator: ' ',
				right: {
					type: 'PseudoClassSelector',
					identifier: '-qsx-extract',
					argument: [{ type: 'ident', value: 'href' }]
				}
			},
			combinator: '⇒',
			right: { type: 'TypeSelector', identifier: 'url' }
		}
	},
	{
		selector: 'a { @href }',
		result: {
			type: 'ComplexSelector',
			left: { type: 'TypeSelector', identifier: 'a' },
			combinator: ' ',
			right: {
				type: 'PseudoClassSelector',
				identifier: '-qsx-select',
				argument: {
					type: 'SelectorList',
					selectors: [
						{
							type: 'PseudoClassSelector',
							identifier: '-qsx-extract',
							argument: [{ type: 'ident', value: 'href' }]
						}
					]
				}
			}
		}
	},
	{
		selector: 'a { @href, @.textContent }',
		result: {
			type: 'ComplexSelector',
			left: { type: 'TypeSelector', identifier: 'a' },
			combinator: ' ',
			right: {
				type: 'PseudoClassSelector',
				identifier: '-qsx-select',
				argument: {
					type: 'SelectorList',
					selectors: [
						{
							type: 'PseudoClassSelector',
							identifier: '-qsx-extract',
							argument: [{ type: 'ident', value: 'href' }]
						},
						{
							type: 'PseudoClassSelector',
							identifier: 'qsx-extract',
							argument: [{ type: 'ident', value: '.textContent' }]
						}
					]
				}
			}
		}
	},
	{
		selector: 'a { @href => url }',
		result: {
			type: 'ComplexSelector',
			left: { type: 'TypeSelector', identifier: 'a' },
			combinator: ' ',
			right: {
				type: 'PseudoClassSelector',
				identifier: '-qsx-select',
				argument: {
					type: 'SelectorList',
					selectors: [
						{
							type: 'ComplexSelector',
							left: {
								type: 'PseudoClassSelector',
								identifier: '-qsx-extract',
								argument: [{ type: 'ident', value: 'href' }]
							},
							combinator: '⇒',
							right: { type: 'TypeSelector', identifier: 'url' }
						}
					]
				}
			}
		}
	},
	{
		selector: 'a { @href >> url, @.textContent => text }',
		result: {
			type: 'ComplexSelector',
			left: { type: 'TypeSelector', identifier: 'a' },
			combinator: ' ',
			right: {
				type: 'PseudoClassSelector',
				identifier: '-qsx-select',
				argument: {
					type: 'SelectorList',
					selectors: [
						{
							type: 'ComplexSelector',
							left: {
								type: 'PseudoClassSelector',
								identifier: '-qsx-extract',
								argument: [{ type: 'ident', value: 'href' }]
							},
							combinator: '⇒',
							right: { type: 'TypeSelector', identifier: 'url' }
						},
						{
							type: 'ComplexSelector',
							left: {
								type: 'PseudoClassSelector',
								identifier: 'qsx-extract',
								argument: [
									{ type: 'ident', value: '.textContent' }
								]
							},
							combinator: '⇒',
							right: { type: 'TypeSelector', identifier: 'text' }
						}
					]
				}
			}
		}
	},
	{
		selector: `dt { 
			a { @href, @.textContent },
			:scope + dd @.textContent
		}`,
		result: {
			type: 'ComplexSelector',
			left: { type: 'TypeSelector', identifier: 'dt' },
			combinator: ' ',
			right: {
				type: 'PseudoClassSelector',
				identifier: '-qsx-select',
				argument: {
					type: 'SelectorList',
					selectors: [
						{
							type: 'ComplexSelector',
							left: { type: 'TypeSelector', identifier: 'a' },
							combinator: ' ',
							right: {
								type: 'PseudoClassSelector',
								identifier: '-qsx-select',
								argument: {
									type: 'SelectorList',
									selectors: [
										{
											type: 'PseudoClassSelector',
											identifier: '-qsx-extract',
											argument: [
												{ type: 'ident', value: 'href' }
											]
										},
										{
											type: 'PseudoClassSelector',
											identifier: 'qsx-extract',
											argument: [
												{
													type: 'ident',
													value: '.textContent'
												}
											]
										}
									]
								}
							}
						},
						{
							type: 'ComplexSelector',
							left: {
								type: 'ComplexSelector',
								left: {
									type: 'PseudoClassSelector',
									identifier: 'scope'
								},
								combinator: '+',
								right: {
									type: 'TypeSelector',
									identifier: 'dd'
								}
							},
							combinator: ' ',
							right: {
								type: 'PseudoClassSelector',
								identifier: 'qsx-extract',
								argument: [
									{ type: 'ident', value: '.textContent' }
								]
							}
						}
					]
				}
			}
		}
	},
	{
		selector: 'h2, h3',
		result: [
			{ type: 'TypeSelector', identifier: 'h2' },
			{ type: 'TypeSelector', identifier: 'h3' }
		]
	},
	{
		selector: '{ h2, h3 }',
		result: {
			type: 'PseudoClassSelector',
			identifier: '-qsx-select',
			argument: {
				type: 'SelectorList',
				selectors: [
					{ type: 'TypeSelector', identifier: 'h2' },
					{ type: 'TypeSelector', identifier: 'h3' }
				]
			}
		}
	},
	{
		selector: ':is(h2, h3)',
		result: {
			type: 'PseudoClassSelector',
			identifier: 'is',
			argument: {
				type: 'SelectorList',
				selectors: [
					{ type: 'TypeSelector', identifier: 'h2' },
					{ type: 'TypeSelector', identifier: 'h3' }
				]
			}
		}
	}
];

tape(
	'getAST() tests',
	t => {
		tests.forEach(item => {
			t.deepEqual(getAST(item.selector), item.result, item.selector);
		});
		t.end();
	},
	{ objectPrintDepth: 100 }
);

// tape('Syntax errors', t => {
// 	t.throws(() => {
// 		getAST('a { @href }}');
// 	}, /Unexpected \}/);

// 	t.throws(() => {
// 		getAST('li { @title, a { @href }');
// 	}, /Missing \}/);

// 	t.throws(() => {
// 		getAST('a:is(a, b))');
// 	}, /Unexpected \)/);

// 	t.throws(() => {
// 		getAST('li:not(a, b');
// 	}, /Missing \)/);

// 	t.throws(() => {
// 		getAST('a @{href}');
// 	}, /after \@/);

// 	t.throws(() => {
// 		getAST('a >>{href}');
// 	}, /after \>\>/);

// 	t.end();
// });

// tape('^ (first)', t => {
// 	t.deepEqual(
// 		astToJson(...getAST('a[href^="#"]')),
// 		{
// 			ctx: 'a[href^="#"]'
// 		},
// 		'ignore ^ unless first token'
// 	);

// 	t.deepEqual(
// 		astToJson(...getAST('a { ^ span }')),
// 		{
// 			ctx: 'a',
// 			children: [
// 				{
// 					ctx: 'span',
// 					first: true
// 				}
// 			]
// 		},
// 		'identify ^ as first'
// 	);

// 	t.end();
// });
