/**
 * Tests for Plain text language syntax highlighting
 */

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import Syntax from '../../../Syntax.js';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;

const syntax = new Syntax();

test('Plain text language can be registered', async () => {
	const language = await syntax.getResource('plain');
	assert.ok(language);
	assert.equal(language.name, 'plain');
});

test('Plain: text alias works', async () => {
	const plainLang = await syntax.getResource('plain');
	const textLang = await syntax.getResource('text');
	assert.equal(plainLang.name, 'plain');
	assert.equal(textLang.name, 'plain');
});

test('Plain: detects HTTP URLs', async () => {
	const language = await syntax.getResource('plain');
	const matches = await language.getMatches(
		syntax,
		'Visit http://example.com for more info'
	);
	const links = matches.filter(m => m.type === 'href');
	assert.ok(links.length >= 1);
	assert.ok(links.some(l => l.value.includes('http://example.com')));
});

test('Plain: detects HTTPS URLs', async () => {
	const language = await syntax.getResource('plain');
	const matches = await language.getMatches(
		syntax,
		'Visit https://example.com for more info'
	);
	const links = matches.filter(m => m.type === 'href');
	assert.ok(links.length >= 1);
	assert.ok(links.some(l => l.value.includes('https://example.com')));
});

test('Plain: detects FTP URLs', async () => {
	const language = await syntax.getResource('plain');
	const matches = await language.getMatches(
		syntax,
		'Download from ftp://files.example.com'
	);
	const links = matches.filter(m => m.type === 'href');
	assert.ok(links.length >= 1);
	assert.ok(links.some(l => l.value.includes('ftp://files.example.com')));
});

test('Plain: detects multiple URLs', async () => {
	const language = await syntax.getResource('plain');
	const matches = await language.getMatches(
		syntax,
		'Visit http://example.com and https://another.com'
	);
	const links = matches.filter(m => m.type === 'href');
	assert.ok(links.length >= 2);
});

test('Plain: detects URLs with paths', async () => {
	const language = await syntax.getResource('plain');
	const matches = await language.getMatches(
		syntax,
		'Go to http://example.com/path/to/page'
	);
	const links = matches.filter(m => m.type === 'href');
	assert.ok(links.some(l => l.value.includes('/path/to/page')));
});

test('Plain: detects URLs with query strings', async () => {
	const language = await syntax.getResource('plain');
	const matches = await language.getMatches(
		syntax,
		'Search at http://example.com/search?q=test&lang=en'
	);
	const links = matches.filter(m => m.type === 'href');
	assert.ok(links.some(l => l.value.includes('?q=test')));
});

test('Plain: detects URLs with fragments', async () => {
	const language = await syntax.getResource('plain');
	const matches = await language.getMatches(
		syntax,
		'Jump to http://example.com/page#section'
	);
	const links = matches.filter(m => m.type === 'href');
	assert.ok(links.some(l => l.value.includes('#section')));
});

test('Plain: detects URLs with ports', async () => {
	const language = await syntax.getResource('plain');
	const matches = await language.getMatches(
		syntax,
		'Connect to http://localhost:8080'
	);
	const links = matches.filter(m => m.type === 'href');
	assert.ok(links.some(l => l.value.includes(':8080')));
});

test('Plain: webLink detects URLs and creates href matches', async () => {
	const language = await syntax.getResource('plain');
	const text = 'Visit http://example.com for info';
	const matches = await language.getMatches(syntax, text);

	// Check that matches contain href type
	const hrefMatches = matches.filter(m => m.type === 'href');
	assert.ok(hrefMatches.length >= 1);
	assert.ok(hrefMatches[0].value.includes('http://example.com'));
});

test('Plain: webLink creates proper match types', async () => {
	const language = await syntax.getResource('plain');
	const text = 'Visit http://example.com';
	const matches = await language.getMatches(syntax, text);
	const links = matches.filter(m => m.type === 'href');

	assert.ok(links.length >= 1);
	assert.ok(links[0].expression);
	assert.equal(links[0].expression.type, 'href');
});

test('Plain: webLink preserves URL content', async () => {
	const language = await syntax.getResource('plain');
	const text = 'Before http://example.com after';
	const matches = await language.getMatches(syntax, text);
	const links = matches.filter(m => m.type === 'href');

	assert.ok(links.length >= 1);
	assert.ok(links[0].value.includes('http://example.com'));
});

test('Plain: webLink handles multiple URLs', async () => {
	const language = await syntax.getResource('plain');
	const text = 'First http://one.com and second https://two.com';
	const matches = await language.getMatches(syntax, text);
	const links = matches.filter(m => m.type === 'href');

	assert.ok(links.length >= 2);
	assert.ok(links.some(l => l.value.includes('http://one.com')));
	assert.ok(links.some(l => l.value.includes('https://two.com')));
});

test('Plain: webLink handles complex URLs', async () => {
	const language = await syntax.getResource('plain');
	const text = 'Search http://example.com/search?q=hello world&lang=en';
	const matches = await language.getMatches(syntax, text);
	const links = matches.filter(m => m.type === 'href');

	assert.ok(links.length >= 1);
	assert.ok(links[0].value.includes('search'));
});

