import {SlideRendering} from '@socketry/presently';
import morphdom from 'morphdom';

const frame = document.querySelector('.playback-frame');
const slideTemplates = Array.from(document.querySelectorAll('.playback-slides template'));
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
let currentRendering = null;
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
	nextButton.disabled = currentIndex === slideTemplates.length - 1;
	counter.textContent = `${currentIndex + 1} / ${slideTemplates.length}`;
}

function stopCurrent() {
	currentRendering?.dispose();
	currentRendering = null;

	stopAudio();
}

function stopAudio() {
	if (currentAudio) {
		currentAudio.pause();
		currentAudio.removeEventListener('ended', handleEnded);
		currentAudio = null;
	}
}

async function activateFrame(index, {transition = true} = {}) {
	const slideTemplate = slideTemplates[index];
	const nextFrame = document.createElement('div');
	nextFrame.id = frame.id;
	nextFrame.className = frame.className;
	nextFrame.dataset.index = slideTemplate.dataset.index;
	nextFrame.dataset.transition = slideTemplate.dataset.transition;
	nextFrame.dataset.duration = slideTemplate.dataset.duration;
	nextFrame.append(slideTemplate.content.cloneNode(true));

	const rendering = new SlideRendering(frame, {
		transition: transition ? slideTemplate.dataset.transition : null,
		previous: currentRendering,
	});
	currentRendering = rendering;

	const rendered = await rendering.render(renderView => morphdom(renderView, nextFrame));
	if (!rendered || currentRendering !== rendering) return false;

	currentIndex = index;
	updateControls();
	return true;
}

async function show(index, {transition = true} = {}) {
	if (transitioning || index < 0 || index >= slideTemplates.length) return false;

	transitioning = true;
	stopAudio();

	try {
		return await activateFrame(index, {transition});
	} finally {
		transitioning = false;
	}
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
		if (currentIndex === slideTemplates.length - 1) {
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

	window.__PRESENTLY_PLAYBACK_ERROR = error.message;
	document.dispatchEvent(new CustomEvent('presently:playback-error', {detail: {message: error.message}}));
}

async function start() {
	window.__PRESENTLY_PLAYBACK_FINISHED = false;
	window.__PRESENTLY_PLAYBACK_ERROR = null;
	startButton.disabled = true;

	try {
		if (currentIndex === slideTemplates.length - 1 || startButton.textContent.includes('again')) {
			await show(0, {transition: false});
		}

		startScreen.hidden = true;
		await playCurrent();
	} catch (error) {
		handlePlaybackError(error);
	}
}

window.__PRESENTLY_PLAYBACK_START = start;

async function move(offset) {
	const wasPlaying = playing;
	const index = Math.max(0, Math.min(slideTemplates.length - 1, currentIndex + offset));
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
	if (!slideTemplates.length) throw new Error('The presentation has no slides.');
	if (audioTracks.size !== slideTemplates.length) throw new Error('Every slide requires a narration recording.');

	await Promise.all([
		document.fonts.ready,
		...Array.from(audioTracks.values()).map(waitForAudioMetadata),
	]);

	await activateFrame(0, {transition: false});
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

	window.__PRESENTLY_PLAYBACK_ERROR = error.message;
	document.dispatchEvent(new CustomEvent('presently:playback-error', {detail: {message: error.message}}));
});
