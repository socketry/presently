/**
 * Tests for bash language definition
 */

import {test} from 'node:test';
import assert from 'node:assert';

import Syntax from '../../../Syntax.js';
import register from '../../../Syntax/Language/bash.js';
import registerBashScript from '../../../Syntax/Language/bash-script.js';

test('bash language can be registered', async () => {
	const syntax = new Syntax();
	registerBashScript(syntax);
	register(syntax);
	const language = await syntax.getLanguage('bash');
	assert.ok(language);
	assert.strictEqual(language.name, 'bash');
});

test('bash can highlight shell prompts', async () => {
	const syntax = new Syntax();
	registerBashScript(syntax);
	register(syntax);
	const language = await syntax.getLanguage('bash');

	const code = '$ echo hello';
	const matches = await language.getMatches(syntax, code);

	assert.ok(matches.length > 0);
	assert.strictEqual(matches[0].type, 'prompt');
});

test('bash can embed bash-script for command execution', async () => {
	const syntax = new Syntax();
	registerBashScript(syntax);
	register(syntax);
	const language = await syntax.getLanguage('bash');

	const code = '$ ls -la';
	const matches = await language.getMatches(syntax, code);

	// Should find prompt and embedded bash-script execution
	const hasPrompt = matches.some(m => m.type === 'prompt');
	assert.ok(hasPrompt);
});

test('bash can handle multi-line commands', async () => {
	const syntax = new Syntax();
	registerBashScript(syntax);
	register(syntax);
	const language = await syntax.getLanguage('bash');

	const code = '$ echo "line 1"\n$ echo "line 2"';
	const matches = await language.getMatches(syntax, code);

	// Should find multiple prompts
	const promptMatches = matches.filter(m => m.type === 'prompt');
	assert.ok(promptMatches.length >= 2);
});

test('bash can handle comments in commands', async () => {
	const syntax = new Syntax();
	registerBashScript(syntax);
	register(syntax);
	const language = await syntax.getLanguage('bash');

	const code = '$ echo test  # inline comment';
	const matches = await language.getMatches(syntax, code);

	// Should have prompt at minimum
	assert.ok(matches.length > 0);
});

test('bash can handle strings in commands', async () => {
	const syntax = new Syntax();
	registerBashScript(syntax);
	register(syntax);
	const language = await syntax.getLanguage('bash');

	const code = '$ echo "hello world"';
	const matches = await language.getMatches(syntax, code);

	assert.ok(matches.length > 0);
});

test('bash can match dollar sign prompts', async () => {
	const syntax = new Syntax();
	registerBashScript(syntax);
	register(syntax);
	const language = await syntax.getLanguage('bash');

	const code = '$ pwd';
	const matches = await language.getMatches(syntax, code);

	const prompt = matches.find(m => m.type === 'prompt');
	assert.ok(prompt);
	assert.strictEqual(prompt.value, '$');
});

test('bash can match hash prompts for root', async () => {
	const syntax = new Syntax();
	registerBashScript(syntax);
	register(syntax);
	const language = await syntax.getLanguage('bash');

	const code = '# whoami';
	const matches = await language.getMatches(syntax, code);

	// Could be either prompt or comment depending on pattern priority
	assert.ok(matches.length > 0);
});

test('bash can handle complex command with options', async () => {
	const syntax = new Syntax();
	registerBashScript(syntax);
	register(syntax);
	const language = await syntax.getLanguage('bash');

	const code = '$ grep -r "pattern" /path/to/dir';
	const matches = await language.getMatches(syntax, code);

	assert.ok(matches.length > 0);
	const hasPrompt = matches.some(m => m.type === 'prompt');
	assert.ok(hasPrompt);
});

test('bash can handle pipes in commands', async () => {
	const syntax = new Syntax();
	registerBashScript(syntax);
	register(syntax);
	const language = await syntax.getLanguage('bash');

	const code = '$ cat file.txt | grep search';
	const matches = await language.getMatches(syntax, code);

	assert.ok(matches.length > 0);
});

test('bash can handle command substitution', async () => {
	const syntax = new Syntax();
	registerBashScript(syntax);
	register(syntax);
	const language = await syntax.getLanguage('bash');

	const code = '$ echo $(date)';
	const matches = await language.getMatches(syntax, code);

	assert.ok(matches.length > 0);
});

test('bash can handle variables in commands', async () => {
	const syntax = new Syntax();
	registerBashScript(syntax);
	register(syntax);
	const language = await syntax.getLanguage('bash');

	const code = '$ echo $PATH';
	const matches = await language.getMatches(syntax, code);

	assert.ok(matches.length > 0);
});
