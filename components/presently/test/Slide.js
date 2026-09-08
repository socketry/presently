import assert from 'node:assert/strict';
import test from 'node:test';

import {Slide} from '../Presently/Slide.js';

globalThis.window = globalThis;

class FakeElement extends EventTarget {
	constructor() {
		super();
		this.style = {};
		this.classes = new Set();
		this.classList = {
			add: value => this.classes.add(value),
			remove: value => this.classes.delete(value),
		};
	}

	querySelectorAll() {
		return [this];
	}
}

test('disposes slide resources', async () => {
	const element = new FakeElement();
	const slide = new Slide(element);
	const cleanup = [];
	const target = new EventTarget();
	let events = 0;
	let timedOut = false;

	target.addEventListener('test', () => events += 1, {signal: slide.signal});
	slide.defer(() => cleanup.push('first'));
	slide.defer(() => cleanup.push('second'));
	slide.setTimeout(() => timedOut = true, 10);

	const animation = slide.find('*').builder({effect: 'fade'}).next();
	slide.dispose();
	slide.dispose();

	await animation;
	target.dispatchEvent(new Event('test'));
	slide.defer(() => cleanup.push('late'));
	await new Promise(resolve => setTimeout(resolve, 20));

	assert.equal(slide.signal.aborted, true);
	assert.equal(events, 0);
	assert.equal(timedOut, false);
	assert.equal(element.classes.has('build-fade'), false);
	assert.deepEqual(cleanup, ['second', 'first', 'late']);
	assert.equal(slide.setTimeout(() => {}, 0), null);
});
