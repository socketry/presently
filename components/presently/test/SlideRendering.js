import assert from 'node:assert/strict';
import test from 'node:test';

import Syntax from '@socketry/syntax';
import {SlideRendering} from '../Presently/SlideRendering.js';

globalThis.window = globalThis;

class SlideElement {
	constructor(script) {
		this.script = {textContent: script};
		this.body = {querySelectorAll: () => []};
		this.dataset = {};
	}

	querySelector(selector) {
		if (selector === '.slide-body') return this.body;
		return null;
	}

	querySelectorAll(selector) {
		if (selector === 'script[type="text/slide-script"]') return [this.script];
		return [];
	}
}

class View extends EventTarget {
	constructor(id, slides) {
		super();
		this.id = id;
		this.slides = slides;
	}

	querySelectorAll(selector) {
		assert.equal(selector, '.slide');
		return this.slides;
	}
}

test('a disposed rendering does not initialize stale slide scripts', async () => {
	const originalHighlight = Syntax.highlight;
	let releaseHighlight;
	Syntax.highlight = () => new Promise(resolve => releaseHighlight = resolve);

	globalThis.staleScriptRan = false;
	globalThis.document = {
		querySelectorAll(selector) {
			assert.equal(selector, '.code-viewport');
			return [];
		},
	};

	try {
		const slide = new SlideElement('globalThis.staleScriptRan = true');
		const rendering = new SlideRendering(new View('stale', [slide]));
		const initialized = rendering.initialize();

		rendering.dispose();
		releaseHighlight();

		assert.equal(await initialized, false);
		assert.equal(globalThis.staleScriptRan, false);
	} finally {
		Syntax.highlight = originalHighlight;
		delete globalThis.staleScriptRan;
		delete globalThis.document;
	}
});

test('a superseded rendering skips its transition and disposes its slides', async () => {
	const originalHighlight = Syntax.highlight;
	Syntax.highlight = async () => {};

	globalThis.slideDisposals = 0;
	globalThis.document = {
		documentElement: {dataset: {}},
		querySelectorAll(selector) {
			assert.equal(selector, '.code-viewport');
			return [];
		},
	};

	try {
		let resolveSlideInitialized;
		const slideInitialized = new Promise(resolve => resolveSlideInitialized = resolve);
		globalThis.resolveSlideInitialized = resolveSlideInitialized;

		const slide = new SlideElement('slide.defer(() => globalThis.slideDisposals += 1); globalThis.resolveSlideInitialized()');
		const view = new View('current', [slide]);
		let changes = 0;
		let releaseTransition;
		let skipped = false;

		view.addEventListener('presently:slide:change', () => changes += 1);

		document.startViewTransition = callback => {
			const updateCallbackDone = Promise.resolve().then(callback);
			const transition = new Promise(resolve => releaseTransition = resolve);

			return {
				ready: Promise.resolve(),
				updateCallbackDone,
				finished: updateCallbackDone.then(() => transition),
				skipTransition() {
					skipped = true;
					releaseTransition();
				},
			};
		};

		const rendering = new SlideRendering(view, {transition: 'fade'});
		let resolveUpdate;
		const updated = new Promise(resolve => {
			resolveUpdate = resolve;
		});

		const result = rendering.render(renderView => {
			assert.equal(renderView, view);
			resolveUpdate();
		});

		await updated;
		await slideInitialized;
		rendering.dispose();

		assert.equal(await result, false);
		assert.equal(skipped, true);
		assert.equal(changes, 0);
		assert.equal(globalThis.slideDisposals, 1);
		assert.equal(document.documentElement.dataset.transition, undefined);
	} finally {
		Syntax.highlight = originalHighlight;
		delete globalThis.slideDisposals;
		delete globalThis.resolveSlideInitialized;
		delete globalThis.document;
	}
});

test('a rendering retains its transition style until the visual transition finishes', async () => {
	const originalHighlight = Syntax.highlight;
	Syntax.highlight = async () => {};

	globalThis.document = {
		hidden: false,
		documentElement: {dataset: {}},
		querySelectorAll(selector) {
			assert.equal(selector, '.code-viewport');
			return [];
		},
	};

	try {
		const view = new View('current', []);
		let resolveUpdate;
		const updated = new Promise(resolve => resolveUpdate = resolve);
		let releaseTransition;

		document.startViewTransition = callback => {
			const updateCallbackDone = Promise.resolve().then(callback);
			const transition = new Promise(resolve => releaseTransition = resolve);

			return {
				ready: Promise.resolve(),
				updateCallbackDone,
				finished: updateCallbackDone.then(() => transition),
				skipTransition() {
					releaseTransition();
				},
			};
		};

		const rendering = new SlideRendering(view, {transition: 'fade'});
		const result = rendering.render(renderView => {
			assert.equal(renderView, view);
			resolveUpdate();
		});

		await updated;
		assert.equal(document.documentElement.dataset.transition, 'fade');

		releaseTransition();
		assert.equal(await result, true);
		assert.equal(document.documentElement.dataset.transition, undefined);
	} finally {
		Syntax.highlight = originalHighlight;
		delete globalThis.document;
	}
});

test('a hidden document renders without starting a visual transition', async () => {
	const originalHighlight = Syntax.highlight;
	Syntax.highlight = async () => {};

	let transitionStarted = false;
	globalThis.document = {
		hidden: true,
		documentElement: {dataset: {}},
		startViewTransition() {
			transitionStarted = true;
		},
		querySelectorAll(selector) {
			assert.equal(selector, '.code-viewport');
			return [];
		},
	};

	try {
		const view = new View('hidden', []);
		const rendering = new SlideRendering(view, {transition: 'fade'});
		let updated = false;

		assert.equal(await rendering.render(renderView => {
			assert.equal(renderView, view);
			updated = true;
		}), true);
		assert.equal(updated, true);
		assert.equal(transitionStarted, false);
		assert.equal(document.documentElement.dataset.transition, undefined);
	} finally {
		Syntax.highlight = originalHighlight;
		delete globalThis.document;
	}
});

test('an aborted visual transition does not discard a completed DOM update', async () => {
	const originalHighlight = Syntax.highlight;
	Syntax.highlight = async () => {};

	globalThis.document = {
		hidden: false,
		documentElement: {dataset: {}},
		querySelectorAll(selector) {
			assert.equal(selector, '.code-viewport');
			return [];
		},
	};

	try {
		document.startViewTransition = callback => {
			const updateCallbackDone = Promise.resolve().then(callback);
			const aborted = new Error('Document hidden');

			return {
				ready: Promise.reject(aborted),
				updateCallbackDone,
				finished: updateCallbackDone.then(() => Promise.reject(aborted)),
				skipTransition() {},
			};
		};

		const view = new View('aborted', []);
		const rendering = new SlideRendering(view, {transition: 'fade'});
		let updated = false;

		assert.equal(await rendering.render(() => updated = true), true);
		assert.equal(updated, true);
		assert.equal(document.documentElement.dataset.transition, undefined);
	} finally {
		Syntax.highlight = originalHighlight;
		delete globalThis.document;
	}
});
