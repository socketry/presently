// Test suite for Syntax/Rule.js
import Rule from '../../Syntax/Rule.js';
import {test} from 'node:test';
import assert from 'node:assert';
import {JSDOM} from 'jsdom';

// Setup DOM environment for tests that need document
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;

test('cStyleComment matches C-style comments', () => {
	const input = '/* this is a comment */';
	const match = Rule.cStyleComment.pattern.exec(input);
	assert.ok(match);
	assert.strictEqual(match[0], '/* this is a comment */');
});

test('cStyleComment matches multi-line comments', () => {
	const input = '/* line 1\nline 2\nline 3 */';
	const match = Rule.cStyleComment.pattern.exec(input);
	assert.ok(match);
	assert.strictEqual(match[0], '/* line 1\nline 2\nline 3 */');
});

test('cppStyleComment matches C++-style comments', () => {
	const input = '// this is a comment';
	const match = Rule.cppStyleComment.pattern.exec(input);
	assert.ok(match);
	assert.strictEqual(match[0], '// this is a comment');
});

test('perlStyleComment matches Perl-style comments', () => {
	const input = '# this is a comment';
	const match = Rule.perlStyleComment.pattern.exec(input);
	assert.ok(match);
	assert.strictEqual(match[0], '# this is a comment');
});

test('perlStyleRegularExpression matches Perl regex literals', () => {
	const input = 'x = /test/g ';
	const match = Rule.perlStyleRegularExpression.pattern.exec(input);
	assert.ok(match);
	assert.strictEqual(match[0], '/test/g');
});

test('rubyStyleRegularExpression matches Ruby regex literals', () => {
	const input = 'x = /test/i do';
	const match = Rule.rubyStyleRegularExpression.pattern.exec(input);
	assert.ok(match);
	assert.strictEqual(match[0], '/test/i');
});

test('camelCaseType matches CamelCase types', () => {
	const input = 'MyClass';
	const match = Rule.camelCaseType.pattern.exec(input);
	assert.ok(match);
	assert.strictEqual(match[0], 'MyClass');
});

test('cStyleType matches C-style type names', () => {
	const input = 'size_t';
	const match = Rule.cStyleType.pattern.exec(input);
	assert.ok(match);
	assert.strictEqual(match[0], 'size_t');
});

test('xmlComment matches XML comments', () => {
	const input = '<!-- this is a comment -->';
	const match = Rule.xmlComment.pattern.exec(input);
	assert.ok(match);
	assert.strictEqual(match[0], '<!-- this is a comment -->');
});

test('xmlComment matches HTML entity-encoded comments', () => {
	const input = '&lt;!-- comment --&gt;';
	const match = Rule.xmlComment.pattern.exec(input);
	assert.ok(match);
	assert.strictEqual(match[0], '&lt;!-- comment --&gt;');
});

test('webLink matches HTTP URLs', () => {
	const input = 'Visit https://example.com/path?query=value';
	const match = Rule.webLink.pattern.exec(input);
	assert.ok(match);
	assert.strictEqual(match[0], 'https://example.com/path?query=value');
});

test('webLink matches FTP URLs', () => {
	const input = 'ftp://files.example.com/';
	const match = Rule.webLink.pattern.exec(input);
	assert.ok(match);
	assert.strictEqual(match[0], 'ftp://files.example.com/');
});

test('hexNumber matches hexadecimal numbers', () => {
	const input = 'value = 0xFF00AB';
	const match = Rule.hexNumber.pattern.exec(input);
	assert.ok(match);
	assert.strictEqual(match[0], '0xFF00AB');
});

test('decimalNumber matches integers', () => {
	const input = 'count = 42';
	const match = Rule.decimalNumber.pattern.exec(input);
	assert.ok(match);
	assert.strictEqual(match[0], '42');
});

test('decimalNumber matches floats', () => {
	const input = 'pi = 3.14159';
	const match = Rule.decimalNumber.pattern.exec(input);
	assert.ok(match);
	assert.strictEqual(match[0], '3.14159');
});

test('decimalNumber matches scientific notation', () => {
	const input = 'mass = 6.022e23';
	const match = Rule.decimalNumber.pattern.exec(input);
	assert.ok(match);
	assert.strictEqual(match[0], '6.022e23');
});

