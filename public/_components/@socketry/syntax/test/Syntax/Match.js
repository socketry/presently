/**
 * Tests for Match class
 */

import {test} from 'node:test';
import assert from 'node:assert';

import {Match} from '../../Syntax/Match.js';

test('Match can be created with string type', () => {
	const match = new Match(0, 5, 'keyword');
	assert.strictEqual(match.offset, 0);
	assert.strictEqual(match.length, 5);
	assert.strictEqual(match.type, 'keyword');
});

test('Match can be created with expression object', () => {
	const expression = {type: 'string', owner: null};
	const match = new Match(10, 8, expression);
	assert.strictEqual(match.offset, 10);
	assert.strictEqual(match.length, 8);
	assert.strictEqual(match.type, 'string');
	assert.strictEqual(match.expression, expression);
});

test('Match stores value', () => {
	const match = new Match(0, 5, 'keyword', 'const');
	assert.strictEqual(match.value, 'const');
});

test('Match calculates endOffset', () => {
	const match = new Match(10, 5, 'keyword');
	assert.strictEqual(match.endOffset, 15);
});

test('Match initializes with empty children array', () => {
	const match = new Match(0, 5, 'keyword');
	assert.ok(Array.isArray(match.children));
	assert.strictEqual(match.children.length, 0);
});
