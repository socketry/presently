/**
 * Tests for Go language syntax highlighting
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

test('Go language can be registered', async () => {
	const language = await syntax.getResource('go');
	assert.ok(language);
	assert.equal(language.name, 'go');
});

test('Go can match keywords', async () => {
	const language = await syntax.getResource('go');
	const code = 'func main() { var x int }';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.length > 0);
	assert.ok(keywords.some(m => m.value === 'func'));
	assert.ok(keywords.some(m => m.value === 'var'));
});

test('Go can match package declaration', async () => {
	const language = await syntax.getResource('go');
	const matches = await language.getMatches(syntax, 'package main');

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'package'));
});

test('Go can match import statements', async () => {
	const language = await syntax.getResource('go');
	const matches = await language.getMatches(syntax, 'import "fmt"');

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'import'));
});

test('Go can match control flow keywords', async () => {
	const language = await syntax.getResource('go');
	const code = 'if x > 0 { return } else { break }';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'if'));
	assert.ok(keywords.some(m => m.value === 'else'));
	assert.ok(keywords.some(m => m.value === 'return'));
	assert.ok(keywords.some(m => m.value === 'break'));
});

test('Go can match for loops', async () => {
	const language = await syntax.getResource('go');
	const matches = await language.getMatches(syntax, 'for i := 0; i < 10; i++ {');

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'for'));
});

test('Go can match range loops', async () => {
	const language = await syntax.getResource('go');
	const matches = await language.getMatches(syntax, 'for i, v := range items {');

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'for'));
	assert.ok(keywords.some(m => m.value === 'range'));
});

test('Go can match switch statements', async () => {
	const language = await syntax.getResource('go');
	const code = 'switch x { case 1: fallthrough default: }';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'switch'));
	assert.ok(keywords.some(m => m.value === 'case'));
	assert.ok(keywords.some(m => m.value === 'fallthrough'));
	assert.ok(keywords.some(m => m.value === 'default'));
});

test('Go can match defer keyword', async () => {
	const language = await syntax.getResource('go');
	const matches = await language.getMatches(syntax, 'defer file.Close()');

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'defer'));
});

test('Go can match go keyword (goroutines)', async () => {
	const language = await syntax.getResource('go');
	const matches = await language.getMatches(syntax, 'go processData(x)');

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'go'));
});

test('Go can match channel keywords', async () => {
	const language = await syntax.getResource('go');
	const code = 'var ch chan int; select { case <-ch: }';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'chan'));
	assert.ok(keywords.some(m => m.value === 'select'));
});

test('Go can match type declarations', async () => {
	const language = await syntax.getResource('go');
	const code = 'type Person struct { name string }';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'type'));
	assert.ok(keywords.some(m => m.value === 'struct'));
});

test('Go can match interface keyword', async () => {
	const language = await syntax.getResource('go');
	const matches = await language.getMatches(syntax, 'type Reader interface {');

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'interface'));
});

test('Go can match map keyword', async () => {
	const language = await syntax.getResource('go');
	const matches = await language.getMatches(syntax, 'var m map[string]int');

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'map'));
});

test('Go can match basic types', async () => {
	const language = await syntax.getResource('go');
	const code = 'var x int; var y string; var z byte';
	const matches = await language.getMatches(syntax, code);

	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(m => m.value === 'int'));
	assert.ok(types.some(m => m.value === 'string'));
	assert.ok(types.some(m => m.value === 'byte'));
});

test('Go can match integer type variants', async () => {
	const language = await syntax.getResource('go');
	const code = 'var a int8; var b int16; var c int32; var d int64';
	const matches = await language.getMatches(syntax, code);

	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(m => m.value === 'int8'));
	assert.ok(types.some(m => m.value === 'int16'));
	assert.ok(types.some(m => m.value === 'int32'));
	assert.ok(types.some(m => m.value === 'int64'));
});

test('Go can match unsigned integer types', async () => {
	const language = await syntax.getResource('go');
	const code = 'var a uint; var b uint8; var c uintptr';
	const matches = await language.getMatches(syntax, code);

	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(m => m.value === 'uint'));
	assert.ok(types.some(m => m.value === 'uint8'));
	assert.ok(types.some(m => m.value === 'uintptr'));
});

test('Go can match float types', async () => {
	const language = await syntax.getResource('go');
	const code = 'var x float32; var y float64';
	const matches = await language.getMatches(syntax, code);

	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(m => m.value === 'float32'));
	assert.ok(types.some(m => m.value === 'float64'));
});

test('Go can match complex types', async () => {
	const language = await syntax.getResource('go');
	const code = 'var x complex64; var y complex128';
	const matches = await language.getMatches(syntax, code);

	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(m => m.value === 'complex64'));
	assert.ok(types.some(m => m.value === 'complex128'));
});

test('Go can match boolean constants', async () => {
	const language = await syntax.getResource('go');
	const code = 'x := true; y := false';
	const matches = await language.getMatches(syntax, code);

	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(m => m.value === 'true'));
	assert.ok(constants.some(m => m.value === 'false'));
});

test('Go can match nil constant', async () => {
	const language = await syntax.getResource('go');
	const matches = await language.getMatches(syntax, 'var ptr *int = nil');

	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(m => m.value === 'nil'));
});

test('Go can match iota constant', async () => {
	const language = await syntax.getResource('go');
	const matches = await language.getMatches(syntax, 'const ( A = iota; B )');

	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(m => m.value === 'iota'));
});

test('Go can match operators', async () => {
	const language = await syntax.getResource('go');
	const code = 'x := a + b - c * d / e % f';
	const matches = await language.getMatches(syntax, code);

	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === ':='));
	assert.ok(operators.some(m => m.value === '+'));
	assert.ok(operators.some(m => m.value === '-'));
	assert.ok(operators.some(m => m.value === '*'));
	assert.ok(operators.some(m => m.value === '/'));
});

test('Go can match comparison operators', async () => {
	const language = await syntax.getResource('go');
	const code = 'if x == y && a != b || c < d && e > f {';
	const matches = await language.getMatches(syntax, code);

	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '=='));
	assert.ok(operators.some(m => m.value === '!='));
	assert.ok(operators.some(m => m.value === '<'));
	assert.ok(operators.some(m => m.value === '>'));
	assert.ok(operators.some(m => m.value === '&&'));
	assert.ok(operators.some(m => m.value === '||'));
});

test('Go can match channel operator', async () => {
	const language = await syntax.getResource('go');
	const matches = await language.getMatches(syntax, 'ch <- value');

	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '<-'));
});

test('Go can match bit clear operator', async () => {
	const language = await syntax.getResource('go');
	const code = 'x &^= y';
	const matches = await language.getMatches(syntax, code);

	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '&^='));
});

test('Go can match builtin functions', async () => {
	const language = await syntax.getResource('go');
	const code = 'slice := make([]int, len(arr), cap(arr))';
	const matches = await language.getMatches(syntax, code);

	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.some(m => m.value === 'make'));
	assert.ok(functions.some(m => m.value === 'len'));
	assert.ok(functions.some(m => m.value === 'cap'));
});

test('Go can match append function', async () => {
	const language = await syntax.getResource('go');
	const matches = await language.getMatches(
		syntax,
		'slice = append(slice, item)'
	);

	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.some(m => m.value === 'append'));
});

test('Go can match panic and recover', async () => {
	const language = await syntax.getResource('go');
	const code = 'defer func() { recover() }(); panic("error")';
	const matches = await language.getMatches(syntax, code);

	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.some(m => m.value === 'panic'));
	assert.ok(functions.some(m => m.value === 'recover'));
});

test('Go can match C-style comments', async () => {
	const language = await syntax.getResource('go');
	const matches = await language.getMatches(syntax, '/* block comment */');

	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.length > 0);
});

