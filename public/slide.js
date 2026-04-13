// Represents a collection of elements within a slide to be revealed sequentially.
// Has no side effects until build() is called.
export class SlideElements {
	constructor(elements) {
		this._elements = elements;
	}

	// Show the first n elements and hide the rest.
	// Assigns view-transition-names and applies build visibility in one step.
	// @parameter n [Integer] Number of elements to show.
	// @parameter options [Object]
	//   group: prefix for view-transition-name (default: "build")
	//   effect: "fade", "fly-up", "fly-down", "fly-left", "fly-right", "scale"
	build(n, options = {}) {
		const prefix = options.group || 'build';

		this._elements.forEach((element, index) => {
			element.style.viewTransitionName = `${prefix}-${index + 1}`;

			if (index < n) {
				element.style.visibility = 'visible';
				// Newly revealed element: apply the enter effect.
				// Already-visible elements: clear any class so they morph normally.
				element.style.viewTransitionClass = (index === n - 1 && options.effect)
					? `build-${options.effect}`
					: '';
			} else {
				element.style.visibility = 'hidden';
				// Hidden elements: suppress both pseudo-elements so they don't
				// crossfade in or out during the transition.
				element.style.viewTransitionClass = 'build-hidden';
			}
		});
	}
}

// The scripting context passed to each slide's javascript block.
// Scopes element queries to the slide body.
export class Slide {
	constructor(container) {
		this._container = container;
	}

	// Find elements within this slide matching the given CSS selector.
	// Use comma-separated selectors to combine multiple element types, e.g. "h2, li".
	// @parameter selector [String] A CSS selector scoped to the slide body.
	// @returns [SlideElements]
	find(selector) {
		const elements = Array.from(this._container.querySelectorAll(selector));
		return new SlideElements(elements);
	}
}
