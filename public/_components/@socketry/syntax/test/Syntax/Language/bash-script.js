/**
 * Tests for bash-script and bash-statement language definitions
 */

import {test} from 'node:test';
import assert from 'node:assert';

import Syntax from '../../../Syntax.js';
import register from '../../../Syntax/Language/bash-script.js';

test('bash-script language can be registered', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('bash-script');
	assert.ok(language);
	assert.strictEqual(language.name, 'bash-script');
});

test('bash-statement language can be registered', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('bash-statement');
	assert.ok(language);
	assert.strictEqual(language.name, 'bash-statement');
});

test('bash-script can highlight operators', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('bash-script');

	const code = 'command1 && command2';
	const matches = await language.getMatches(syntax, code);

	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.length > 0);
	assert.ok(operators.some(m => m.value === '&&'));
});

test('bash-script can highlight pipe operators', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('bash-script');

	const code = 'cat file | grep pattern';
	const matches = await language.getMatches(syntax, code);

	const pipe = matches.find(m => m.value === '|' && m.type === 'operator');
	assert.ok(pipe);
});

test('bash-script can highlight semicolon separators', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('bash-script');

	const code = 'echo hello; echo world';
	const matches = await language.getMatches(syntax, code);

	const semicolon = matches.find(m => m.value === ';' && m.type === 'operator');
	assert.ok(semicolon);
});

test('bash-statement can highlight keywords', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('bash-statement');

	const code = 'if [ $x -eq 1 ]; then echo yes; fi';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.length > 0);
	assert.ok(keywords.some(m => m.value === 'if'));
	assert.ok(keywords.some(m => m.value === 'then'));
	assert.ok(keywords.some(m => m.value === 'fi'));
});

test('bash-statement can highlight for loops', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('bash-statement');

	const code = 'for i in 1 2 3; do echo $i; done';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'for'));
	assert.ok(keywords.some(m => m.value === 'do'));
	assert.ok(keywords.some(m => m.value === 'done'));
});

test('bash-statement can highlight variables', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('bash-statement');

	const code = 'echo $HOME';
	const matches = await language.getMatches(syntax, code);

	const variable = matches.find(m => m.type === 'variable');
	assert.ok(variable);
	assert.strictEqual(variable.value, '$HOME');
});

test('bash-statement can highlight environment variable assignments', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('bash-statement');

	const code = 'PATH=/usr/bin';
	const matches = await language.getMatches(syntax, code);

	// Should recognize variable assignment
	assert.ok(matches.length > 0);
});

test('bash-statement can highlight arithmetic expressions', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('bash-statement');

	const code = 'result=$((5 + 3))';
	const matches = await language.getMatches(syntax, code);

	const expression = matches.find(m => m.type === 'expression');
	assert.ok(expression);
});

test('bash-statement can highlight command substitution with backticks', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('bash-statement');

	const code = 'date=`date +%Y-%m-%d`';
	const matches = await language.getMatches(syntax, code);

	assert.ok(matches.length > 0);
});

test('bash-statement can highlight single-quoted strings', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('bash-statement');

	const code = "echo 'hello world'";
	const matches = await language.getMatches(syntax, code);

	const string = matches.find(m => m.type === 'string');
	assert.ok(string);
});

test('bash-statement can highlight double-quoted strings', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('bash-statement');

	const code = 'echo "hello world"';
	const matches = await language.getMatches(syntax, code);

	const string = matches.find(m => m.type === 'string');
	assert.ok(string);
});

test('bash-statement can highlight command options', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('bash-statement');

	const code = 'ls -la --color=auto';
	const matches = await language.getMatches(syntax, code);

	const options = matches.filter(m => m.type === 'option');
	assert.ok(options.length > 0);
});

test('bash-statement can highlight comments', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('bash-statement');

	const code = '# This is a comment';
	const matches = await language.getMatches(syntax, code);

	const comment = matches.find(m => m.type === 'comment');
	assert.ok(comment);
});

test('bash-statement can highlight decimal numbers', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('bash-statement');

	const code = 'echo 42';
	const matches = await language.getMatches(syntax, code);

	const number = matches.find(m => m.type === 'constant');
	assert.ok(number);
});

test('bash-statement can handle case statements', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('bash-statement');

	const code = 'case $var in';
	const matches = await language.getMatches(syntax, code);

	const keyword = matches.find(m => m.value === 'case' && m.type === 'keyword');
	assert.ok(keyword);
});

test('bash-statement can handle function definitions', async () => {
	const syntax = new Syntax();
	register(syntax);
	const language = await syntax.getLanguage('bash-statement');

	const code = 'function myFunc {';
	const matches = await language.getMatches(syntax, code);

	const keyword = matches.find(
		m => m.value === 'function' && m.type === 'keyword'
	);
	assert.ok(keyword);
});
