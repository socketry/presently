import {ViewElement} from '@socketry/live';

const RECORDING_EDGE_DELAY = 100;
const RECORDER_INTERFACE = `
	<div class="recording-actions" part="actions">
		<button class="recording-toggle" part="toggle" type="button">● Record</button>
		<button class="recording-save" part="save" type="button" disabled>Save</button>
		<span class="recording-indicator" part="indicator" aria-hidden="true"></span>
		<span class="recording-time" part="time">0:00</span>
	</div>
	<audio class="recording-playback" part="playback" controls preload="metadata"></audio>
	<button class="recording-apply-duration" part="apply-duration" type="button" disabled>Update Slide Duration</button>
	<label class="recording-duration-option" part="duration-option">
		<input class="recording-update-duration" type="checkbox" checked>
		<span>Update slide duration to match recording</span>
	</label>
`;

// Records and reviews narration. This Live view receives slide inputs on its
// host while its shadow root owns the complete client-rendered interface.
export class PresentlyRecordingControls extends ViewElement {
	static observedAttributes = ['data-slide-index', 'data-slide-duration', 'data-recording-state'];

	#mediaRecorder = null;
	#mediaStream = null;
	#audioContext = null;
	#audioSource = null;
	#audioDelay = null;
	#audioDestination = null;
	#chunks = [];
	#recording = null;
	#recordingURL = null;
	#recordingDuration = null;
	#startedAt = null;
	#timer = null;
	#startToken = null;
	#cancelPlaybackLoad = null;
	#ignoreClick = false;
	#hostReconciliationQueued = false;
	#reflectingState = false;
	#initialized = false;
	#sessionToken = {};
	#recordingAvailability = 'loading';
	
	connectedCallback() {
		super.connectedCallback();

		if (this.#initialized) {
			this.switchSlide();
			return;
		}

		this.#initialized = true;
		const root = this.attachShadow({mode: 'open'});
		root.innerHTML = RECORDER_INTERFACE;
		this.recordButton = root.querySelector('.recording-toggle');
		this.saveButton = root.querySelector('.recording-save');
		this.playback = root.querySelector('.recording-playback');
		this.applyDurationButton = root.querySelector('.recording-apply-duration');
		this.updateDuration = root.querySelector('.recording-update-duration');
		this.time = root.querySelector('.recording-time');
		this.#recordingAvailability = this.recordingAvailability();
		
		// Stop as soon as the pointer is pressed so the delayed audio excludes the
		// click. The click handler provides both starting and keyboard activation.
		this.recordButton.addEventListener('pointerdown', () => {
			if (this.isRecording()) {
				this.#ignoreClick = true;
				this.stop();
			}
		});
		this.recordButton.addEventListener('click', () => {
			if (this.#ignoreClick) {
				this.#ignoreClick = false;
				return;
			}

			if (this.recordButton.disabled) return;
			
			if (this.isRecording()) {
				this.stop();
			} else {
				this.start(performance.now());
			}
		});
		this.saveButton.addEventListener('click', () => this.save());
		this.applyDurationButton.addEventListener('click', () => this.updateSlideDuration());
		this.playback.addEventListener('loadedmetadata', () => this.updateDurationAction());

		this.loadPlayback();
		this.updateInterface();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === null || oldValue === newValue || !this.isConnected) return;

