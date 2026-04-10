/**
 * Tests for Io language syntax highlighting
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

test('Io language can be registered', async () => {
	const language = await syntax.getResource('io');
	assert.ok(language);
	assert.equal(language.name, 'io');
});

test('Io can match return keyword', async () => {
	const language = await syntax.getResource('io');
	const matches = await language.getMatches(syntax, 'return 42');
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'return'));
});

test('Io can match assignment operator', async () => {
	const language = await syntax.getResource('io');
	const matches = await language.getMatches(syntax, 'x := 42');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === ':='));
});

test('Io can match slot assignment operator', async () => {
	const language = await syntax.getResource('io');
	const matches = await language.getMatches(syntax, 'x ::= 42');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '::='));
});

test('Io can match logical operators', async () => {
	const language = await syntax.getResource('io');
	const matches = await language.getMatches(syntax, 'true or false and true');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === 'or'));
	assert.ok(operators.some(m => m.value === 'and'));
});

test('Io can match at operator', async () => {
	const language = await syntax.getResource('io');
	const matches = await language.getMatches(syntax, 'obj @method');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '@'));
});

test('Io can match arithmetic operators', async () => {
	const language = await syntax.getResource('io');
	const matches = await language.getMatches(syntax, 'x + y - z * a / b % c');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '+'));
	assert.ok(operators.some(m => m.value === '-'));
	assert.ok(operators.some(m => m.value === '*'));
	assert.ok(operators.some(m => m.value === '/'));
	assert.ok(operators.some(m => m.value === '%'));
});

test('Io can match bitwise operators', async () => {
	const language = await syntax.getResource('io');
	const matches = await language.getMatches(syntax, 'x & y | z ~ a');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '&'));
	assert.ok(operators.some(m => m.value === '|'));
	assert.ok(operators.some(m => m.value === '~'));
});

test('Io can match comparison operators', async () => {
	const language = await syntax.getResource('io');
	const matches = await language.getMatches(syntax, 'x < y = z > a');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '<'));
	assert.ok(operators.some(m => m.value === '='));
	assert.ok(operators.some(m => m.value === '>'));
});

test('Io can match bracket operators', async () => {
	const language = await syntax.getResource('io');
	const matches = await language.getMatches(syntax, 'x := [1, 2, 3]');
	const operators = matches.filter(m => m.type === 'operator');
	// Brackets are operators in the Io syntax definition
	assert.ok(operators.length > 0);
});

test('Io can match new operator', async () => {
	const language = await syntax.getResource('io');
	const matches = await language.getMatches(syntax, 'obj := Object new');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === 'new'));
});

test('Io can match space-delimited method invocations', async () => {
	const language = await syntax.getResource('io');
	const matches = await language.getMatches(syntax, 'obj println');
	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.some(m => m.value === 'println'));
});

test('Io can match method calls after parentheses', async () => {
	const language = await syntax.getResource('io');
	const matches = await language.getMatches(syntax, 'list(1, 2) println');
	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.some(m => m.value === 'println'));
});

test('Io can match CamelCase types', async () => {
	const language = await syntax.getResource('io');
	const matches = await language.getMatches(syntax, 'Person := Object clone');
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(m => m.value === 'Person'));
	assert.ok(types.some(m => m.value === 'Object'));
});

test('Io can match Perl-style comments', async () => {
	const language = await syntax.getResource('io');
	const matches = await language.getMatches(syntax, '# This is a comment');
	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.some(m => m.value === '# This is a comment'));
});

test('Io can match C-style comments', async () => {
	const language = await syntax.getResource('io');
	const matches = await language.getMatches(syntax, '/* This is a comment */');
	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.some(m => m.value === '/* This is a comment */'));
});

test('Io can match C++-style comments', async () => {
	const language = await syntax.getResource('io');
	const matches = await language.getMatches(
		syntax,
		'// This is a comment\nx := 5'
	);
	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.some(m => m.value === '// This is a comment'));
});

test('Io can match single-quoted strings', async () => {
	const language = await syntax.getResource('io');
	const matches = await language.getMatches(syntax, "'Hello, World!'");
	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.some(m => m.value === "'Hello, World!'"));
});

test('Io can match double-quoted strings', async () => {
	const language = await syntax.getResource('io');
	const matches = await language.getMatches(syntax, '"Hello, World!"');
	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.some(m => m.value === '"Hello, World!"'));
});

test('Io can match string escapes', async () => {
	const language = await syntax.getResource('io');
	const matches = await language.getMatches(syntax, '"Line 1\\nLine 2"');
	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.length > 0);
});

test('Io can match decimal numbers', async () => {
	const language = await syntax.getResource('io');
	const matches = await language.getMatches(syntax, 'x := 42; y := 3.14');
	const numbers = matches.filter(m => m.type === 'constant');
	assert.ok(numbers.some(m => m.value === '42'));
	assert.ok(numbers.some(m => m.value === '3.14'));
});

test('Io can match hexadecimal numbers', async () => {
	const language = await syntax.getResource('io');
	const matches = await language.getMatches(syntax, 'color := 0xFF00AA');
	const numbers = matches.filter(m => m.type === 'constant');
	assert.ok(numbers.some(m => m.value === '0xFF00AA'));
});

test('Io can process object cloning', async () => {
	const language = await syntax.getResource('io');
	const code = 'Person := Object clone';
	const matches = await language.getMatches(syntax, code);
	assert.ok(matches.length > 0);

	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(m => m.value === 'Person'));
	assert.ok(types.some(m => m.value === 'Object'));
});

test('Io can process method definitions', async () => {
	const language = await syntax.getResource('io');
	const code = 'Person greet := method("Hello, " .. self name)';
	const matches = await language.getMatches(syntax, code);
	assert.ok(matches.length > 0);

	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(m => m.value === 'Person'));
});

test('Io can process complete program', async () => {
	const language = await syntax.getResource('io');
	const code = `# Factorial function
factorial := method(n,
	if(n <= 1,
		return 1,
		return n * factorial(n - 1)
	)
)

factorial(5) println`;
	const matches = await language.getMatches(syntax, code);
	assert.ok(matches.length > 0);

	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.some(m => m.value === '# Factorial function'));

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'return'));

	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === ':='));
});
