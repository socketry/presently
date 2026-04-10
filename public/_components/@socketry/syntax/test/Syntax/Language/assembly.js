/**
 * Tests for Assembly language definition
 */

import {test} from 'node:test';
import assert from 'node:assert';
import {JSDOM} from 'jsdom';

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;

import Syntax from '../../../Syntax.js';
import registerAssembly from '../../../Syntax/Language/assembly.js';
import {
	assertToken,
	assertTokenType,
	assertTokenCount,
	getMatchText
} from '../../helpers/ast-matcher.js';

test('Assembly language can be registered', async () => {
	const syntax = new Syntax();
	registerAssembly(syntax);
	const language = await syntax.getLanguage('assembly');
	assert.ok(language);
	assert.strictEqual(language.name, 'assembly');
});

test('Assembly can be registered with asm alias', async () => {
	const syntax = new Syntax();
	registerAssembly(syntax);
	const language = await syntax.getLanguage('asm');
	assert.ok(language);
	assert.strictEqual(language.name, 'assembly');
});

test('Assembly can match C-style comments', async () => {
	const syntax = new Syntax();
	registerAssembly(syntax);
	const language = await syntax.getLanguage('assembly');

	const code = '/* This is a comment */\nmov eax, ebx';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'comment', '/* This is a comment */');
});

test('Assembly can match C++-style comments', async () => {
	const syntax = new Syntax();
	registerAssembly(syntax);
	const language = await syntax.getLanguage('assembly');

	const code = '// This is a comment\nmov eax, ebx';
	const matches = await language.getMatches(syntax, code);

	const commentMatch = assertTokenType(matches, 'comment');
	const text = getMatchText(code, commentMatch);
	assert.ok(text.startsWith('//'));
});

test('Assembly can match directives', async () => {
	const syntax = new Syntax();
	registerAssembly(syntax);
	const language = await syntax.getLanguage('assembly');

	const code = '.text\n.global main\n.data';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'directive', '.text');
	assertToken(code, matches, 'directive', '.global');
	assertToken(code, matches, 'directive', '.data');
});

test('Assembly can match labels', async () => {
	const syntax = new Syntax();
	registerAssembly(syntax);
	const language = await syntax.getLanguage('assembly');

	const code = 'main:\n  mov eax, 0\nloop_start:\n  inc eax';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'label', 'main:');
	assertToken(code, matches, 'label', 'loop_start:');
});

test('Assembly can match instructions', async () => {
	const syntax = new Syntax();
	registerAssembly(syntax);
	const language = await syntax.getLanguage('assembly');

	const code = '  mov eax, ebx\n  add ecx, edx\n  ret';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'function', 'mov');
	assertToken(code, matches, 'function', 'add');
	assertToken(code, matches, 'function', 'ret');
});

test('Assembly can match registers', async () => {
	const syntax = new Syntax();
	registerAssembly(syntax);
	const language = await syntax.getLanguage('assembly');

	const code = 'mov %eax, %ebx\nadd %ecx, %edx';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'register', '%eax');
	assertToken(code, matches, 'register', '%ebx');
	assertToken(code, matches, 'register', '%ecx');
	assertToken(code, matches, 'register', '%edx');
});

test('Assembly can match decimal numbers', async () => {
	const syntax = new Syntax();
	registerAssembly(syntax);
	const language = await syntax.getLanguage('assembly');

	const code = 'mov eax, 42\nadd ebx, -10';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'constant', '42');
	assertToken(code, matches, 'constant', '-10');
});

test('Assembly can match hexadecimal numbers', async () => {
	const syntax = new Syntax();
	registerAssembly(syntax);
	const language = await syntax.getLanguage('assembly');

	const code = 'mov eax, 0xFF\nadd ebx, 0x10';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'constant', '0xFF');
	assertToken(code, matches, 'constant', '0x10');
});

test('Assembly can match single-quoted strings', async () => {
	const syntax = new Syntax();
	registerAssembly(syntax);
	const language = await syntax.getLanguage('assembly');

	const code = "db 'Hello'";
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'string', "'Hello'");
});

test('Assembly can match double-quoted strings', async () => {
	const syntax = new Syntax();
	registerAssembly(syntax);
	const language = await syntax.getLanguage('assembly');

	const code = 'db "World"';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'string', '"World"');
});

test('Assembly can match hash comments', async () => {
	const syntax = new Syntax();
	registerAssembly(syntax);
	const language = await syntax.getLanguage('assembly');

	const code = '# This is a comment\nmov eax, ebx';
	const matches = await language.getMatches(syntax, code);

	const commentMatch = assertTokenType(matches, 'comment');
	const text = getMatchText(code, commentMatch);
	assert.ok(text.startsWith('#'));
});

test('Assembly can match URLs', async () => {
	const syntax = new Syntax();
	registerAssembly(syntax);
	const language = await syntax.getLanguage('assembly');

	const code = '# See https://example.com/docs';
	const matches = await language.getMatches(syntax, code);

	assertToken(code, matches, 'href', 'https://example.com/docs');
});

test('Assembly can process code to HTML', async () => {
	const syntax = new Syntax();
	registerAssembly(syntax);
	const language = await syntax.getLanguage('assembly');

	const code = 'main:\n  mov eax, 0\n  ret';
	const html = await language.process(syntax, code);

	assert.ok(html.innerHTML.includes('label'));
	assert.ok(html.innerHTML.includes('main'));
	assert.ok(html.innerHTML.includes('function'));
	assert.ok(html.innerHTML.includes('mov'));
});

test('Assembly can build a syntax tree', async () => {
	const syntax = new Syntax();
	registerAssembly(syntax);
	const language = await syntax.getLanguage('assembly');

	const code = 'mov eax, 0';
	const tree = await language.buildTree(syntax, code, 0);

	assert.ok(tree);
	assert.strictEqual(tree.offset, 0);
	assert.strictEqual(tree.length, code.length);
});
