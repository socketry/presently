/**
 * Tests for XML language syntax highlighting
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

test('XML language can be registered', async () => {
	const language = await syntax.getResource('xml');
	assert.ok(language);
	assert.equal(language.name, 'xml');
});

test('xml-tag language can be registered', async () => {
	const language = await syntax.getResource('xml-tag');
	assert.ok(language);
	assert.equal(language.name, 'xml-tag');
});

test('XML can match opening tags', async () => {
	const language = await syntax.getResource('xml');
	const matches = await language.getMatches(syntax, '<root>');
	assert.ok(matches.some(m => m.value === '<root>'));
});

test('XML can match closing tags', async () => {
	const language = await syntax.getResource('xml');
	const matches = await language.getMatches(syntax, '</root>');
	assert.ok(matches.some(m => m.value === '</root>'));
});

test('XML can match self-closing tags', async () => {
	const language = await syntax.getResource('xml');
	const matches = await language.getMatches(syntax, '<element/>');
	assert.ok(matches.some(m => m.value === '<element/>'));
});

test('XML can match tags with namespace', async () => {
	const language = await syntax.getResource('xml');
	const matches = await language.getMatches(syntax, '<ns:element>');
	assert.ok(matches.some(m => m.value === '<ns:element>'));
});

test('XML can match tags with attributes', async () => {
	const language = await syntax.getResource('xml');
	const matches = await language.getMatches(syntax, '<element attr="value">');
	assert.ok(matches.some(m => m.value === '<element attr="value">'));
});

test('XML can match entities', async () => {
	const language = await syntax.getResource('xml');
	const matches = await language.getMatches(syntax, '&nbsp; &lt; &gt; &amp;');
	const entities = matches.filter(m => m.type === 'entity');
	assert.ok(entities.some(m => m.value === '&nbsp;'));
	assert.ok(entities.some(m => m.value === '&lt;'));
	assert.ok(entities.some(m => m.value === '&gt;'));
	assert.ok(entities.some(m => m.value === '&amp;'));
});

test('XML can match CDATA sections', async () => {
	const language = await syntax.getResource('xml');
	const matches = await language.getMatches(syntax, '<![CDATA[some data]]>');
	const cdata = matches.filter(m => m.type === 'cdata');
	assert.ok(cdata.length > 0);
});

test('XML can match CDATA with special chars', async () => {
	const language = await syntax.getResource('xml');
	const matches = await language.getMatches(syntax, '<![CDATA[<>&"\']]>');
	const cdata = matches.filter(m => m.type === 'cdata');
	assert.ok(cdata.length > 0);
});

test('XML can match comments', async () => {
	const language = await syntax.getResource('xml');
	const matches = await language.getMatches(syntax, '<!-- comment -->');
	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.length > 0);
});

test('XML can match multi-line comments', async () => {
	const language = await syntax.getResource('xml');
	const matches = await language.getMatches(
		syntax,
		'<!-- multi\nline\ncomment -->'
	);
	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.length > 0);
});

test('XML can match percent escapes', async () => {
	const language = await syntax.getResource('xml');
	const matches = await language.getMatches(syntax, '%20%2F%3A');
	const escapes = matches.filter(m => m.type === 'percent-escape');
	assert.ok(escapes.some(m => m.value === '%20'));
	assert.ok(escapes.some(m => m.value === '%2F'));
	assert.ok(escapes.some(m => m.value === '%3A'));
});

test('XML can match URLs', async () => {
	const language = await syntax.getResource('xml');
	const matches = await language.getMatches(syntax, 'http://example.com/path');
	const urls = matches.filter(m => m.type === 'href');
	assert.ok(urls.some(m => m.value === 'http://example.com/path'));
});

test('xml-tag can match tag names', async () => {
	const xmlTag = await syntax.getResource('xml-tag');
	const matches = await xmlTag.getMatches(syntax, '<element>');
	const tagNames = matches.filter(m => m.type === 'tag-name');
	assert.ok(tagNames.some(m => m.value === 'element'));
});

test('xml-tag can match namespaces', async () => {
	const xmlTag = await syntax.getResource('xml-tag');
	const matches = await xmlTag.getMatches(syntax, '<ns:element>');
	const namespaces = matches.filter(m => m.type === 'namespace');
	assert.ok(namespaces.some(m => m.value === 'ns:'));
});

test('xml-tag can match attributes', async () => {
	const xmlTag = await syntax.getResource('xml-tag');
	const matches = await xmlTag.getMatches(syntax, '<element attr="value">');
	const attributes = matches.filter(m => m.type === 'attribute');
	assert.ok(attributes.some(m => m.value === 'attr'));
});

test('xml-tag can match attribute values', async () => {
	const xmlTag = await syntax.getResource('xml-tag');
	const matches = await xmlTag.getMatches(syntax, '<element attr="value">');
	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.some(m => m.value === '"value"'));
});

test('xml-tag can match single-quoted attributes', async () => {
	const xmlTag = await syntax.getResource('xml-tag');
	const matches = await xmlTag.getMatches(syntax, "<element attr='value'>");
	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.some(m => m.value === "'value'"));
});

test('xml-tag can match unquoted attributes', async () => {
	const xmlTag = await syntax.getResource('xml-tag');
	const matches = await xmlTag.getMatches(syntax, '<element attr=value>');
	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.some(m => m.value === 'value'));
});

test('XML can process complete document', async () => {
	const language = await syntax.getResource('xml');
	const code = `<?xml version="1.0"?>
<root xmlns:ns="http://example.com">
	<!-- Comment -->
	<element attr="value">text &amp; entity</element>
	<ns:element/>
	<![CDATA[<raw>data</raw>]]>
</root>`;
	const matches = await language.getMatches(syntax, code);
	assert.ok(matches.length > 0);
});
