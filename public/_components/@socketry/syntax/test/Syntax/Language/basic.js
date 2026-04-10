/**
 * Tests for BASIC/VB language definition
 */

import {test} from 'node:test';
import assert from 'node:assert';

import Syntax from '../../../Syntax.js';
import register from '../../../Syntax/Language/basic.js';

test('BASIC language can be registered', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('basic');
	assert.ok(language);
	assert.strictEqual(language.name, 'basic');
});

test('BASIC can be registered with vb alias', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('vb');
	assert.ok(language);
	assert.strictEqual(language.name, 'basic');
});

test('BASIC can highlight keywords', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('basic');

	const code = 'Dim x As Integer\nIf x > 0 Then\n    Print x\nEnd If';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.length > 0);
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'dim'));
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'if'));
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'then'));
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'end'));
});

test('BASIC can highlight types', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('basic');

	const code = 'Dim x As Integer\nDim s As String';
	const matches = await language.getMatches(syntax, code);

	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.length > 0);
	assert.ok(types.some(m => m.value === 'Integer'));
	assert.ok(types.some(m => m.value === 'String'));
});

test('BASIC can highlight access modifiers', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('basic');

	const code = 'Public Sub MyMethod()\nPrivate x As Integer\nEnd Sub';
	const matches = await language.getMatches(syntax, code);

	const access = matches.filter(m => m.type === 'access');
	assert.ok(access.length > 0);
	assert.ok(access.some(m => m.value === 'Public'));
	assert.ok(access.some(m => m.value === 'Private'));
});

test('BASIC can highlight constants', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('basic');

	const code = 'If x = True Then\n    y = False\nEnd If';
	const matches = await language.getMatches(syntax, code);

	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.length > 0);
	assert.ok(constants.some(m => m.value === 'True'));
	assert.ok(constants.some(m => m.value === 'False'));
});

test('BASIC can highlight Me/MyClass/MyBase', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('basic');

	const code = 'Me.Property = MyBase.Value';
	const matches = await language.getMatches(syntax, code);

	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(m => m.value === 'Me'));
	assert.ok(constants.some(m => m.value === 'MyBase'));
});

test('BASIC can highlight operators', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('basic');

	const code = 'x = y + z - 5 * 2';
	const matches = await language.getMatches(syntax, code);

	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.length > 0);
	assert.ok(operators.some(m => m.value === '+'));
	assert.ok(operators.some(m => m.value === '-'));
	assert.ok(operators.some(m => m.value === '*'));
});

test('BASIC can highlight VB-style comments', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('basic');

	const code = "' This is a comment\nDim x As Integer";
	const matches = await language.getMatches(syntax, code);

	const comment = matches.find(m => m.type === 'comment');
	assert.ok(comment);
	assert.ok(comment.value.includes('This is a comment'));
});

test('BASIC can highlight REM comments', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('basic');

	const code = 'REM This is a remark\nDim x As Integer';
	const matches = await language.getMatches(syntax, code);

	const rem = matches.find(
		m => m.type === 'keyword' && m.value.toLowerCase() === 'rem'
	);
	assert.ok(rem);
});

test('BASIC can highlight double-quoted strings', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('basic');

	const code = 'Dim msg As String = "Hello World"';
	const matches = await language.getMatches(syntax, code);

	const string = matches.find(m => m.type === 'string');
	assert.ok(string);
});

test('BASIC can highlight numbers', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('basic');

	const code = 'Dim x As Integer = 42';
	const matches = await language.getMatches(syntax, code);

	const number = matches.find(m => m.type === 'constant' && m.value === '42');
	assert.ok(number);
});

test('BASIC can highlight Function declarations', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('basic');

	const code =
		'Function Add(a As Integer, b As Integer) As Integer\n    Return a + b\nEnd Function';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'function'));
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'return'));
});

test('BASIC can highlight Sub declarations', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('basic');

	const code = 'Sub MyMethod()\n    Print "Hello"\nEnd Sub';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'sub'));
});

test('BASIC can highlight For loops', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('basic');

	const code = 'For i = 1 To 10\n    Print i\nNext i';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'for'));
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'to'));
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'next'));
});

test('BASIC can highlight While loops', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('basic');

	const code = 'While x < 10\n    x = x + 1\nEnd While';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'while'));
});

test('BASIC can highlight Select Case', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('basic');

	const code = 'Select Case x\n    Case 1\n        Print "One"\nEnd Select';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'select'));
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'case'));
});

test('BASIC can highlight Class declarations', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('basic');

	const code = 'Public Class MyClass\n    Private x As Integer\nEnd Class';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'class'));
});

test('BASIC can highlight Nothing constant', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('basic');

	const code = 'If obj Is Nothing Then';
	const matches = await language.getMatches(syntax, code);

	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(m => m.value === 'Nothing'));
});

test('BASIC can highlight CamelCase types', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('basic');

	const code = 'Dim customer As CustomerRecord';
	const matches = await language.getMatches(syntax, code);

	const type = matches.find(
		m => m.type === 'type' && m.value === 'CustomerRecord'
	);
	assert.ok(type);
});
