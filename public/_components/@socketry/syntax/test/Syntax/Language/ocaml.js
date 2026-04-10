/**
 * Tests for OCaml language syntax highlighting
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

test('OCaml language can be registered', async () => {
	const language = await syntax.getResource('ocaml');
	assert.ok(language);
	assert.equal(language.name, 'ocaml');
});

test('OCaml: keyword matches let', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(syntax, 'let x = 5');
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'let'));
});

test('OCaml: keyword matches fun and function', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(
		syntax,
		'let add = fun x y -> x + y'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'fun'));
});

test('OCaml: keyword matches match/with', async () => {
	const language = await syntax.getResource('ocaml');
	const code = 'match x with | Some v -> v | None -> 0';
	const matches = await language.getMatches(syntax, code);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'match'));
	assert.ok(keywords.some(m => m.value === 'with'));
});

test('OCaml: keyword matches type definition', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(
		syntax,
		'type color = Red | Green | Blue'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'type'));
});

test('OCaml: keyword matches module', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(
		syntax,
		'module MyModule = struct end'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'module'));
	assert.ok(keywords.some(m => m.value === 'struct'));
	assert.ok(keywords.some(m => m.value === 'end'));
});

test('OCaml: keyword matches if/then/else', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(syntax, 'if x > 0 then 1 else 0');
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'if'));
	assert.ok(keywords.some(m => m.value === 'then'));
	assert.ok(keywords.some(m => m.value === 'else'));
});

test('OCaml: keyword matches rec for recursive functions', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(
		syntax,
		'let rec factorial n = if n = 0 then 1 else n * factorial (n - 1)'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'rec'));
});

test('OCaml: type matches basic types', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(syntax, 'let x: int = 42');
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.length > 0);
});

test('OCaml: type matches string type', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(syntax, 'let s: string = "hello"');
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(m => m.value === 'string'));
});

test('OCaml: type matches bool type', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(syntax, 'let flag: bool = true');
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(m => m.value === 'bool'));
});

test('OCaml: type matches option type', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(syntax, 'let x: option = Some 5');
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(m => m.value === 'option'));
});

test('OCaml: type matches list type', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(
		syntax,
		'let numbers: list = [1; 2; 3]'
	);
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(m => m.value === 'list'));
});

test('OCaml: constant matches true and false', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(
		syntax,
		'let x = true and y = false'
	);
	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(m => m.value === 'true'));
	assert.ok(constants.some(m => m.value === 'false'));
});

test('OCaml: access matches private', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(syntax, 'private method foo = 42');
	const access = matches.filter(m => m.type === 'access');
	assert.ok(access.some(m => m.value === 'private'));
});

test('OCaml: access matches public', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(syntax, 'public method bar = 100');
	const access = matches.filter(m => m.type === 'access');
	assert.ok(access.some(m => m.value === 'public'));
});

test('OCaml: operator matches arrow', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(syntax, 'fun x -> x + 1');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '->'));
});

test('OCaml: operator matches cons operator', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(syntax, '1 :: [2; 3]');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '::'));
});

test('OCaml: operator matches assignment', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(syntax, 'x := 10');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === ':='));
});

test('OCaml: operator matches pipe operators', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(syntax, 'x |> f |> g');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '|>'));
});

test('OCaml: operator matches pattern match pipe', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(
		syntax,
		'match x with | 0 -> "zero" | _ -> "other"'
	);
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '|'));
});

test('OCaml: operator matches not equal', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(syntax, 'x <> y');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '<>'));
});

test('OCaml: function matches after dot', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(syntax, 'List.map');
	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.some(m => m.value === 'map'));
});

test('OCaml: function matches function call', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(syntax, 'print_endline("Hello")');
	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.some(m => m.value === 'print_endline'));
});

test('OCaml: comment matches (* *) style', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(syntax, '(* This is a comment *)');
	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.length > 0);
});

test('OCaml: comment matches nested comments', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(
		syntax,
		'(* outer (* inner *) outer *)'
	);
	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.length > 0);
});

test('OCaml: string matches double-quoted strings', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(syntax, '"Hello, World!"');
	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.length > 0);
});

test('OCaml: number matches decimal', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(syntax, '42');
	const numbers = matches.filter(m => m.type === 'constant');
	assert.ok(numbers.length > 0);
});

test('OCaml: number matches hex', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(syntax, '0xFF');
	const numbers = matches.filter(m => m.type === 'constant');
	assert.ok(numbers.length > 0);
});

test('OCaml: camelCase type matches custom types', async () => {
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(syntax, 'let x: MyType = value');
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.length > 0);
});

test('OCaml: complete function definition', async () => {
	const code = `let rec sum_list lst =
  match lst with
  | [] -> 0
  | hd :: tl -> hd + sum_list tl`;
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(syntax, code);
	const keywords = matches.filter(m => m.type === 'keyword');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(keywords.some(m => m.value === 'let'));
	assert.ok(keywords.some(m => m.value === 'rec'));
	assert.ok(keywords.some(m => m.value === 'match'));
	assert.ok(keywords.some(m => m.value === 'with'));
	assert.ok(operators.some(m => m.value === '::'));
});

test('OCaml: pattern matching with types', async () => {
	const code = `match value with
  | Some x -> x
  | None -> 0`;
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(syntax, code);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'match'));
	assert.ok(keywords.some(m => m.value === 'with'));
});

test('OCaml: module definition', async () => {
	const code = `module Stack = struct
  let empty = []
  let push x s = x :: s
  let pop = function
    | [] -> None
    | x :: xs -> Some (x, xs)
end`;
	const language = await syntax.getResource('ocaml');
	const matches = await language.getMatches(syntax, code);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'module'));
	assert.ok(keywords.some(m => m.value === 'struct'));
	assert.ok(keywords.some(m => m.value === 'end'));
});
