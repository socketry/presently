import Syntax from '../../../Syntax.js';
import registerScala from '../../../Syntax/Language/scala.js';
import registerXML from '../../../Syntax/Language/xml.js';
import {strictEqual, ok} from 'node:assert';
import test from 'node:test';

async function getLanguage() {
	const syntax = new Syntax();
	registerXML(syntax);
	registerScala(syntax);
	return await syntax.getLanguage('scala');
}

function typesFrom(matches) {
	return matches.map(m => m.expression.type);
}

test('Scala: keywords highlighted', async () => {
	const language = await getLanguage();
	const code =
		'object App extends App { def run(): Unit = if (true) return else for (x <- xs) yield x }';
	const matches = await language.getMatches(Syntax.default, code);
	const types = typesFrom(matches);
	ok(types.includes('keyword'));
});

test('Scala: operators highlighted', async () => {
	const language = await getLanguage();
	const code = 'xs.map(x => x: Int) @annot #hash';
	const matches = await language.getMatches(Syntax.default, code);
	const operators = matches.filter(m => m.expression.type === 'operator');
	ok(operators.length > 0);
});

test('Scala: constants highlighted', async () => {
	const language = await getLanguage();
	const code = 'this == null || true && !false';
	const matches = await language.getMatches(Syntax.default, code);
	const constants = matches.filter(m => m.expression.type === 'constant');
	ok(constants.length >= 3);
});

test('Scala: triple and double quoted strings', async () => {
	const language = await getLanguage();
	const code = 'val a = "hello"; val b = """multi\nline"""';
	const matches = await language.getMatches(Syntax.default, code);
	const strings = matches.filter(m => m.expression.type === 'string');
	ok(strings.length >= 2);
});

test('Scala: function names', async () => {
	const language = await getLanguage();
	const code = 'def compute(x: Int) = x + 1; value.toString';
	const matches = await language.getMatches(Syntax.default, code);
	const functions = matches.filter(m => m.expression.type === 'function');
	ok(functions.length >= 2);
});

test('Scala: types and c-style function calls', async () => {
	const language = await getLanguage();
	const code = 'val x: MyType = MyType(1)';
	const matches = await language.getMatches(Syntax.default, code);
	const types = matches.filter(m => m.expression.type === 'type');
	const functions = matches.filter(m => m.expression.type === 'function');
	ok(types.length >= 1);
	ok(functions.length >= 1);
});

test('Scala: comments', async () => {
	const language = await getLanguage();
	const code = '/* block */ // line';
	const matches = await language.getMatches(Syntax.default, code);
	const comments = matches.filter(m => m.expression.type === 'comment');
	ok(comments.length >= 2);
});
