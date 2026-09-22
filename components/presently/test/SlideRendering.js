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

function animatedSlide() {
	const slide = new SlideElement(`
		slide.anime(({utils}) => utils.set(slide.element.camera, {zoom: 3}));
		slide.defer(() => slide.element.disposals += 1);
	`);
	slide.body.camera = {zoom: 1};
	slide.body.disposals = 0;
	return slide;
}

// The browser captures the outgoing slide before invoking the update callback.
// Control that boundary separately from the end of the visual transition.
function pendingTransition(callback) {
	let update;
	let finish;
	const updateCallbackDone = new Promise(resolve => update = () => resolve(callback()));
	const animation = new Promise(resolve => finish = resolve);

	return {
		update,
		finish,
		updateCallbackDone,
		ready: updateCallbackDone,
		finished: updateCallbackDone.then(() => animation),
		skipped: false,
		skipTransition() {
			this.skipped = true;
			finish();
		},
	};
}

for (const mode of ['fade', 'no transition', 'hidden', 'unsupported']) {
	test(`replacement preserves animated state until the DOM update (${mode})`, async () => {
		const originalHighlight = Syntax.highlight;
		Syntax.highlight = async () => {};
		globalThis.document = {
			hidden: mode === 'hidden',
			documentElement: {dataset: {}},
			querySelectorAll: () => [],
		};

		try {
			const outgoing = animatedSlide();
			const incoming = animatedSlide();
			const view = new View('current', [outgoing]);
			const previous = new SlideRendering(view);
			await previous.initialize();
			let transition;
			if (mode !== 'unsupported') {
				document.startViewTransition = callback => transition = pendingTransition(callback);
			}

			const rendering = new SlideRendering(view, {
				transition: mode === 'no transition' ? null : 'fade',
				previous,
			});
			assert.equal(outgoing.body.camera.zoom, 3);

			const rendered = rendering.render(() => {
				assert.equal(outgoing.body.camera.zoom, 1);
				assert.equal(outgoing.body.disposals, 1);
				view.slides = [incoming];
			});

			if (mode === 'fade') {
				// This is the state the browser captures for the outgoing snapshot.
				assert.equal(outgoing.body.camera.zoom, 3);
				assert.equal(outgoing.body.disposals, 0);
				transition.update();
				assert.equal(incoming.body.camera.zoom, 3);
				await transition.updateCallbackDone;
				assert.equal(document.documentElement.dataset.transition, 'fade');
				transition.finish();
			} else {
				assert.equal(transition, undefined);
				assert.equal(incoming.body.camera.zoom, 3);
			}

			assert.equal(await rendered, true);
			assert.equal(document.documentElement.dataset.transition, undefined);
			previous.dispose();
			rendering.dispose();
			rendering.dispose();
			assert.equal(outgoing.body.disposals, 1);
			assert.equal(incoming.body.disposals, 1);
		} finally {
			Syntax.highlight = originalHighlight;
			delete globalThis.document;
		}
	});
}

