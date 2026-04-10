/**
 * Tests for Lua language syntax highlighting
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

test('Lua language can be registered', async () => {
	const language = await syntax.getResource('lua');
	assert.ok(language);
	assert.equal(language.name, 'lua');
});

test('Lua can match function keyword', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(syntax, 'function test() end');
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'function'));
	assert.ok(keywords.some(m => m.value === 'end'));
});

test('Lua can match local keyword', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(syntax, 'local x = 10');
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'local'));
});

test('Lua can match control flow keywords', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(
		syntax,
		'if x > 0 then return true else return false end'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'if'));
	assert.ok(keywords.some(m => m.value === 'then'));
	assert.ok(keywords.some(m => m.value === 'else'));
	assert.ok(keywords.some(m => m.value === 'return'));
	assert.ok(keywords.some(m => m.value === 'end'));
});

test('Lua can match elseif keyword', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(
		syntax,
		'if x > 0 then elseif x < 0 then else end'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'elseif'));
});

test('Lua can match loop keywords', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(
		syntax,
		'for i = 1, 10 do end while true do break end'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'for'));
	assert.ok(keywords.some(m => m.value === 'while'));
	assert.ok(keywords.some(m => m.value === 'do'));
	assert.ok(keywords.some(m => m.value === 'break'));
});

test('Lua can match repeat until keywords', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(
		syntax,
		'repeat x = x + 1 until x > 10'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'repeat'));
	assert.ok(keywords.some(m => m.value === 'until'));
});

test('Lua can match in keyword', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(
		syntax,
		'for k, v in pairs(t) do end'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'in'));
});

test('Lua can match logical keywords', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(
		syntax,
		'if x > 0 and y < 10 or not z then end'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'and'));
	assert.ok(keywords.some(m => m.value === 'or'));
	assert.ok(keywords.some(m => m.value === 'not'));
});

test('Lua can match boolean constants', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(syntax, 'x = true; y = false');
	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(m => m.value === 'true'));
	assert.ok(constants.some(m => m.value === 'false'));
});

test('Lua can match nil constant', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(syntax, 'x = nil');
	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(m => m.value === 'nil'));
});

test('Lua can match self constant', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(
		syntax,
		'function obj:method() self.value = 10 end'
	);
	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(m => m.value === 'self'));
});

test('Lua can match arithmetic operators', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(syntax, 'x + y - z * a / b % c ^ d');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '+'));
	assert.ok(operators.some(m => m.value === '-'));
	assert.ok(operators.some(m => m.value === '*'));
	assert.ok(operators.some(m => m.value === '/'));
	assert.ok(operators.some(m => m.value === '%'));
	assert.ok(operators.some(m => m.value === '^'));
});

test('Lua can match comparison operators', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(
		syntax,
		'if x == y or a ~= b or c < d or e > f then end'
	);
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '=='));
	assert.ok(operators.some(m => m.value === '~='));
	assert.ok(operators.some(m => m.value === '<'));
	assert.ok(operators.some(m => m.value === '>'));
});

test('Lua can match less/greater than or equal operators', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(
		syntax,
		'if x <= y and a >= b then end'
	);
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '<='));
	assert.ok(operators.some(m => m.value === '>='));
});

test('Lua can match concatenation operator', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(
		syntax,
		's = "Hello" .. " " .. "World"'
	);
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '..'));
});

test('Lua can match length operator', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(syntax, 'len = #table');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '#'));
});

test('Lua can match assignment operator', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(syntax, 'x = 10');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '='));
});

test('Lua can match colon operator', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(syntax, 'obj:method()');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === ':'));
});

test('Lua can match single-line comments', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(
		syntax,
		'-- This is a comment\nx = 10'
	);
	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.some(m => m.value === '-- This is a comment'));
});

test('Lua can match multi-line comments', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(
		syntax,
		'--[[ This is a\nmulti-line comment ]]--'
	);
	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.some(m => m.value.includes('multi-line')));
});

test('Lua can match single-quoted strings', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(syntax, "s = 'Hello, World!'");
	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.some(m => m.value === "'Hello, World!'"));
});

test('Lua can match double-quoted strings', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(syntax, 's = "Hello, World!"');
	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.some(m => m.value === '"Hello, World!"'));
});

test('Lua can match string escapes', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(syntax, 's = "Line 1\\nLine 2"');
	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.length > 0);
});

test('Lua can match decimal numbers', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(syntax, 'x = 42; y = 3.14');
	const numbers = matches.filter(m => m.type === 'constant');
	assert.ok(numbers.some(m => m.value === '42'));
	assert.ok(numbers.some(m => m.value === '3.14'));
});

test('Lua can match hexadecimal numbers', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(syntax, 'color = 0xFF00AA');
	const numbers = matches.filter(m => m.type === 'constant');
	assert.ok(numbers.some(m => m.value === '0xFF00AA'));
});

test('Lua can match CamelCase types', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(syntax, 'MyClass = {}');
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(m => m.value === 'MyClass'));
});

test('Lua can match function calls', async () => {
	const language = await syntax.getResource('lua');
	const matches = await language.getMatches(syntax, 'print("Hello")');
	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.some(m => m.value === 'print'));
});

test('Lua can process complete function definition', async () => {
	const language = await syntax.getResource('lua');
	const code = `function factorial(n)
	if n <= 1 then
		return 1
	else
		return n * factorial(n - 1)
	end
end`;
	const matches = await language.getMatches(syntax, code);
	assert.ok(matches.length > 0);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'function'));
	assert.ok(keywords.some(m => m.value === 'if'));
	assert.ok(keywords.some(m => m.value === 'then'));
	assert.ok(keywords.some(m => m.value === 'return'));
	assert.ok(keywords.some(m => m.value === 'else'));
	assert.ok(keywords.some(m => m.value === 'end'));
});

test('Lua can process table definition', async () => {
	const language = await syntax.getResource('lua');
	const code = `local person = {
	name = "Alice",
	age = 30,
	greet = function(self)
		print("Hello, " .. self.name)
	end
}`;
	const matches = await language.getMatches(syntax, code);
	assert.ok(matches.length > 0);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'local'));
	assert.ok(keywords.some(m => m.value === 'function'));
});
