import Syntax from '../../../Syntax.js';
import registerJSON from '../../../Syntax/Language/json.js';
import {strictEqual, ok} from 'node:assert';
import test from 'node:test';

async function getLanguage() {
	const syntax = new Syntax();
	registerJSON(syntax);
	return await syntax.getLanguage('json');
}

function typesFrom(matches) {
	return matches.map(m => m.expression.type);
}

test('JSON language can be registered', async () => {
	const language = await getLanguage();
	strictEqual(language.name, 'json');
});

test('JSON: true, false, null constants', async () => {
	const language = await getLanguage();
	const code = 'true false null';
	const matches = await language.getMatches(Syntax.default, code);
	const constants = matches.filter(m => m.expression.type === 'constant');
	strictEqual(constants.length, 3);
});

test('JSON: integer numbers', async () => {
	const language = await getLanguage();
	const code = '0 42 -17 999';
	const matches = await language.getMatches(Syntax.default, code);
	const numbers = matches.filter(m => m.expression.type === 'constant' && /^-?\d/.test(m.value));
	ok(numbers.length >= 4);
});

test('JSON: float numbers', async () => {
	const language = await getLanguage();
	const code = '3.14 -0.5 123.456';
	const matches = await language.getMatches(Syntax.default, code);
	const numbers = matches.filter(m => m.expression.type === 'constant' && m.value.includes('.'));
	ok(numbers.length >= 3);
});

test('JSON: scientific notation', async () => {
	const language = await getLanguage();
	const code = '1e10 2.5e-3 -1.23E+5';
	const matches = await language.getMatches(Syntax.default, code);
	const numbers = matches.filter(m => m.expression.type === 'constant' && /e/i.test(m.value));
	ok(numbers.length >= 3);
});

test('JSON: strings', async () => {
	const language = await getLanguage();
	const code = '"hello" "world" "with \\"escaped\\" quotes"';
	const matches = await language.getMatches(Syntax.default, code);
	const strings = matches.filter(m => m.expression.type === 'string');
	ok(strings.length >= 3);
});

test('JSON: object keys', async () => {
	const language = await getLanguage();
	const code = '{"name": "value", "age": 42}';
	const matches = await language.getMatches(Syntax.default, code);
	const keys = matches.filter(m => m.expression.type === 'key');
	ok(keys.length >= 2);
});

test('JSON: structural operators', async () => {
	const language = await getLanguage();
	const code = '{} [] , : ';
	const matches = await language.getMatches(Syntax.default, code);
	const operators = matches.filter(m => m.expression.type === 'operator');
	ok(operators.length >= 4);
});

test('JSON: nested object', async () => {
	const language = await getLanguage();
	const code = '{"user": {"name": "John", "age": 30}}';
	const matches = await language.getMatches(Syntax.default, code);
	const keys = matches.filter(m => m.expression.type === 'key');
	ok(keys.length >= 3);
});

test('JSON: array', async () => {
	const language = await getLanguage();
	const code = '[1, 2, "three", true, null]';
	const matches = await language.getMatches(Syntax.default, code);
	const types = typesFrom(matches);
	ok(types.includes('constant'));
	ok(types.includes('string'));
	ok(types.includes('operator'));
});

test('JSON: complex structure', async () => {
	const language = await getLanguage();
	const code = '{"items": [{"id": 1, "active": true}, {"id": 2, "active": false}]}';
	const matches = await language.getMatches(Syntax.default, code);
	const keys = matches.filter(m => m.expression.type === 'key');
	ok(keys.length >= 5);
});
