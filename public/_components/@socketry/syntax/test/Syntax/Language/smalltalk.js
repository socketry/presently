/**
 * Tests for Smalltalk language syntax highlighting
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

test('Smalltalk language can be registered', async () => {
	const language = await syntax.getResource('smalltalk');
	assert.ok(language);
	assert.equal(language.name, 'smalltalk');
});

test('Smalltalk can match self keyword', async () => {
	const language = await syntax.getResource('smalltalk');
	const matches = await language.getMatches(syntax, 'self doSomething');
	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(m => m.value === 'self'));
});

test('Smalltalk can match super keyword', async () => {
	const language = await syntax.getResource('smalltalk');
	const matches = await language.getMatches(syntax, 'super initialize');
	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(m => m.value === 'super'));
});

test('Smalltalk can match true and false', async () => {
	const language = await syntax.getResource('smalltalk');
	const matches = await language.getMatches(syntax, 'true & false');
	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(m => m.value === 'true'));
	assert.ok(constants.some(m => m.value === 'false'));
});

test('Smalltalk can match nil keyword', async () => {
	const language = await syntax.getResource('smalltalk');
	const matches = await language.getMatches(syntax, 'x := nil');
	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(m => m.value === 'nil'));
});

test('Smalltalk can match bracket operators', async () => {
	const language = await syntax.getResource('smalltalk');
	const matches = await language.getMatches(syntax, '[x + 1]');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '['));
	assert.ok(operators.some(m => m.value === ']'));
});

test('Smalltalk can match pipe operator', async () => {
	const language = await syntax.getResource('smalltalk');
	const matches = await language.getMatches(syntax, '| temp |');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '|'));
});

test('Smalltalk can match assignment operator', async () => {
	const language = await syntax.getResource('smalltalk');
	const matches = await language.getMatches(syntax, 'x := 42');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === ':='));
});

test('Smalltalk can match statement separator', async () => {
	const language = await syntax.getResource('smalltalk');
	const matches = await language.getMatches(syntax, 'x := 1. y := 2');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '.'));
});

test('Smalltalk can match unary message selectors', async () => {
	const language = await syntax.getResource('smalltalk');
	const matches = await language.getMatches(syntax, 'self initialize');
	// Unary messages are just identifiers, not highlighted specially
	assert.ok(matches.length > 0);
});

test('Smalltalk can match keyword message selectors', async () => {
	const language = await syntax.getResource('smalltalk');
	const matches = await language.getMatches(syntax, 'object at: key put: value');
	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.some(m => m.value === 'at:'));
	assert.ok(functions.some(m => m.value === 'put:'));
});

test('Smalltalk can match method definition selectors', async () => {
	const language = await syntax.getResource('smalltalk');
	const matches = await language.getMatches(syntax, 'setName: aName age: anAge');
	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.some(m => m.value === 'setName:'));
	assert.ok(functions.some(m => m.value === 'age:'));
});

test('Smalltalk can match CamelCase types', async () => {
	const language = await syntax.getResource('smalltalk');
	const matches = await language.getMatches(syntax, 'OrderedCollection new');
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(m => m.value === 'OrderedCollection'));
});

test('Smalltalk can match class names', async () => {
	const language = await syntax.getResource('smalltalk');
	const matches = await language.getMatches(syntax, 'Array with: String');
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(m => m.value === 'Array'));
	assert.ok(types.some(m => m.value === 'String'));
});

test('Smalltalk can match single-quoted strings', async () => {
	const language = await syntax.getResource('smalltalk');
	const matches = await language.getMatches(syntax, "'Hello, World!'");
	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.some(m => m.value === "'Hello, World!'"));
});

test('Smalltalk can match strings with escaped quotes', async () => {
	const language = await syntax.getResource('smalltalk');
	const matches = await language.getMatches(syntax, "'It''s a test'");
	const strings = matches.filter(m => m.type === 'string');
	// In Smalltalk, two single quotes represent an escaped quote
	assert.ok(strings.length > 0);
});

test('Smalltalk can match decimal numbers', async () => {
	const language = await syntax.getResource('smalltalk');
	const matches = await language.getMatches(syntax, 'x := 42');
	const numbers = matches.filter(m => m.type === 'constant');
	assert.ok(numbers.some(m => m.value === '42'));
});

test('Smalltalk can match floating point numbers', async () => {
	const language = await syntax.getResource('smalltalk');
	const matches = await language.getMatches(syntax, 'pi := 3.14159');
	const numbers = matches.filter(m => m.type === 'constant');
	assert.ok(numbers.some(m => m.value === '3.14159'));
});

test('Smalltalk can match hexadecimal numbers', async () => {
	const language = await syntax.getResource('smalltalk');
	const matches = await language.getMatches(syntax, 'color := 0xFF');
	const numbers = matches.filter(m => m.type === 'constant');
	assert.ok(numbers.some(m => m.value === '0xFF'));
});

test('Smalltalk can match blocks', async () => {
	const language = await syntax.getResource('smalltalk');
	const matches = await language.getMatches(syntax, '[x + 1] value');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '['));
	assert.ok(operators.some(m => m.value === ']'));
});

test('Smalltalk can match temporary variable declarations', async () => {
	const language = await syntax.getResource('smalltalk');
	const matches = await language.getMatches(syntax, '| temp1 temp2 |');
	const operators = matches.filter(m => m.type === 'operator');
	const pipes = operators.filter(m => m.value === '|');
	assert.equal(pipes.length, 2);
});

test('Smalltalk can process method definition', async () => {
	const language = await syntax.getResource('smalltalk');
	const code = `initialize
	super initialize.
	collection := OrderedCollection new`;
	const matches = await language.getMatches(syntax, code);
	assert.ok(matches.length > 0);

	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(m => m.value === 'super'));

	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(m => m.value === 'OrderedCollection'));
});

test('Smalltalk can process cascade messages', async () => {
	const language = await syntax.getResource('smalltalk');
	const code = `stream
	nextPutAll: 'Hello';
	space;
	nextPutAll: 'World'`;
	const matches = await language.getMatches(syntax, code);

	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.some(m => m.value === 'nextPutAll:'));
});

test('Smalltalk can process complete class method', async () => {
	const language = await syntax.getResource('smalltalk');
	const code = `factorial: n
	| result |
	result := 1.
	n > 1 ifTrue: [
		result := n * (self factorial: n - 1)
	].
	^ result`;
	const matches = await language.getMatches(syntax, code);
	assert.ok(matches.length > 0);

	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '|'));
	assert.ok(operators.some(m => m.value === ':='));
	assert.ok(operators.some(m => m.value === '['));
	assert.ok(operators.some(m => m.value === ']'));

	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(m => m.value === 'self'));

	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.some(m => m.value === 'factorial:'));
	assert.ok(functions.some(m => m.value === 'ifTrue:'));
});
