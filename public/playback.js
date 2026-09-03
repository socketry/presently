import Syntax from '@socketry/syntax';
import {runScript} from './slide-scripts.js';
import {applyCodeFocus} from './code-focus.js';

const frames = Array.from(document.querySelectorAll('.playback-frame'));
const audioTracks = new Map(
	Array.from(document.querySelectorAll('.playback-audio audio')).map(audio => [Number(audio.dataset.index), audio]),
);
const startScreen = document.querySelector('.playback-start-screen');
const startButton = document.querySelector('.playback-start');
const status = document.querySelector('.playback-status');
const previousButton = document.querySelector('.playback-previous');
const toggleButton = document.querySelector('.playback-toggle');
const nextButton = document.querySelector('.playback-next');
const counter = document.querySelector('.playback-counter');

let currentIndex = 0;
let currentScript = null;
let currentAudio = null;
let playing = false;
let transitioning = false;

function setStatus(message, error = false) {
	status.textContent = message;
	status.classList.toggle('error', error);
}

function updateControls() {
	toggleButton.textContent = playing ? '❚❚' : '▶';
	previousButton.disabled = currentIndex === 0;
	nextButton.disabled = currentIndex === frames.length - 1;
	counter.textContent = `${currentIndex + 1} / ${frames.length}`;
}

function stopCurrent() {
	currentScript?.cancelTimeouts();
	currentScript = null;

	if (currentAudio) {
		currentAudio.pause();
		currentAudio.removeEventListener('ended', handleEnded);
		currentAudio = null;
	}
}

function activateFrame(index) {
	frames.forEach((frame, frameIndex) => {
		frame.hidden = frameIndex !== index;
	});

	currentIndex = index;
	const slide = frames[index].querySelector('.slide');
	currentScript = runScript(slide);
	updateControls();
}

async function show(index, {transition = true} = {}) {
	if (transitioning || index < 0 || index >= frames.length) return false;

	transitioning = true;
	stopCurrent();

	const transitionName = frames[index].dataset.transition;
	const swap = () => activateFrame(index);

	try {
		if (transition && transitionName && document.startViewTransition) {
			document.documentElement.dataset.transition = transitionName;
			const viewTransition = document.startViewTransition(swap);
			await viewTransition.updateCallbackDone;
		} else {
			swap();
		}
	} finally {
		delete document.documentElement.dataset.transition;
		transitioning = false;
	}

	return true;
}

function finish() {
	stopCurrent();
	playing = false;
	updateControls();

	if (document.body.dataset.controls !== 'false') {
		startScreen.hidden = false;
		startButton.disabled = false;
		startButton.textContent = '↻ Play again';
		setStatus('Playback complete.');
	}

	window.__PRESENTLY_PLAYBACK_FINISHED = true;
	document.dispatchEvent(new CustomEvent('presently:playback-finished'));
}

async function playCurrent() {
	currentAudio = audioTracks.get(currentIndex);

	if (!currentAudio) {
		playing = false;
		updateControls();
		startScreen.hidden = false;
		startButton.disabled = false;
		setStatus(`Slide ${currentIndex + 1} has no narration.`, true);
		throw new Error(`Slide ${currentIndex + 1} has no narration.`);
	}

	currentAudio.currentTime = 0;
	currentAudio.addEventListener('ended', handleEnded, {once: true});
	await currentAudio.play();
	playing = true;
	updateControls();
}

async function handleEnded() {
	try {
		if (currentIndex === frames.length - 1) {
			finish();
			return;
		}

		await show(currentIndex + 1);
		await playCurrent();
	} catch (error) {
		handlePlaybackError(error);
	}
}

function handlePlaybackError(error) {
	stopCurrent();
	playing = false;
	updateControls();
	startScreen.hidden = false;
	startButton.disabled = false;
	setStatus(error.name === 'NotAllowedError' ? 'Press Start to allow audio playback.' : error.message, error.name !== 'NotAllowedError');
	console.error(error);
}

async function start() {
	window.__PRESENTLY_PLAYBACK_FINISHED = false;
	startButton.disabled = true;

	try {
		if (currentIndex === frames.length - 1 || startButton.textContent.includes('again')) {
			await show(0, {transition: false});
		}

		startScreen.hidden = true;
		await playCurrent();
	} catch (error) {
		handlePlaybackError(error);
	}
}

async function move(offset) {
	const wasPlaying = playing;
	const index = Math.max(0, Math.min(frames.length - 1, currentIndex + offset));
	if (index === currentIndex) return;

	playing = false;
	await show(index);
	if (wasPlaying) {
		try {
			await playCurrent();
		} catch (error) {
			handlePlaybackError(error);
		}
	}
}

async function toggle() {
	try {
		if (!currentAudio || currentAudio.ended) {
			startScreen.hidden = true;
			await playCurrent();
		} else if (currentAudio.paused) {
			await currentAudio.play();
			playing = true;
			updateControls();
		} else {
			currentAudio.pause();
			playing = false;
			updateControls();
		}
	} catch (error) {
		handlePlaybackError(error);
	}
}

startButton.addEventListener('click', start);
previousButton.addEventListener('click', () => move(-1));
toggleButton.addEventListener('click', toggle);
nextButton.addEventListener('click', () => move(1));

document.addEventListener('keydown', async event => {
	if (event.target.closest('button')) return;

	switch (event.key) {
		case 'ArrowLeft':
		case 'PageUp':
			event.preventDefault();
			await move(-1);
			break;
		case 'ArrowRight':
		case 'PageDown':
			event.preventDefault();
			await move(1);
			break;
		case ' ':
			event.preventDefault();
			await toggle();
			break;
		case 'f':
		case 'F':
			event.preventDefault();
			if (document.fullscreenElement) await document.exitFullscreen();
			else await document.documentElement.requestFullscreen();
			break;
	}
});

async function waitForAudioMetadata(audio) {
	if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) return;

	await new Promise((resolve, reject) => {
		audio.addEventListener('loadedmetadata', resolve, {once: true});
		audio.addEventListener('error', () => reject(new Error(`Could not load narration for slide ${Number(audio.dataset.index) + 1}.`)), {once: true});
	});
}

async function prepare() {
	if (!frames.length) throw new Error('The presentation has no slides.');
	if (audioTracks.size !== frames.length) throw new Error('Every slide requires a narration recording.');

	await Promise.all([
		Syntax.highlight(),
		document.fonts.ready,
		...Array.from(audioTracks.values()).map(waitForAudioMetadata),
	]);
	await applyCodeFocus();

	activateFrame(0);
	startButton.disabled = false;
	setStatus('Ready.');

	window.__PRESENTLY_PLAYBACK_READY = true;
	document.dispatchEvent(new CustomEvent('presently:playback-ready'));

	if (document.body.dataset.autoplay === 'true') await start();
}

prepare().catch(error => {
	startButton.disabled = true;
	setStatus(error.message, true);
	console.error(error);
});
