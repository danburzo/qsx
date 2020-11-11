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
	},

	/*
		Tests for ^ (first)
	 */
	{
		selector: 'a[href^="#"]',
		result: {
			type: 'CompoundSelector',
			selectors: [
				{ type: 'TypeSelector', identifier: 'a' },
				{
					type: 'AttributeSelector',
					identifier: 'href',
					matcher: '^=',
					value: '#'
				}
			]
		}
	},
	{
		selector: 'a { ^ span }',
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
							left: null,
							combinator: '^',
							right: { type: 'TypeSelector', identifier: 'span' }
						}
					]
				}
			}
		}
	},

	/*
		Tolerated syntaxes
	 */

	{
		selector: 'li { @title, a { @href }',
		result: {
			type: 'ComplexSelector',
			left: { type: 'TypeSelector', identifier: 'li' },
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
							argument: [{ type: 'ident', value: 'title' }]
						},
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
										}
									]
								}
							}
						}
					]
				}
			}
		}
	},

	/*
		Syntax errors
	 */
	{
		selector: 'a { @href }}',
		result: /Unexpected token \)/
		// TODO should show error in original selector
	},
	{
		selector: 'a:is(a, b))',
		result: /Unexpected token \)/
	}
	// TODO: these should be rejected by an AST validator
	// {
	// 	selector: 'a @{href}',
	// 	result: {}
	// },
	// {
	// 	selector: 'a >>{href}',
	// 	result: {}
	// }
];

tape(
	'getAST() tests',
	t => {
		tests.forEach(item => {
			let desc = item.description || item.selector;
			if (item.result instanceof RegExp) {
				t.throws(
					() => {
						getAST(item.selector);
					},
					item.result,
					desc
				);
			} else {
				t.deepEqual(getAST(item.selector), item.result, desc);
			}
		});
		t.end();
	},
	{ objectPrintDepth: 100 }
);
