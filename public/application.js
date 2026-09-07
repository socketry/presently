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

// Track the active view transition so we can skip overlapping ones.
let activeTransition = null;

// Track Slide instances from the current scripts so we can cancel their timeouts on slide change.
let currentSlides = [];

function dispatchSlideChange(view) {
	view.dispatchEvent(new CustomEvent(SLIDE_CHANGE_EVENT, {bubbles: true}));
}

function renderSlide(event) {
	const view = event.target.closest?.('live-view');
	if (!view) return;

	const {html, transition} = event.detail;
	const render = () => {
		live.update(view.id, html);
		runSlideScripts();
	};
	
	if (transition && document.startViewTransition && !activeTransition) {
		document.documentElement.dataset.transition = transition;

		const viewTransition = document.startViewTransition(render);
		activeTransition = viewTransition;

		const complete = () => {
			delete document.documentElement.dataset.transition;
			activeTransition = null;
			dispatchSlideChange(view);
		};

		viewTransition.finished.then(complete, complete);
	} else {
		render();
		dispatchSlideChange(view);
	}
}

document.addEventListener(SLIDE_RENDER_EVENT, renderSlide);
document.addEventListener(SLIDE_CHANGE_EVENT, () => {
	highlightAndApplyCodeFocus();
});

// Initialize the server-rendered slide before connecting for subsequent updates:
await highlightAndApplyCodeFocus();

live = Live.start();

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
