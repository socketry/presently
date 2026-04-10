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
			// No focus specified - reset
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
		
		// Wait for content to render, then calculate positions
		requestAnimationFrame(() => {
			// Find the pre element and measure line height
			const pre = scroll.querySelector('pre');
			if (!pre) return;
			
			// Get computed line height from the code content
			const code = pre.querySelector('code, syntax-code') || pre;
			const style = getComputedStyle(code);
			const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.6;
			
			const padding = parseFloat(getComputedStyle(scroll).paddingTop) || 16;
			const viewportHeight = viewport.clientHeight;
			
			// Calculate pixel positions for focus region
			const focusTopPx = padding + (focusStart - 1) * lineHeight;
			const focusBottomPx = padding + focusEnd * lineHeight;
			const focusHeight = focusBottomPx - focusTopPx;
			
			// Center the focus region in the viewport
			const targetCenter = focusTopPx + focusHeight / 2;
			const viewportCenter = viewportHeight / 2;
			const translateY = Math.min(0, viewportCenter - targetCenter);
			
			scroll.style.transform = `translateY(${translateY}px)`;
			
			// Position the dim overlays
			const dimTopHeight = Math.max(0, focusTopPx + translateY);
			const dimBottomHeight = Math.max(0, viewportHeight - (focusBottomPx + translateY));
			
			dimTop.style.height = `${dimTopHeight}px`;
			dimBottom.style.height = `${dimBottomHeight}px`;
		});
	});
}

// Re-highlight and apply focus after Live DOM updates:
const observer = new MutationObserver(() => {
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
