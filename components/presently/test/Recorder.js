import assert from 'node:assert/strict';
import test from 'node:test';

class Element extends EventTarget {
	constructor() {
		super();
		this.dataset = {};
		this.isConnected = true;
	}
}

globalThis.HTMLElement = Element;
globalThis.customElements = {define() {}};
globalThis.window = globalThis;

const {PresentlyRecorder} = await import('../../../public/recorder.js');

class Control extends EventTarget {
	constructor() {
		super();
		this.checked = false;
		this.disabled = false;
		this.duration = Number.NaN;
		this.hidden = false;
		this.textContent = '';
		this.classList = {toggle() {}};
	}

	pause() {}
}

function makeRecorder() {
	const controls = {
		'.recording-toggle': new Control(),
		'.recording-save': new Control(),
		'.recording-playback': new Control(),
		'.recording-update-duration': new Control(),
		'.recording-status': new Control(),
		'.recording-time': new Control(),
	};
	const recorder = new PresentlyRecorder();
	recorder.querySelector = selector => controls[selector];
	recorder.loadExisting = () => {};
	recorder.connectedCallback();

	return {recorder, controls};
}

test('a pointer stop does not start a retake from the following click', () => {
	const {recorder, controls} = makeRecorder();
	let starts = 0;
	let stops = 0;

	recorder.start = () => starts += 1;
	recorder.stop = () => stops += 1;
	recorder.isRecording = () => true;

	controls['.recording-toggle'].dispatchEvent(new Event('pointerdown'));
	controls['.recording-toggle'].dispatchEvent(new Event('click'));

	assert.equal(stops, 1);
	assert.equal(starts, 0);

	recorder.isRecording = () => false;
	controls['.recording-toggle'].dispatchEvent(new Event('click'));
	assert.equal(starts, 1);
});

test('saving can update the slide duration from the recording length', async () => {
	const {recorder, controls} = makeRecorder();
	recorder.dataset.recordingUrl = '/recordings?index=2';
	controls['.recording-playback'].duration = 12.2;
	controls['.recording-update-duration'].checked = true;
	recorder.finish();

	const originalFetch = globalThis.fetch;
	const originalLocation = globalThis.location;
	let requestURL = null;
	globalThis.location = {href: 'http://localhost/record'};
	globalThis.fetch = async (url, options) => {
		requestURL = url;
		assert.equal(options.method, 'PUT');
		return {ok: true};
	};

	try {
		await recorder.save();
		assert.equal(requestURL.searchParams.get('index'), '2');
		assert.equal(requestURL.searchParams.get('duration'), '13');
		assert.equal(controls['.recording-status'].textContent, 'Recording saved. Slide duration set to 13 seconds.');
	} finally {
		globalThis.fetch = originalFetch;
		if (originalLocation === undefined) {
			delete globalThis.location;
		} else {
			globalThis.location = originalLocation;
		}
	}
});
