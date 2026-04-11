import { Live } from 'live';
import Syntax from '@socketry/syntax';

const live = Live.start();

// Highlight code blocks on initial load:
await Syntax.highlight();

// Apply code focus effect to all code viewports.
function applyCodeFocus() {
	document.querySelectorAll('.code-viewport').forEach(viewport => {
		const focusStart = parseInt(viewport.dataset.focusStart);
		const focusEnd = parseInt(viewport.dataset.focusEnd);
		
		if (!focusStart || !focusEnd) {
			const scroll = viewport.querySelector('.code-scroll');
			const dimTop = viewport.querySelector('.code-dim-top');
			const dimBottom = viewport.querySelector('.code-dim-bottom');
			if (scroll) scroll.style.transform = '';
			if (dimTop) dimTop.style.height = '0';
			if (dimBottom) dimBottom.style.height = '0';
			return;
		}
		
		const scroll = viewport.querySelector('.code-scroll');
		const dimTop = viewport.querySelector('.code-dim-top');
		const dimBottom = viewport.querySelector('.code-dim-bottom');
		if (!scroll) return;
		
		requestAnimationFrame(() => {
			const pre = scroll.querySelector('pre');
			if (!pre) return;
			
			// Measure actual line height by rendering a single line and measuring it:
			const probe = document.createElement('span');
			probe.textContent = 'X';
			probe.style.visibility = 'hidden';
			probe.style.position = 'absolute';
			pre.appendChild(probe);
			const singleHeight = probe.getBoundingClientRect().height;
			pre.removeChild(probe);
			const lineHeight = singleHeight;
			
			const padding = parseFloat(getComputedStyle(scroll).paddingTop) || 16;
			const viewportHeight = viewport.clientHeight;
			
			const focusTopPx = padding + (focusStart - 1) * lineHeight;
			const focusBottomPx = padding + focusEnd * lineHeight;
			const focusHeight = focusBottomPx - focusTopPx;
			
			const targetCenter = focusTopPx + focusHeight / 2;
			const viewportCenter = viewportHeight / 2;
			const translateY = Math.min(0, viewportCenter - targetCenter);
			
			scroll.style.transform = `translateY(${translateY}px)`;
			
			const dimTopHeight = Math.max(0, focusTopPx + translateY);
			const dimBottomHeight = Math.max(0, viewportHeight - (focusBottomPx + translateY));
			
			dimTop.style.height = `${dimTopHeight}px`;
			dimBottom.style.height = `${dimBottomHeight}px`;
		});
	});
}

// Detect the transition type from the incoming HTML before morphdom applies it.
function detectTransition(html) {
	const match = html.match(/data-transition="([^"]+)"/);
	return match ? match[1] : null;
}

// Track the active view transition so we can skip overlapping ones.
let activeTransition = null;

// Wrap Live's update method to support view transitions.
const originalUpdate = live.update.bind(live);
live.update = function(id, html, options) {
	// Only apply transitions on the display view, not the presenter:
	const transition = document.querySelector('.display') ? detectTransition(html) : null;
	
	if (transition && document.startViewTransition && !activeTransition) {
		document.documentElement.dataset.transition = transition;
		
		activeTransition = document.startViewTransition(() => {
			originalUpdate(id, html, options);
		});
		
		activeTransition.finished.finally(() => {
			delete document.documentElement.dataset.transition;
			activeTransition = null;
			Syntax.highlight();
			applyCodeFocus();
		});
	} else {
		originalUpdate(id, html, options);
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

// Initial focus application:
applyCodeFocus();

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
