/**
 * Tests for YAML language definition
 */

import {test} from 'node:test';
import assert from 'node:assert';
import {JSDOM} from 'jsdom';

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;

import Syntax from '../../../Syntax.js';
import registerYaml from '../../../Syntax/Language/yaml.js';
import {
	assertToken,
	assertTokenType,
	assertTokenCount,
	getMatchText
} from '../../helpers/ast-matcher.js';

test('YAML language can be registered', async () => {
	const syntax = new Syntax();
	registerYaml(syntax);
	const language = await syntax.getLanguage('yaml');
	assert.ok(language);
	assert.strictEqual(language.name, 'yaml');
});

test('YAML can match comments', async () => {
	const syntax = new Syntax();
	registerYaml(syntax);
	const language = await syntax.getLanguage('yaml');

	const code = '# This is a comment\nkey: value';
	const matches = await language.getMatches(syntax, code);

	const commentMatch = assertTokenType(matches, 'comment');
	const text = getMatchText(code, commentMatch);
	assert.ok(text.startsWith('#'));
});

test('YAML can match single-quoted strings', async () => {
	const syntax = new Syntax();
	registerYaml(syntax);
	const language = await syntax.getLanguage('yaml');

	const code = "message: 'hello world'";
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'string', "'hello world'");
});

test('YAML can match double-quoted strings', async () => {
	const syntax = new Syntax();
	registerYaml(syntax);
	const language = await syntax.getLanguage('yaml');

	const code = 'message: "hello world"';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'string', '"hello world"');
});

test('YAML can match anchors and aliases', async () => {
	const syntax = new Syntax();
	registerYaml(syntax);
	const language = await syntax.getLanguage('yaml');

	const code = 'anchor: &ref value\nalias: *ref';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'constant', '&ref');
	assertToken(code, matches, 'constant', '*ref');
});

test('YAML can match keys', async () => {
	const syntax = new Syntax();
	registerYaml(syntax);
	const language = await syntax.getLanguage('yaml');

	const code = 'name: John\nage: 30';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'keyword', 'name');
	assertToken(code, matches, 'keyword', 'age');
});

test('YAML can match URLs', async () => {
	const syntax = new Syntax();
	registerYaml(syntax);
	const language = await syntax.getLanguage('yaml');

	const code = 'url: https://example.com/path';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'href', 'https://example.com/path');
});

test('YAML can process code to HTML', async () => {
	const syntax = new Syntax();
	registerYaml(syntax);
	const language = await syntax.getLanguage('yaml');

	const code = 'name: John';
	const html = await language.process(syntax, code);

	assert.ok(html.innerHTML.includes('keyword'));
	assert.ok(html.innerHTML.includes('name'));
});

test('YAML can build a syntax tree', async () => {
	const syntax = new Syntax();
	registerYaml(syntax);
	const language = await syntax.getLanguage('yaml');

	const code = 'key: value';
	const tree = await language.buildTree(syntax, code, 0);

	assert.ok(tree);
	assert.strictEqual(tree.offset, 0);
	assert.strictEqual(tree.length, code.length);
});
