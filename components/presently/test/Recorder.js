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

const {PresentlyRecorder} = await import('../../../public/recorder.js');

class Control extends EventTarget {
	constructor() {
		super();
		this.disabled = false;
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
