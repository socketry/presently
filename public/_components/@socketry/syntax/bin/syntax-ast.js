#!/usr/bin/env node

import Syntax from '../Syntax.js';

async function main() {
	const args = process.argv.slice(2);
	
	if (args.length < 2) {
		console.error('Usage: syntax-ast <language> <code>');
		console.error('Example: syntax-ast javascript "const x = 1;"');
		process.exit(1);
	}
	
	const [languageName, code] = args;
	
	const syntax = new Syntax();
	
	try {
		const language = await syntax.getLanguage(languageName);
		const matches = await language.getMatches(syntax, code);
		
		console.log('Language:', languageName);
		console.log('Code:', JSON.stringify(code));
		console.log('\nMatches:', matches.length);
		console.log('─'.repeat(80));
		
		for (const match of matches) {
			const text = code.substring(match.offset, match.offset + match.length);
			console.log(`[${match.type}] @${match.offset}..${match.offset + match.length} (${match.length} chars)`);
			console.log(`  Text: ${JSON.stringify(text)}`);
			if (match.children && match.children.length > 0) {
				console.log(`  Children: ${match.children.length}`);
			}
		}
		
	} catch (error) {
		console.error('Error:', error.message);
		process.exit(1);
	}
}

main();
