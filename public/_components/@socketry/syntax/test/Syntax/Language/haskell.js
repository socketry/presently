/**
 * Tests for Haskell language syntax highlighting
 */

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import Syntax from '../../../Syntax.js';

// Set up JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;

const syntax = new Syntax();

test('Haskell language can be registered', async () => {
	const language = await syntax.getResource('haskell');
	assert.ok(language);
	assert.equal(language.name, 'haskell');
});

test('Haskell can match keywords', async () => {
	const language = await syntax.getResource('haskell');
	const code = 'module Main where import Data.List';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'module'));
	assert.ok(keywords.some(m => m.value === 'where'));
	assert.ok(keywords.some(m => m.value === 'import'));
});

test('Haskell can match module declaration', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(syntax, 'module Main where');

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'module'));
	assert.ok(keywords.some(m => m.value === 'where'));
});

test('Haskell can match import statements', async () => {
	const language = await syntax.getResource('haskell');
	const code = 'import qualified Data.Map as M';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'import'));
	assert.ok(keywords.some(m => m.value === 'qualified'));
	assert.ok(keywords.some(m => m.value === 'as'));
});

test('Haskell can match hiding in imports', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(
		syntax,
		'import Data.List hiding (map)'
	);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'hiding'));
});

test('Haskell can match data declarations', async () => {
	const language = await syntax.getResource('haskell');
	const code = 'data Maybe a = Just a | Nothing';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'data'));
});

test('Haskell can match data family', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(syntax, 'data family Array e');

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'data family'));
});

test('Haskell can match data instance', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(
		syntax,
		'data instance T Int = TInt'
	);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'data instance'));
});

test('Haskell can match type declarations', async () => {
	const language = await syntax.getResource('haskell');
	const code = 'type String = [Char]';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'type'));
});

test('Haskell can match type family', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(syntax, 'type family F a');

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'type family'));
});

test('Haskell can match type instance', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(
		syntax,
		'type instance F Int = Bool'
	);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'type instance'));
});

test('Haskell can match newtype declarations', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(
		syntax,
		'newtype Identity a = Identity a'
	);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'newtype'));
});

test('Haskell can match class declarations', async () => {
	const language = await syntax.getResource('haskell');
	const code = 'class Eq a where (==) :: a -> a -> Bool';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'class'));
	assert.ok(keywords.some(m => m.value === 'where'));
});

test('Haskell can match instance declarations', async () => {
	const language = await syntax.getResource('haskell');
	const code = 'instance Eq Int where x == y = ...';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'instance'));
});

test('Haskell can match deriving', async () => {
	const language = await syntax.getResource('haskell');
	const code = 'data Person = Person String Int deriving (Show, Eq)';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'deriving'));
});

test('Haskell can match deriving instance', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(syntax, 'deriving instance Show a');

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'deriving instance'));
});

test('Haskell can match case expressions', async () => {
	const language = await syntax.getResource('haskell');
	const code = 'case x of Just y -> y; Nothing -> 0';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'case'));
	assert.ok(keywords.some(m => m.value === 'of'));
});

test('Haskell can match if-then-else', async () => {
	const language = await syntax.getResource('haskell');
	const code = 'if x > 0 then 1 else 0';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'if'));
	assert.ok(keywords.some(m => m.value === 'then'));
	assert.ok(keywords.some(m => m.value === 'else'));
});

test('Haskell can match let-in expressions', async () => {
	const language = await syntax.getResource('haskell');
	const code = 'let x = 5 in x + 1';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'let'));
	assert.ok(keywords.some(m => m.value === 'in'));
});

test('Haskell can match do notation', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(syntax, 'do x <- getLine; return x');

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'do'));
});

test('Haskell can match mdo (recursive do)', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(
		syntax,
		'mdo x <- f y; y <- g x; return x'
	);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'mdo'));
});

test('Haskell can match forall', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(syntax, 'id :: forall a. a -> a');

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'forall'));
});

test('Haskell can match foreign declarations', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(
		syntax,
		'foreign import ccall "sin" c_sin :: Double -> Double'
	);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'foreign'));
	assert.ok(keywords.some(m => m.value === 'import'));
});

test('Haskell can match infix operators', async () => {
	const language = await syntax.getResource('haskell');
	const code = 'infix 5 +++; infixl 6 ***; infixr 7 ^^^';
	const matches = await language.getMatches(syntax, code);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'infix'));
	assert.ok(keywords.some(m => m.value === 'infixl'));
	assert.ok(keywords.some(m => m.value === 'infixr'));
});

