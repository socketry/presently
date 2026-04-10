/**
 * Tests for Perl 5 language syntax highlighting
 */

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import Syntax from '../../../Syntax.js';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;

const syntax = new Syntax();

test('Perl 5 language can be registered', async () => {
	const language = await syntax.getResource('perl5');
	assert.ok(language);
	assert.equal(language.name, 'perl5');
});

test('Perl 5: keywords', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(
		syntax,
		'if my foreach while unless until sub package'
	);
	const keywords = matches.filter(match => match.type === 'keyword');
	assert.ok(keywords.length >= 8);
	assert.ok(keywords.some(k => k.value === 'if'));
	assert.ok(keywords.some(k => k.value === 'my'));
	assert.ok(keywords.some(k => k.value === 'foreach'));
	assert.ok(keywords.some(k => k.value === 'while'));
});

test('Perl 5: constants', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(syntax, 'this true false');
	const constants = matches.filter(match => match.type === 'constant');
	assert.ok(constants.some(c => c.value === 'this'));
	assert.ok(constants.some(c => c.value === 'true'));
	assert.ok(constants.some(c => c.value === 'false'));
});

test('Perl 5: operators', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(
		syntax,
		'+ - * / % ** && || // => <=> =~ !~'
	);
	const operators = matches.filter(match => match.type === 'operator');
	assert.ok(operators.length >= 10);
	assert.ok(operators.some(op => op.value === '+'));
	assert.ok(operators.some(op => op.value === '**'));
	assert.ok(operators.some(op => op.value === '&&'));
	assert.ok(operators.some(op => op.value === '//'));
	assert.ok(operators.some(op => op.value === '=>'));
	assert.ok(operators.some(op => op.value === '<=>'));
	assert.ok(operators.some(op => op.value === '=~'));
	assert.ok(operators.some(op => op.value === '!~'));
});

test('Perl 5: built-in functions', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(
		syntax,
		'print push pop shift unshift grep map join split'
	);
	const functions = matches.filter(match => match.type === 'function');
	assert.ok(functions.length >= 9);
	assert.ok(functions.some(fn => fn.value === 'print'));
	assert.ok(functions.some(fn => fn.value === 'push'));
	assert.ok(functions.some(fn => fn.value === 'grep'));
	assert.ok(functions.some(fn => fn.value === 'map'));
});

test('Perl 5: variables', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(syntax, '$scalar @array %hash');
	const variables = matches.filter(match => match.type === 'variable');
	assert.ok(variables.length >= 3);
	assert.ok(variables.some(v => v.value === '$scalar'));
	assert.ok(variables.some(v => v.value === '@array'));
	assert.ok(variables.some(v => v.value === '%hash'));
});

test('Perl 5: comments', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(
		syntax,
		'# This is a comment\nmy $x = 1;'
	);
	const comments = matches.filter(match => match.type === 'comment');
	assert.ok(comments.some(c => c.value === '# This is a comment'));
});

test('Perl 5: __END__ marker', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(
		syntax,
		'my $x = 1;\n__END__\nThis is documentation after END'
	);
	const comments = matches.filter(match => match.type === 'comment');
	assert.ok(comments.some(c => c.value.includes('__END__')));
});

test('Perl 5: single-quoted strings', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(syntax, "my $str = 'hello world';");
	const strings = matches.filter(match => match.type === 'string');
	assert.ok(strings.some(s => s.value === "'hello world'"));
});

test('Perl 5: double-quoted strings', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(syntax, 'my $str = "hello world";');
	const strings = matches.filter(match => match.type === 'string');
	assert.ok(strings.some(s => s.value === '"hello world"'));
});

test('Perl 5: decimal numbers', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(
		syntax,
		'my $x = 123; my $y = 45.67;'
	);
	const numbers = matches.filter(
		match => match.type === 'constant' && /^\d/.test(match.value)
	);
	assert.ok(numbers.length >= 2);
});

test('Perl 5: hex numbers', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(syntax, 'my $hex = 0xFF;');
	const hexNumbers = matches.filter(
		match => match.type === 'constant' && match.value.includes('0x')
	);
	assert.ok(hexNumbers.some(h => h.value === '0xFF'));
});

test('Perl 5: regular expressions', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(
		syntax,
		'if ($str =~ /pattern/) { }'
	);
	// Just check that =~ operator is matched
	assert.ok(matches.some(m => m.type === 'operator' && m.value === '=~'));
});

test('Perl 5: function definitions', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(syntax, 'sub my_function { }');
	// Just check that sub keyword is matched
	assert.ok(matches.some(m => m.type === 'keyword' && m.value === 'sub'));
});

test('Perl 5: complete subroutine', async () => {
	const language = await syntax.getResource('perl5');
	const code = `sub greet {
	my ($name) = @_;
	print "Hello, $name\\n";
}`;
	const matches = await language.getMatches(syntax, code);
	assert.ok(matches.some(m => m.type === 'keyword' && m.value === 'sub'));
	assert.ok(matches.some(m => m.type === 'keyword' && m.value === 'my'));
	assert.ok(matches.some(m => m.type === 'function' && m.value === 'print'));
});

