/**
 * Tests for Java language syntax highlighting
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

test('Java language can be registered', async () => {
	const language = await syntax.getResource('java');
	assert.ok(language);
	assert.equal(language.name, 'java');
});

test('Java can match class keyword', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(syntax, 'public class MyClass { }');
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'class'));
});

test('Java can match control flow keywords', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(
		syntax,
		'if (x > 0) { return true; } else { return false; }'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'if'));
	assert.ok(keywords.some(m => m.value === 'else'));
	assert.ok(keywords.some(m => m.value === 'return'));
});

test('Java can match loop keywords', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(
		syntax,
		'for (int i = 0; i < 10; i++) { while (true) { break; } }'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'for'));
	assert.ok(keywords.some(m => m.value === 'while'));
	assert.ok(keywords.some(m => m.value === 'break'));
});

test('Java can match exception keywords', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(
		syntax,
		'try { } catch (Exception e) { throw e; } finally { }'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'try'));
	assert.ok(keywords.some(m => m.value === 'catch'));
	assert.ok(keywords.some(m => m.value === 'throw'));
	assert.ok(keywords.some(m => m.value === 'finally'));
});

test('Java can match access modifiers', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(
		syntax,
		'public private protected package'
	);
	const access = matches.filter(m => m.type === 'access');
	assert.ok(access.some(m => m.value === 'public'));
	assert.ok(access.some(m => m.value === 'private'));
	assert.ok(access.some(m => m.value === 'protected'));
	assert.ok(access.some(m => m.value === 'package'));
});

test('Java can match primitive types', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(
		syntax,
		'int x; double y; boolean flag; char c;'
	);
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(m => m.value === 'int'));
	assert.ok(types.some(m => m.value === 'double'));
	assert.ok(types.some(m => m.value === 'boolean'));
	assert.ok(types.some(m => m.value === 'char'));
});

test('Java can match void type', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(syntax, 'void method() { }');
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(m => m.value === 'void'));
});

test('Java can match constants', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(
		syntax,
		'this.value = true; that.value = false; x = null;'
	);
	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(m => m.value === 'this'));
	assert.ok(constants.some(m => m.value === 'true'));
	assert.ok(constants.some(m => m.value === 'false'));
	assert.ok(constants.some(m => m.value === 'null'));
});

test('Java can match comparison operators', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(
		syntax,
		'if (a == b && c != d || e < f && g > h)'
	);
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '=='));
	assert.ok(operators.some(m => m.value === '!='));
	assert.ok(operators.some(m => m.value === '<'));
	assert.ok(operators.some(m => m.value === '>'));
	assert.ok(operators.some(m => m.value === '&&'));
	assert.ok(operators.some(m => m.value === '||'));
});

test('Java can match assignment operators', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(syntax, 'x += 5; y -= 3; z *= 2;');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '+='));
	assert.ok(operators.some(m => m.value === '-='));
	assert.ok(operators.some(m => m.value === '*='));
});

test('Java can match bitwise operators', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(syntax, 'x << 2; y >> 1; z >>> 3;');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '<<'));
	assert.ok(operators.some(m => m.value === '>>'));
	assert.ok(operators.some(m => m.value === '>>>'));
});

test('Java can match increment and decrement operators', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(syntax, 'i++; j--;');
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '++'));
	assert.ok(operators.some(m => m.value === '--'));
});

test('Java can match instanceof operator', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(
		syntax,
		'if (obj instanceof String)'
	);
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === 'instanceof'));
});

test('Java can match new operator', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(
		syntax,
		'String s = new String("test");'
	);
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === 'new'));
});

test('Java can match CamelCase types', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(
		syntax,
		'String name; ArrayList<Integer> list;'
	);
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(m => m.value === 'String'));
	assert.ok(types.some(m => m.value === 'ArrayList'));
	assert.ok(types.some(m => m.value === 'Integer'));
});

test('Java can match C-style comments', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(syntax, '/* This is a comment */');
	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.some(m => m.value === '/* This is a comment */'));
});

test('Java can match C++-style comments', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(
		syntax,
		'// This is a comment\nint x = 5;'
	);
	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.some(m => m.value === '// This is a comment'));
});

test('Java can match decimal numbers', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(
		syntax,
		'int x = 42; double y = 3.14;'
	);
	const numbers = matches.filter(m => m.type === 'constant');
	assert.ok(numbers.some(m => m.value === '42'));
	assert.ok(numbers.some(m => m.value === '3.14'));
});

test('Java can match hexadecimal numbers', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(syntax, 'int color = 0xFF00AA;');
	const numbers = matches.filter(m => m.type === 'constant');
	assert.ok(numbers.some(m => m.value === '0xFF00AA'));
});

test('Java can match single-quoted strings', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(syntax, "char c = 'a';");
	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.some(m => m.value === "'a'"));
});

test('Java can match double-quoted strings', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(
		syntax,
		'String s = "Hello, World!";'
	);
	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.some(m => m.value === '"Hello, World!"'));
});

test('Java can match string escapes', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(
		syntax,
		'String s = "Line 1\\nLine 2";'
	);
	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.length > 0);
});

test('Java can match function calls', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(
		syntax,
		'System.out.println("Hello");'
	);
	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.some(m => m.value === 'println'));
});

test('Java can match method definitions', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(
		syntax,
		'public void doSomething() { }'
	);
	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.some(m => m.value === 'doSomething'));
});

test('Java can match interface keyword', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(
		syntax,
		'public interface MyInterface { }'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'interface'));
});

test('Java can match implements keyword', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(
		syntax,
		'class MyClass implements MyInterface { }'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'implements'));
});

test('Java can match extends keyword', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(
		syntax,
		'class Child extends Parent { }'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'extends'));
});

test('Java can match static and final keywords', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(
		syntax,
		'public static final int MAX = 100;'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'static'));
	assert.ok(keywords.some(m => m.value === 'final'));
});

test('Java can match abstract keyword', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(
		syntax,
		'public abstract class MyClass { }'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'abstract'));
});

test('Java can match synchronized keyword', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(
		syntax,
		'synchronized void method() { }'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'synchronized'));
});

test('Java can match enum keyword', async () => {
	const language = await syntax.getResource('java');
	const matches = await language.getMatches(
		syntax,
		'enum Color { RED, GREEN, BLUE }'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'enum'));
});

test('Java can process complete class definition', async () => {
	const language = await syntax.getResource('java');
	const code = `public class Calculator {
	private int result;
	
	public int add(int a, int b) {
		return a + b;
	}
}`;
	const matches = await language.getMatches(syntax, code);
	assert.ok(matches.length > 0);

	const access = matches.filter(m => m.type === 'access');
	assert.ok(access.some(m => m.value === 'public'));
	assert.ok(access.some(m => m.value === 'private'));

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'class'));
	assert.ok(keywords.some(m => m.value === 'return'));

	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(m => m.value === 'int'));
});
