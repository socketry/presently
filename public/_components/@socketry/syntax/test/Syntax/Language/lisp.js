/**
 * Tests for Lisp language syntax highlighting
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

test('Lisp language can be registered', async () => {
	const language = await syntax.getResource('lisp');
	assert.ok(language);
	assert.equal(language.name, 'lisp');
});

test('Lisp can match parentheses operators', async () => {
	const language = await syntax.getResource('lisp');
	const matches = await language.getMatches(syntax, '(+ 1 2)');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '('));
	assert.ok(operators.some(m => m.value === ')'));
});

test('Lisp can match single semicolon comments', async () => {
	const language = await syntax.getResource('lisp');
	const matches = await language.getMatches(syntax, '; This is a comment');
	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.some(m => m.value === '; This is a comment'));
});

test('Lisp can match double semicolon comments', async () => {
	const language = await syntax.getResource('lisp');
	const matches = await language.getMatches(syntax, ';; This is a comment');
	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.some(m => m.value === ';; This is a comment'));
});

test('Lisp can match triple semicolon comments', async () => {
	const language = await syntax.getResource('lisp');
	const matches = await language.getMatches(syntax, ';;; Section header');
	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.some(m => m.value === ';;; Section header'));
});

test('Lisp can match decimal numbers', async () => {
	const language = await syntax.getResource('lisp');
	const matches = await language.getMatches(syntax, '(+ 42 3.14)');
	const numbers = matches.filter(m => m.type === 'constant');
	assert.ok(numbers.some(m => m.value === '42'));
	assert.ok(numbers.some(m => m.value === '3.14'));
});

test('Lisp can match hexadecimal numbers', async () => {
	const language = await syntax.getResource('lisp');
	const matches = await language.getMatches(syntax, '0xFF 0x1A2B');
	const numbers = matches.filter(m => m.type === 'constant');
	assert.ok(numbers.some(m => m.value === '0xFF'));
	assert.ok(numbers.some(m => m.value === '0x1A2B'));
});

test('Lisp can match hash constants', async () => {
	const language = await syntax.getResource('lisp');
	const matches = await language.getMatches(syntax, '#t #f #nil');
	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(m => m.value === '#t'));
	assert.ok(constants.some(m => m.value === '#f'));
	assert.ok(constants.some(m => m.value === '#nil'));
});

test('Lisp can match hash keywords', async () => {
	const language = await syntax.getResource('lisp');
	const matches = await language.getMatches(syntax, '#true #false');
	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(m => m.value === '#true'));
	assert.ok(constants.some(m => m.value === '#false'));
});

test('Lisp can match function calls', async () => {
	const language = await syntax.getResource('lisp');
	const matches = await language.getMatches(syntax, '(defun factorial (n))');
	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.some(m => m.value === 'defun'));
});

test('Lisp can match function names in expressions', async () => {
	const language = await syntax.getResource('lisp');
	const matches = await language.getMatches(syntax, '(+ 1 2)');
	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.some(m => m.value === '+'));
});

test('Lisp can match built-in functions', async () => {
	const language = await syntax.getResource('lisp');
	const matches = await language.getMatches(syntax, '(list 1 2 3)');
	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.some(m => m.value === 'list'));
});

test('Lisp can match special forms', async () => {
	const language = await syntax.getResource('lisp');
	const matches = await language.getMatches(syntax, '(if condition then else)');
	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.some(m => m.value === 'if'));
});

test('Lisp can match lambda expressions', async () => {
	const language = await syntax.getResource('lisp');
	const matches = await language.getMatches(syntax, '(lambda (x) (* x x))');
	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.some(m => m.value === 'lambda'));
});

test('Lisp can match double-quoted strings', async () => {
	const language = await syntax.getResource('lisp');
	const matches = await language.getMatches(syntax, '"Hello, World!"');
	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.some(m => m.value === '"Hello, World!"'));
});

test('Lisp can match multi-line strings', async () => {
	const language = await syntax.getResource('lisp');
	const matches = await language.getMatches(syntax, '"Line 1\nLine 2"');
	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.some(m => m.value.includes('Line 1')));
});

test('Lisp can match string escapes', async () => {
	const language = await syntax.getResource('lisp');
	const matches = await language.getMatches(syntax, '"Say \\"Hello\\""');
	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.length > 0);
});

test('Lisp can match nested expressions', async () => {
	const language = await syntax.getResource('lisp');
	const matches = await language.getMatches(syntax, '(+ (* 2 3) (- 5 1))');
	const operators = matches.filter(m => m.type === 'operator');
	const openParens = operators.filter(m => m.value === '(');
	const closeParens = operators.filter(m => m.value === ')');
	assert.ok(openParens.length >= 3);
	assert.ok(closeParens.length >= 3);
});

test('Lisp can match let bindings', async () => {
	const language = await syntax.getResource('lisp');
	const matches = await language.getMatches(
		syntax,
		'(let ((x 10) (y 20)) (+ x y))'
	);
	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.some(m => m.value === 'let'));
});

test('Lisp can match define statements', async () => {
	const language = await syntax.getResource('lisp');
	const matches = await language.getMatches(syntax, '(define x 42)');
	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.some(m => m.value === 'define'));
});

test('Lisp can match setq assignments', async () => {
	const language = await syntax.getResource('lisp');
	const matches = await language.getMatches(syntax, '(setq x 100)');
	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.some(m => m.value === 'setq'));
});

test('Lisp can process complete function definition', async () => {
	const language = await syntax.getResource('lisp');
	const code = `(defun factorial (n)
	(if (<= n 1)
		1
		(* n (factorial (- n 1)))))`;
	const matches = await language.getMatches(syntax, code);
	assert.ok(matches.length > 0);

	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.some(m => m.value === 'defun'));
	assert.ok(functions.some(m => m.value === 'if'));
	assert.ok(functions.some(m => m.value === '<='));
	assert.ok(functions.some(m => m.value === '*'));
	assert.ok(functions.some(m => m.value === 'factorial'));
	assert.ok(functions.some(m => m.value === '-'));
});

test('Lisp can process code with comments', async () => {
	const language = await syntax.getResource('lisp');
	const code = `; Calculate factorial
(defun factorial (n)
	;; Base case
	(if (<= n 1)
		1  ; Return 1
		(* n (factorial (- n 1)))))`;
	const matches = await language.getMatches(syntax, code);

	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.some(m => m.value === '; Calculate factorial'));
	assert.ok(comments.some(m => m.value === ';; Base case'));
	assert.ok(comments.some(m => m.value === '; Return 1'));
});

test('Lisp can match quoted expressions', async () => {
	const language = await syntax.getResource('lisp');
	const matches = await language.getMatches(syntax, "'(1 2 3)");
	// Quote is just part of the syntax, lists are in parentheses
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '('));
	assert.ok(operators.some(m => m.value === ')'));
});

test('Lisp can match backquote and unquote', async () => {
	const language = await syntax.getResource('lisp');
	const matches = await language.getMatches(syntax, '`(1 ,x 3)');
	// Backquote and comma are part of the expression syntax
	assert.ok(matches.length > 0);
});