for (const updated of [false, true]) {
	test(`rapid navigation preserves the visible slide (${updated ? 'after' : 'before'} the pending DOM update)`, async () => {
		const originalHighlight = Syntax.highlight;
		Syntax.highlight = async () => {};
		const transitions = [];
		globalThis.document = {
			documentElement: {dataset: {}},
			querySelectorAll: () => [],
			startViewTransition(callback) {
				const transition = pendingTransition(callback);
				transitions.push(transition);
				return transition;
			},
		};

		try {
			const firstSlide = animatedSlide();
			const secondSlide = animatedSlide();
			const finalSlide = animatedSlide();
			const view = new View('current', [firstSlide]);
			let changes = 0;
			view.addEventListener('presently:slide:change', () => changes += 1);
			const first = new SlideRendering(view);
			await first.initialize();

			const second = new SlideRendering(view, {transition: 'fade', previous: first});
			let secondUpdates = 0;
			const secondResult = second.render(() => {
				secondUpdates += 1;
				view.slides = [secondSlide];
			});
			if (updated) {
				transitions[0].update();
				await transitions[0].updateCallbackDone;
			}

			const final = new SlideRendering(view, {transition: 'slide-left', previous: second});
			const finalResult = final.render(() => view.slides = [finalSlide]);
			assert.equal(transitions[0].skipped, true);
			assert.equal((updated ? secondSlide : firstSlide).body.camera.zoom, 3);
			assert.equal((updated ? secondSlide : firstSlide).body.disposals, 0);

			if (!updated) transitions[0].update();
			assert.equal(await secondResult, false);
			assert.equal(secondUpdates, updated ? 1 : 0);
			assert.equal(document.documentElement.dataset.transition, 'slide-left');
			assert.equal(changes, 0);

			transitions[1].update();
			transitions[1].finish();
			assert.equal(await finalResult, true);
			assert.equal(changes, 1);
			assert.equal(view.slides[0], finalSlide);
			final.dispose();
			assert.equal(firstSlide.body.disposals, 1);
			assert.equal(secondSlide.body.disposals, updated ? 1 : 0);
			assert.equal(finalSlide.body.disposals, 1);
		} finally {
			Syntax.highlight = originalHighlight;
			delete globalThis.document;
		}
	});
}

test('disposing a replacement before its update releases the outgoing slide', async () => {
	const originalHighlight = Syntax.highlight;
	Syntax.highlight = async () => {};
	globalThis.document = {querySelectorAll: () => []};

	try {
		const outgoing = animatedSlide();
		const view = new View('current', [outgoing]);
		const previous = new SlideRendering(view);
		await previous.initialize();
		const rendering = new SlideRendering(view, {previous});
		rendering.dispose();
		assert.equal(outgoing.body.camera.zoom, 1);
		assert.equal(outgoing.body.disposals, 1);
		previous.dispose();
		assert.equal(await rendering.render(() => assert.fail('Disposed rendering updated the DOM')), false);
	} finally {
		Syntax.highlight = originalHighlight;
		delete globalThis.document;
	}
});

test('slide scripts establish initial state before asynchronous preparation', async () => {
	const originalHighlight = Syntax.highlight;
	let releaseHighlight;
	Syntax.highlight = () => new Promise(resolve => releaseHighlight = resolve);

	globalThis.initialScriptRan = false;
	globalThis.slideDisposals = 0;
	globalThis.document = {
		querySelectorAll(selector) {
			assert.equal(selector, '.code-viewport');
			return [];
		},
	};

	try {
		const slide = new SlideElement('globalThis.initialScriptRan = true; slide.defer(() => globalThis.slideDisposals += 1)');
		const rendering = new SlideRendering(new View('initial', [slide]));
		const initialized = rendering.initialize();

		assert.equal(globalThis.initialScriptRan, true);
		rendering.dispose();
		releaseHighlight();

		assert.equal(await initialized, false);
		assert.equal(globalThis.slideDisposals, 1);
	} finally {
		Syntax.highlight = originalHighlight;
		delete globalThis.initialScriptRan;
		delete globalThis.slideDisposals;
		delete globalThis.document;
	}
});

test('a render updates the DOM and establishes script state synchronously', async () => {
	const originalHighlight = Syntax.highlight;
	Syntax.highlight = async () => {};

	globalThis.renderScriptRan = false;
	globalThis.document = {
		querySelectorAll(selector) {
			assert.equal(selector, '.code-viewport');
			return [];
		},
	};

	try {
		const view = new View('current', []);
		const slide = new SlideElement('globalThis.renderScriptRan = true');
		const rendering = new SlideRendering(view);
		const rendered = rendering.render(renderView => {
			assert.equal(renderView, view);
			view.slides = [slide];
		});

		assert.equal(globalThis.renderScriptRan, true);
		assert.equal(await rendered, true);
	} finally {
		Syntax.highlight = originalHighlight;
		delete globalThis.renderScriptRan;
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
