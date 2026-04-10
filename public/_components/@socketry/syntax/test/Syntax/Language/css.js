// test/Syntax/Language/css.js
// Tests for CSS language highlighting

import {test} from 'node:test';
import assert from 'node:assert';
import {JSDOM} from 'jsdom';

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;

import Syntax from '../../../Syntax.js';
import registerCSS from '../../../Syntax/Language/css.js';

test('CSS language is registered', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');
	assert.ok(language, 'CSS language should be registered');
	assert.strictEqual(language.name, 'css');
});

test('selectors - element', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');
	const code = 'div { color: red; }';
	const matches = await language.getMatches(syntax, code);

	const selectors = matches.filter(m => m.type === 'selector');
	assert.ok(selectors.length > 0, 'Should find selector');
});

test('selectors - class', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');
	const code = '.my-class { color: red; }';
	const matches = await language.getMatches(syntax, code);

	const selectors = matches.filter(m => m.type === 'selector');
	assert.ok(selectors.length > 0, 'Should find class selector');
});

test('selectors - id', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');
	const code = '#my-id { color: red; }';
	const matches = await language.getMatches(syntax, code);

	const selectors = matches.filter(m => m.type === 'selector');
	assert.ok(selectors.length > 0, 'Should find id selector');
});

test('selectors - attribute', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');
	const code = '[data-value="test"] { color: red; }';
	const matches = await language.getMatches(syntax, code);

	const selectors = matches.filter(m => m.type === 'selector');
	assert.ok(selectors.length > 0, 'Should find attribute selector');
});

test('selectors - pseudo-class', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');
	const code = 'a:hover { color: blue; }';
	const matches = await language.getMatches(syntax, code);

	const selectors = matches.filter(m => m.type === 'selector');
	assert.ok(selectors.length > 0, 'Should find pseudo-class selector');
});

test('properties and values', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');
	const code = 'div { color: red; }';
	const matches = await language.getMatches(syntax, code);

	const properties = matches.filter(m => m.type === 'property');
	const values = matches.filter(m => m.type === 'value');

	assert.ok(properties.length > 0, 'Should find property');
	assert.ok(values.length > 0, 'Should find value');
});

test('color - named color', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');
	const code = 'div { color: AliceBlue; }';
	const matches = await language.getMatches(syntax, code);

	const colors = matches.filter(m => m.type === 'color');
	assert.ok(colors.length > 0, 'Should find named color');
});

test('color - hex short', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');
	const code = 'div { color: #fff; }';
	const matches = await language.getMatches(syntax, code);

	const colors = matches.filter(m => m.type === 'color');
	assert.ok(colors.length > 0, 'Should find hex color');
});

test('color - hex long', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');
	const code = 'div { color: #ffffff; }';
	const matches = await language.getMatches(syntax, code);

	const colors = matches.filter(m => m.type === 'color');
	assert.ok(colors.length > 0, 'Should find hex color');
});

test('color - rgb', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');
	const code = 'div { color: rgb(255, 0, 0); }';
	const matches = await language.getMatches(syntax, code);

	const colors = matches.filter(m => m.type === 'color');
	assert.ok(colors.length > 0, 'Should find rgb color');
});

test('color - rgba', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');
	const code = 'div { color: rgba(255, 0, 0, 0.5); }';
	const matches = await language.getMatches(syntax, code);

	const colors = matches.filter(m => m.type === 'color');
	assert.ok(colors.length > 0, 'Should find rgba color');
});

test('color - hsl', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');
	const code = 'div { color: hsl(120, 100%, 50%); }';
	const matches = await language.getMatches(syntax, code);

	const colors = matches.filter(m => m.type === 'color');
	assert.ok(colors.length > 0, 'Should find hsl color');
});

test('color - hsla', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');
	const code = 'div { color: hsla(120, 100%, 50%, 0.5); }';
	const matches = await language.getMatches(syntax, code);

	const colors = matches.filter(m => m.type === 'color');
	assert.ok(colors.length > 0, 'Should find hsla color');
});

test('comments - single line', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');
	const code = '/* This is a comment */';
	const matches = await language.getMatches(syntax, code);

	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.length > 0, 'Should find comment');
});

test('comments - multiline', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');
	const code = `/* This is
	a multiline
	comment */`;
	const matches = await language.getMatches(syntax, code);

	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.length > 0, 'Should find multiline comment');
});

test('strings - single quoted', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');
	const code = "content: 'hello';";
	const matches = await language.getMatches(syntax, code);

	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.length > 0, 'Should find single quoted string');
});

test('strings - double quoted', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');
	const code = 'content: "hello";';
	const matches = await language.getMatches(syntax, code);

	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.length > 0, 'Should find double quoted string');
});

test('functions - url', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');
	const code = 'background: url(image.png);';
	const matches = await language.getMatches(syntax, code);

	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.length > 0, 'Should find url function');
});

test('functions - calc', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');
	const code = 'width: calc(100% - 20px);';
	const matches = await language.getMatches(syntax, code);

	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.length > 0, 'Should find calc function');
});

