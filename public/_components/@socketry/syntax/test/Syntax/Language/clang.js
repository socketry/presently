/**
 * Tests for C/C++/Objective-C language definition
 */

import {test} from 'node:test';
import assert from 'node:assert';

import Syntax from '../../../Syntax.js';
import register from '../../../Syntax/Language/clang.js';

test('clang language can be registered', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');
	assert.ok(language);
	assert.strictEqual(language.name, 'clang');
});

test('clang can be registered with cpp alias', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('cpp');
	assert.ok(language);
	assert.strictEqual(language.name, 'clang');
});

test('clang can be registered with c++ alias', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('c++');
	assert.ok(language);
	assert.strictEqual(language.name, 'clang');
});

test('clang can be registered with c alias', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('c');
	assert.ok(language);
	assert.strictEqual(language.name, 'clang');
});

test('clang can be registered with objective-c alias', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('objective-c');
	assert.ok(language);
	assert.strictEqual(language.name, 'clang');
});

test('clang can highlight C keywords', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code =
		'int main() {\n    if (x > 0) {\n        return 1;\n    }\n    return 0;\n}';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.length > 0);
	assert.ok(keywords.some(m => m.value === 'if'));
	assert.ok(keywords.some(m => m.value === 'return'));
});

test('clang can highlight C++ keywords', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code = 'class MyClass {\n    virtual void method() throw() {}\n};';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'class'));
	assert.ok(keywords.some(m => m.value === 'virtual'));
	assert.ok(keywords.some(m => m.value === 'throw'));
});

test('clang can highlight Objective-C keywords', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code = '@interface MyClass : NSObject\n@end';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === '@interface'));
	assert.ok(keywords.some(m => m.value === '@end'));
});

test('clang can highlight types', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code = 'int x;\nfloat y;\ndouble z;\nbool flag;';
	const matches = await language.getMatches(syntax, code);

	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(m => m.value === 'int'));
	assert.ok(types.some(m => m.value === 'float'));
	assert.ok(types.some(m => m.value === 'double'));
	assert.ok(types.some(m => m.value === 'bool'));
});

test('clang can highlight access modifiers', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code =
		'class MyClass {\nprivate:\n    int x;\npublic:\n    void method();\n};';
	const matches = await language.getMatches(syntax, code);

	const access = matches.filter(m => m.type === 'access');
	assert.ok(access.some(m => m.value === 'private'));
	assert.ok(access.some(m => m.value === 'public'));
});

test('clang can highlight Objective-C access modifiers', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code =
		'@interface MyClass\n@private\n    int x;\n@public\n    int y;\n@end';
	const matches = await language.getMatches(syntax, code);

	const access = matches.filter(m => m.type === 'access');
	assert.ok(access.some(m => m.value === '@private'));
	assert.ok(access.some(m => m.value === '@public'));
});

test('clang can highlight constants', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code = 'if (ptr == NULL) return false;\nbool flag = true;';
	const matches = await language.getMatches(syntax, code);

	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(m => m.value === 'NULL'));
	assert.ok(constants.some(m => m.value === 'true'));
	assert.ok(constants.some(m => m.value === 'false'));
});

test('clang can highlight Objective-C constants', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code = 'if (obj == nil) return NO;\nreturn YES;';
	const matches = await language.getMatches(syntax, code);

	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(m => m.value === 'nil'));
	assert.ok(constants.some(m => m.value === 'YES'));
	assert.ok(constants.some(m => m.value === 'NO'));
});

test('clang can highlight operators', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code = 'int result = a + b * c - d / e;';
	const matches = await language.getMatches(syntax, code);

	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '+'));
	assert.ok(operators.some(m => m.value === '*'));
	assert.ok(operators.some(m => m.value === '-'));
	assert.ok(operators.some(m => m.value === '/'));
});

test('clang can highlight preprocessor directives', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code = '#include <stdio.h>\n#define MAX 100\nint main() {}';
	const matches = await language.getMatches(syntax, code);

	const preprocessor = matches.filter(m => m.type === 'preprocessor');
	assert.ok(preprocessor.length > 0);
});

test('clang can highlight C-style comments', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code = '/* This is a comment */\nint x;';
	const matches = await language.getMatches(syntax, code);

	const comment = matches.find(m => m.type === 'comment');
	assert.ok(comment);
	assert.ok(comment.value.includes('This is a comment'));
});

test('clang can highlight C++-style comments', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code = '// This is a comment\nint x;';
	const matches = await language.getMatches(syntax, code);

	const comment = matches.find(m => m.type === 'comment');
	assert.ok(comment);
	assert.ok(comment.value.includes('This is a comment'));
});

test('clang can highlight strings', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code = 'const char* str = "Hello World";';
	const matches = await language.getMatches(syntax, code);

	const string = matches.find(m => m.type === 'string');
	assert.ok(string);
});

test('clang can highlight character literals', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code = "char c = 'A';";
	const matches = await language.getMatches(syntax, code);

	const string = matches.find(m => m.type === 'string');
	assert.ok(string);
});

test('clang can highlight Objective-C string literals', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code = 'NSString *str = @"Hello";';
	const matches = await language.getMatches(syntax, code);

	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.length > 0);
});

test('clang can highlight decimal numbers', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code = 'int x = 42;';
	const matches = await language.getMatches(syntax, code);

	const number = matches.find(m => m.type === 'constant' && m.value === '42');
	assert.ok(number);
});

test('clang can highlight hexadecimal numbers', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code = 'int x = 0xFF;';
	const matches = await language.getMatches(syntax, code);

	const number = matches.find(m => m.type === 'constant' && m.value === '0xFF');
	assert.ok(number);
});

test('clang can highlight struct declarations', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code = 'struct Point {\n    int x;\n    int y;\n};';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'struct'));
});

test('clang can highlight enum declarations', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code = 'enum Color { RED, GREEN, BLUE };';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'enum'));
});

test('clang can highlight namespace declarations', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code = 'namespace MyNamespace {\n    int x;\n}';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'namespace'));
});

test('clang can highlight template keyword', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code = 'template <typename T>\nclass Container {};';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'template'));
	assert.ok(keywords.some(m => m.value === 'typename'));
});

test('clang can highlight C-style function calls', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code = 'printf("Hello");';
	const matches = await language.getMatches(syntax, code);

	const func = matches.find(m => m.type === 'function' && m.value === 'printf');
	assert.ok(func);
});

test('clang can highlight CamelCase types', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code = 'MyCustomClass *obj;';
	const matches = await language.getMatches(syntax, code);

	const type = matches.find(
		m => m.type === 'type' && m.value === 'MyCustomClass'
	);
	assert.ok(type);
});

test('clang can highlight Objective-C @property', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code = '@property (nonatomic, retain) NSString *name;';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === '@property'));
});

test('clang can highlight for loops', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code = 'for (int i = 0; i < 10; i++) { }';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'for'));
});

test('clang can highlight switch statements', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('clang');

	const code =
		'switch (x) {\n    case 1:\n        break;\n    default:\n        break;\n}';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'switch'));
	assert.ok(keywords.some(m => m.value === 'case'));
	assert.ok(keywords.some(m => m.value === 'default'));
	assert.ok(keywords.some(m => m.value === 'break'));
});