		if (name === 'data-recording-state' && this.#reflectingState) return;

		if (name === 'data-slide-duration') {
			this.updateInterface();
			return;
		}

		if (name === 'data-recording-state' && newValue !== 'missing' && newValue !== 'present') {
			this.updateInterface();
			return;
		}

		if (this.#hostReconciliationQueued) return;

		// Morphdom updates attributes individually. Wait until its synchronous
		// reconciliation is complete before reading the new slide inputs.
		this.#hostReconciliationQueued = true;
		queueMicrotask(() => {
			this.#hostReconciliationQueued = false;
			if (this.isConnected) this.switchSlide();
		});
	}
	
	disconnectedCallback() {
		this.resetSession();
		this.setRecordingState(this.#recordingAvailability);
		super.disconnectedCallback();
	}
	
	get url() {
		return this.dataset.recordingUrl;
	}

	isRecording() {
		return this.#mediaRecorder?.state === 'recording';
	}

	switchSlide() {
		this.resetSession();
		this.#recordingAvailability = this.recordingAvailability();
		this.time.textContent = '0:00';
		const loading = this.loadPlayback();
		this.updateInterface();
		return loading;
	}

	resetSession() {
		this.#sessionToken = {};
		this.#startToken = null;
		this.#cancelPlaybackLoad?.();

		if (this.#mediaRecorder) {
			this.#mediaRecorder.onstop = null;
			if (this.#mediaRecorder.state === 'recording') this.#mediaRecorder.stop();
		}

		this.releaseMicrophone();
		this.stopTimer();
		this.releaseRecordingURL();
		this.#mediaRecorder = null;
		this.#chunks = [];
		this.#recording = null;
		this.#recordingDuration = null;
		this.#ignoreClick = false;
	}
	
	async loadPlayback() {
		const sessionToken = this.#sessionToken;
		this.playback.pause();

		if (this.dataset.recordingState !== 'present') {
			this.clearPlaybackSource();
			return;
		}

		try {
			const loaded = await this.waitForPlayback(() => {
				if (this.playback.getAttribute('src') !== this.url) {
					this.playback.src = this.url;
				}
			});
			if (loaded === null || sessionToken !== this.#sessionToken || !this.isConnected) return;

			if (!loaded) console.error('Could not load the existing recording.');
		} catch (error) {
			if (sessionToken !== this.#sessionToken || !this.isConnected) return;
			console.error('Could not load the existing recording.', error);
		}
	}
	
	async start(clickedAt) {
		const AudioContext = window.AudioContext || window.webkitAudioContext;
		if (!window.MediaRecorder || !navigator.mediaDevices?.getUserMedia || !AudioContext) {
			console.error('Audio recording is not supported by this browser.');
			return;
		}
		
		const mimeType = 'audio/webm;codecs=opus';
		if (!MediaRecorder.isTypeSupported(mimeType)) {
			console.error(`${mimeType} recording is not supported by this browser.`);
			return;
		}
		
		const startToken = this.#startToken = {};
		const fallbackState = this.#recording ? 'review' : this.#recordingAvailability;
		this.#recordingDuration = null;
		this.setRecordingState('preparing');

		try {
			this.playback.pause();
			this.#audioContext = new AudioContext();
			await this.#audioContext.resume();

			if (this.#startToken !== startToken || !this.isConnected) {
				this.releaseMicrophone();
				return;
			}

			const audio = {};
			if (navigator.mediaDevices.getSupportedConstraints().autoGainControl) {
				// Preserve the microphone's dynamics for consistent offline normalization.
				audio.autoGainControl = false;
			}

			const mediaStream = await navigator.mediaDevices.getUserMedia({audio});

			if (this.#startToken !== startToken || !this.isConnected) {
				mediaStream.getTracks().forEach(track => track.stop());
				this.releaseMicrophone();
				return;
			}

			this.#mediaStream = mediaStream;
			this.#audioSource = this.#audioContext.createMediaStreamSource(mediaStream);

			this.#audioDelay = this.#audioContext.createDelay(RECORDING_EDGE_DELAY / 1000);
			this.#audioDelay.delayTime.value = RECORDING_EDGE_DELAY / 1000;
			this.#audioDestination = this.#audioContext.createMediaStreamDestination();
			this.#audioSource
				.connect(this.#audioDelay)
				.connect(this.#audioDestination);

			this.#chunks = [];
			const mediaRecorder = this.#mediaRecorder = new MediaRecorder(this.#audioDestination.stream, {mimeType});
			
			mediaRecorder.addEventListener('dataavailable', (event) => {
				if (this.#mediaRecorder === mediaRecorder && event.data.size > 0) this.#chunks.push(event.data);
			});
			
			mediaRecorder.onstop = () => {
				if (this.#mediaRecorder === mediaRecorder) this.finish();
			};

			this.setRecordingState('starting');

			// Audio reaches MediaRecorder 100 ms after it reaches the microphone. Starting
			// the encoder 200 ms after the click therefore retains audio beginning 100 ms
			// after pointer-up. If microphone setup took longer, wait only long enough for
			// the newly-created delay line to contain live audio.
			const startAt = Math.max(
				clickedAt + RECORDING_EDGE_DELAY * 2,
				performance.now() + RECORDING_EDGE_DELAY,
			);
			await new Promise(resolve => window.setTimeout(resolve, Math.max(0, startAt - performance.now())));

			if (this.#startToken !== startToken || !this.isConnected) return;

			this.#mediaRecorder.start();
			this.#startToken = null;
			this.startTimer();
			
			this.setRecordingState('recording');
		} catch (error) {
			if (this.#startToken !== startToken) return;

			this.#startToken = null;
			this.releaseMicrophone();
			this.setRecordingState(fallbackState);
			console.error('Could not start recording.', error);
		}
	}
	
	stop() {
		if (this.#mediaRecorder?.state === 'recording') {
			this.#recordingDuration = (performance.now() - this.#startedAt) / 1000;
			
			// The encoder receives audio through a 100 ms delay. Stopping immediately
			// excludes approximately the final 100 ms before this pointer-down event.
			this.#mediaRecorder.stop();
			this.setRecordingState('finishing');
		}
	}
	
	async finish() {
		this.stopTimer();
		this.releaseMicrophone();
		this.releaseRecordingURL();
		
		this.#recording = new Blob(this.#chunks, {type: 'audio/webm'});
		this.#recordingURL = URL.createObjectURL(this.#recording);

		if (this.#recording.size === 0) {
			this.#recording = null;
			this.releaseRecordingURL();
			this.setRecordingState(this.#recordingAvailability);
			return;
		}

		const loaded = await this.setPlaybackSource(this.#recordingURL);
		if (loaded === null || !this.isConnected) return;

		if (loaded && this.playbackReady()) {
			this.setRecordingState('review');
		} else {
			this.#recording = null;
			this.releaseRecordingURL();
			await this.loadPlayback();
			this.setRecordingState(this.#recordingAvailability);
			console.error('The recording could not be played.');
		}
	}
	
	async save() {
		if (!this.#recording) return;
		const sessionToken = this.#sessionToken;
		
		this.setRecordingState('saving');
		
		try {
			const url = new URL(this.url, window.location.href);
			let duration = null;
			
			if (this.updateDuration.checked) {
				duration = this.canonicalDuration();
				if (!duration) {
					throw new Error('Could not determine the recording duration.');
				}
				
				url.searchParams.set('duration', duration);
			}
			
			const response = await fetch(url, {
				method: 'PUT',
				headers: {'content-type': this.#recording.type},
				body: this.#recording,
			});
			
			if (!response.ok) {
				throw new Error((await response.text()) || `Could not save recording (${response.status}).`);
			}

			if (sessionToken !== this.#sessionToken || !this.isConnected) return;
			
			// Keep the reviewed blob loaded because replacing its source resets media metadata:
			this.#recording = null;
			if (duration) this.dataset.slideDuration = String(duration);
			this.setRecordingState('present');
		} catch (error) {
			if (sessionToken !== this.#sessionToken || !this.isConnected) return;
			this.setRecordingState('review');
			console.error('Could not save recording.', error);
		}
	}
	
	canonicalDuration() {
		const duration = this.recordingDuration();
		if (!Number.isFinite(duration) || duration <= 0) return null;
		return Math.max(1, Math.ceil(duration));
	}
	
	updateDurationAction() {
		this.updateInterface();
	}
	
	async updateSlideDuration() {
		const duration = this.canonicalDuration();
		if (!duration) return;
		const sessionToken = this.#sessionToken;
		
		this.setRecordingState('updating');
		
		try {
			const url = new URL(this.url, window.location.href);
			url.searchParams.set('duration', duration);
			const response = await fetch(url, {method: 'PATCH'});
			
			if (!response.ok) {
				throw new Error((await response.text()) || `Could not update slide duration (${response.status}).`);
			}

			if (sessionToken !== this.#sessionToken || !this.isConnected) return;
			
			this.dataset.slideDuration = String(duration);
			this.setRecordingState(this.#recordingAvailability);
		} catch (error) {
			if (sessionToken !== this.#sessionToken || !this.isConnected) return;
			this.setRecordingState(this.#recordingAvailability);
			console.error('Could not update slide duration.', error);
		}
	}
	
	recordingDuration() {
		if (this.playbackReady()) {
			return this.playback.duration;
		}
		
		return this.#recordingDuration;
	}

	playbackReady() {
		return Number.isFinite(this.playback.duration) && this.playback.duration > 0;
	}

	waitForPlayback(update = null) {
		this.#cancelPlaybackLoad?.();

		return new Promise(resolve => {
			const finish = (result) => {
				this.playback.removeEventListener('loadedmetadata', onLoaded);
				this.playback.removeEventListener('error', onError);
				if (this.#cancelPlaybackLoad === cancel) this.#cancelPlaybackLoad = null;
				resolve(result);
			};
			const onLoaded = () => finish(this.playbackReady());
			const onError = () => finish(false);
			const cancel = () => finish(null);

			this.playback.addEventListener('loadedmetadata', onLoaded);
			this.playback.addEventListener('error', onError);
			this.#cancelPlaybackLoad = cancel;

			update?.();
			if (this.playbackReady()) finish(true);
			else if (this.playback.error) finish(false);
		});
	}

	setPlaybackSource(source) {
		return this.waitForPlayback(() => {
			this.playback.src = source;
		});
	}

	clearPlaybackSource() {
		if (this.playback.hasAttribute('src')) this.playback.removeAttribute('src');
		if (this.playback.currentSrc) this.playback.load();
	}

	setRecordingState(state) {
		if (state === 'missing' || state === 'present') this.#recordingAvailability = state;

		this.#reflectingState = true;
		try {
			this.dataset.recordingState = state;
		} finally {
			this.#reflectingState = false;
		}
		this.updateInterface();
	}

	recordingAvailability() {
		const state = this.dataset.recordingState;
		return state === 'missing' || state === 'present' ? state : 'loading';
	}

	updateInterface() {
		if (!this.recordButton) return;

		const state = this.dataset.recordingState || 'loading';
		const playbackReady = this.playbackReady();
		const recording = state === 'recording';
		const reviewing = state === 'review';
		const busy = ['preparing', 'starting', 'finishing', 'saving', 'updating'].includes(state);
		const canRecord = recording || (!busy && (reviewing || ['missing', 'present'].includes(state)));

		this.recordButton.textContent = recording ? '■ Stop' : reviewing || state === 'present' ? '● Retake' : '● Record';
		this.recordButton.disabled = !canRecord;
		this.saveButton.disabled = state !== 'review' || !this.#recording?.size || !playbackReady;

		const recordingDuration = this.canonicalDuration();
		const slideDuration = Number(this.dataset.slideDuration);
		this.applyDurationButton.disabled = state !== 'present' || !playbackReady || !recordingDuration || recordingDuration === slideDuration;
	}
	
	startTimer() {
		this.#startedAt = performance.now();
		this.updateTimer();
		this.#timer = window.setInterval(() => this.updateTimer(), 250);
	}
	
	stopTimer() {
		if (this.#timer) window.clearInterval(this.#timer);
		this.#timer = null;
	}
	
	updateTimer() {
		const elapsed = Math.floor((performance.now() - this.#startedAt) / 1000);
		const minutes = Math.floor(elapsed / 60);
		const seconds = String(elapsed % 60).padStart(2, '0');
		this.time.textContent = `${minutes}:${seconds}`;
	}
	
	releaseMicrophone() {
		this.#mediaStream?.getTracks().forEach(track => track.stop());
		this.#mediaStream = null;

		this.#audioDestination?.stream.getTracks().forEach(track => track.stop());
		this.#audioSource?.disconnect();
		this.#audioDelay?.disconnect();
		this.#audioDestination?.disconnect();
		this.#audioContext?.close().catch(() => {});

		this.#audioContext = null;
		this.#audioSource = null;
		this.#audioDelay = null;
		this.#audioDestination = null;
	}
	
	releaseRecordingURL() {
		if (this.#recordingURL) URL.revokeObjectURL(this.#recordingURL);
		this.#recordingURL = null;
	}
	
}

customElements.define('presently-recording-controls', PresentlyRecordingControls);
