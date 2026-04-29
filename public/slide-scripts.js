import {Slide} from './slide.js';

// Run the inline slide script for a single slide element.
//
// Scopes the Slide context to .slide-body (falling back to the slide element
// itself) so slide.find() queries don't accidentally match chrome outside the
// content area. Shadows the global setTimeout with slide.setTimeout so that
// any timeouts registered by the script are tracked and can be cancelled on
// slide change. Returns the Slide instance, or null if there was no script.
//
// @parameter slideEl [HTMLElement] The .slide container element.
// @parameter animated [Boolean] Whether animations are active. Default: true.
// @returns [Slide | null]
export function runScript(slideEl, {animated = true} = {}) {
	const scriptEl = slideEl.querySelector('script[type="text/slide-script"]');
	if (!scriptEl) return null;

	const container = slideEl.querySelector('.slide-body') ?? slideEl;
	const slide = new Slide(container, {animated});

	try {
		const fn = new Function('slide', 'setTimeout', scriptEl.textContent);
		fn(slide, slide.setTimeout.bind(slide));
	} catch (error) {
		console.error('Slide script error:', error);
	}

	return slide;
}

// Run scripts for every .slide element in the document.
// Returns the array of Slide instances that had a script.
// Intended for one-shot contexts (e.g. export) where timeout cancellation
// is not needed.
//
// @parameter animated [Boolean] Whether animations are active. Default: true.
// @returns [Array(Slide)]
export function runAllSlideScripts({animated = true} = {}) {
	const slides = [];

	for (const slideEl of document.querySelectorAll('.slide')) {
		const slide = runScript(slideEl, {animated});
		if (slide) slides.push(slide);
	}

	return slides;
}
