import {test} from 'node:test';
import assert from 'node:assert';

import Syntax from '../../Syntax.js';
import {Language} from '../../Syntax/Language.js';
import {
	LanguageNotFoundError,
	RuleApplyError,
	StyleSheetLoadError
} from '../../Syntax/Errors.js';

test('Language.buildTree throws LanguageNotFoundError in strict mode for missing embedded language', async () => {
	const syntax = new Syntax();
	syntax.defaultOptions.strict = true;

	const lang = new Language('dummy');
	// Rule that embeds a non-existent language
	lang.push({pattern: /x+/, language: 'no-such-language'});

	await assert.rejects(
		async () => {
			await lang.buildTree(syntax, 'xxx', 0);
		},
		err => err instanceof LanguageNotFoundError
	);
});

test('RuleApplyError thrown in strict mode when rule.apply throws', async () => {
	const syntax = new Syntax();
	syntax.defaultOptions.strict = true;

	const lang = new Language('dummy');
	// Custom rule that throws from apply
	lang.push({
		pattern: /x+/,
		apply() {
			throw new Error('boom');
		}
	});

	await assert.rejects(
		async () => {
			await lang.getMatches(syntax, 'xxx');
		},
		err => err instanceof RuleApplyError
	);
});

test('Rule apply failure is ignored (warn) in non-strict mode', async () => {
	const syntax = new Syntax();
	syntax.defaultOptions.strict = false;

	const lang = new Language('dummy');
	lang.push({
		pattern: /x+/,
		apply() {
			throw new Error('boom');
		}
	});

	const matches = await lang.getMatches(syntax, 'xxx');
	assert.ok(Array.isArray(matches));
	assert.strictEqual(matches.length, 0);
});

test('Stylesheet loader throws StyleSheetLoadError on non-200 response', async () => {
	const syntax = new Syntax();
	// Mock fetch to return 404
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async () => ({
		ok: false,
		status: 404,
		text: async () => ''
	});
	try {
		await assert.rejects(
			async () => {
				await syntax.getStyleSheet('https://example.invalid/missing.css');
			},
			err => err instanceof StyleSheetLoadError
		);
	} finally {
		globalThis.fetch = originalFetch;
	}
});
