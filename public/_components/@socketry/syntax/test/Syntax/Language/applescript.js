/**
 * Tests for AppleScript language definition
 */

import {test} from 'node:test';
import assert from 'node:assert';
import {JSDOM} from 'jsdom';

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;

import Syntax from '../../../Syntax.js';
import registerAppleScript from '../../../Syntax/Language/applescript.js';
import {
	assertToken,
	assertTokenType,
	assertTokenCount,
	getMatchText
} from '../../helpers/ast-matcher.js';

test('AppleScript language can be registered', async () => {
	const syntax = new Syntax();
	registerAppleScript(syntax);
	const language = await syntax.getLanguage('applescript');
	assert.ok(language);
	assert.strictEqual(language.name, 'applescript');
});

test('AppleScript can match basic keywords', async () => {
	const syntax = new Syntax();
	registerAppleScript(syntax);
	const language = await syntax.getLanguage('applescript');

	const code = 'set x to 5\nreturn x';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'keyword', 'set');
	assertToken(code, matches, 'keyword', 'to');
	assertToken(code, matches, 'keyword', 'return');
});

test('AppleScript can match ordinal keywords', async () => {
	const syntax = new Syntax();
	registerAppleScript(syntax);
	const language = await syntax.getLanguage('applescript');

	const code = 'first item of myList';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'keyword', 'first');
});

test('AppleScript can match special keywords', async () => {
	const syntax = new Syntax();
	registerAppleScript(syntax);
	const language = await syntax.getLanguage('applescript');

	const code = 'activate application "Safari"\nset x to true\nset y to false';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'keyword', 'activate');
	assertToken(code, matches, 'keyword', 'true');
	assertToken(code, matches, 'keyword', 'false');
});

test('AppleScript can match double-dash comments', async () => {
	const syntax = new Syntax();
	registerAppleScript(syntax);
	const language = await syntax.getLanguage('applescript');

	const code = '-- This is a comment\nset x to 1';
	const matches = await language.getMatches(syntax, code);

	const commentMatch = assertTokenType(matches, 'comment');
	const text = getMatchText(code, commentMatch);
	assert.ok(text.startsWith('--'));
});

test('AppleScript can match hash comments', async () => {
	const syntax = new Syntax();
	registerAppleScript(syntax);
	const language = await syntax.getLanguage('applescript');

	const code = '# This is a comment\nset x to 1';
	const matches = await language.getMatches(syntax, code);

	const commentMatch = assertTokenType(matches, 'comment');
	const text = getMatchText(code, commentMatch);
	assert.ok(text.startsWith('#'));
});

test('AppleScript can match block comments', async () => {
	const syntax = new Syntax();
	registerAppleScript(syntax);
	const language = await syntax.getLanguage('applescript');

	const code = '(* This is a block comment *)\nset x to 1';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'comment', '(* This is a block comment *)');
});

test('AppleScript can match double-quoted strings', async () => {
	const syntax = new Syntax();
	registerAppleScript(syntax);
	const language = await syntax.getLanguage('applescript');

	const code = 'set msg to "Hello World"';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'string', '"Hello World"');
});

test('AppleScript can match ordinal numbers', async () => {
	const syntax = new Syntax();
	registerAppleScript(syntax);
	const language = await syntax.getLanguage('applescript');

	const code = '1st item, 2nd item, 3rd item, 4th item';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'constant', '1st');
	assertToken(code, matches, 'constant', '2nd');
	assertToken(code, matches, 'constant', '3rd');
	assertToken(code, matches, 'constant', '4th');
});

test('AppleScript can match decimal numbers', async () => {
	const syntax = new Syntax();
	registerAppleScript(syntax);
	const language = await syntax.getLanguage('applescript');

	const code = 'set x to 42\nset y to 3.14';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'constant', '42');
	assertToken(code, matches, 'constant', '3.14');
});

test('AppleScript can match operators', async () => {
	const syntax = new Syntax();
	registerAppleScript(syntax);
	const language = await syntax.getLanguage('applescript');

	const code = 'set x to 5 + 3 * 2';
	const matches = await language.getMatches(syntax, code);

	assertTokenCount(matches, 'operator', 2); // + and *
});

test('AppleScript can match control flow keywords', async () => {
	const syntax = new Syntax();
	registerAppleScript(syntax);
	const language = await syntax.getLanguage('applescript');

	const code = 'if x is equal to 5 then\nend if';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'keyword', 'if');
	assertToken(code, matches, 'keyword', 'is equal to');
});

test('AppleScript can match URLs', async () => {
	const syntax = new Syntax();
	registerAppleScript(syntax);
	const language = await syntax.getLanguage('applescript');

	const code = 'open location "https://example.com"';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'href', 'https://example.com');
});

test('AppleScript can process code to HTML', async () => {
	const syntax = new Syntax();
	registerAppleScript(syntax);
	const language = await syntax.getLanguage('applescript');

	const code = 'set x to 5';
	const html = await language.process(syntax, code);

	assert.ok(html.innerHTML.includes('keyword'));
	assert.ok(html.innerHTML.includes('set'));
});

test('AppleScript can build a syntax tree', async () => {
	const syntax = new Syntax();
	registerAppleScript(syntax);
	const language = await syntax.getLanguage('applescript');

	const code = 'set x to 5';
	const tree = await language.buildTree(syntax, code, 0);

	assert.ok(tree);
	assert.strictEqual(tree.offset, 0);
	assert.strictEqual(tree.length, code.length);
});
