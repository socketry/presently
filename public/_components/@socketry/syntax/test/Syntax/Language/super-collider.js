import Syntax from '../../../Syntax.js';
import registerSuperCollider from '../../../Syntax/Language/super-collider.js';
import {strictEqual} from 'node:assert';
import test from 'node:test';

async function getTypesFor(code) {
	const syntax = new Syntax();
	registerSuperCollider(syntax);
	const language = await syntax.getLanguage('super-collider');
	const matches = await language.getMatches(syntax, code);
	return matches.map(m => m.expression.type);
}

test('SuperCollider: keywords', async () => {
	const types = await getTypesFor('var x; classvar y; const z; arg a;');
	strictEqual(types.includes('keyword'), true);
});

test('SuperCollider: operators', async () => {
	const types = await getTypesFor(
		'a+b - c * d / e % f < g > h = i & j | k ~ l ! m : n @ o'
	);
	strictEqual(types.includes('operator'), true);
});

test('SuperCollider: values/constants', async () => {
	const types = await getTypesFor(
		'thisFunction thisMethod thisProcess thisThread this super true false nil inf'
	);
	strictEqual(types.filter(t => t === 'constant').length >= 3, true);
});

test('SuperCollider: camel case type', async () => {
	const types = await getTypesFor('SynthDef EnvGen Pan2 SinOsc');
	strictEqual(types.includes('type'), true);
});

test('SuperCollider: single character constants', async () => {
	const types = await getTypesFor('$a $\n');
	strictEqual(types.includes('constant'), true);
});

test('SuperCollider: symbols', async () => {
	const types1 = await getTypesFor('\\freq \\amp');
	strictEqual(types1.includes('symbol'), true);
	const types2 = await getTypesFor("'foo' 'bar'");
	strictEqual(types2.includes('symbol'), true);
});

test('SuperCollider: comments and links', async () => {
	const types = await getTypesFor('/* comment */ // line http://example.com');
	strictEqual(types.includes('comment'), true);
	strictEqual(types.includes('href'), true);
});

test('SuperCollider: strings and numbers', async () => {
	const types = await getTypesFor('\'a\' "b" 0xFF 123 3.14');
	// 'a' is a Symbol (handled in the symbols test). Only \"b\" is a String.
	strictEqual(types.filter(t => t === 'string').length >= 1, true);
	strictEqual(types.filter(t => t === 'constant').length >= 2, true);
});

test('SuperCollider: method calls and functions', async () => {
	const types = await getTypesFor('object.method(); func()');
	strictEqual(types.includes('function'), true);
});