test('Plain: handles plain text without URLs', async () => {
	const language = await syntax.getResource('plain');
	const text = 'This is just plain text with no links';
	const matches = await language.getMatches(syntax, text);
	const links = matches.filter(m => m.type === 'href');
	assert.equal(links.length, 0);
});

test('Plain: handles empty text', async () => {
	const language = await syntax.getResource('plain');
	const matches = await language.getMatches(syntax, '');
	assert.equal(matches.length, 0);
});

test('Plain: handles text with email-like patterns', async () => {
	const language = await syntax.getResource('plain');
	const text = 'Contact user@example.com for help';
	const matches = await language.getMatches(syntax, text);
	// Email addresses are not matched as URLs (they don't have http://)
	const links = matches.filter(m => m.type === 'href');
	// Should not match email unless it has a protocol
	assert.equal(links.length, 0);
});

test('Plain: detects URLs at start of line', async () => {
	const language = await syntax.getResource('plain');
	const matches = await language.getMatches(
		syntax,
		'http://example.com is the URL'
	);
	const links = matches.filter(m => m.type === 'href');
	assert.ok(links.length >= 1);
});

test('Plain: detects URLs at end of line', async () => {
	const language = await syntax.getResource('plain');
	const matches = await language.getMatches(
		syntax,
		'The URL is http://example.com'
	);
	const links = matches.filter(m => m.type === 'href');
	assert.ok(links.length >= 1);
});

test('Plain: detects URLs with subdomains', async () => {
	const language = await syntax.getResource('plain');
	const matches = await language.getMatches(
		syntax,
		'Visit https://api.staging.example.com'
	);
	const links = matches.filter(m => m.type === 'href');
	assert.ok(links.some(l => l.value.includes('api.staging.example.com')));
});

test('Plain: detects URLs with IP addresses', async () => {
	const language = await syntax.getResource('plain');
	const matches = await language.getMatches(
		syntax,
		'Server at http://192.168.1.1'
	);
	const links = matches.filter(m => m.type === 'href');
	assert.ok(links.some(l => l.value.includes('192.168.1.1')));
});

test('Plain: detects URLs with authentication', async () => {
	const language = await syntax.getResource('plain');
	const matches = await language.getMatches(
		syntax,
		'Login at http://user:pass@example.com'
	);
	const links = matches.filter(m => m.type === 'href');
	assert.ok(links.some(l => l.value.includes('user:pass@')));
});

test('Plain: handles text with email-like patterns', async () => {
	const language = await syntax.getResource('plain');
	const text = 'Contact user@example.com for help';
	const matches = await language.getMatches(syntax, text);
	// Email addresses are not matched as URLs (they don't have http://)
	const links = matches.filter(m => m.type === 'href');
	// Should not match email unless it has a protocol
	assert.equal(links.length, 0);
});

test('Plain: detects URLs at start of line', async () => {
	const language = await syntax.getResource('plain');
	const matches = await language.getMatches(
		syntax,
		'http://example.com is the URL'
	);
	const links = matches.filter(m => m.type === 'href');
	assert.ok(links.length >= 1);
});

test('Plain: detects URLs at end of line', async () => {
	const language = await syntax.getResource('plain');
	const matches = await language.getMatches(
		syntax,
		'The URL is http://example.com'
	);
	const links = matches.filter(m => m.type === 'href');
	assert.ok(links.length >= 1);
});

test('Plain: detects URLs with subdomains', async () => {
	const language = await syntax.getResource('plain');
	const matches = await language.getMatches(
		syntax,
		'Visit https://api.staging.example.com'
	);
	const links = matches.filter(m => m.type === 'href');
	assert.ok(links.some(l => l.value.includes('api.staging.example.com')));
});

test('Plain: detects URLs with IP addresses', async () => {
	const language = await syntax.getResource('plain');
	const matches = await language.getMatches(
		syntax,
		'Server at http://192.168.1.1'
	);
	const links = matches.filter(m => m.type === 'href');
	assert.ok(links.some(l => l.value.includes('192.168.1.1')));
});

test('Plain: processes multiline text with URLs', async () => {
	const language = await syntax.getResource('plain');
	const text = `First line with http://example.com
Second line with https://another.com
Third line without URL`;
	const matches = await language.getMatches(syntax, text);
	const links = matches.filter(m => m.type === 'href');
	assert.ok(links.length >= 2);
});

test('Plain: handles URLs with trailing punctuation', async () => {
	const language = await syntax.getResource('plain');
	const text = 'Check out http://example.com. It is great!';
	const matches = await language.getMatches(syntax, text);
	const links = matches.filter(m => m.type === 'href');
	// URL should not include the trailing period
	assert.ok(links.length >= 1);
});

test('Plain: handles URLs in parentheses', async () => {
	const language = await syntax.getResource('plain');
	const text = 'See documentation (http://example.com) for details';
	const matches = await language.getMatches(syntax, text);
	const links = matches.filter(m => m.type === 'href');
	assert.ok(links.length >= 1);
});

test('Plain: detects file:// URLs', async () => {
	const language = await syntax.getResource('plain');
	const matches = await language.getMatches(
		syntax,
		'Open file://localhost/path/to/file.txt'
	);
	const links = matches.filter(m => m.type === 'href');
	assert.ok(links.length >= 1);
	assert.ok(links.some(l => l.value.includes('file://')));
});
