import { Live } from 'live';
import Syntax from '@socketry/syntax';
import { runScript } from './slide-scripts.js';
import { applyCodeFocus } from './code-focus.js';

import './recorder.js';

const SLIDE_RENDER_EVENT = 'presently:slide:render';
const SLIDE_CHANGE_EVENT = 'presently:slide:change';

let live = null;

async function highlightAndApplyCodeFocus() {
	await Syntax.highlight();
	await applyCodeFocus();
}

// A page can render multiple slides, such as the current slide and presenter preview.
// Track their active Slide instances so we can cancel their timeouts on slide change.
let activeSlides = [];
let slideRevision = 0;

async function initializeSlides() {
	const revision = ++slideRevision;

	activeSlides.forEach(slide => slide.cancelTimeouts());
	activeSlides = [];

	await highlightAndApplyCodeFocus();
	if (revision !== slideRevision) return null;

	document.querySelectorAll('.slide').forEach(slideEl => {
		const slide = runScript(slideEl);
		if (slide) activeSlides.push(slide);
	});

	return revision;
}

// Track the active view transition so we can skip overlapping ones.
let activeTransition = null;

function dispatchSlideChange(view) {
	view.dispatchEvent(new CustomEvent(SLIDE_CHANGE_EVENT, {bubbles: true}));
}

async function renderSlide(event) {
	const view = event.target.closest?.('live-view');
	if (!view) return;

	const {html, transition} = event.detail;
	let revision = null;

	const render = async () => {
		live.update(view.id, html);
		revision = await initializeSlides();
	};
	
	if (transition && document.startViewTransition && !activeTransition) {
		document.documentElement.dataset.transition = transition;

		const viewTransition = document.startViewTransition(render);
		activeTransition = viewTransition;

		try {
			await viewTransition.finished;
			if (revision === slideRevision) dispatchSlideChange(view);
		} finally {
			delete document.documentElement.dataset.transition;
			activeTransition = null;
		}
	} else {
		await render();
		if (revision === slideRevision) dispatchSlideChange(view);
	}
}

document.addEventListener(SLIDE_RENDER_EVENT, (event) => {
	renderSlide(event).catch(error => console.error('Could not render slide:', error));
});

// Begin initializing the server-rendered slide before connecting. If the server
// sends a newer render while this is in progress, its revision takes precedence.
const initialSlide = initializeSlides();
live = Live.start();

const initialRevision = await initialSlide;
const initialView = document.querySelector('live-view');
if (initialView && initialRevision === slideRevision) dispatchSlideChange(initialView);

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
