import Syntax from '@socketry/syntax';

// Run all inline slide scripts synchronously, scoped to their slide element.
function runSlideScripts() {
	const {Slide} = window.__SLIDE_CLASSES__ || {};
	if (!Slide) return;
	
	document.querySelectorAll('script[type="text/slide-script"]').forEach((scriptEl) => {
		const slideEl = scriptEl.closest('.slide');
		if (!slideEl) return;
		
		const slide = new Slide(slideEl);
		// eslint-disable-next-line no-new-func
		new Function('slide', scriptEl.textContent)(slide);
	});
}

// Apply code focus ranges declared via slide front matter.
function applyCodeFocus() {
	document.querySelectorAll('.slide[data-focus]').forEach((slideEl) => {
		const [start, end] = slideEl.dataset.focus.split('-').map(Number);
		if (!start || !end) return;
		
		slideEl.querySelectorAll('pre code .line').forEach((line, index) => {
			const lineNumber = index + 1;
			if (lineNumber < start || lineNumber > end) {
				line.classList.add('line-dimmed');
			}
		});
	});
}

async function main() {
	// 1. Syntax highlighting (synchronous).
	await Syntax.highlight();
	
	// 2. Run slide scripts (reveals builds etc. instantly in export mode).
	runSlideScripts();
	
	// 3. Apply code focus highlighting.
	applyCodeFocus();
	
	// 4. Signal readiness to the WebDriver bake task.
	window.__PRESENTLY_READY = true;
	document.dispatchEvent(new CustomEvent('presently:ready'));
}

main().catch(console.error);