test('Haskell can match default declarations', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(syntax, 'default (Int, Double)');

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'default'));
});

test('Haskell can match rec keyword', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(syntax, 'rec x <- f y');

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'rec'));
});

test('Haskell can match proc (arrows)', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(
		syntax,
		'proc x -> returnA -< x + 1'
	);

	const keywords = matches.filter(m => m.type === 'keyword');
	assert.ok(keywords.some(m => m.value === 'proc'));
});

test('Haskell can match True and False constants', async () => {
	const language = await syntax.getResource('haskell');
	const code = 'x = True; y = False';
	const matches = await language.getMatches(syntax, code);

	const constants = matches.filter(m => m.type === 'constant');
	assert.ok(constants.some(m => m.value === 'True'));
	assert.ok(constants.some(m => m.value === 'False'));
});

test('Haskell can match type signatures (::)', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(syntax, 'f :: Int -> String');

	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '::'));
});

test('Haskell can match function arrow (->)', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(
		syntax,
		'f :: Int -> String -> Bool'
	);

	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '->'));
});

test('Haskell can match bind operator (<-)', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(syntax, 'x <- getLine');

	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '<-'));
});

test('Haskell can match arrow operators', async () => {
	const language = await syntax.getResource('haskell');
	const code = 'f -< x; g -<< y';
	const matches = await language.getMatches(syntax, code);

	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '-<'));
	assert.ok(operators.some(m => m.value === '-<<'));
});

test('Haskell can match pipe operator', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(
		syntax,
		'data Either a b = Left a | Right b'
	);

	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '|'));
});

test('Haskell can match lambda (\\)', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(syntax, '\\x -> x + 1');

	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '\\'));
});

test('Haskell can match backtick infix', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(syntax, 'x `mod` 2');

	const operators = matches.filter(m => m.type === 'operator');
	assert.ok(operators.some(m => m.value === '`'));
});

test('Haskell can match line comments', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(syntax, '-- This is a comment');

	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.length > 0);
	assert.ok(comments[0].value.includes('comment'));
});

test('Haskell can match block comments', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(
		syntax,
		'{- multi\nline\ncomment -}'
	);

	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.length > 0);
	assert.ok(comments[0].value.includes('multi'));
});

test('Haskell can match nested block comments', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(
		syntax,
		'{- outer {- inner -} outer -}'
	);

	const comments = matches.filter(m => m.type === 'comment');
	assert.ok(comments.length > 0);
});

test('Haskell can match double-quoted strings', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(syntax, '"Hello, World!"');

	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.some(m => m.value.includes('Hello')));
});

test('Haskell can match single-quoted characters', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(syntax, "'a'");

	const strings = matches.filter(m => m.type === 'string');
	assert.ok(strings.length > 0);
});

test('Haskell can match decimal numbers', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(syntax, 'x = 42; y = 3.14');

	const numbers = matches.filter(
		m => m.type === 'constant' && /\d/.test(m.value)
	);
	assert.ok(numbers.length > 0);
});

test('Haskell can match hexadecimal numbers', async () => {
	const language = await syntax.getResource('haskell');
	const matches = await language.getMatches(syntax, 'x = 0xFF');

	const numbers = matches.filter(
		m => m.type === 'constant' && m.value.includes('0x')
	);
	assert.ok(numbers.length > 0);
});

test('Haskell can match CamelCase types', async () => {
	const language = await syntax.getResource('haskell');
	const code = 'data Maybe a = Just a | Nothing';
	const matches = await language.getMatches(syntax, code);

	const types = matches.filter(m => m.type === 'type' && /^[A-Z]/.test(m.value));
	assert.ok(types.some(m => m.value === 'Maybe'));
	assert.ok(types.some(m => m.value === 'Just'));
	assert.ok(types.some(m => m.value === 'Nothing'));
});

test('Haskell can process complete code to HTML', async () => {
	const language = await syntax.getResource('haskell');
	const code = `module Main where

main :: IO ()
main = putStrLn "Hello, World!"`;

	const html = await language.process(syntax, code);
	assert.ok(html instanceof HTMLElement);
	const text = html.textContent;
	assert.ok(text.includes('module'));
	assert.ok(text.includes('main'));
	assert.ok(text.includes('Hello'));
});

test('Haskell can build a syntax tree', async () => {
	const language = await syntax.getResource('haskell');
	const code =
		'factorial :: Int -> Int\nfactorial 0 = 1\nfactorial n = n * factorial (n - 1)';

	const tree = await language.buildTree(syntax, code, 0);
	assert.ok(tree);
	assert.ok(tree.children.length > 0);
});
