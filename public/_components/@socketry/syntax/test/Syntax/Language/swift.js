/**
 * Tests for Swift language syntax highlighting
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

test('Swift language can be registered', async () => {
	const language = await syntax.getResource('swift');
	assert.ok(language);
	assert.equal(language.name, 'swift');
});

test('Swift can match keywords', async () => {
	const language = await syntax.getResource('swift');
	const matches = await language.getMatches(
		syntax,
		'class MyClass func test() { if true { } }'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'class'));
	assert.ok(keywords.some(m => m.value === 'func'));
	assert.ok(keywords.some(m => m.value === 'if'));
});

test('Swift can match access modifiers', async () => {
	const language = await syntax.getResource('swift');
	const matches = await language.getMatches(
		syntax,
		'public class A private var b'
	);
	const access = matches.filter(m => m.type === 'access');
	assert.ok(access.some(m => m.value === 'public'));
	assert.ok(access.some(m => m.value === 'private'));
});

test('Swift can match constants', async () => {
	const language = await syntax.getResource('swift');
	const matches = await language.getMatches(
		syntax,
		'let a = true, b = false, c = nil'
	);
	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(m => m.value === 'true'));
	assert.ok(constants.some(m => m.value === 'false'));
	assert.ok(constants.some(m => m.value === 'nil'));
});

test('Swift can match backtick identifiers', async () => {
	const language = await syntax.getResource('swift');
	const matches = await language.getMatches(syntax, 'let `class` = "test"');
	const identifiers = matches.filter(m => m.type === 'identifier');
	assert.ok(identifiers.some(m => m.value === '`class`'));
});

test('Swift can match arrow operator', async () => {
	const language = await syntax.getResource('swift');
	const matches = await language.getMatches(syntax, 'func foo() -> Int { }');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '->'));
});
