/**
 * Tests for Protocol Buffers (protobuf) language syntax highlighting
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

test('Protocol Buffers language can be registered', async () => {
	const language = await syntax.getResource('protobuf');
	assert.ok(language);
	assert.equal(language.name, 'protobuf');
});

test('Protobuf: keyword message', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(syntax, 'message Person { }');
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(k => k.value === 'message'));
});

test('Protobuf: keyword enum', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(syntax, 'enum Status { }');
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(k => k.value === 'enum'));
});

test('Protobuf: keyword service', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(syntax, 'service MyService { }');
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(k => k.value === 'service'));
});

test('Protobuf: keyword rpc', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(
		syntax,
		'rpc GetUser(Request) returns (Response);'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(k => k.value === 'rpc'));
	assert.ok(keywords.some(k => k.value === 'returns'));
});

test('Protobuf: keyword import', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(syntax, 'import "other.proto";');
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(k => k.value === 'import'));
});

test('Protobuf: keyword package', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(syntax, 'package com.example;');
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(k => k.value === 'package'));
});

test('Protobuf: keyword option', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(
		syntax,
		'option java_package = "com.example";'
	);
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(k => k.value === 'option'));
});

test('Protobuf: keyword extend', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(syntax, 'extend Message { }');
	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(k => k.value === 'extend'));
});

test('Protobuf: constants true and false', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(
		syntax,
		'option allow = true; option deny = false;'
	);
	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(c => c.value === 'true'));
	assert.ok(constants.some(c => c.value === 'false'));
});

test('Protobuf: type string', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(syntax, 'string name = 1;');
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(t => t.value === 'string'));
});

test('Protobuf: type int32', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(syntax, 'int32 age = 2;');
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(t => t.value === 'int32'));
});

test('Protobuf: type int64', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(syntax, 'int64 timestamp = 3;');
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(t => t.value === 'int64'));
});

test('Protobuf: type bool', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(syntax, 'bool active = 4;');
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(t => t.value === 'bool'));
});

test('Protobuf: type double', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(syntax, 'double price = 5;');
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(t => t.value === 'double'));
});

test('Protobuf: type float', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(syntax, 'float ratio = 6;');
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(t => t.value === 'float'));
});

test('Protobuf: type bytes', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(syntax, 'bytes data = 7;');
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(t => t.value === 'bytes'));
});

test('Protobuf: fixed-size integer types', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(
		syntax,
		'fixed32 a = 1; fixed64 b = 2; sfixed32 c = 3; sfixed64 d = 4;'
	);
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(t => t.value === 'fixed32'));
	assert.ok(types.some(t => t.value === 'fixed64'));
	assert.ok(types.some(t => t.value === 'sfixed32'));
	assert.ok(types.some(t => t.value === 'sfixed64'));
});

test('Protobuf: signed integer types', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(
		syntax,
		'sint32 x = 1; sint64 y = 2;'
	);
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(t => t.value === 'sint32'));
	assert.ok(types.some(t => t.value === 'sint64'));
});

test('Protobuf: unsigned integer types', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(
		syntax,
		'uint32 a = 1; uint64 b = 2;'
	);
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(t => t.value === 'uint32'));
	assert.ok(types.some(t => t.value === 'uint64'));
});

test('Protobuf: access modifier optional', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(syntax, 'optional string name = 1;');
	const access = matches.filter(m => m.type === 'access');
	assert.ok(access.some(a => a.value === 'optional'));
});

test('Protobuf: access modifier required', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(syntax, 'required int32 id = 1;');
	const access = matches.filter(m => m.type === 'access');
	assert.ok(access.some(a => a.value === 'required'));
});

test('Protobuf: access modifier repeated', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(syntax, 'repeated string tags = 1;');
	const access = matches.filter(m => m.type === 'access');
	assert.ok(access.some(a => a.value === 'repeated'));
});

test('Protobuf: field names', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(syntax, 'string user_name = 1;');
	const variables = matches.filter(m => m.type === 'variable');
	assert.ok(variables.some(v => v.value === 'user_name'));
});

test('Protobuf: CamelCase type names', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(syntax, 'MyCustomType field = 1;');
	const types = matches.filter(m => m.type === 'type');
	assert.ok(types.some(t => t.value === 'MyCustomType'));
});

test('Protobuf: single-line comments', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(
		syntax,
		'// This is a comment\nstring name = 1;'
	);
	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.length >= 1);
	assert.ok(comments.some(c => c.value.includes('//')));
});

test('Protobuf: multi-line comments', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(
		syntax,
		'/* Multi\nline */\nstring name = 1;'
	);
	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.some(c => c.value.includes('Multi')));
});

test('Protobuf: double-quoted strings', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(syntax, 'option name = "value";');
	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.some(s => s.value === '"value"'));
});

test('Protobuf: single-quoted strings', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(syntax, "option name = 'value';");
	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.some(s => s.value === "'value'"));
});

test('Protobuf: decimal numbers', async () => {
	const language = await syntax.getResource('protobuf');
	const matches = await language.getMatches(syntax, 'int32 field = 123;');
	const numbers = matches.filter(
		m => m.type === 'constant' && /^\d/.test(m.value)
	);
	assert.ok(numbers.length >= 1);
});

test('Protobuf: complete message definition', async () => {
	const language = await syntax.getResource('protobuf');
	const code = `message Person {
	string name = 1;
	int32 age = 2;
}`;
	const matches = await language.getMatches(syntax, code);
	assert.ok(matches.some(m => m.type === 'keyword' && m.value === 'message'));
	assert.ok(matches.some(m => m.type === 'type' && m.value === 'string'));
	assert.ok(matches.some(m => m.type === 'type' && m.value === 'int32'));
	assert.ok(matches.some(m => m.type === 'variable' && m.value === 'name'));
	assert.ok(matches.some(m => m.type === 'variable' && m.value === 'age'));
});

test('Protobuf: enum definition', async () => {
	const language = await syntax.getResource('protobuf');
	const code = `enum Status {
	UNKNOWN = 0;
	ACTIVE = 1;
}`;
	const matches = await language.getMatches(syntax, code);
	assert.ok(matches.some(m => m.type === 'keyword' && m.value === 'enum'));
});

test('Protobuf: service definition', async () => {
	const language = await syntax.getResource('protobuf');
	const code = `service UserService {
	rpc GetUser(UserRequest) returns (UserResponse);
}`;
	const matches = await language.getMatches(syntax, code);
	assert.ok(matches.some(m => m.type === 'keyword' && m.value === 'service'));
	assert.ok(matches.some(m => m.type === 'keyword' && m.value === 'rpc'));
	assert.ok(matches.some(m => m.type === 'keyword' && m.value === 'returns'));
});
