/**
 * Tests for Nginx configuration syntax highlighting
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

test('Nginx language can be registered', async () => {
	const language = await syntax.getResource('nginx');
	assert.ok(language);
	assert.equal(language.name, 'nginx');
});

test('nginx: directive matches simple directives', async () => {
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(syntax, 'listen 80;');
	const directives = matches.filter(m => m.type === 'directive');
	assert.ok(directives.length > 0);
});

test('nginx: directive matches directives with parameters', async () => {
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(syntax, 'server_name example.com;');
	const directives = matches.filter(m => m.type === 'directive');
	assert.ok(directives.length > 0);
});

test('nginx: directive matches root directive', async () => {
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(syntax, 'root /var/www/html;');
	const directives = matches.filter(m => m.type === 'directive');
	assert.ok(directives.length > 0);
});

test('nginx: directive matches index directive', async () => {
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(
		syntax,
		'index index.html index.htm;'
	);
	const directives = matches.filter(m => m.type === 'directive');
	assert.ok(directives.length > 0);
});

test('nginx: directive matches access_log directive', async () => {
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(
		syntax,
		'access_log /var/log/nginx/access.log;'
	);
	const directives = matches.filter(m => m.type === 'directive');
	assert.ok(directives.length > 0);
});

test('nginx: function matches directive name with web link', async () => {
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(syntax, 'listen 80;');
	const functions = matches.filter(m => m.type === 'function');
	assert.ok(functions.length > 0);
});

test('nginx: keyword matches server block', async () => {
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(syntax, 'server {');
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'server'));
});

test('nginx: keyword matches http block', async () => {
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(syntax, 'http {');
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'http'));
});

test('nginx: keyword matches location block', async () => {
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(syntax, 'location / {');
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'location'));
});

test('nginx: keyword matches upstream block', async () => {
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(syntax, 'upstream backend {');
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'upstream'));
});

test('nginx: keyword matches events block', async () => {
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(syntax, 'events {');
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'events'));
});

test('nginx: variable matches simple variable', async () => {
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(syntax, '$host');
	const variables = matches.filter(m => m.type === 'variable');
	assert.ok(variables.some(m => m.value.includes('host')));
});

test('nginx: variable matches request_uri variable', async () => {
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(syntax, '$request_uri');
	const variables = matches.filter(m => m.type === 'variable');
	assert.ok(variables.length > 0);
});

test('nginx: variable matches remote_addr variable', async () => {
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(syntax, '$remote_addr');
	const variables = matches.filter(m => m.type === 'variable');
	assert.ok(variables.length > 0);
});

test('nginx: variable matches http_user_agent variable', async () => {
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(syntax, '$http_user_agent');
	const variables = matches.filter(m => m.type === 'variable');
	assert.ok(variables.length > 0);
});

test('nginx: variable matches in directive', async () => {
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(
		syntax,
		'return 301 https://$host$request_uri;'
	);
	const variables = matches.filter(m => m.type === 'variable');
	assert.ok(variables.length > 0);
});

test('nginx: perlStyleComment matches hash comments', async () => {
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(syntax, '# This is a comment');
	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.length > 0);
});

test('nginx: singleQuotedString matches single-quoted strings', async () => {
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(syntax, "'text/html'");
	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.length > 0);
});

test('nginx: doubleQuotedString matches double-quoted strings', async () => {
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(syntax, '"application/json"');
	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.length > 0);
});

test('nginx: complete server block', async () => {
	const code = `server {
    listen 80;
    server_name example.com;
    root /var/www/html;
}`;
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(syntax, code);
	const keywords = matches.filter(m => m.type === 'keyword');
	const directives = matches.filter(m => m.type === 'directive');
	assert.ok(keywords.length > 0);
	assert.ok(directives.length > 0);
});

test('nginx: location block with proxy_pass', async () => {
	const code = `location / {
    proxy_pass http://backend;
}`;
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(syntax, code);
	const keywords = matches.filter(m => m.type === 'keyword');
	const directives = matches.filter(m => m.type === 'directive');
	assert.ok(keywords.length > 0);
	assert.ok(directives.length > 0);
});

test('nginx: rewrite directive with regex', async () => {
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(
		syntax,
		'rewrite ^/old-path(.*)$ /new-path$1 permanent;'
	);
	const directives = matches.filter(m => m.type === 'directive');
	assert.ok(directives.length > 0);
});

test('nginx: ssl directives', async () => {
	const code = `ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;`;
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(syntax, code);
	const directives = matches.filter(m => m.type === 'directive');
	assert.ok(directives.length > 0);
});

test('nginx: gzip directives', async () => {
	const code = `gzip on;
gzip_types text/plain text/css application/json;`;
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(syntax, code);
	const directives = matches.filter(m => m.type === 'directive');
	assert.ok(directives.length > 0);
});

test('nginx: upstream with servers', async () => {
	const code = `upstream backend {
    server 127.0.0.1:8080;
    server 127.0.0.1:8081;
}`;
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(syntax, code);
	const keywords = matches.filter(m => m.type === 'keyword');
	const directives = matches.filter(m => m.type === 'directive');
	assert.ok(keywords.length > 0);
	assert.ok(directives.length > 0);
});

test('nginx: add_header directive', async () => {
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(
		syntax,
		'add_header X-Frame-Options "SAMEORIGIN";'
	);
	const directives = matches.filter(m => m.type === 'directive');
	const strings = matches.filter(m => m.type === 'string');
	assert.ok(directives.length > 0);
	assert.ok(strings.length > 0);
});

test('nginx: try_files directive', async () => {
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(
		syntax,
		'try_files $uri $uri/ /index.html;'
	);
	const directives = matches.filter(m => m.type === 'directive');
	const variables = matches.filter(m => m.type === 'variable');
	assert.ok(directives.length > 0);
	assert.ok(variables.length > 0);
});

test('nginx: if directive with condition', async () => {
	const code = `if ($request_method = POST) {
    return 405;
}`;
	const language = await syntax.getResource('nginx');
	const matches = await language.getMatches(syntax, code);
	const keywords = matches.filter(m => m.type === 'keyword');
	const variables = matches.filter(m => m.type === 'variable');
	assert.ok(keywords.length > 0);
	assert.ok(variables.length > 0);
});
