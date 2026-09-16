import assert from 'node:assert/strict';
import test from 'node:test';

class Element extends EventTarget {
	constructor() {
		super();
		this.id = 'recording-controls';
		this.dataset = {};
		this.isConnected = true;
		this.ownerDocument = {defaultView: null};
	}

	attachShadow(options) {
		this.shadowOptions = options;
		this.shadowRoot = {
			innerHTML: '',
			querySelector: selector => this.shadowControls[selector],
		};

		return this.shadowRoot;
	}
}

globalThis.HTMLElement = Element;
globalThis.customElements = {define() {}};
globalThis.window = globalThis;

const {ViewElement} = await import('@socketry/live');
const {PresentlyRecordingControls} = await import('../../../public/recording_controls.js');

class Control extends EventTarget {
	constructor() {
		super();
		this.checked = false;
		this.disabled = false;
		this.duration = Number.NaN;
		this.currentSrc = '';
		this.loadCount = 0;
		this.hidden = false;
		this.textContent = '';
		this.classList = {toggle() {}};
	}

	pause() {}
	load() {
		this.loadCount += 1;
		if (!this.src) {
			this.currentSrc = '';
			this.duration = Number.NaN;
		}
	}

	getAttribute(name) {
		if (name === 'src') return this.src || null;
		return this.attributes?.[name] || null;
	}

	hasAttribute(name) {
		return this.getAttribute(name) !== null;
	}

	setAttribute(name, value) {
		this.attributes ||= {};
		this.attributes[name] = String(value);
	}

	removeAttribute(name) {
		if (name === 'src') {
			delete this.src;
			this.duration = Number.NaN;
		}
	}
}

function makeRecorder() {
	const controls = {
		'.recording-toggle': new Control(),
		'.recording-save': new Control(),
		'.recording-playback': new Control(),
		'.recording-apply-duration': new Control(),
		'.recording-update-duration': new Control(),
		'.recording-indicator': new Control(),
		'.recording-time': new Control(),
	};
	const recorder = new PresentlyRecordingControls();
	recorder.shadowControls = controls;
	recorder.dataset.recordingState = 'loading';
	recorder.loadPlayback = () => {};
	recorder.connectedCallback();

	return {recorder, controls};
}

async function finishRecording(recorder) {
	const BlobClass = globalThis.Blob;
	globalThis.Blob = class extends BlobClass {
		constructor(parts, options) {
			super(parts.length ? parts : ['recording'], options);
		}
	};

	try {
		await recorder.finish();
	} finally {
		globalThis.Blob = BlobClass;
	}
}

