/**
 * Tests for Syntax class
 */

import {test} from 'node:test';
import assert from 'node:assert';

import Syntax from '../Syntax.js';

test('Syntax class can be instantiated', () => {
	const syntax = new Syntax();
	assert.ok(syntax instanceof Syntax);
});

test('Syntax.default returns a singleton instance', () => {
	const instance1 = Syntax.default;
	const instance2 = Syntax.default;
	assert.strictEqual(instance1, instance2);
});

test('Syntax can register languages', async () => {
	const syntax = new Syntax();
	const mockLanguage = {type: 'test'};
	syntax.register('test', mockLanguage);

	assert.strictEqual(await syntax.getLanguage('test'), mockLanguage);
});

test('Syntax can register aliases', async () => {
	const syntax = new Syntax();
	const mockLanguage = {type: 'javascript'};
	syntax.register('javascript', mockLanguage);
	syntax.alias('javascript', ['js', 'jsx']);

	assert.strictEqual(await syntax.getLanguage('js'), mockLanguage);
	assert.strictEqual(await syntax.getLanguage('jsx'), mockLanguage);
	assert.strictEqual(await syntax.getLanguage('javascript'), mockLanguage);
});
