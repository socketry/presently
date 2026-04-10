import Syntax from '../../../Syntax.js';
import registerXRB from '../../../Syntax/Language/xrb.js';
import registerRuby from '../../../Syntax/Language/ruby.js';
import registerXML from '../../../Syntax/Language/xml.js';
import {strictEqual} from 'node:assert';
import test from 'node:test';

async function getMatches(code) {
	const syntax = new Syntax();
	registerRuby(syntax);
	registerXML(syntax);
	registerXRB(syntax);
	const language = await syntax.getLanguage('xrb');
	return await language.getMatches(syntax, code);
}

function typesFrom(matches) {
	return matches.map(m => m.expression.type);
}

test('XRB: ruby processing instruction', async () => {
	const matches = await getMatches('<?r puts "Hello" ?>');
	const types = typesFrom(matches);
	// Should include a keyword-class token for opening/closing and an embedded ruby subtree
	strictEqual(
		types.some(t => t.includes('keyword')),
		true
	);
	strictEqual(
		matches.some(m => m.expression && m.expression.language === 'ruby'),
		true
	);
});

test('XRB: interpolation #{...}', async () => {
	const matches = await getMatches('Value: #{x + 1}');
	const types = typesFrom(matches);
	strictEqual(
		types.some(t => t.includes('keyword')),
		true
	);
	// Embedded ruby subtree should be present
	strictEqual(
		matches.some(m => m.expression && m.expression.language === 'ruby'),
		true
	);
});

test('XRB: xml context preserved', async () => {
	const matches = await getMatches('<tag attr="v">#{1+2}</tag>');
	const types = typesFrom(matches);
	// Expect interpolation keyword to be present; XML tags are handled via subtree
	strictEqual(
		types.some(t => t.includes('keyword')),
		true
	);
});
