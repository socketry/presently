/**
 * Tests for Python language definition
 */

import {test} from 'node:test';
import assert from 'node:assert';
import {JSDOM} from 'jsdom';

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;

import Syntax from '../../../Syntax.js';
import registerPython from '../../../Syntax/Language/python.js';
import {
	assertToken,
	assertTokenType,
	assertTokenCount,
	getMatchText
} from '../../helpers/ast-matcher.js';

test('Python language can be registered', async () => {
	const syntax = new Syntax();
	registerPython(syntax);
	const language = await syntax.getLanguage('python');
	assert.ok(language);
	assert.strictEqual(language.name, 'python');
});

test('Python can match keywords', async () => {
	const syntax = new Syntax();
	registerPython(syntax);
	const language = await syntax.getLanguage('python');

	const code = 'def foo():\n    return True';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'keyword', 'def');
	assertToken(code, matches, 'keyword', 'return');
});

test('Python can match builtin functions', async () => {
	const syntax = new Syntax();
	registerPython(syntax);
	const language = await syntax.getLanguage('python');

	const code = 'len(list)';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'builtin', 'len');
	assertToken(code, matches, 'builtin', 'list');
});

test('Python can match decorators', async () => {
	const syntax = new Syntax();
	registerPython(syntax);
	const language = await syntax.getLanguage('python');

	const code = '@property\ndef foo(self):\n    pass';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'decorator', '@property');
});

test('Python can match constants', async () => {
	const syntax = new Syntax();
	registerPython(syntax);
	const language = await syntax.getLanguage('python');

	const code = 'x = True\ny = False\nz = None\nself.value = 42';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'constant', 'True');
	assertToken(code, matches, 'constant', 'False');
	assertToken(code, matches, 'constant', 'None');
	assertToken(code, matches, 'constant', 'self');
});

test('Python can match single-quoted strings', async () => {
	const syntax = new Syntax();
	registerPython(syntax);
	const language = await syntax.getLanguage('python');

	const code = "s = 'hello world'";
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'string', "'hello world'");
});

test('Python can match double-quoted strings', async () => {
	const syntax = new Syntax();
	registerPython(syntax);
	const language = await syntax.getLanguage('python');

	const code = 's = "hello world"';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'string', '"hello world"');
});

test('Python can match triple-quoted strings (docstrings)', async () => {
	const syntax = new Syntax();
	registerPython(syntax);
	const language = await syntax.getLanguage('python');

	const code = '"""This is a docstring"""';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'comment', '"""This is a docstring"""');
});

test('Python can match hash comments', async () => {
	const syntax = new Syntax();
	registerPython(syntax);
	const language = await syntax.getLanguage('python');

	const code = '# This is a comment\nx = 1';
	const matches = await language.getMatches(syntax, code);

	const commentMatch = assertTokenType(matches, 'comment');
	const text = getMatchText(code, commentMatch);
	assert.ok(text.startsWith('#'));
});

test('Python can match operators', async () => {
	const syntax = new Syntax();
	registerPython(syntax);
	const language = await syntax.getLanguage('python');

	const code = 'x += y * 2';
	const matches = await language.getMatches(syntax, code);

	assertTokenCount(matches, 'operator', 2); // At least += and *
});

test('Python can match numbers', async () => {
	const syntax = new Syntax();
	registerPython(syntax);
	const language = await syntax.getLanguage('python');

	const code = 'x = 42\ny = 3.14\nz = 0xFF';
	const matches = await language.getMatches(syntax, code);

	const constants = assertTokenCount(matches, 'constant', 3);
	const texts = constants.map(m => getMatchText(code, m));
	assert.ok(texts.includes('42'));
	assert.ok(texts.includes('3.14'));
	assert.ok(texts.includes('0xFF'));
});

test('Python can match CamelCase class names', async () => {
	const syntax = new Syntax();
	registerPython(syntax);
	const language = await syntax.getLanguage('python');

	const code = 'class MyClass:\n    pass';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'type', 'MyClass');
});

test('Python can match function calls', async () => {
	const syntax = new Syntax();
	registerPython(syntax);
	const language = await syntax.getLanguage('python');

	const code = 'result = my_function(arg)';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'function', 'my_function');
});

test('Python can process code to HTML', async () => {
	const syntax = new Syntax();
	registerPython(syntax);
	const language = await syntax.getLanguage('python');

	const code = 'def foo():\n    return True';
	const html = await language.process(syntax, code);

	assert.ok(html.innerHTML.includes('keyword'));
	assert.ok(html.innerHTML.includes('def'));
	assert.ok(html.innerHTML.includes('return'));
});

test('Python can build a syntax tree', async () => {
	const syntax = new Syntax();
	registerPython(syntax);
	const language = await syntax.getLanguage('python');

	const code = 'x = 42';
	const tree = await language.buildTree(syntax, code, 0);

	assert.ok(tree);
	assert.strictEqual(tree.offset, 0);
	assert.strictEqual(tree.length, code.length);
});

test('Python creates documentation links for functions', async () => {
	const syntax = new Syntax();
	registerPython(syntax);
	const language = await syntax.getLanguage('python');

	const code = 'len(list)';
	const html = await language.process(syntax, code);

	// Should have links to Python documentation
	const links = html.querySelectorAll('a.builtin');
	assert.strictEqual(links.length, 2);
	assert.ok(links[0].href.includes('docs.python.org'));
	assert.ok(links[0].href.includes('len'));
	assert.strictEqual(links[0].textContent, 'len');
});
