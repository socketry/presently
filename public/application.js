import { Live } from 'live';
import Syntax from '@socketry/syntax';
import { runScript } from './slide-scripts.js';
import { applyCodeFocus } from './code-focus.js';

const live = Live.start();

// Highlight code blocks on initial load:
await Syntax.highlight();


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
			Syntax.highlight();
			applyCodeFocus();
		});
	} else {
		originalUpdate(id, html, options);
		runSlideScripts();
		Syntax.highlight();
		applyCodeFocus();
	}
};

// Re-highlight and apply focus after non-update DOM mutations (e.g. replace):
const observer = new MutationObserver(() => {
	if (activeTransition) return;
	Syntax.highlight();
	applyCodeFocus();
});
observer.observe(document.body, { childList: true, subtree: true });

// Initial focus and script application:
applyCodeFocus();
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
