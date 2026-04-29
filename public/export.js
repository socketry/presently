import Syntax from '@socketry/syntax';
import {Slide} from '/slide.js';

// Run all inline slide scripts synchronously, scoped to their slide element.
function runSlideScripts() {
	document.querySelectorAll('script[type="text/slide-script"]').forEach((scriptEl) => {
		const slideEl = scriptEl.closest('.slide');
		if (!slideEl) return;
		
		const slide = new Slide(slideEl);
		// eslint-disable-next-line no-new-func
		new Function('slide', scriptEl.textContent)(slide);
	});
}

// Apply code focus — mirrors application.js applyCodeFocus() exactly.
// Positions .code-scroll via translateY and sizes the dim overlays by
// measuring actual line positions via syntax-code.getLineBoundingClientRect().
async function applyCodeFocus() {
	for (const viewport of document.querySelectorAll('.code-viewport')) {
		const focusStart = parseInt(viewport.dataset.focusStart);
		const focusEnd = parseInt(viewport.dataset.focusEnd);
		if (!focusStart || !focusEnd) continue;
		
		const scroll = viewport.querySelector('.code-scroll');
		const dimTop = viewport.querySelector('.code-dim-top');
		const dimBottom = viewport.querySelector('.code-dim-bottom');
		if (!scroll) continue;
		
		const code = scroll.querySelector('syntax-code');
		if (!code) continue;
		
		await code.ready;
		
		const firstLineRect = code.getLineBoundingClientRect(focusStart);
		const lastLineRect = code.getLineBoundingClientRect(focusEnd);
		if (!firstLineRect || !lastLineRect) continue;
		
		const scrollRect = scroll.getBoundingClientRect();
		const scale = scroll.clientHeight / scrollRect.height;
		
		const focusTopPx = (firstLineRect.top - scrollRect.top) * scale;
		const focusBottomPx = (lastLineRect.bottom - scrollRect.top) * scale;
		const focusHeight = focusBottomPx - focusTopPx;
		const viewportHeight = viewport.clientHeight;
		
		const targetCenter = focusTopPx + focusHeight / 2;
		const viewportCenter = viewportHeight / 2;
		const translateY = Math.min(0, viewportCenter - targetCenter);
		
		scroll.style.transform = `translateY(${translateY}px)`;
		
		const dimTopHeight = Math.max(0, focusTopPx + translateY);
		const dimBottomHeight = Math.max(0, viewportHeight - (focusBottomPx + translateY));
		
		if (dimTop) dimTop.style.height = `${dimTopHeight}px`;
		if (dimBottom) dimBottom.style.height = `${dimBottomHeight}px`;
	}
}

// Wait for two animation frames, ensuring the browser has processed all pending
// style recalculations and committed DOM mutations to a rendered frame.
// This is the canonical way to know the browser is done after async DOM work.
function waitForRender() {
	return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

async function main() {
	// 1. Kick off syntax highlighting and font loading concurrently.
	//    Slide scripts are synchronous and don't depend on either, so run them now.
	const syntaxDone = Syntax.highlight();

	// 2. Run slide scripts (synchronous in export mode — sets visibility instantly).
	runSlideScripts();

	// 3. Wait for syntax and fonts to finish before applying focus.
	await Promise.all([syntaxDone, document.fonts.ready]);

	// 4. Apply code focus now that syntax-code elements are ready.
	await applyCodeFocus();

	// 5. Wait for the browser to commit all DOM mutations to a rendered frame.
	//    Without this, the PDF can be captured before the browser has painted.
	await waitForRender();

	window.__PRESENTLY_READY = true;
	document.dispatchEvent(new CustomEvent('presently:ready'));
}

main().catch(console.error);