test('Go can match C++-style comments', async () => {
	const language = await syntax.getResource('go');
	const matches = await language.getMatches(syntax, '// line comment');

	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.length > 0);
});

test('Go can match double-quoted strings', async () => {
	const language = await syntax.getResource('go');
	const matches = await language.getMatches(syntax, 'msg := "Hello, World!"');

	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.some(m => m.value.includes('Hello')));
});

test('Go can match single-quoted runes', async () => {
	const language = await syntax.getResource('go');
	const matches = await language.getMatches(syntax, "ch := 'A'");

	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.length > 0);
});

test('Go can match decimal numbers', async () => {
	const language = await syntax.getResource('go');
	const matches = await language.getMatches(syntax, 'x := 42; y := 3.14');

	const numbers = matches.filter(
		m => m.type === 'constant' && /\d/.test(m.value)
	);
	assert.ok(numbers.length > 0);
});

test('Go can match hexadecimal numbers', async () => {
	const language = await syntax.getResource('go');
	const matches = await language.getMatches(syntax, 'x := 0xFF');

	const numbers = matches.filter(
		m => m.type === 'constant' && m.value.includes('0x')
	);
	assert.ok(numbers.length > 0);
});

test('Go can match CamelCase types', async () => {
	const language = await syntax.getResource('go');
	const matches = await language.getMatches(syntax, 'var reader io.Reader');

	const types = matches.filter(m => m.type === 'type' && /^[A-Z]/.test(m.value));
	assert.ok(types.some(m => m.value === 'Reader'));
});

test('Go can process complete code to HTML', async () => {
	const language = await syntax.getResource('go');
	const code = `package main

import "fmt"

func main() {
	fmt.Println("Hello, World!")
}`;

	const html = await language.process(syntax, code);
	assert.ok(html instanceof HTMLElement);
	const text = html.textContent;
	assert.ok(text.includes('package'));
	assert.ok(text.includes('main'));
	assert.ok(text.includes('Hello'));
});

test('Go can build a syntax tree', async () => {
	const language = await syntax.getResource('go');
	const code = 'func add(x, y int) int { return x + y }';

	const tree = await language.buildTree(syntax, code, 0);
	assert.ok(tree);
	assert.ok(tree.children.length > 0);
});
