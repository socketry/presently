/**
 * CodeElement Integration Tests
 *
 * Tests the <syntax-code> web component with auto-loading
 *
 * Note: These tests focus on the integration between Syntax.js and Language classes
 * without requiring a full browser environment. Full end-to-end tests with stylesheets
 * and DOM rendering are better suited for browser-based testing.
 */

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import Syntax from '../../Syntax.js';

// Set up JSDOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
	url: 'http://localhost:8000/'
});

global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;
global.CustomEvent = dom.window.CustomEvent;

test('Syntax.highlight() registers the web component', async () => {
	// This should register the <syntax-code> element
	await Syntax.highlight({upgradeAll: false});

	// Verify the element is registered
	const constructor = customElements.get('syntax-code');
	assert.ok(constructor, 'syntax-code element should be registered');

	// Verify we can create an instance
	const element = new constructor();
	assert.ok(element instanceof HTMLElement);
});

test('Auto-loading mechanism loads YAML language on demand', async () => {
	const syntax = Syntax.default;

	// YAML should not be loaded yet
	assert.ok(!syntax.hasLanguage('yaml'), 'YAML should not be loaded initially');

	// Request the YAML language
	const language = await syntax.getResource('yaml');

	// Verify it was loaded and cached
	assert.ok(language, 'Language should be loaded');
	assert.equal(language.name, 'yaml', 'Language name should be yaml');
	assert.ok(syntax.hasLanguage('yaml'), 'YAML should now be cached');

	// Requesting again should return the same instance
	const language2 = await syntax.getResource('yaml');
	assert.equal(language2, language, 'Should return cached instance');
});

test('Auto-loading deduplicates concurrent requests', async () => {
	const syntax = new Syntax();

	// Make multiple concurrent requests for the same language
	const [lang1, lang2, lang3] = await Promise.all([
		syntax.getResource('python'),
		syntax.getResource('python'),
		syntax.getResource('python')
	]);

	// All should return the same instance
	assert.equal(
		lang1,
		lang2,
		'Concurrent request 1 and 2 should return same instance'
	);
	assert.equal(
		lang2,
		lang3,
		'Concurrent request 2 and 3 should return same instance'
	);
	assert.equal(lang1.name, 'python');
});

test('Language registration works correctly', async () => {
	const syntax = new Syntax();

	// Load CSS which uses the register() pattern
	const language = await syntax.getResource('css');

	// Verify it's registered under the correct name
	assert.ok(syntax.hasLanguage('css'));
	assert.equal(language.name, 'css');

	// Verify we can process code with it
	const html = await language.process(syntax, 'body { color: red; }');
	assert.ok(html instanceof HTMLElement);
	assert.ok(html.outerHTML.includes('color'));
	assert.ok(html.outerHTML.includes('red'));
});

test('Language.process() with multiple languages', async () => {
	const syntax = Syntax.default;

	// Load multiple languages
	const python = await syntax.getResource('python');
	const yaml = await syntax.getResource('yaml');
	const css = await syntax.getResource('css');

	// Process code in each language
	const pythonHtml = await python.process(syntax, 'def hello(): pass');
	const yamlHtml = await yaml.process(syntax, 'key: value');
	const cssHtml = await css.process(syntax, 'a { color: blue; }');

	// Verify all returned HTML elements
	assert.ok(pythonHtml instanceof HTMLElement);
	assert.ok(yamlHtml instanceof HTMLElement);
	assert.ok(cssHtml instanceof HTMLElement);

	// Verify they contain the expected content
	assert.ok(pythonHtml.textContent.includes('def'));
	assert.ok(yamlHtml.textContent.includes('key'));
	assert.ok(cssHtml.textContent.includes('color'));
});

test('Error handling for non-existent language', async () => {
	const syntax = new Syntax();

	// Try to load a language that doesn't exist
	await assert.rejects(
		async () => await syntax.getResource('nonexistent-language-xyz'),
		{
			name: 'LanguageLoadError',
			message: /Failed to load language 'nonexistent-language-xyz'/
		},
		'Should throw LanguageLoadError for non-existent language'
	);
});

test('Aliases work correctly', async () => {
	const syntax = new Syntax();

	// Load bash-script language and check it registered bash-statement too
	const bashScript = await syntax.getResource('bash-script');

	// bash-statement should also be available (registered by bash-script)
	assert.ok(syntax.hasLanguage('bash-statement'));

	// Load clang which has multiple aliases
	const clang = await syntax.getResource('clang');

	// Check aliases
	assert.ok(syntax.hasLanguage('c'));
	assert.ok(syntax.hasLanguage('cpp'));
	assert.ok(syntax.hasLanguage('c++'));
	assert.ok(syntax.hasLanguage('objective-c'));

	// All aliases should resolve to the same language
	const c = await syntax.getResource('c');
	const cpp = await syntax.getResource('cpp');
	assert.equal(c, clang);
	assert.equal(cpp, clang);
});

