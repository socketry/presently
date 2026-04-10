/**
 * Tests for Diff language syntax highlighting
 */

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import Syntax from '../../../Syntax.js';

// Set up JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;

const syntax = new Syntax();

test('Diff language can be registered', async () => {
	const language = await syntax.getResource('diff');
	assert.ok(language);
	assert.equal(language.name, 'diff');
});

test('Diff can be registered with patch alias', async () => {
	const diff = await syntax.getResource('diff');
	const patch = await syntax.getResource('patch');
	assert.equal(diff, patch);
});

test('Diff can match added file headers (+++)', async () => {
	const language = await syntax.getResource('diff');
	const matches = await language.getMatches(syntax, '+++ b/file.txt');
	assert.ok(matches.length > 0);
	const match = matches.find(m => m.type === 'add');
	assert.ok(match);
	assert.equal(match.value, '+++ b/file.txt');
});

test('Diff can match removed file headers (---)', async () => {
	const language = await syntax.getResource('diff');
	const matches = await language.getMatches(syntax, '--- a/file.txt');
	assert.ok(matches.length > 0);
	const match = matches.find(m => m.type === 'del');
	assert.ok(match);
	assert.equal(match.value, '--- a/file.txt');
});

test('Diff can match chunk headers (@@)', async () => {
	const language = await syntax.getResource('diff');
	const matches = await language.getMatches(syntax, '@@ -1,3 +1,4 @@');
	assert.ok(matches.length > 0);
	const match = matches.find(m => m.type === 'offset');
	assert.ok(match);
	assert.equal(match.value, '@@ -1,3 +1,4 @@');
});

test('Diff can match chunk headers with context', async () => {
	const language = await syntax.getResource('diff');
	const matches = await language.getMatches(
		syntax,
		'@@ -10,7 +10,8 @@ function test() {'
	);
	assert.ok(matches.length > 0);
	const match = matches.find(m => m.type === 'offset');
	assert.ok(match);
	assert.ok(match.value.includes('@@'));
});

test('Diff can match inserted lines', async () => {
	const language = await syntax.getResource('diff');
	const matches = await language.getMatches(syntax, '+This line was added');
	assert.ok(matches.length > 0);
	const match = matches.find(m => m.type === 'insert');
	assert.ok(match);
	assert.equal(match.value, '+This line was added');
});

test('Diff can match removed lines', async () => {
	const language = await syntax.getResource('diff');
	const matches = await language.getMatches(syntax, '-This line was removed');
	assert.ok(matches.length > 0);
	const match = matches.find(m => m.type === 'remove');
	assert.ok(match);
	assert.equal(match.value, '-This line was removed');
});

test('Diff does not match +++ as insert', async () => {
	const language = await syntax.getResource('diff');
	const matches = await language.getMatches(syntax, '+++ b/file.txt');
	const insert = matches.find(m => m.type === 'insert');
	assert.ok(!insert, 'Should not match +++ as insert');
	const add = matches.find(m => m.type === 'add');
	assert.ok(add, 'Should match +++ as add');
});

test('Diff does not match --- as remove', async () => {
	const language = await syntax.getResource('diff');
	const matches = await language.getMatches(syntax, '--- a/file.txt');
	const remove = matches.find(m => m.type === 'remove');
	assert.ok(!remove, 'Should not match --- as remove');
	const del = matches.find(m => m.type === 'del');
	assert.ok(del, 'Should match --- as del');
});

test('Diff can process complete diff to HTML', async () => {
	const language = await syntax.getResource('diff');
	const diff = `--- a/test.js
+++ b/test.js
@@ -1,3 +1,4 @@
 function hello() {
-  console.log("old");
+  console.log("new");
+  return true;
 }`;

	const html = await language.process(syntax, diff);
	assert.ok(html instanceof HTMLElement);
	const text = html.textContent;
	assert.ok(text.includes('hello'));
	assert.ok(text.includes('old'));
	assert.ok(text.includes('new'));
});

test('Diff highlights file headers correctly', async () => {
	const language = await syntax.getResource('diff');
	const diff = `--- a/README.md
+++ b/README.md`;

	const html = await language.process(syntax, diff);
	const htmlStr = html.innerHTML;
	assert.ok(htmlStr.includes('del'));
	assert.ok(htmlStr.includes('add'));
	assert.ok(htmlStr.includes('README.md'));
});

test('Diff highlights multiple chunks', async () => {
	const language = await syntax.getResource('diff');
	const diff = `@@ -1,2 +1,2 @@
-old line 1
+new line 1
@@ -10,2 +10,3 @@
 context
+added line`;

	const html = await language.process(syntax, diff);
	const htmlStr = html.innerHTML;
	assert.ok(htmlStr.includes('offset'));
	assert.ok(htmlStr.includes('remove'));
	assert.ok(htmlStr.includes('insert'));
});

test('Diff can build a syntax tree', async () => {
	const language = await syntax.getResource('diff');
	const diff = `--- a/file.txt
+++ b/file.txt
@@ -1 +1 @@
-old
+new`;

	const tree = await language.buildTree(syntax, diff, 0);
	assert.ok(tree);
	assert.ok(tree.children.length > 0);
});

test('Diff handles empty lines correctly', async () => {
	const language = await syntax.getResource('diff');
	const diff = ` unchanged line
+added line
 another unchanged`;

	const html = await language.process(syntax, diff);
	const text = html.textContent;
	assert.ok(text.includes('unchanged'));
	assert.ok(text.includes('added'));
});

test('Diff handles context lines (no prefix)', async () => {
	const language = await syntax.getResource('diff');
	const matches = await language.getMatches(syntax, ' context line');
	// Context lines (starting with space) should not have special highlighting
	const specialMatches = matches.filter(m =>
		['insert', 'remove', 'add', 'del', 'offset'].includes(m.type)
	);
	assert.equal(specialMatches.length, 0);
});

test('Diff processes realistic git diff', async () => {
	const language = await syntax.getResource('diff');
	const diff = `diff --git a/src/main.js b/src/main.js
index 1234567..abcdefg 100644
--- a/src/main.js
+++ b/src/main.js
@@ -15,6 +15,7 @@ function initialize() {
   config.load();
   database.connect();
+  logger.init();
   server.start();
 }`;

	const html = await language.process(syntax, diff);
	assert.ok(html instanceof HTMLElement);
	const htmlStr = html.innerHTML;
	assert.ok(htmlStr.includes('main.js'));
	assert.ok(htmlStr.includes('initialize'));
});
