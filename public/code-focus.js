// Applies code focus to all .code-viewport elements on the page.
//
// Reads data-focus-start / data-focus-end from each viewport, waits for the
// syntax-code element to finish rendering, measures actual line positions via
// getLineBoundingClientRect(), then translates .code-scroll and sizes the
// .code-dim-top / .code-dim-bottom overlays accordingly.
//
// Returns a Promise that resolves when all viewports have been processed,
// making it safe to await in export mode. In live mode callers can fire-and-forget.
export async function applyCodeFocus() {
	for (const viewport of document.querySelectorAll('.code-viewport')) {
		const focusStart = parseInt(viewport.dataset.focusStart);
		const focusEnd = parseInt(viewport.dataset.focusEnd);

		const scroll = viewport.querySelector('.code-scroll');
		const dimTop = viewport.querySelector('.code-dim-top');
		const dimBottom = viewport.querySelector('.code-dim-bottom');
		if (!scroll) continue;

		// Reset when there is no focus range (e.g. after a slide change).
		if (!focusStart || !focusEnd) {
			scroll.style.transform = '';
			if (dimTop) dimTop.style.height = '0';
			if (dimBottom) dimBottom.style.height = '0';
			continue;
		}

		const code = scroll.querySelector('syntax-code');
		if (!code) continue;

		// Wait for the syntax-code element to finish rendering into its shadow DOM.
		await code.ready;

		// Get line positions in screen pixels and convert to CSS pixels using
		// the scroll container's own rect as the reference frame.
		const firstLineRect = code.getLineBoundingClientRect(focusStart);
		const lastLineRect = code.getLineBoundingClientRect(focusEnd);
		if (!firstLineRect || !lastLineRect) continue;

		const scrollRect = scroll.getBoundingClientRect();
		const scale = scroll.clientHeight / scrollRect.height;

		const focusTopPx = (firstLineRect.top - scrollRect.top) * scale;
		const focusBottomPx = (lastLineRect.bottom - scrollRect.top) * scale;
		const focusHeight = focusBottomPx - focusTopPx;
		const viewportHeight = viewport.clientHeight;

		// Centre the focus region in the viewport.
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
