/**
 * Tests for SQL language syntax highlighting
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

test('SQL language can be registered', async () => {
	const language = await syntax.getResource('sql');
	assert.ok(language);
	assert.equal(language.name, 'sql');
});

test('SQL can match SELECT keyword', async () => {
	const language = await syntax.getResource('sql');
	const matches = await language.getMatches(syntax, 'SELECT * FROM users');
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'SELECT'));
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'FROM'));
});

test('SQL can match INSERT keyword', async () => {
	const language = await syntax.getResource('sql');
	const matches = await language.getMatches(
		syntax,
		'INSERT INTO users VALUES (1, 2)'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'INSERT'));
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'INTO'));
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'VALUES'));
});

test('SQL can match UPDATE keyword', async () => {
	const language = await syntax.getResource('sql');
	const matches = await language.getMatches(
		syntax,
		'UPDATE users SET name = "John"'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'UPDATE'));
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'SET'));
});

test('SQL can match DELETE keyword', async () => {
	const language = await syntax.getResource('sql');
	const matches = await language.getMatches(
		syntax,
		'DELETE FROM users WHERE id = 1'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'DELETE'));
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'WHERE'));
});

test('SQL can match CREATE TABLE', async () => {
	const language = await syntax.getResource('sql');
	const matches = await language.getMatches(
		syntax,
		'CREATE TABLE users (id INT PRIMARY KEY)'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'CREATE'));
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'TABLE'));
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'PRIMARY'));
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'KEY'));
});

test('SQL can match JOIN keywords', async () => {
	const language = await syntax.getResource('sql');
	const matches = await language.getMatches(
		syntax,
		'SELECT * FROM a LEFT JOIN b ON a.id = b.id'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'LEFT'));
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'JOIN'));
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'ON'));
});

test('SQL can match operators', async () => {
	const language = await syntax.getResource('sql');
	const matches = await language.getMatches(
		syntax,
		'WHERE a = 1 AND b != 2 OR c > 3'
	);
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '='));
	assert.ok(operators.some(m => m.value === '!='));
	assert.ok(operators.some(m => m.value === '>'));
});

test('SQL can match comparison operators', async () => {
	const language = await syntax.getResource('sql');
	const matches = await language.getMatches(
		syntax,
		'WHERE x < 5 AND y >= 10 AND z <= 20'
	);
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '<'));
	assert.ok(operators.some(m => m.value === '>='));
	assert.ok(operators.some(m => m.value === '<='));
});

test('SQL can match arithmetic operators', async () => {
	const language = await syntax.getResource('sql');
	const matches = await language.getMatches(
		syntax,
		'SELECT a + b - c * d / e % f'
	);
	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '+'));
	assert.ok(operators.some(m => m.value === '-'));
	assert.ok(operators.some(m => m.value === '*'));
	assert.ok(operators.some(m => m.value === '/'));
	assert.ok(operators.some(m => m.value === '%'));
});

test('SQL can match single-line comments', async () => {
	const language = await syntax.getResource('sql');
	const matches = await language.getMatches(
		syntax,
		'-- This is a comment\nSELECT * FROM users'
	);
	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.some(m => m.value === '-- This is a comment'));
});

test('SQL can match single-quoted strings', async () => {
	const language = await syntax.getResource('sql');
	const matches = await language.getMatches(
		syntax,
		"SELECT * FROM users WHERE name = 'John Doe'"
	);
	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.some(m => m.value === "'John Doe'"));
});

test('SQL can match double-quoted strings', async () => {
	const language = await syntax.getResource('sql');
	const matches = await language.getMatches(
		syntax,
		'SELECT * FROM users WHERE name = "Jane Smith"'
	);
	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.some(m => m.value === '"Jane Smith"'));
});

test('SQL can match decimal numbers', async () => {
	const language = await syntax.getResource('sql');
	const matches = await language.getMatches(
		syntax,
		'SELECT * FROM items WHERE price = 19.99'
	);
	const numbers = matches.filter(m => m.type === 'constant');
	assert.ok(numbers.some(m => m.value === '19.99'));
});

test('SQL can match hexadecimal numbers', async () => {
	const language = await syntax.getResource('sql');
	const matches = await language.getMatches(syntax, 'SELECT 0xFF, 0x1A2B');
	const numbers = matches.filter(m => m.type === 'constant');
	assert.ok(numbers.some(m => m.value === '0xFF'));
	assert.ok(numbers.some(m => m.value === '0x1A2B'));
});

test('SQL keywords are case-insensitive', async () => {
	const language = await syntax.getResource('sql');
	const matches = await language.getMatches(
		syntax,
		'select * from users where id = 1'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'select'));
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'from'));
	assert.ok(keywords.some(m => m.value.toLowerCase() === 'where'));
});

test('SQL can match data types', async () => {
	const language = await syntax.getResource('sql');
	const matches = await language.getMatches(
		syntax,
		'CREATE TABLE t (id INT, name VARCHAR, created TIMESTAMP)'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'INT'));
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'VARCHAR'));
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'TIMESTAMP'));
});

test('SQL can match aggregate functions', async () => {
	const language = await syntax.getResource('sql');
	const matches = await language.getMatches(
		syntax,
		'SELECT COUNT(*), SUM(price), AVG(rating) FROM items'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'COUNT'));
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'SUM'));
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'AVG'));
});

test('SQL can match GROUP BY and HAVING', async () => {
	const language = await syntax.getResource('sql');
	const matches = await language.getMatches(
		syntax,
		'SELECT category FROM items GROUP BY category HAVING COUNT(*) > 5'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'GROUP'));
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'BY'));
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'HAVING'));
});

test('SQL can match ORDER BY', async () => {
	const language = await syntax.getResource('sql');
	const matches = await language.getMatches(
		syntax,
		'SELECT * FROM users ORDER BY name ASC, age DESC'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'ORDER'));
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'BY'));
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'ASC'));
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'DESC'));
});

test('SQL can match DISTINCT keyword', async () => {
	const language = await syntax.getResource('sql');
	const matches = await language.getMatches(
		syntax,
		'SELECT DISTINCT category FROM items'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'DISTINCT'));
});

test('SQL can match LIMIT and OFFSET', async () => {
	const language = await syntax.getResource('sql');
	const matches = await language.getMatches(
		syntax,
		'SELECT * FROM users LIMIT 10 OFFSET 20'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'LIMIT'));
	assert.ok(keywords.some(m => m.value.toUpperCase() === 'OFFSET'));
});

test('SQL can process complete query', async () => {
	const language = await syntax.getResource('sql');
	const code = `-- Get active users with their order counts
SELECT 
	u.id, 
	u.name, 
	COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.active = 1
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 0
ORDER BY order_count DESC
LIMIT 100;`;
	const matches = await language.getMatches(syntax, code);
	assert.ok(matches.length > 0);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.length > 0);

	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.length > 0);
});