test('a pointer stop does not start a retake from the following click', () => {
	const {recorder, controls} = makeRecorder();
	recorder.setRecordingState('missing');
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

test('offers to update a mismatched existing recording duration', () => {
	const {recorder, controls} = makeRecorder();
	recorder.setRecordingState('present');
	recorder.dataset.slideDuration = '30';
	controls['.recording-playback'].duration = 12.2;
	controls['.recording-playback'].dispatchEvent(new Event('loadedmetadata'));

	assert.equal(controls['.recording-apply-duration'].disabled, false);

	recorder.dataset.slideDuration = '13';
	recorder.attributeChangedCallback('data-slide-duration', '30', '13');
	assert.equal(controls['.recording-apply-duration'].disabled, true);
});

test('reflects a recording state through one interface update', () => {
	const {recorder} = makeRecorder();
	let state = recorder.dataset.recordingState;
	let updates = 0;

	Object.defineProperty(recorder.dataset, 'recordingState', {
		get: () => state,
		set: value => {
			const oldValue = state;
			state = value;
			recorder.attributeChangedCallback('data-recording-state', oldValue, value);
		},
	});
	recorder.updateInterface = () => updates += 1;

	recorder.setRecordingState('present');
	assert.equal(updates, 1);
});

test('updates the slide duration without uploading the recording again', async () => {
	const {recorder, controls} = makeRecorder();
	recorder.setRecordingState('present');
	recorder.dataset.recordingUrl = '/recordings?index=2';
	recorder.dataset.slideDuration = '30';
	controls['.recording-playback'].duration = 12.2;

	const originalFetch = globalThis.fetch;
	const originalLocation = globalThis.location;
	let requestURL = null;
	globalThis.location = {href: 'http://localhost/recorder'};
	globalThis.fetch = async (url, options) => {
		requestURL = url;
		assert.equal(options.method, 'PATCH');
		return {ok: true};
	};

	try {
		await recorder.updateSlideDuration();
		assert.equal(requestURL.searchParams.get('duration'), '13');
		assert.equal(recorder.dataset.slideDuration, '13');
		assert.equal(controls['.recording-apply-duration'].disabled, true);
	} finally {
		globalThis.fetch = originalFetch;
		if (originalLocation === undefined) {
			delete globalThis.location;
		} else {
			globalThis.location = originalLocation;
		}
	}
});

test('saving can update the slide duration from the recording length', async () => {
	const {recorder, controls} = makeRecorder();
	recorder.setRecordingState('missing');
	recorder.dataset.recordingUrl = '/recordings?index=2';
	controls['.recording-playback'].duration = 12.2;
	controls['.recording-update-duration'].checked = true;
	await finishRecording(recorder);
	const playbackURL = controls['.recording-playback'].src;

	const originalFetch = globalThis.fetch;
	const originalLocation = globalThis.location;
	let requestURL = null;
	globalThis.location = {href: 'http://localhost/recorder'};
	globalThis.fetch = async (url, options) => {
		requestURL = url;
		assert.equal(options.method, 'PUT');
		return {ok: true};
	};

	try {
		await recorder.save();
		assert.equal(requestURL.searchParams.get('index'), '2');
		assert.equal(requestURL.searchParams.get('duration'), '13');
		assert.equal(controls['.recording-playback'].src, playbackURL);
		assert.equal(recorder.dataset.recordingState, 'present');
	} finally {
		globalThis.fetch = originalFetch;
		if (originalLocation === undefined) {
			delete globalThis.location;
		} else {
			globalThis.location = originalLocation;
		}
	}
});

test('derives recording controls from server-rendered availability', () => {
	const {recorder, controls} = makeRecorder();

	assert.ok(recorder instanceof ViewElement);
	assert.deepEqual(recorder.shadowOptions, {mode: 'open'});
	assert.doesNotMatch(recorder.shadowRoot.innerHTML, /<style>/);
	assert.match(recorder.shadowRoot.innerHTML, /part="actions"/);
	assert.match(recorder.shadowRoot.innerHTML, /part="toggle"/);
	assert.match(recorder.shadowRoot.innerHTML, /part="playback"/);
	assert.deepEqual(PresentlyRecordingControls.observedAttributes, ['data-slide-index', 'data-slide-duration', 'data-recording-state']);
	assert.equal(recorder.dataset.recordingState, 'loading');
	assert.equal(controls['.recording-toggle'].textContent, '● Record');
	assert.equal(controls['.recording-toggle'].disabled, true);
	assert.equal(controls['.recording-save'].disabled, true);
	assert.equal(controls['.recording-apply-duration'].disabled, true);

	recorder.setRecordingState('missing');
	assert.equal(controls['.recording-toggle'].textContent, '● Record');
	assert.equal(controls['.recording-toggle'].disabled, false);

	recorder.setRecordingState('present');
	assert.equal(controls['.recording-toggle'].textContent, '● Retake');
	assert.equal(controls['.recording-toggle'].disabled, false);

	recorder.setRecordingState('recording');
	assert.equal(recorder.dataset.recordingState, 'recording');
	assert.equal(controls['.recording-toggle'].textContent, '■ Stop');
	assert.match(recorder.shadowRoot.innerHTML, /class="recording-toggle" part="toggle"/);
	assert.doesNotMatch(recorder.shadowRoot.innerHTML, /toggle-recording/);
});

test('loads playback metadata for a server-rendered existing recording', async () => {
	const {recorder, controls} = makeRecorder();
	recorder.dataset.recordingUrl = '/recordings?index=2';
	recorder.setRecordingState('present');
	controls['.recording-playback'].duration = 12.2;

	const loading = PresentlyRecordingControls.prototype.loadPlayback.call(recorder);
	assert.equal(controls['.recording-toggle'].textContent, '● Retake');
	assert.equal(controls['.recording-toggle'].disabled, false);

	controls['.recording-playback'].dispatchEvent(new Event('loadedmetadata'));
	await loading;

	assert.equal(recorder.playbackReady(), true);
	assert.equal(controls['.recording-toggle'].textContent, '● Retake');
	assert.equal(controls['.recording-toggle'].disabled, false);
});

test('resets a persistent recorder when its slide identity changes', async () => {
	const {recorder, controls} = makeRecorder();
	let loads = 0;
	recorder.loadPlayback = () => loads += 1;
	recorder.dataset.recordingState = 'missing';
	recorder.dataset.slideIndex = '2';
	controls['.recording-playback'].src = '/recordings?index=2';
	controls['.recording-playback'].currentSrc = '/recordings?index=1';
	controls['.recording-playback'].duration = Number.NaN;
	controls['.recording-time'].textContent = '0:12';

	recorder.attributeChangedCallback('data-slide-index', '1', '2');
	await Promise.resolve();

	assert.equal(loads, 1);
	assert.equal(recorder.dataset.recordingState, 'missing');
	assert.equal(controls['.recording-playback'].src, '/recordings?index=2');
	assert.equal(controls['.recording-playback'].currentSrc, '/recordings?index=1');
	assert.equal(controls['.recording-playback'].duration, Number.NaN);
	assert.equal(controls['.recording-playback'].loadCount, 0);
	assert.equal(controls['.recording-time'].textContent, '0:00');
});

test('resets a recording when the server restores canonical state', async () => {
	const {recorder, controls} = makeRecorder();
	let loads = 0;
	recorder.setRecordingState('missing');
	controls['.recording-playback'].duration = 12.2;
	await finishRecording(recorder);
	assert.equal(recorder.dataset.recordingState, 'review');
	recorder.loadPlayback = () => loads += 1;
	controls['.recording-time'].textContent = '0:12';
	recorder.dataset.recordingState = 'missing';

	recorder.attributeChangedCallback('data-recording-state', 'review', 'missing');
	await Promise.resolve();

	assert.equal(loads, 1);
	assert.equal(recorder.dataset.recordingState, 'missing');
	assert.equal(controls['.recording-time'].textContent, '0:00');
	assert.equal(controls['.recording-toggle'].textContent, '● Record');

	let requests = 0;
	const originalFetch = globalThis.fetch;
	globalThis.fetch = () => requests += 1;
	try {
		await recorder.save();
		assert.equal(requests, 0);
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test('clears the previous recording when the new slide has none', () => {
	const {recorder, controls} = makeRecorder();
	const playback = controls['.recording-playback'];
	playback.currentSrc = '/recordings?index=1';
	playback.duration = 12.2;
	recorder.dataset.recordingState = 'missing';
	recorder.loadPlayback = PresentlyRecordingControls.prototype.loadPlayback;

	recorder.switchSlide();

	assert.equal(playback.loadCount, 1);
	assert.equal(playback.currentSrc, '');
	assert.equal(playback.duration, Number.NaN);
});

test('does not apply a completed save to a subsequently selected slide', async () => {
	const {recorder, controls} = makeRecorder();
	recorder.setRecordingState('missing');
	recorder.dataset.recordingUrl = '/recordings?index=1';
	recorder.dataset.slideDuration = '30';
	recorder.dataset.slideIndex = '1';
	controls['.recording-playback'].duration = 12.2;
	controls['.recording-update-duration'].checked = true;
	await finishRecording(recorder);

	const originalFetch = globalThis.fetch;
	const originalLocation = globalThis.location;
	let resolveFetch;
	globalThis.location = {href: 'http://localhost/recorder'};
	globalThis.fetch = () => new Promise(resolve => resolveFetch = resolve);

	try {
		const saving = recorder.save();
		recorder.dataset.recordingState = 'missing';
		recorder.dataset.slideIndex = '2';
		recorder.attributeChangedCallback('data-slide-index', '1', '2');
		await Promise.resolve();
		resolveFetch({ok: true});
		await saving;

		assert.equal(recorder.dataset.recordingState, 'missing');
		assert.equal(recorder.dataset.slideDuration, '30');
	} finally {
		globalThis.fetch = originalFetch;
		if (originalLocation === undefined) {
			delete globalThis.location;
		} else {
			globalThis.location = originalLocation;
		}
	}
});
