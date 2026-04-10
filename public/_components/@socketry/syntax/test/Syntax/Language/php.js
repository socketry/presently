import {strictEqual} from 'assert';
import {test} from 'node:test';

import Syntax from '../../../Syntax.js';
import registerPhp from '../../../Syntax/Language/php.js';

test('PHP: opening and closing tags are highlighted', async () => {
	const syntax = new Syntax();
	registerPhp(syntax);
	const language = await syntax.getLanguage('php');

	const code = '<?php echo "hello"; ?>';
	const matches = await language.getMatches(syntax, code);
	const types = matches.map(m => m.expression.type);

	strictEqual(types.filter(t => t === 'keyword').length >= 2, true); // <?php and ?>
});

test('PHP: short opening tag', async () => {
	const syntax = new Syntax();
	registerPhp(syntax);
	const language = await syntax.getLanguage('php');

	const code = '<? echo "hello"; ?>';
	const matches = await language.getMatches(syntax, code);
	const types = matches.map(m => m.expression.type);

	strictEqual(types.filter(t => t === 'keyword').length >= 2, true); // <? and ?>
});

test('PHP: embedded PHP in HTML', async () => {
	const syntax = new Syntax();
	registerPhp(syntax);
	const language = await syntax.getLanguage('php');

	const code = '<html><?php echo $title; ?></html>';
	const matches = await language.getMatches(syntax, code);
	const types = matches.map(m => m.expression.type);

	strictEqual(types.includes('keyword'), true); // PHP tags
});

test('PHP: multiple PHP blocks', async () => {
	const syntax = new Syntax();
	registerPhp(syntax);
	const language = await syntax.getLanguage('php');

	const code = '<?php $a = 1; ?> text <?php $b = 2; ?>';
	const matches = await language.getMatches(syntax, code);
	const types = matches.map(m => m.expression.type);

	strictEqual(types.filter(t => t === 'keyword').length >= 4, true); // Two pairs of tags
});

test('PHP: multiline PHP block', async () => {
	const syntax = new Syntax();
	registerPhp(syntax);
	const language = await syntax.getLanguage('php');

	const code = `<?php
function hello() {
    echo "Hello";
}
?>`;
	const matches = await language.getMatches(syntax, code);
	const types = matches.map(m => m.expression.type);

	strictEqual(types.includes('keyword'), true); // PHP tags
});

test('PHP: PHP with comments', async () => {
	const syntax = new Syntax();
	registerPhp(syntax);
	const language = await syntax.getLanguage('php');

	const code = '<?php // comment\necho "test"; ?>';
	const matches = await language.getMatches(syntax, code);

	strictEqual(matches.length > 0, true);
});

test('PHP: empty PHP block', async () => {
	const syntax = new Syntax();
	registerPhp(syntax);
	const language = await syntax.getLanguage('php');

	const code = '<?php ?>';
	const matches = await language.getMatches(syntax, code);
	const types = matches.map(m => m.expression.type);

	strictEqual(types.filter(t => t === 'keyword').length >= 2, true);
});
