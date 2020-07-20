import tape from "tape";
import { JSDOM } from "jsdom";
import qsx from "../index";

let doc = new JSDOM(`
	<dl>
		<dt><a href='#1' title='Go to term 1'>Term 1</a></dt>
		<dd><strong>Very</strong>Def 1</dd>

		<dt><a href='#wo' title='Go to term w/o'>Term w/o def</a></dt>
		
		<dt><a href='#2' title='Go to term 1'>Term 2</a></dt>
		<dd><strong>Very</strong>Def 2</dd>
		
	</dl>
`).window.document;

tape("qsx()", (t) => {
  t.deepEqual(qsx(doc, "dt { a, :scope + dd }"), [
    [
      [`<a href="#1" title="Go to term 1">Term 1</a>`],
      [`<dd><strong>Very</strong>Def 1</dd>`],
    ],
    [[`<a href="#wo" title="Go to term w/o">Term w/o def</a>`], []],
    [
      [`<a href="#2" title="Go to term 1">Term 2</a>`],
      [`<dd><strong>Very</strong>Def 2</dd>`],
    ],
  ]);

  t.deepEqual(qsx(doc, "a { @href }"), [
    { href: "#1" },
    { href: "#wo" },
    { href: "#2" },
  ]);
  t.end();
});
