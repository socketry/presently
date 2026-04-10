/**
 * Test helpers for AST/token matching
 */

import assert from 'node:assert';

/**
 * Assert that a specific token type exists in matches at the expected text
 */
export function assertToken(code, matches, type, expectedText) {
	const match = matches.find(
		m =>
			m.type === type &&
			code.substring(m.offset, m.offset + m.length) === expectedText
	);
	assert.ok(
		match,
		`Expected to find token of type '${type}' with text '${expectedText}'`
	);
	return match;
}

/**
 * Assert that a specific token type exists in matches
 */
export function assertTokenType(matches, type) {
	const match = matches.find(m => m.type === type);
	assert.ok(match, `Expected to find token of type '${type}'`);
	return match;
}

/**
 * Assert that code contains a token of given type at specific position
 */
export function assertTokenAt(code, matches, type, expectedText, offset) {
	const match = matches.find(
		m =>
			m.type === type &&
			m.offset === offset &&
			code.substring(m.offset, m.offset + m.length) === expectedText
	);
	assert.ok(
		match,
		`Expected to find token of type '${type}' with text '${expectedText}' at offset ${offset}`
	);
	return match;
}

/**
 * Get all tokens of a specific type from matches
 */
export function getTokensOfType(matches, type) {
	return matches.filter(m => m.type === type);
}

/**
 * Assert that matches contain at least N tokens of given type
 */
export function assertTokenCount(matches, type, minCount) {
	const tokens = getTokensOfType(matches, type);
	assert.ok(
		tokens.length >= minCount,
		`Expected at least ${minCount} tokens of type '${type}', found ${tokens.length}`
	);
	return tokens;
}

/**
 * Extract the text content of a match from source code
 */
export function getMatchText(code, match) {
	return code.substring(match.offset, match.offset + match.length);
}

/**
 * Assert that highlighted HTML output contains expected token classes
 */
export function assertHTMLContains(html, tokenType, expectedText) {
	const innerHTML = html.innerHTML || html.textContent;
	assert.ok(
		innerHTML.includes(tokenType),
		`Expected HTML to contain token type '${tokenType}'`
	);
	if (expectedText) {
		assert.ok(
			innerHTML.includes(expectedText),
			`Expected HTML to contain text '${expectedText}'`
		);
	}
}
