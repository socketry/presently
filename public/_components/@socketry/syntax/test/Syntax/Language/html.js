import Syntax from '../../../Syntax.js';
import registerHTML from '../../../Syntax/Language/html.js';
import registerXML from '../../../Syntax/Language/xml.js';
import registerJavaScript from '../../../Syntax/Language/javascript.js';
import registerJSON from '../../../Syntax/Language/json.js';
import registerCSS from '../../../Syntax/Language/css.js';
import registerPHPScript from '../../../Syntax/Language/php-script.js';
import registerRuby from '../../../Syntax/Language/ruby.js';
import {strictEqual, ok} from 'node:assert';
import test from 'node:test';

async function getLanguage() {
	const syntax = new Syntax();
	registerXML(syntax);
	registerJavaScript(syntax);
	registerJSON(syntax);
	registerCSS(syntax);
	registerPHPScript(syntax);
	registerRuby(syntax);
	registerHTML(syntax);
	return await syntax.getLanguage('html');
}

function typesFrom(matches) {
	return matches.map(m => m.expression.type);
}

test('HTML language can be registered', async () => {
	const language = await getLanguage();
	strictEqual(language.name, 'html');
});

test('HTML: DOCTYPE declaration', async () => {
	const language = await getLanguage();
	const code = '<!DOCTYPE html>';
	const matches = await language.getMatches(Syntax.default, code);
	const types = typesFrom(matches);
	ok(types.includes('doctype'));
});

test('HTML: embedded JavaScript in script tag', async () => {
	const language = await getLanguage();
	const code = '<script type="text/javascript">console.log("test");</script>';
	const matches = await language.getMatches(Syntax.default, code);
	// Should have embedded JavaScript language
	ok(matches.some(m => m.expression && m.expression.language === 'javascript'));
});

test('HTML: embedded JavaScript in script tag without type', async () => {
	const language = await getLanguage();
	const code = '<script>console.log("test");</script>';
	const matches = await language.getMatches(Syntax.default, code);
	// Should have embedded JavaScript language
	ok(matches.some(m => m.expression && m.expression.language === 'javascript'));
});

test('HTML: embedded JSON in importmap', async () => {
	const language = await getLanguage();
	const code = '<script type="importmap">{"imports": {"vue": "/vue.js"}}</script>';
	const matches = await language.getMatches(Syntax.default, code);
	// Should have embedded JSON language
	ok(matches.some(m => m.expression && m.expression.language === 'json'));
});

test('HTML: embedded CSS in style tag', async () => {
	const language = await getLanguage();
	const code = '<style type="text/css">body { color: red; }</style>';
	const matches = await language.getMatches(Syntax.default, code);
	// Should have embedded CSS language
	ok(matches.some(m => m.expression && m.expression.language === 'css'));
});

test('HTML: embedded PHP', async () => {
	const language = await getLanguage();
	const code = '<?php echo "Hello"; ?>';
	const matches = await language.getMatches(Syntax.default, code);
	const types = typesFrom(matches);
	ok(types.includes('keyword') || types.includes('php-tag'));
});

test('HTML: embedded Ruby', async () => {
	const language = await getLanguage();
	const code = '<?rb puts "Hello" ?>';
	const matches = await language.getMatches(Syntax.default, code);
	const types = typesFrom(matches);
	ok(types.includes('keyword') || types.includes('ruby-tag'));
});

test('HTML: ERB-style instructions', async () => {
	const language = await getLanguage();
	const code = '<%= value %>';
	const matches = await language.getMatches(Syntax.default, code);
	const types = typesFrom(matches);
	ok(types.includes('instruction'));
});

test('HTML: percent escapes', async () => {
	const language = await getLanguage();
	const code = 'test%20value';
	const matches = await language.getMatches(Syntax.default, code);
	const types = typesFrom(matches);
	ok(types.includes('percent-escape'));
});

test('HTML: derives from XML for tags', async () => {
	const language = await getLanguage();
	const code = '<div class="test">Hello</div>';
	const matches = await language.getMatches(Syntax.default, code);
	// Should have XML-derived tag matches
	ok(matches.length > 0);
});
