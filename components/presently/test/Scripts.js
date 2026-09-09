import assert from 'node:assert/strict';
import test from 'node:test';

import {runScript} from '../Presently/Scripts.js';

globalThis.window = globalThis;

class SlideBody extends EventTarget {
	querySelectorAll() {
		return [];
	}
}

class SlideElement {
	constructor(scripts) {
		this.scripts = scripts.map(textContent => ({textContent}));
		this.body = new SlideBody();
	}

	querySelector(selector) {
		if (selector === '.slide-body') return this.body;
		return null;
	}

	querySelectorAll(selector) {
		assert.equal(selector, 'script[type="text/slide-script"]');
		return this.scripts;
	}
}

test('runs isolated scripts in order against one slide', () => {
	globalThis.scriptOrder = [];

	try {
		const element = new SlideElement([
			'const local = "setup"; slide.anime().data.value = local; globalThis.scriptOrder.push(local);',
			'const local = slide.anime().data.value; globalThis.scriptOrder.push(local, "slide");',
		]);

		const slide = runScript(element);

		assert.ok(slide);
		assert.deepEqual(globalThis.scriptOrder, ['setup', 'setup', 'slide']);
		assert.equal(slide.anime().data.value, 'setup');
	} finally {
		delete globalThis.scriptOrder;
	}
});

test('returns null when a slide has no scripts', () => {
	assert.equal(runScript(new SlideElement([])), null);
});