test('media query', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');
	const code = '@media screen and (max-width: 600px) { .class { color: red; } }';
	const matches = await language.getMatches(syntax, code);

	assert.ok(matches.length > 0, 'Should parse media query');
});

test('multiple properties', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');
	const code = `div {
		color: red;
		background-color: blue;
		margin: 10px;
		padding: 5px;
	}`;
	const matches = await language.getMatches(syntax, code);

	const properties = matches.filter(m => m.type === 'property');
	assert.ok(properties.length >= 4, 'Should find multiple properties');
});

test('complex selector', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');
	const code = 'div.class#id[attr="value"]:hover > span { color: red; }';
	const matches = await language.getMatches(syntax, code);

	const selectors = matches.filter(m => m.type === 'selector');
	assert.ok(selectors.length > 0, 'Should parse complex selector');
});

test('vendor prefixes', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');
	const code = 'div { -webkit-transform: rotate(45deg); }';
	const matches = await language.getMatches(syntax, code);

	const properties = matches.filter(m => m.type === 'property');
	assert.ok(properties.length > 0, 'Should find vendor prefixed property');
});

test('keyframes', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');
	const code = '@keyframes slide { from { left: 0; } to { left: 100px; } }';
	const matches = await language.getMatches(syntax, code);

	assert.ok(matches.length > 0, 'Should parse keyframes');
});

test('color box - color matches have process function', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');

	const code = 'div { color: #ff0000; }';
	const matches = await language.getMatches(syntax, code);

	const colorMatches = matches.filter(m => m.type === 'color');
	assert.ok(colorMatches.length > 0, 'Should find color matches');

	// Check that at least one color match has a process function
	const matchWithProcess = colorMatches.find(
		m => m.expression && m.expression.process
	);
	assert.ok(matchWithProcess, 'Color match should have process function');
	assert.strictEqual(
		typeof matchWithProcess.expression.process,
		'function',
		'Process should be a function'
	);
});

test('color box - process function creates colour-box element', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');

	const code = 'div { color: #ff0000; }';
	const matches = await language.getMatches(syntax, code);

	const colorMatch = matches.find(
		m => m.type === 'color' && m.expression && m.expression.process
	);
	assert.ok(colorMatch, 'Should find color match with process function');

	// Create a test element
	const element = document.createElement('span');
	element.textContent = '#ff0000';

	// Call the process function
	const result = colorMatch.expression.process(element, colorMatch);

	// Verify the color box was created
	assert.strictEqual(result, element, 'Should return the element');
	const colourBox = element.querySelector('.colour-box');
	assert.ok(colourBox, 'Should create colour-box element');

	const sample = colourBox.querySelector('.sample');
	assert.ok(sample, 'Should create sample element inside colour-box');
	assert.strictEqual(
		sample.style.backgroundColor,
		'rgb(255, 0, 0)',
		'Should set backgroundColor to the color value'
	);
});

test('color box - handles named colors', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');

	const code = 'div { color: AliceBlue; }';
	const matches = await language.getMatches(syntax, code);

	const colorMatch = matches.find(
		m => m.type === 'color' && m.expression && m.expression.process
	);
	assert.ok(colorMatch, 'Should find color match with process function');

	const element = document.createElement('span');
	element.textContent = 'AliceBlue';

	colorMatch.expression.process(element, colorMatch);

	const sample = element.querySelector('.sample');
	assert.ok(sample, 'Should create sample element for named color');
	assert.strictEqual(
		sample.style.backgroundColor,
		'aliceblue',
		'Should set backgroundColor to named color'
	);
});

test('color box - handles rgba colors', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');

	const code = 'div { color: rgba(255, 0, 0, 0.5); }';
	const matches = await language.getMatches(syntax, code);

	const colorMatch = matches.find(
		m => m.type === 'color' && m.expression && m.expression.process
	);
	assert.ok(colorMatch, 'Should find color match with process function');

	const element = document.createElement('span');
	element.textContent = 'rgba(255, 0, 0, 0.5)';

	colorMatch.expression.process(element, colorMatch);

	const sample = element.querySelector('.sample');
	assert.ok(sample, 'Should create sample element for rgba color');
	assert.strictEqual(
		sample.style.backgroundColor,
		'rgba(255, 0, 0, 0.5)',
		'Should set backgroundColor to rgba value'
	);
});

test('color box - returns element unchanged if no textContent', async () => {
	const syntax = new Syntax();
	registerCSS(syntax);
	const language = await syntax.getLanguage('css');

	const code = 'div { color: #ff0000; }';
	const matches = await language.getMatches(syntax, code);

	const colorMatch = matches.find(
		m => m.type === 'color' && m.expression && m.expression.process
	);
	assert.ok(colorMatch, 'Should find color match with process function');

	const element = document.createElement('span');
	// No textContent set

	const result = colorMatch.expression.process(element, colorMatch);

	assert.strictEqual(result, element, 'Should return the element');
	const colourBox = element.querySelector('.colour-box');
	assert.strictEqual(
		colourBox,
		null,
		'Should not create colour-box if no textContent'
	);
});
