// Represents a collection of elements within a slide to be revealed sequentially.
// Has no side effects until build() is called.
export class SlideElements {
	constructor(elements) {
		this._elements = elements;
	}

	// Show the first `count` elements and hide the rest.
	// Assigns view-transition-names for morph compatibility.
	// If an `effect` is given, applies a CSS animation class to the newly
	// revealed element and returns a Promise that resolves when it finishes.
	// Without an effect, returns a resolved Promise immediately.
	// @parameter count [Integer] Number of elements to show.
	// @parameter options [Object]
	//   group: prefix for view-transition-name (default: "build")
	//   effect: "fade", "fly-up", "fly-down", "fly-left", "fly-right", "scale"
	// @returns [Promise] Resolves when the animation completes (or immediately if no effect).
	build(count, options = {}) {
		const prefix = options.group || 'build';
		let revealedElement = null;

		this._elements.forEach((element, index) => {
			element.style.viewTransitionName = `${prefix}-${index + 1}`;

			if (index < count) {
				element.style.visibility = 'visible';
				element.style.viewTransitionClass = '';

				if (index === count - 1 && options.effect) {
					element.classList.add(`build-${options.effect}`);
					revealedElement = element;
				}
			} else {
				element.style.visibility = 'hidden';
				// Keep viewTransitionClass set so morph transitions can suppress
				// crossfading on hidden elements when called inside startViewTransition.
				element.style.viewTransitionClass = 'build-hidden';
			}
		});

		if (revealedElement) {
			const animationClass = `build-${options.effect}`;
			return new Promise((resolve) => {
				revealedElement.addEventListener('animationend', () => {
					revealedElement.classList.remove(animationClass);
					resolve();
				}, {once: true});
			});
		}

		return Promise.resolve();
	}
}

// Returned by Slide#after to enable relative delay chaining.
// Each .after(delay, callback) fires that many milliseconds after the previous step.
class SlideChain {
	constructor(slide, elapsed) {
		this._slide = slide;
		this._elapsed = elapsed;
	}

	after(delay, callback) {
		this._elapsed += delay;
		this._slide.setTimeout(callback, this._elapsed);
		return this;
	}
}

// The scripting context passed to each slide's javascript block.
// Scopes element queries to the slide body.
export class Slide {
	constructor(container) {
		this._container = container;
		this._timeouts = [];
	}

	// Find elements within this slide matching the given CSS selector.
	// Use comma-separated selectors to combine multiple element types, e.g. "h2, li".
	// @parameter selector [String] A CSS selector scoped to the slide body.
	// @returns [SlideElements]
	find(selector) {
		const elements = Array.from(this._container.querySelectorAll(selector));
		return new SlideElements(elements);
	}

	// Tracked setTimeout — use this in slide scripts instead of the global.
	// Registered timeouts are automatically cancelled when the slide changes.
	// @parameter callback [Function] The function to call after the delay.
	// @parameter delay [Number] Delay in milliseconds.
	// @returns [Number] The timeout ID.
	setTimeout(callback, delay) {
		const timeoutId = window.setTimeout(callback, delay);
		this._timeouts.push(timeoutId);
		return timeoutId;
	}

	// Schedule a callback after a delay, returning a chainable object so
	// subsequent .after(delay) calls are relative to the previous step.
	// All timeouts are tracked and cancelled automatically on slide change.
	// @parameter delay [Number] Delay in milliseconds from now (or previous step).
	// @parameter callback [Function] The function to call after the delay.
	// @returns [SlideChain]
	after(delay, callback) {
		this.setTimeout(callback, delay);
		return new SlideChain(this, delay);
	}

	// Cancel all pending timeouts registered by this slide's script.
	cancelTimeouts() {
		this._timeouts.forEach(timeoutId => clearTimeout(timeoutId));
		this._timeouts = [];
	}
}