test('decimalNumber matches negative numbers', () => {
	const input = 'temp = -273.15';
	const match = Rule.decimalNumber.pattern.exec(input);
	assert.ok(match);
	// Note: The regex has \b at the start, so it won't match the leading -
	// It matches the number part after the minus
	assert.strictEqual(match[0], '273.15');
});

test('doubleQuotedString matches double-quoted strings', () => {
	const input = '"hello world"';
	const match = Rule.doubleQuotedString.pattern.exec(input);
	assert.ok(match);
	assert.strictEqual(match[0], '"hello world"');
});

test('doubleQuotedString matches strings with escaped quotes', () => {
	const input = '"say \\"hello\\""';
	const match = Rule.doubleQuotedString.pattern.exec(input);
	assert.ok(match);
	assert.strictEqual(match[0], '"say \\"hello\\""');
});

test('singleQuotedString matches single-quoted strings', () => {
	const input = "'hello world'";
	const match = Rule.singleQuotedString.pattern.exec(input);
	assert.ok(match);
	assert.strictEqual(match[0], "'hello world'");
});

test('singleQuotedString matches strings with escaped quotes', () => {
	const input = "'it\\'s working'";
	const match = Rule.singleQuotedString.pattern.exec(input);
	assert.ok(match);
	assert.strictEqual(match[0], "'it\\'s working'");
});

test('multiLineDoubleQuotedString matches multi-line strings', () => {
	const input = '"line 1\nline 2"';
	const match = Rule.multiLineDoubleQuotedString.pattern.exec(input);
	assert.ok(match);
	assert.strictEqual(match[0], '"line 1\nline 2"');
});

test('multiLineSingleQuotedString matches multi-line strings', () => {
	const input = "'line 1\nline 2'";
	const match = Rule.multiLineSingleQuotedString.pattern.exec(input);
	assert.ok(match);
	assert.strictEqual(match[0], "'line 1\nline 2'");
});

test('stringEscape matches backslash escapes', () => {
	const input = '\\n';
	const match = Rule.stringEscape.pattern.exec(input);
	assert.ok(match);
	assert.strictEqual(match[0], '\\n');
});

test('stringEscape matches escaped quotes', () => {
	const input = '\\"';
	const match = Rule.stringEscape.pattern.exec(input);
	assert.ok(match);
	assert.strictEqual(match[0], '\\"');
});

test('webLinkProcess creates anchor elements', () => {
	const baseUrl = 'http://docs.example.com/search?q=';
	const process = Rule.webLinkProcess(baseUrl);

	// Create a mock container and match
	const container = document.createElement('span');
	container.className = 'function';
	container.textContent = 'myFunction';

	const match = {
		value: 'myFunction',
		expression: {type: 'function'}
	};

	const result = process(container, match, {});

	assert.strictEqual(result.tagName, 'A');
	assert.strictEqual(result.className, 'function');
	assert.strictEqual(result.textContent, 'myFunction');
	assert.ok(result.href.includes('docs.example.com'));
	assert.ok(result.href.includes('myFunction'));
});

test('webLinkProcess encodes URLs properly', () => {
	const baseUrl = 'http://docs.example.com/search?q=';
	const process = Rule.webLinkProcess(baseUrl);

	const container = document.createElement('span');
	container.className = 'function';
	container.textContent = 'my Function';

	const match = {
		value: 'my Function',
		expression: {type: 'function'}
	};

	const result = process(container, match, {});

	// Should encode the space
	assert.ok(result.href.includes('my%20Function'));
});

test('webLinkProcess preserves nested HTML', () => {
	const baseUrl = 'http://docs.example.com/';
	const process = Rule.webLinkProcess(baseUrl);

	const container = document.createElement('span');
	container.className = 'function';
	container.innerHTML = 'my<span class="highlight">Func</span>tion';

	const match = {
		value: 'myFunction',
		expression: {type: 'function'}
	};

	const result = process(container, match, {});

	assert.strictEqual(result.tagName, 'A');
	assert.strictEqual(
		result.innerHTML,
		'my<span class="highlight">Func</span>tion'
	);
	assert.strictEqual(result.className, 'function');
});
