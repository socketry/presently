import Syntax from '../../../Syntax.js';
import registerJavaScript from '../../../Syntax/Language/javascript.js';
import {strictEqual, ok} from 'node:assert';
import test from 'node:test';

async function getLanguage() {
	const syntax = new Syntax();
	registerJavaScript(syntax);
	return await syntax.getLanguage('javascript');
}

function typesFrom(matches) {
	return matches.map(m => m.expression.type);
}

test('JavaScript: keywords highlighted', async () => {
	const language = await getLanguage();
	const code =
		'async function run() { await fetch(); const x = class {}; let y; var z; return yield; }';
	const matches = await language.getMatches(Syntax.default, code);
	const types = typesFrom(matches);
	ok(types.includes('keyword'));
});

test('JavaScript: constants highlighted', async () => {
	const language = await getLanguage();
	const code = 'this === null || true && false';
	const matches = await language.getMatches(Syntax.default, code);
	const constants = matches.filter(m => m.expression.type === 'constant');
	ok(constants.length >= 4);
});

test('JavaScript: operators highlighted', async () => {
	const language = await getLanguage();
	const code = 'a + b * c / d - e & f | g ~ h ! i % j < k = l > m';
	const matches = await language.getMatches(Syntax.default, code);
	const operators = matches.filter(m => m.expression.type === 'operator');
	ok(operators.length > 0);
});

test('JavaScript: access modifiers highlighted', async () => {
	const language = await getLanguage();
	const code =
		'public interface Foo extends Bar implements Baz { private x; protected y; package z; }';
	const matches = await language.getMatches(Syntax.default, code);
	const access = matches.filter(m => m.expression.type === 'access');
	ok(access.length >= 5);
});

test('JavaScript: regex literals', async () => {
	const language = await getLanguage();
	const code = 'const pattern = /test\\d+/gi;';
	const matches = await language.getMatches(Syntax.default, code);
	const regex = matches.filter(
		m => m.expression.type === 'constant' && m.value.startsWith('/')
	);
	ok(regex.length >= 1);
});

test('JavaScript: comments', async () => {
	const language = await getLanguage();
	const code = '/* block */ // line';
	const matches = await language.getMatches(Syntax.default, code);
	const comments = matches.filter(m => m.expression.type === 'comment');
	ok(comments.length >= 2);
});

test('JavaScript: strings', async () => {
	const language = await getLanguage();
	const code =
		'const a = "double"; const b = \'single\'; const c = "esc\\"ape";';
	const matches = await language.getMatches(Syntax.default, code);
	const strings = matches.filter(m => m.expression.type === 'string');
	ok(strings.length >= 3);
});

test('JavaScript: numbers', async () => {
	const language = await getLanguage();
	const code = 'const a = 42; const b = 3.14; const c = 0xFF;';
	const matches = await language.getMatches(Syntax.default, code);
	const numbers = matches.filter(
		m => m.expression.type === 'constant' && /^\d/.test(m.value)
	);
	ok(numbers.length >= 3);
});

test('JavaScript: function calls', async () => {
	const language = await getLanguage();
	const code = 'console.log("test"); Math.max(1, 2);';
	const matches = await language.getMatches(Syntax.default, code);
	const functions = matches.filter(m => m.expression.type === 'function');
	ok(functions.length >= 2);
});

test('JavaScript: CamelCase types', async () => {
	const language = await getLanguage();
	const code = 'const obj = new MyClass();';
	const matches = await language.getMatches(Syntax.default, code);
	const types = matches.filter(m => m.expression.type === 'type');
	ok(types.length >= 1);
});
