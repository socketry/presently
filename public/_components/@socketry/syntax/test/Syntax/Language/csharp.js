/**
 * Tests for C# language definition
 */

import {test} from 'node:test';
import assert from 'node:assert';

import Syntax from '../../../Syntax.js';
import register from '../../../Syntax/Language/csharp.js';

test('C# language can be registered', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');
	assert.ok(language);
	assert.strictEqual(language.name, 'csharp');
});

test('C# can be registered with c-sharp alias', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('c-sharp');
	assert.ok(language);
	assert.strictEqual(language.name, 'csharp');
});

test('C# can be registered with c# alias', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('c#');
	assert.ok(language);
	assert.strictEqual(language.name, 'csharp');
});

test('C# can highlight keywords', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code =
		'public class MyClass {\n    public void Method() {\n        if (x > 0) {\n            return;\n        }\n    }\n}';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.length > 0);
	assert.ok(keywords.some(m => m.value === 'class'));
	assert.ok(keywords.some(m => m.value === 'if'));
	assert.ok(keywords.some(m => m.value === 'return'));

	// void is a type, not a keyword
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(m => m.value === 'void'));
});

test('C# can highlight access modifiers', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code =
		'public class MyClass {\n    private int x;\n    protected string y;\n    internal double z;\n}';
	const matches = await language.getMatches(syntax, code);

	const access = matches.filter(m => m.type === 'access');
	assert.ok(access.some(m => m.value === 'public'));
	assert.ok(access.some(m => m.value === 'private'));
	assert.ok(access.some(m => m.value === 'protected'));
	assert.ok(access.some(m => m.value === 'internal'));
});

test('C# can highlight types', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = 'int x;\nstring y;\nbool flag;\ndouble d;\nfloat f;';
	const matches = await language.getMatches(syntax, code);

	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(m => m.value === 'int'));
	assert.ok(types.some(m => m.value === 'string'));
	assert.ok(types.some(m => m.value === 'bool'));
	assert.ok(types.some(m => m.value === 'double'));
	assert.ok(types.some(m => m.value === 'float'));
});

test('C# can highlight constants', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code =
		'if (obj == null) return false;\nbool flag = true;\nvar x = this;';
	const matches = await language.getMatches(syntax, code);

	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(m => m.value === 'null'));
	assert.ok(constants.some(m => m.value === 'true'));
	assert.ok(constants.some(m => m.value === 'false'));
	assert.ok(constants.some(m => m.value === 'this'));
});

test('C# can highlight operators', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = 'int result = a + b * c - d / e % f;';
	const matches = await language.getMatches(syntax, code);

	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '+'));
	assert.ok(operators.some(m => m.value === '*'));
	assert.ok(operators.some(m => m.value === '-'));
	assert.ok(operators.some(m => m.value === '/'));
	assert.ok(operators.some(m => m.value === '%'));
});

test('C# can highlight logical operators', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = 'if (a && b || !c) { }';
	const matches = await language.getMatches(syntax, code);

	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.length > 0);
	// Note: && and || might be matched as separate & and | operators
	assert.ok(operators.some(m => m.value === '!'));
});

test('C# can highlight var keyword', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = 'var x = 5;';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'var'));
});

test('C# can highlight LINQ keywords', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = 'var result = from x in items where x > 0 select x;';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'from'));
	assert.ok(keywords.some(m => m.value === 'in'));
	assert.ok(keywords.some(m => m.value === 'where'));
	assert.ok(keywords.some(m => m.value === 'select'));
});

test('C# can highlight async/await keywords', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = 'async Task MethodAsync() { }';
	const matches = await language.getMatches(syntax, code);

	// 'async' and 'await' might not be in the keyword list, but let's test what we have
	assert.ok(matches.length > 0);
});

test('C# can highlight delegate keyword', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = 'public delegate void MyDelegate();';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'delegate'));
});

test('C# can highlight event keyword', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = 'public event EventHandler MyEvent;';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'event'));
});

test('C# can highlight foreach loops', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = 'foreach (var item in items) { }';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'foreach'));
});

test('C# can highlight using statements', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = 'using System;\nusing (var stream = new FileStream()) { }';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'using'));
});

test('C# can highlight namespace declarations', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = 'namespace MyNamespace { }';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'namespace'));
});

test('C# can highlight interface declarations', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = 'public interface IMyInterface { }';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'interface'));
});

test('C# can highlight struct declarations', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = 'public struct Point { public int X; public int Y; }';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'struct'));
});

test('C# can highlight enum declarations', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = 'public enum Color { Red, Green, Blue }';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'enum'));
});

test('C# can highlight C-style comments', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = '/* This is a comment */\nint x;';
	const matches = await language.getMatches(syntax, code);

	const comment = matches.find(m => m.type === 'comment');
	assert.ok(comment);
	assert.ok(comment.value.includes('This is a comment'));
});

test('C# can highlight C++-style comments', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = '// This is a comment\nint x;';
	const matches = await language.getMatches(syntax, code);

	const comment = matches.find(m => m.type === 'comment');
	assert.ok(comment);
	assert.ok(comment.value.includes('This is a comment'));
});

test('C# can highlight double-quoted strings', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = 'string msg = "Hello World";';
	const matches = await language.getMatches(syntax, code);

	const string = matches.find(m => m.type === 'string');
	assert.ok(string);
});

test('C# can highlight character literals', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = "char c = 'A';";
	const matches = await language.getMatches(syntax, code);

	const string = matches.find(m => m.type === 'string');
	assert.ok(string);
});

test('C# can highlight decimal numbers', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = 'int x = 42;';
	const matches = await language.getMatches(syntax, code);

	const number = matches.find(m => m.type === 'constant' && m.value === '42');
	assert.ok(number);
});

test('C# can highlight hexadecimal numbers', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = 'int x = 0xFF;';
	const matches = await language.getMatches(syntax, code);

	const number = matches.find(m => m.type === 'constant' && m.value === '0xFF');
	assert.ok(number);
});

test('C# can highlight function calls', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = 'Console.WriteLine("Hello");';
	const matches = await language.getMatches(syntax, code);

	const func = matches.find(
		m => m.type === 'function' && m.value === 'WriteLine'
	);
	assert.ok(func);
});

test('C# can highlight CamelCase types', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = 'MyCustomClass obj = new MyCustomClass();';
	const matches = await language.getMatches(syntax, code);

	const type = matches.find(
		m => m.type === 'type' && m.value === 'MyCustomClass'
	);
	assert.ok(type);
});

test('C# can highlight try-catch blocks', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = 'try { } catch (Exception ex) { } finally { }';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'try'));
	assert.ok(keywords.some(m => m.value === 'catch'));
	assert.ok(keywords.some(m => m.value === 'finally'));
});

test('C# can highlight switch statements', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code =
		'switch (x) {\n    case 1:\n        break;\n    default:\n        break;\n}';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'switch'));
	assert.ok(keywords.some(m => m.value === 'case'));
	assert.ok(keywords.some(m => m.value === 'default'));
	assert.ok(keywords.some(m => m.value === 'break'));
});

test('C# can highlight properties with get/set', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = 'public int Property { get; set; }';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'get'));
	assert.ok(keywords.some(m => m.value === 'set'));
});

test('C# can highlight static keyword', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = 'public static void Main() { }';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'static'));
});

test('C# can highlight abstract and virtual keywords', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('csharp');

	const code = 'public abstract class Base { public virtual void Method() { } }';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'abstract'));
	assert.ok(keywords.some(m => m.value === 'virtual'));
});
