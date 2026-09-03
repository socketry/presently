import { Live } from 'live';
import Syntax from '@socketry/syntax';
import { runScript } from './slide-scripts.js';
import { applyCodeFocus } from './code-focus.js';

const RECORDING_EDGE_DELAY = 100;

// Records and reviews the narration for one slide. The element is recreated
// when the selected slide changes, which gives each recording session a clear
// lifetime and releases the microphone during navigation.
class PresentlyRecorder extends HTMLElement {
	#mediaRecorder = null;
	#mediaStream = null;
	#audioContext = null;
	#audioSource = null;
	#audioDelay = null;
	#audioDestination = null;
	#chunks = [];
	#recording = null;
	#recordingURL = null;
	#startedAt = null;
	#timer = null;
	#startToken = null;
	
	connectedCallback() {
		this.startButton = this.querySelector('.recording-start');
		this.stopButton = this.querySelector('.recording-stop');
		this.saveButton = this.querySelector('.recording-save');
		this.playback = this.querySelector('.recording-playback');
		this.status = this.querySelector('.recording-status');
		this.time = this.querySelector('.recording-time');
		
		this.startButton.addEventListener('click', () => this.start(performance.now()));
		// Stop as soon as the pointer is pressed, before the normal click completes.
		// The click handler remains for keyboard activation and is safe to invoke twice.
		this.stopButton.addEventListener('pointerdown', () => this.stop());
		this.stopButton.addEventListener('click', () => this.stop());
		this.saveButton.addEventListener('click', () => this.save());
		
		this.loadExisting();
	}
	
	disconnectedCallback() {
		this.#startToken = null;

		if (this.#mediaRecorder?.state === 'recording') {
			this.#mediaRecorder.onstop = null;
			this.#mediaRecorder.stop();
		}
		
		this.releaseMicrophone();
		this.stopTimer();
		this.releaseRecordingURL();
	}
	
	get url() {
		return this.dataset.recordingUrl;
	}
	
	async loadExisting() {
		try {
			const response = await fetch(this.url, {method: 'HEAD', cache: 'no-store'});
			
			if (response.ok) {
				this.playback.src = this.cacheBustedURL();
				this.playback.hidden = false;
				this.startButton.textContent = '● Retake';
				this.setStatus('Existing recording loaded.');
			} else if (response.status === 404) {
				this.setStatus('No recording yet.');
			} else {
				throw new Error(`Could not check recording (${response.status}).`);
			}
		} catch (error) {
			this.setStatus(error.message, true);
		}
	}
	
