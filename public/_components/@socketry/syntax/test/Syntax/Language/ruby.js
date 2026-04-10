import Syntax from '../../../Syntax.js';
import registerRuby from '../../../Syntax/Language/ruby.js';
import {strictEqual} from 'node:assert';
import test from 'node:test';

async function getTypesFor(code) {
	const syntax = new Syntax();
	registerRuby(syntax);
	const language = await syntax.getLanguage('ruby');
	const matches = await language.getMatches(syntax, code);
	return matches.map(m => m.expression.type);
}

test('Ruby: keywords highlighted', async () => {
	const types = await getTypesFor('def method\nend');
	strictEqual(types.includes('keyword'), true);
});

test('Ruby: values/constants', async () => {
	const types = await getTypesFor('self true false nil super');
	strictEqual(types.filter(t => t === 'constant').length >= 3, true);
});

test('Ruby: access modifiers', async () => {
	const types = await getTypesFor('private\nprotected\npublic');
	strictEqual(types.includes('access'), true);
});

test('Ruby: variables', async () => {
	const types = await getTypesFor('@@class_var @instance $global');
	strictEqual(types.includes('variable'), true);
});

test('Ruby: operators', async () => {
	const types = await getTypesFor('a + b - c * d / e');
	strictEqual(types.includes('operator'), true);
});

test('Ruby: strings', async () => {
	const types = await getTypesFor('\'single\' "double"');
	strictEqual(types.filter(t => t === 'string').length >= 2, true);
});

test('Ruby: numbers', async () => {
	const types = await getTypesFor('0xFF 123 3.14');
	strictEqual(types.filter(t => t === 'constant').length >= 2, true);
});

test('Ruby: comments and links', async () => {
	const types = await getTypesFor('# comment http://example.com');
	strictEqual(types.includes('comment'), true);
	strictEqual(types.includes('href'), true);
});

test('Ruby: regex literal', async () => {
	const types = await getTypesFor('/foo.+bar/i');
	strictEqual(types.includes('constant'), true);
});

test('Ruby: symbols', async () => {
	const types1 = await getTypesFor(':symbol');
	strictEqual(types1.includes('constant'), true);
	const types2 = await getTypesFor('::symbol');
	strictEqual(types2.includes('constant'), false);
});

test('Ruby: function detection', async () => {
	const types = await getTypesFor('def compute\nend\nobject.method');
	strictEqual(types.includes('function'), true);
});
