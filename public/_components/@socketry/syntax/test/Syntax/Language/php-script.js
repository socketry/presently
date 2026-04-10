import {strictEqual} from 'assert';
import {test} from 'node:test';

import Syntax from '../../../Syntax.js';
import registerPhpScript from '../../../Syntax/Language/php-script.js';

test('PHP-Script: keywords are highlighted', async () => {
	const syntax = new Syntax();
	registerPhpScript(syntax);
	const language = await syntax.getLanguage('php-script');

	const matches = await language.getMatches(
		syntax,
		'function class if else while'
	);
	const types = matches.map(m => m.expression.type);

	strictEqual(types.filter(t => t === 'keyword').length, 5);
});

test('PHP-Script: access modifiers are highlighted', async () => {
	const syntax = new Syntax();
	registerPhpScript(syntax);
	const language = await syntax.getLanguage('php-script');

	const matches = await language.getMatches(syntax, 'public private protected');
	const types = matches.map(m => m.expression.type);

	strictEqual(types.filter(t => t === 'access').length, 3);
});

test('PHP-Script: operators are highlighted', async () => {
	const syntax = new Syntax();
	registerPhpScript(syntax);
	const language = await syntax.getLanguage('php-script');

	const matches = await language.getMatches(syntax, '+ - * / = < > new');
	const types = matches.map(m => m.expression.type);

	strictEqual(types.filter(t => t === 'operator').length >= 7, true);
});

test('PHP-Script: constants are highlighted', async () => {
	const syntax = new Syntax();
	registerPhpScript(syntax);
	const language = await syntax.getLanguage('php-script');

	const matches = await language.getMatches(syntax, 'this true false');
	const types = matches.map(m => m.expression.type);

	strictEqual(types.filter(t => t === 'constant').length, 3);
});

test('PHP-Script: variables are highlighted', async () => {
	const syntax = new Syntax();
	registerPhpScript(syntax);
	const language = await syntax.getLanguage('php-script');

	const matches = await language.getMatches(syntax, '$name $value $counter');
	const types = matches.map(m => m.expression.type);

	strictEqual(types.filter(t => t === 'variable').length, 3);
});

test('PHP-Script: functions are highlighted', async () => {
	const syntax = new Syntax();
	registerPhpScript(syntax);
	const language = await syntax.getLanguage('php-script');

	const matches = await language.getMatches(
		syntax,
		'strlen($str) array_push($arr, $item)'
	);
	const types = matches.map(m => m.expression.type);

	strictEqual(types.filter(t => t === 'function').length, 2);
});

test('PHP-Script: camel case types are highlighted', async () => {
	const syntax = new Syntax();
	registerPhpScript(syntax);
	const language = await syntax.getLanguage('php-script');

	const matches = await language.getMatches(
		syntax,
		'MyClass DateTime Exception'
	);
	const types = matches.map(m => m.expression.type);

	strictEqual(types.filter(t => t === 'type').length, 3);
});

test('PHP-Script: C-style comments are highlighted', async () => {
	const syntax = new Syntax();
	registerPhpScript(syntax);
	const language = await syntax.getLanguage('php-script');

	const matches = await language.getMatches(syntax, '/* block comment */');
	const types = matches.map(m => m.expression.type);

	strictEqual(types.filter(t => t === 'comment').length, 1);
});

test('PHP-Script: C++-style comments are highlighted', async () => {
	const syntax = new Syntax();
	registerPhpScript(syntax);
	const language = await syntax.getLanguage('php-script');

	const matches = await language.getMatches(syntax, '// single line comment');
	const types = matches.map(m => m.expression.type);

	strictEqual(types.filter(t => t === 'comment').length, 1);
});

test('PHP-Script: Perl-style comments are highlighted', async () => {
	const syntax = new Syntax();
	registerPhpScript(syntax);
	const language = await syntax.getLanguage('php-script');

	const matches = await language.getMatches(syntax, '# perl style comment');
	const types = matches.map(m => m.expression.type);

	strictEqual(types.filter(t => t === 'comment').length, 1);
});

test('PHP-Script: single-quoted strings are highlighted', async () => {
	const syntax = new Syntax();
	registerPhpScript(syntax);
	const language = await syntax.getLanguage('php-script');

	const matches = await language.getMatches(syntax, "'hello world'");
	const types = matches.map(m => m.expression.type);

	strictEqual(types.filter(t => t === 'string').length, 1);
});

test('PHP-Script: double-quoted strings are highlighted', async () => {
	const syntax = new Syntax();
	registerPhpScript(syntax);
	const language = await syntax.getLanguage('php-script');

	const matches = await language.getMatches(syntax, '"hello world"');
	const types = matches.map(m => m.expression.type);

	strictEqual(types.filter(t => t === 'string').length, 1);
});

test('PHP-Script: decimal numbers are highlighted', async () => {
	const syntax = new Syntax();
	registerPhpScript(syntax);
	const language = await syntax.getLanguage('php-script');

	const matches = await language.getMatches(syntax, '42 3.14 -10');
	const types = matches.map(m => m.expression.type);

	strictEqual(types.filter(t => t === 'constant').length >= 3, true);
});

test('PHP-Script: hex numbers are highlighted', async () => {
	const syntax = new Syntax();
	registerPhpScript(syntax);
	const language = await syntax.getLanguage('php-script');

	const matches = await language.getMatches(syntax, '0xFF 0x1A2B');
	const types = matches.map(m => m.expression.type);

	strictEqual(types.filter(t => t === 'constant').length >= 2, true);
});

test('PHP-Script: complete function definition', async () => {
	const syntax = new Syntax();
	registerPhpScript(syntax);
	const language = await syntax.getLanguage('php-script');

	const code = 'function hello($name) { return "Hello " . $name; }';
	const matches = await language.getMatches(syntax, code);
	const types = matches.map(m => m.expression.type);

	strictEqual(types.includes('keyword'), true); // function
	strictEqual(types.includes('function'), true); // hello(
	strictEqual(types.includes('variable'), true); // $name
	strictEqual(types.includes('string'), true); // "Hello "
});

test('PHP-Script: class definition', async () => {
	const syntax = new Syntax();
	registerPhpScript(syntax);
	const language = await syntax.getLanguage('php-script');

	const code = 'class Person { public $name; private $age; }';
	const matches = await language.getMatches(syntax, code);
	const types = matches.map(m => m.expression.type);

	strictEqual(types.includes('keyword'), true); // class
	strictEqual(types.includes('access'), true); // public, private
	strictEqual(types.includes('variable'), true); // $name, $age
});