	async start(clickedAt) {
		const AudioContext = window.AudioContext || window.webkitAudioContext;
		if (!window.MediaRecorder || !navigator.mediaDevices?.getUserMedia || !AudioContext) {
			this.setStatus('Audio recording is not supported by this browser.', true);
			return;
		}
		
		const mimeType = 'audio/webm;codecs=opus';
		if (!MediaRecorder.isTypeSupported(mimeType)) {
			this.setStatus(`${mimeType} recording is not supported by this browser.`, true);
			return;
		}
		
		const startToken = this.#startToken = {};
		this.startButton.disabled = true;
		this.stopButton.disabled = true;
		this.saveButton.disabled = true;
		this.dataset.state = 'preparing';
		this.setStatus('Preparing microphone…');

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
			this.#mediaRecorder = new MediaRecorder(this.#audioDestination.stream, {mimeType});
			
			this.#mediaRecorder.addEventListener('dataavailable', (event) => {
				if (event.data.size > 0) this.#chunks.push(event.data);
			});
			
			this.#mediaRecorder.addEventListener('stop', () => this.finish());

			this.dataset.state = 'starting';
			this.setStatus('Starting…');

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
			
			this.stopButton.disabled = false;
			this.dataset.state = 'recording';
			this.setStatus('Recording…');
		} catch (error) {
			if (this.#startToken !== startToken) return;

			this.#startToken = null;
			this.releaseMicrophone();
			this.startButton.disabled = false;
			this.dataset.state = 'idle';
			this.setStatus(`Could not start recording: ${error.message}`, true);
		}
	}
	
	stop() {
		if (this.#mediaRecorder?.state === 'recording') {
			// The encoder receives audio through a 100 ms delay. Stopping immediately
			// excludes approximately the final 100 ms before this pointer-down event.
			this.#mediaRecorder.stop();
			this.stopButton.disabled = true;
			this.dataset.state = 'finishing';
			this.setStatus('Preparing recording…');
		}
	}
	
	finish() {
		this.stopTimer();
		this.releaseMicrophone();
		this.releaseRecordingURL();
		
		this.#recording = new Blob(this.#chunks, {type: 'audio/webm'});
		this.#recordingURL = URL.createObjectURL(this.#recording);
		this.playback.src = this.#recordingURL;
		this.playback.hidden = false;
		
		this.startButton.disabled = false;
		this.startButton.textContent = '● Retake';
		this.saveButton.disabled = this.#recording.size === 0;
		this.dataset.state = 'review';
		this.setStatus(this.#recording.size > 0 ? 'Review the recording, then save it.' : 'The recording was empty.', this.#recording.size === 0);
	}
	
	async save() {
		if (!this.#recording) return;
		
		this.saveButton.disabled = true;
		this.setStatus('Saving…');
		
		try {
			const response = await fetch(this.url, {
				method: 'PUT',
				headers: {'content-type': this.#recording.type},
				body: this.#recording,
			});
			
			if (!response.ok) {
				throw new Error((await response.text()) || `Could not save recording (${response.status}).`);
			}
			
			this.playback.src = this.cacheBustedURL();
			this.releaseRecordingURL();
			this.#recording = null;
			this.setStatus('Recording saved.');
		} catch (error) {
			this.saveButton.disabled = false;
			this.setStatus(`Could not save recording: ${error.message}`, true);
		}
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
	
	cacheBustedURL() {
		return `${this.url}&version=${Date.now()}`;
	}
	
	setStatus(message, error = false) {
		this.status.textContent = message;
		this.status.classList.toggle('error', error);
	}
}

customElements.define('presently-recorder', PresentlyRecorder);

const live = Live.start();

async function highlightAndApplyCodeFocus() {
	await Syntax.highlight();
	await applyCodeFocus();
}

// Highlight code blocks on initial load and apply focus once rendering finishes:
await highlightAndApplyCodeFocus();


// Run the script for a single slide element.
// Wrapped in try/catch so syntax errors don't crash the presentation.
// Passes a tracked setTimeout so pending timeouts can be cancelled on slide change.
// Run scripts for all slide elements currently in the DOM.
// Cancels any pending timeouts from the previous slide's scripts first.
function runSlideScripts() {
	currentSlides.forEach(slide => slide.cancelTimeouts());
	currentSlides = [];
	document.querySelectorAll('.slide').forEach(slideEl => {
		const slide = runScript(slideEl);
		if (slide) currentSlides.push(slide);
	});
}


// Detect the transition type from the incoming HTML before morphdom applies it.
function detectTransition(html) {
	const match = html.match(/data-transition="([^"]+)"/);
	return match ? match[1] : null;
}

// Track the active view transition so we can skip overlapping ones.
let activeTransition = null;

// Track Slide instances from the current scripts so we can cancel their timeouts on slide change.
let currentSlides = [];

// Wrap Live's update method to support view transitions.
const originalUpdate = live.update.bind(live);
live.update = function(id, html, options) {
	// Only apply transitions on the display view, not the presenter:
	const transition = document.querySelector('.display') ? detectTransition(html) : null;
	
	if (transition && document.startViewTransition && !activeTransition) {
		document.documentElement.dataset.transition = transition;

		activeTransition = document.startViewTransition(() => {
			originalUpdate(id, html, options);
			runSlideScripts();
		});

		activeTransition.finished.finally(() => {
			delete document.documentElement.dataset.transition;
			activeTransition = null;
			highlightAndApplyCodeFocus();
		});
	} else {
		originalUpdate(id, html, options);
		runSlideScripts();
		highlightAndApplyCodeFocus();
	}
};

// Re-highlight and apply focus after non-update DOM mutations (e.g. replace):
const observer = new MutationObserver(() => {
	if (activeTransition) return;
	highlightAndApplyCodeFocus();
});
observer.observe(document.body, { childList: true, subtree: true });

// Initial script application:
runSlideScripts();

// Jump-to select: forward the selected slide index to the presenter view.
document.addEventListener('change', (event) => {
	const select = event.target.closest('select.jump-to');
	if (!select) return;
	const liveId = select.dataset.liveId;
	if (!liveId) return;
	live.forwardEvent(liveId, event, {action: 'jump', index: parseInt(select.value)});
	select.value = '';
});

// Keyboard navigation
document.addEventListener('keydown', (event) => {
	if (event.target.closest('button, input, textarea, select, audio, presently-recorder')) return;
	
	const liveView = document.querySelector('live-view');
	if (!liveView) return;
	
	const id = liveView.id;
	let action = null;
	
	switch (event.key) {
		case 'ArrowRight':
		case ' ':
		case 'PageDown':
			action = 'next';
			break;
		case 'ArrowLeft':
		case 'PageUp':
			action = 'previous';
			break;
		case 'f':
		case 'F':
			event.preventDefault();
			if (document.fullscreenElement) {
				document.exitFullscreen();
			} else {
				document.documentElement.requestFullscreen();
			}
			return;
	}
	
	if (action) {
		event.preventDefault();
		live.forwardEvent(id, event, { action: action });
	}
});
