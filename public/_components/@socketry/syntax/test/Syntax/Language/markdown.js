/**
 * Tests for Markdown language definition
 */

import {test} from 'node:test';
import assert from 'node:assert';
import {JSDOM} from 'jsdom';

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;

import Syntax from '../../../Syntax.js';
import registerMarkdown from '../../../Syntax/Language/markdown.js';
import {
	assertToken,
	assertTokenType,
	assertTokenCount,
	getMatchText
} from '../../helpers/ast-matcher.js';

test('Markdown language can be registered', async () => {
	const syntax = new Syntax();
	registerMarkdown(syntax);
	const language = await syntax.getLanguage('markdown');
	assert.ok(language);
	assert.strictEqual(language.name, 'markdown');
});

test('Markdown can match headers', async () => {
	const syntax = new Syntax();
	registerMarkdown(syntax);
	const language = await syntax.getLanguage('markdown');
	
	const code = '# Heading 1';
	const matches = await language.getMatches(syntax, code);
	
	assertToken(code, matches, 'heading', '# Heading 1');
});

test('Markdown can match bold text', async () => {
	const syntax = new Syntax();
	registerMarkdown(syntax);
	const language = await syntax.getLanguage('markdown');
	
	const code = '**bold text**';
	const matches = await language.getMatches(syntax, code);
	
	assertToken(code, matches, 'strong', '**bold text**');
});

test('Markdown can match italic text', async () => {
	const syntax = new Syntax();
	registerMarkdown(syntax);
	const language = await syntax.getLanguage('markdown');
	
	const code = '*italic text*';
	const matches = await language.getMatches(syntax, code);
	
	assertToken(code, matches, 'emphasis', '*italic text*');
});

test('Markdown can match inline code', async () => {
	const syntax = new Syntax();
	registerMarkdown(syntax);
	const language = await syntax.getLanguage('markdown');
	
	const code = '`code here`';
	const matches = await language.getMatches(syntax, code);
	
	assertToken(code, matches, 'code', '`code here`');
});

test('Markdown can match code blocks', async () => {
	const syntax = new Syntax();
	registerMarkdown(syntax);
	const language = await syntax.getLanguage('markdown');
	
	const code = '```javascript\nconst x = 1;\n```';
	const matches = await language.getMatches(syntax, code);
	
	assertToken(code, matches, 'code', '```javascript\nconst x = 1;\n```');
});

test('Markdown can match links', async () => {
	const syntax = new Syntax();
	registerMarkdown(syntax);
	const language = await syntax.getLanguage('markdown');
	
	const code = '[text](http://example.com)';
	const matches = await language.getMatches(syntax, code);
	
	// Should match the link text and URL as separate tokens
	assertToken(code, matches, 'string', 'text');
	assertToken(code, matches, 'link', 'http://example.com');
});

test('Markdown can match images', async () => {
	const syntax = new Syntax();
	registerMarkdown(syntax);
	const language = await syntax.getLanguage('markdown');
	
	const code = '![alt text](image.png)';
	const matches = await language.getMatches(syntax, code);
	
	assertToken(code, matches, 'link', '![alt text](image.png)');
});

test('Markdown can match blockquotes', async () => {
	const syntax = new Syntax();
	registerMarkdown(syntax);
	const language = await syntax.getLanguage('markdown');
	
	const code = '> This is a quote';
	const matches = await language.getMatches(syntax, code);
	
	assertToken(code, matches, 'quote', '> This is a quote');
});

test('Markdown can match unordered lists', async () => {
	const syntax = new Syntax();
	registerMarkdown(syntax);
	const language = await syntax.getLanguage('markdown');
	
	const code = '- List item';
	const matches = await language.getMatches(syntax, code);
	
	assertToken(code, matches, 'list-marker', '- ');
});

test('Markdown can match ordered lists', async () => {
	const syntax = new Syntax();
	registerMarkdown(syntax);
	const language = await syntax.getLanguage('markdown');
	
	const code = '1. List item';
	const matches = await language.getMatches(syntax, code);
	
	assertToken(code, matches, 'list-marker', '1. ');
});

test('Markdown: fenced block followed by inline code does not merge', async () => {
	const syntax = new Syntax();
	registerMarkdown(syntax);
	const language = await syntax.getLanguage('markdown');

	const code = "```\nfoo\n```\n\n`project`";
	const matches = await language.getMatches(syntax, code);

	// Expect a fenced code block token:
	assertToken(code, matches, 'code', '```\nfoo\n```');

	// Expect a separate inline code token for `project`:
	assertToken(code, matches, 'code', '`project`');

	// Ensure there is no token that incorrectly spans the fence backticks
	// and the following inline backtick (e.g., "````" boundary merge):
	const badSpan = matches.find(m =>
		m.type === 'code' &&
		code.substring(m.offset, m.offset + m.length).includes('````')
	);
	assert.strictEqual(badSpan, undefined);
});