test('upgradeAll handles <pre><code> blocks without double-nesting', async () => {
	// Import the upgradeAll function
	const {upgradeAll} = await import('../../Syntax/CodeElement.js');

	// Create a typical code block structure: <pre><code>
	document.body.innerHTML = `
		<div id="test-container">
			<pre><code class="language-javascript">const x = 1;</code></pre>
		</div>
	`;

	// Run upgradeAll
	upgradeAll('code[class*="language-"]');

	const container = document.getElementById('test-container');

	// Check that the syntax-code element was created
	const syntaxCode = container.querySelector('syntax-code');
	assert.ok(syntaxCode, 'syntax-code element should be created');

	// Check that syntax-code is INSIDE the <pre> (replacing <code>)
	const pre = container.querySelector('pre');
	assert.ok(pre, '<pre> should still exist in the container');
	assert.equal(
		syntaxCode.parentElement,
		pre,
		'syntax-code should be child of <pre>'
	);

	// Verify the language was set correctly
	assert.equal(
		syntaxCode.getAttribute('language'),
		'javascript',
		'Language should be set from class name'
	);

	// Verify the code content is preserved
	assert.equal(
		syntaxCode.textContent.trim(),
		'const x = 1;',
		'Code content should be preserved'
	);
	
	// Verify wrap attribute is set (because it's inside <pre>)
	// Note: This happens in connectedCallback, which may not fire in JSDOM
	// We'll just verify structure for now
});

test('upgradeAll can handle standalone <code> blocks with custom selector', async () => {
	const {upgradeAll} = await import('../../Syntax/CodeElement.js');

	// Create a standalone code block (no <pre> wrapper)
	document.body.innerHTML = `
		<div id="test-container">
			<code class="language-python">print("hello")</code>
		</div>
	`;

	// For standalone code blocks, use a selector without 'pre >'
	upgradeAll('code[class*="language-"]');

	const container = document.getElementById('test-container');
	const syntaxCode = container.querySelector('syntax-code');

	assert.ok(syntaxCode, 'syntax-code element should be created');
	assert.equal(
		syntaxCode.parentElement.tagName,
		'DIV',
		'syntax-code should be child of DIV'
	);
	assert.equal(
		syntaxCode.getAttribute('language'),
		'python',
		'Language should be set'
	);
	assert.equal(
		syntaxCode.textContent.trim(),
		'print("hello")',
		'Code content should be preserved'
	);
});

test('syntax-code behaves semantically like <code> when inline', async () => {
	const {CodeElement} = await import('../../Syntax/CodeElement.js');

	// Create an inline syntax-code element
	document.body.innerHTML = `
		<p id="test-container">
			Some text <syntax-code language="javascript">const x = 1;</syntax-code> more text.
		</p>
	`;

	const element = document.querySelector('syntax-code');
	
	// Wait for rendering to complete
	await new Promise(resolve => setTimeout(resolve, 100));

	// Verify it's inline (like <code>) by checking the shadow DOM structure
	const shadowRoot = element.shadowRoot;
	assert.ok(shadowRoot, 'Shadow root should exist');
	
	// Should contain a <code> element, not wrapped in <pre>
	const codeElement = shadowRoot.querySelector('code');
	assert.ok(codeElement, 'Shadow DOM should contain <code> element');
	
	const preElement = shadowRoot.querySelector('pre');
	assert.equal(preElement, null, 'Shadow DOM should NOT contain <pre> wrapper for inline usage');
	
	// The code element should be a direct child of shadow root
	assert.ok(
		Array.from(shadowRoot.children).includes(codeElement),
		'<code> should be direct child of shadow root'
	);
});

test('syntax-code behaves as block when inside <pre>', async () => {
	const {CodeElement} = await import('../../Syntax/CodeElement.js');

	// Create a block syntax-code element inside <pre>
	document.body.innerHTML = `
		<div id="test-container">
			<pre><syntax-code language="javascript">const x = 1;</syntax-code></pre>
		</div>
	`;

	const element = document.querySelector('syntax-code');
	
	// Wait for rendering to complete
	await new Promise(resolve => setTimeout(resolve, 100));

	// Check that wrap attribute was set (because it's inside <pre>)
	assert.ok(element.hasAttribute('wrap'), 'wrap attribute should be set when inside <pre>');
	
	// After rendering, light DOM is cleared, so check shadow DOM
	const shadowRoot = element.shadowRoot;
	const codeElement = shadowRoot.querySelector('code');
	assert.ok(codeElement, 'Shadow DOM should contain <code> element');
	
	// The <code> should be a direct child of shadow root (no <pre> wrapper needed inside)
	assert.ok(
		Array.from(shadowRoot.children).includes(codeElement),
		'<code> should be direct child of shadow root'
	);
});
