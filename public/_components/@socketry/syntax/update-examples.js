#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const examplesDir = './examples';
const excludeFiles = new Set([
	'_template.html',
	'index.html',
	'javascript.html',
	'markdown.html',
	'python.html',
	'ruby.html',
	'html.html',
	'css-colors.html',
	'java.html',
	'custom-theme.html',
	'README.md'
]);

// Language name mappings
const languageNames = {
	'apache': 'Apache',
	'applescript': 'AppleScript',
	'assembly': 'Assembly',
	'bash': 'Bash',
	'basic': 'BASIC/VB',
	'c': 'C/C++',
	'clang': 'C/C++',
	'csharp': 'C#',
	'diff': 'Diff/Patch',
	'go': 'Go',
	'haskell': 'Haskell',
	'io': 'Io',
	'json': 'JSON',
	'lisp': 'Lisp',
	'lua': 'Lua',
	'mixed': 'Mixed Languages',
	'nginx': 'Nginx',
	'ocaml': 'OCaml',
	'pascal': 'Pascal',
	'perl5': 'Perl 5',
	'php': 'PHP',
	'php-script': 'PHP Script',
	'plain': 'Plain Text',
	'protobuf': 'Protocol Buffers',
	'scala': 'Scala',
	'smalltalk': 'Smalltalk',
	'sql': 'SQL',
	'super-collider': 'SuperCollider',
	'swift': 'Swift',
	'wrap-demo': 'Wrap Demo',
	'xrb': 'XRB',
	'xml': 'XML',
	'yaml': 'YAML'
};

// Process each file
const files = readdirSync(examplesDir).filter(f => 
	f.endsWith('.html') && !excludeFiles.has(f)
);

console.log(`Processing ${files.length} files...`);

files.forEach(file => {
	const filePath = join(examplesDir, file);
	let content = readFileSync(filePath, 'utf8');
	
	const baseName = file.replace('.html', '');
	const langName = languageNames[baseName] || baseName;
	
	// Check if already updated
	if (content.includes('examples.css')) {
		console.log(`✓ ${file} already updated`);
		return;
	}
	
	console.log(`Updating ${file}...`);
	
	// Replace <head> with inline styles
	content = content.replace(
		/<head>[\s\S]*?<\/head>/,
		`<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${langName} Examples - @socketry/syntax</title>
	<link rel="stylesheet" href="examples.css">
</head>`
	);
	
	// Add header if not present
	if (!content.includes('<header>')) {
		content = content.replace(
			/<body[^>]*>\s*/,
			`<body>
	<header>
		<h1>${langName} Examples</h1>
		<p class="subtitle">${langName} syntax highlighting</p>
	</header>
	
	<nav>
		<a href="index.html">Back to Examples</a>
	</nav>
	
`
		);
	}
	
	// Wrap examples in div.example if needed
	if (!content.includes('class="example"')) {
		// Simple wrapping for code blocks
		content = content.replace(
			/<h2>(.*?)<\/h2>\s*(<syntax-code|<pre>)/g,
			`<div class="example">
		<h2>$1</h2>
		<p class="description">Example:</p>
		
		$2`
		);
		content = content.replace(
			/(<\/syntax-code>|<\/pre>)\s*(?=<h2>|<script>)/g,
			'$1\n\t</div>\n\n\t'
		);
		// Close last example before script
		content = content.replace(
			/(<\/syntax-code>|<\/pre>)\s*<script/,
			'$1\n\t</div>\n\t\n\t<script'
		);
	}
	
	writeFileSync(filePath, content, 'utf8');
	console.log(`✓ Updated ${file}`);
});

console.log('\nDone!');
