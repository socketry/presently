/**
 * Tests for Language class
 */

import {test} from 'node:test';
import assert from 'node:assert';

import Syntax from '../../Syntax.js';
import {Language} from '../../Syntax/Language.js';

test('Language can be created', () => {
	const language = new Language();
	assert.ok(language);
	assert.strictEqual(language.name, null);
});

test('Language can set name', () => {
	const language = new Language();
	language.name = 'javascript';
	assert.strictEqual(language.name, 'javascript');
});

test('Language can add keyword rules', async () => {
	const syntax = new Syntax();
	const language = new Language();
	const keywords = ['const', 'let', 'var'];

	language.push(keywords, {type: 'keyword'});

	// Verify by checking that matches can be found
	const matches = await language.getMatches(syntax, 'const x = 1;');
	assert.ok(matches.length > 0);
	assert.strictEqual(matches[0].expression.type, 'keyword');
});

test('Language can add pattern rules', async () => {
	const syntax = new Syntax();
	const language = new Language();

	language.push({
		pattern: /\/\/.*$/m,
		type: 'comment'
	});

	// Verify by checking that matches can be found
	const matches = await language.getMatches(syntax, '// this is a comment');
	assert.ok(matches.length > 0);
	assert.strictEqual(matches[0].expression.type, 'comment');
});

test('Language can get matches from text', async () => {
	const syntax = new Syntax();
	const language = new Language();
	language.push(['const', 'let'], {type: 'keyword'});

	const code = 'const x = 42;';
	const matches = await language.getMatches(syntax, code);

	assert.ok(matches.length > 0);
	const keywordMatch = matches.find(m => m.type === 'keyword');
	assert.ok(keywordMatch);
});
