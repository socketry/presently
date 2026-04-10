/**
 * Tests for Apache language definition
 */

import {test} from 'node:test';
import assert from 'node:assert';
import {JSDOM} from 'jsdom';

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;

import Syntax from '../../../Syntax.js';
import registerApache from '../../../Syntax/Language/apache.js';
import {
	assertToken,
	assertTokenType,
	assertTokenCount,
	getMatchText
} from '../../helpers/ast-matcher.js';

test('Apache language can be registered', async () => {
	const syntax = new Syntax();
	registerApache(syntax);
	const language = await syntax.getLanguage('apache');
	assert.ok(language);
	assert.strictEqual(language.name, 'apache');
});

test('Apache can match opening tags', async () => {
	const syntax = new Syntax();
	registerApache(syntax);
	const language = await syntax.getLanguage('apache');

	const code = '<VirtualHost *:80>';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'tag', '<VirtualHost *:80>');
	assertToken(code, matches, 'tag-name', 'VirtualHost');
});

test('Apache can match closing tags', async () => {
	const syntax = new Syntax();
	registerApache(syntax);
	const language = await syntax.getLanguage('apache');

	const code = '</VirtualHost>';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'tag', '</VirtualHost>');
	assertToken(code, matches, 'tag-name', 'VirtualHost');
});

test('Apache can match directives', async () => {
	const syntax = new Syntax();
	registerApache(syntax);
	const language = await syntax.getLanguage('apache');

	const code = '  ServerName example.com\n  DocumentRoot /var/www';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'function', 'ServerName');
	assertToken(code, matches, 'function', 'DocumentRoot');
});

test('Apache can match comments', async () => {
	const syntax = new Syntax();
	registerApache(syntax);
	const language = await syntax.getLanguage('apache');

	const code = '# This is a comment\nServerName example.com';
	const matches = await language.getMatches(syntax, code);

	const commentMatch = assertTokenType(matches, 'comment');
	const text = getMatchText(code, commentMatch);
	assert.ok(text.startsWith('#'));
});

test('Apache can match single-quoted strings', async () => {
	const syntax = new Syntax();
	registerApache(syntax);
	const language = await syntax.getLanguage('apache');

	const code = "ErrorLog 'logs/error.log'";
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'string', "'logs/error.log'");
});

test('Apache can match double-quoted strings', async () => {
	const syntax = new Syntax();
	registerApache(syntax);
	const language = await syntax.getLanguage('apache');

	const code = 'ErrorLog "logs/error.log"';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'string', '"logs/error.log"');
});

test('Apache can match URLs', async () => {
	const syntax = new Syntax();
	registerApache(syntax);
	const language = await syntax.getLanguage('apache');

	const code = 'Redirect https://example.com/new';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'href', 'https://example.com/new');
});

test('Apache can process code to HTML', async () => {
	const syntax = new Syntax();
	registerApache(syntax);
	const language = await syntax.getLanguage('apache');

	const code = '<VirtualHost *:80>\n  ServerName example.com\n</VirtualHost>';
	const html = await language.process(syntax, code);

	assert.ok(html.innerHTML.includes('tag'));
	assert.ok(html.innerHTML.includes('VirtualHost'));
	assert.ok(html.innerHTML.includes('function'));
	assert.ok(html.innerHTML.includes('ServerName'));
});

test('Apache creates documentation links for directives', async () => {
	const syntax = new Syntax();
	registerApache(syntax);
	const language = await syntax.getLanguage('apache');

	const code = '  ServerName example.com';
	const html = await language.process(syntax, code);

	// Should have link to Apache documentation
	const links = html.querySelectorAll('a.function');
	assert.ok(links.length > 0);
	assert.ok(links[0].href.includes('httpd.apache.org'));
	assert.ok(links[0].href.includes('ServerName'));
	assert.strictEqual(links[0].textContent, 'ServerName');
});

test('Apache can build a syntax tree', async () => {
	const syntax = new Syntax();
	registerApache(syntax);
	const language = await syntax.getLanguage('apache');

	const code = 'ServerName example.com';
	const tree = await language.buildTree(syntax, code, 0);

	assert.ok(tree);
	assert.strictEqual(tree.offset, 0);
	assert.strictEqual(tree.length, code.length);
});