test('Perl 5: array operations', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(
		syntax,
		'push @array, $value; my $item = pop @array;'
	);
	assert.ok(matches.some(m => m.type === 'function' && m.value === 'push'));
	assert.ok(matches.some(m => m.type === 'function' && m.value === 'pop'));
	assert.ok(matches.some(m => m.type === 'variable' && m.value === '@array'));
});

test('Perl 5: hash operations', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(
		syntax,
		'my %hash = (key => "value"); my @keys = keys %hash;'
	);
	assert.ok(matches.some(m => m.type === 'variable' && m.value === '%hash'));
	assert.ok(matches.some(m => m.type === 'function' && m.value === 'keys'));
	assert.ok(matches.some(m => m.type === 'operator' && m.value === '=>'));
});

test('Perl 5: control flow', async () => {
	const language = await syntax.getResource('perl5');
	const code = `if ($x > 5) {
	print "big";
} elsif ($x > 2) {
	print "medium";
} else {
	print "small";
}`;
	const matches = await language.getMatches(syntax, code);
	assert.ok(matches.some(m => m.type === 'keyword' && m.value === 'if'));
	assert.ok(matches.some(m => m.type === 'keyword' && m.value === 'elsif'));
	assert.ok(matches.some(m => m.type === 'keyword' && m.value === 'else'));
});

test('Perl 5: loops', async () => {
	const language = await syntax.getResource('perl5');
	const code = `foreach my $item (@array) {
	print $item;
}
while ($condition) {
	last if $done;
}`;
	const matches = await language.getMatches(syntax, code);
	assert.ok(matches.some(m => m.type === 'keyword' && m.value === 'foreach'));
	assert.ok(matches.some(m => m.type === 'keyword' && m.value === 'while'));
	assert.ok(matches.some(m => m.type === 'keyword' && m.value === 'last'));
});

test('Perl 5: package declaration', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(
		syntax,
		'package MyModule; use strict; use warnings;'
	);
	assert.ok(matches.some(m => m.type === 'keyword' && m.value === 'package'));
	assert.ok(matches.some(m => m.type === 'keyword' && m.value === 'use'));
});

test('Perl 5: object-oriented code', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(
		syntax,
		'my $obj = bless {}, "ClassName"; $obj->method();'
	);
	assert.ok(matches.some(m => m.type === 'keyword' && m.value === 'bless'));
	assert.ok(matches.some(m => m.type === 'operator' && m.value === '->'));
});

test('Perl 5: file operations', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(
		syntax,
		'open my $fh, "<", "file.txt"; close $fh;'
	);
	assert.ok(matches.some(m => m.type === 'function' && m.value === 'open'));
	assert.ok(matches.some(m => m.type === 'function' && m.value === 'close'));
});

test('Perl 5: map and grep', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(
		syntax,
		'my @doubled = map { $_ * 2 } @numbers; my @filtered = grep { $_ > 5 } @values;'
	);
	assert.ok(matches.some(m => m.type === 'function' && m.value === 'map'));
	assert.ok(matches.some(m => m.type === 'function' && m.value === 'grep'));
});

test('Perl 5: die and warn', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(
		syntax,
		'die "Error!" unless $ok; warn "Warning message";'
	);
	assert.ok(matches.some(m => m.type === 'keyword' && m.value === 'die'));
	assert.ok(matches.some(m => m.type === 'function' && m.value === 'warn'));
	assert.ok(matches.some(m => m.type === 'keyword' && m.value === 'unless'));
});

test('Perl 5: reference operators', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(
		syntax,
		'my $arrayref = \\@array; my @copy = @{$arrayref};'
	);
	assert.ok(matches.some(m => m.type === 'operator' && m.value === '\\'));
});

test('Perl 5: string operators', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(
		syntax,
		'my $str = "hello" . " " . "world"; my $repeated = "x" x 5;'
	);
	assert.ok(matches.some(m => m.type === 'operator' && m.value === '.'));
	assert.ok(matches.some(m => m.type === 'operator' && m.value === 'x'));
});

test('Perl 5: range operator', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(
		syntax,
		'my @range = (1..10); my @letters = ("a".."z");'
	);
	assert.ok(matches.some(m => m.type === 'operator' && m.value === '..'));
});

test('Perl 5: logical operators', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(
		syntax,
		'if ($a and $b or $c) { } if ($x && $y || $z) { }'
	);
	assert.ok(matches.some(m => m.type === 'operator' && m.value === 'and'));
	assert.ok(matches.some(m => m.type === 'operator' && m.value === 'or'));
	assert.ok(matches.some(m => m.type === 'operator' && m.value === '&&'));
	assert.ok(matches.some(m => m.type === 'operator' && m.value === '||'));
});

test('Perl 5: special variables', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(
		syntax,
		'print $_ for @array; my $args = @ARGV;'
	);
	assert.ok(matches.some(m => m.type === 'variable' && m.value === '$_'));
	assert.ok(matches.some(m => m.type === 'variable' && m.value === '@ARGV'));
});

test('Perl 5: eval', async () => {
	const language = await syntax.getResource('perl5');
	const matches = await language.getMatches(
		syntax,
		'eval { risky_operation(); }; warn $@ if $@;'
	);
	assert.ok(matches.some(m => m.type === 'keyword' && m.value === 'eval'));
	assert.ok(matches.some(m => m.type === 'function' && m.value === 'warn'));
});
