/**
 * Tests for Pascal/Delphi language syntax highlighting
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

test('Pascal language can be registered', async () => {
	const language = await syntax.getResource('pascal');
	assert.ok(language);
	assert.equal(language.name, 'pascal');
});

test('Pascal: keyword matches begin/end (case insensitive)', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(syntax, 'BEGIN program END');
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'begin'));
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'end'));
});

test('Pascal: keyword matches program', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(syntax, 'program HelloWorld;');
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'program'));
});

test('Pascal: keyword matches var', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(syntax, 'var x: Integer;');
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'var'));
});

test('Pascal: keyword matches procedure', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(syntax, 'procedure DoSomething;');
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'procedure'));
});

test('Pascal: keyword matches function', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(
		syntax,
		'function Add(a, b: Integer): Integer;'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'function'));
});

test('Pascal: keyword matches if/then/else', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(
		syntax,
		'if x > 0 then y := 1 else y := 0'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'if'));
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'then'));
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'else'));
});

test('Pascal: keyword matches for/to/do', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(syntax, 'for i := 1 to 10 do');
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'for'));
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'to'));
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'do'));
});

test('Pascal: keyword matches while/do', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(syntax, 'while x < 10 do');
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'while'));
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'do'));
});

test('Pascal: keyword matches repeat/until', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(
		syntax,
		'repeat x := x + 1 until x > 10'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'repeat'));
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'until'));
});

test('Pascal: keyword matches case/of', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(syntax, 'case x of 1: y := 1; end;');
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'case'));
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'of'));
});

test('Pascal: keyword matches record', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(
		syntax,
		'type Person = record name: String; end;'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'record'));
});

test('Pascal: keyword matches class (Delphi)', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(
		syntax,
		'type TMyClass = class end;'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'class'));
});

test('Pascal: keyword matches try/except/finally', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(
		syntax,
		'try DoSomething except end; try DoOther finally end;'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'try'));
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'except'));
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'finally'));
});

test('Pascal: constant matches true/false (case insensitive)', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(
		syntax,
		'flag := TRUE; other := False;'
	);
	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(m => m.value.toLowerCase() === 'true'));
	assert.ok(constants.some(m => m.value.toLowerCase() === 'false'));
});

test('Pascal: constant matches nil', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(syntax, 'ptr := NIL;');
	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(m => m.value.toLowerCase() === 'nil'));
});

test('Pascal: operator matches assignment :=', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(syntax, 'x := 10');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === ':='));
});

test('Pascal: operator matches comparison operators', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(
		syntax,
		'x = 5; y <> 3; z >= 1; w <= 2'
	);
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '='));
	assert.ok(operators.some(m => m.value === '<>'));
	assert.ok(operators.some(m => m.value === '>='));
	assert.ok(operators.some(m => m.value === '<='));
});

test('Pascal: operator matches arithmetic operators', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(syntax, 'x + y - z * w / 2');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '+'));
	assert.ok(operators.some(m => m.value === '-'));
	assert.ok(operators.some(m => m.value === '*'));
	assert.ok(operators.some(m => m.value === '/'));
});

test('Pascal: operator matches div and mod', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(syntax, 'x div 2; y mod 3');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value.toLowerCase() === 'div'));
	assert.ok(operators.some(m => m.value.toLowerCase() === 'mod'));
});

test('Pascal: operator matches logical operators', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(syntax, 'a and b or c xor d');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value.toLowerCase() === 'and'));
	assert.ok(operators.some(m => m.value.toLowerCase() === 'or'));
	assert.ok(operators.some(m => m.value.toLowerCase() === 'xor'));
});

test('Pascal: operator matches bit shift operators', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(syntax, 'x shl 2; y shr 1');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value.toLowerCase() === 'shl'));
	assert.ok(operators.some(m => m.value.toLowerCase() === 'shr'));
});

test('Pascal: operator matches not', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(syntax, 'not flag');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value.toLowerCase() === 'not'));
});

test('Pascal: comment matches curly brace style', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(syntax, '{ This is a comment }');
	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.length > 0);
});

test('Pascal: comment matches (* *) style', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(syntax, '(* This is a comment *)');
	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.length > 0);
});

test('Pascal: string matches single-quoted strings', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(syntax, "'Hello, World!'");
	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.length > 0);
});

test('Pascal: number matches decimal', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(syntax, '42');
	const numbers = matches.filter(m => m.type === 'constant');
	assert.ok(numbers.length > 0);
});

test('Pascal: number matches hex', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(syntax, '$FF');
	const numbers = matches.filter(m => m.type === 'constant');
	assert.ok(numbers.length > 0);
});

test('Pascal: function call matches', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(syntax, 'WriteLn(message)');
	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.some(m => m.value === 'WriteLn'));
});

test('Pascal: CamelCase type matches', async () => {
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(syntax, 'var obj: TMyObject;');
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.length > 0);
});

test('Pascal: complete program structure', async () => {
	const code = `program HelloWorld;
var
  message: String;
begin
  message := 'Hello, World!';
  WriteLn(message);
end.`;
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(syntax, code);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'program'));
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'var'));
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'begin'));
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'end'));
});

test('Pascal: procedure definition', async () => {
	const code = `procedure DisplaySum(a, b: Integer);
begin
  WriteLn('Sum: ', a + b);
end;`;
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(syntax, code);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'procedure'));
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'begin'));
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'end'));
});

test('Pascal: function definition', async () => {
	const code = `function Add(a, b: Integer): Integer;
begin
  Result := a + b;
end;`;
	const language = await syntax.getResource('pascal');
	const matches = await language.getMatches(syntax, code);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'function'));
});
