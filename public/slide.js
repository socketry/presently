// Stateful builder for a set of slide elements.
// Wraps a raw element array with a cached position so callers can use next()
// instead of tracking count manually. Created via SlideElements#builder(options).
export class SlideBuilder {
	#elements;
	#prefix;
	#defaultEffect;
	#slide;
	#step = 0;

	constructor(slide, elements, options = {}) {
		this.#slide = slide;
		this.#elements = elements;
		this.#prefix = options.group || 'build';
		this.#defaultEffect = options.effect || null;
	}

	// Reveal elements up to `count`, using the default effect unless overridden.
	// Assigns view-transition-names, sets visibility, and applies entry animation.
	// @parameter count [Integer] Number of elements to show.
	// @parameter overrides [Object] Option overrides for this step (e.g. a different effect).
	// @returns [Promise] Resolves when the animation completes (or immediately if no effect).
	show(count, overrides = {}) {
		const effect = overrides.effect !== undefined ? overrides.effect : this.#defaultEffect;
		let revealedElement = null;

		this.#elements.forEach((element, index) => {
			// Only assign a group name if the element doesn't already have an explicit one.
			// Preserving explicit names allows elements to participate in morph transitions
			// to other slides while still being managed by the build system.
			if (!element.style.viewTransitionName || element.style.viewTransitionName === 'none') {
				element.style.viewTransitionName = `${this.#prefix}-${index + 1}`;
			}

			if (index < count) {
				element.style.visibility = 'visible';
				element.style.viewTransitionClass = '';

				if (index === count - 1 && effect) {
					element.classList.add(`build-${effect}`);
					revealedElement = element;
				}
			} else {
				element.style.visibility = 'hidden';
				// Keep viewTransitionClass set so morph transitions can suppress
				// crossfading on hidden elements when called inside startViewTransition.
				element.style.viewTransitionClass = 'build-hidden';
			}
		});

		this.#step = count;

		if (revealedElement) {
			const animationClass = `build-${effect}`;
			return new Promise((resolve) => {
				revealedElement.addEventListener('animationend', () => {
					revealedElement.classList.remove(animationClass);
					resolve();
				}, {once: true});
			});
		}

		return Promise.resolve();
	}

	// Reveal the next element. Only touches the single newly revealed element —
	// all others are already in the correct state from the previous call.
	// @parameter overrides [Object] Option overrides for this step.
	// @returns [Promise]
	next(overrides = {}) {
		if (this.finished) return Promise.resolve();

		const effect = overrides.effect !== undefined ? overrides.effect : this.#defaultEffect;
		const element = this.#elements[this.#step];

		if (!element.style.viewTransitionName || element.style.viewTransitionName === 'none') {
			element.style.viewTransitionName = `${this.#prefix}-${this.#step + 1}`;
		}
		element.style.visibility = 'visible';
		element.style.viewTransitionClass = '';

		this.#step += 1;

		if (effect) {
			const animationClass = `build-${effect}`;
			element.classList.add(animationClass);
			return new Promise((resolve) => {
				element.addEventListener('animationend', () => {
					element.classList.remove(animationClass);
					resolve();
				}, {once: true});
			});
		}

		return Promise.resolve();
	}

	// Reveal all remaining elements in sequence, with `interval` milliseconds between each.
	// An optional callback is invoked after each reveal — if it returns false, playback stops.
	// Requires the builder to have been created via slide.find(...).builder() so that
	// the timeouts are tracked and cancelled on slide change.
	// @parameter interval [Number] Delay in milliseconds between each reveal.
	// @parameter callback [Function | null] Optional. Receives the builder after each next().
	//   Return false to stop playback early.
	play(interval, callback = null) {
		if (this.finished) return;

		const playNext = () => {
			this.next();
			const shouldContinue = callback ? callback(this) !== false : true;
			if (!this.finished && shouldContinue) {
				this.#slide.setTimeout(playNext, interval);
			}
		};

		this.#slide.setTimeout(playNext, interval);
	}

	// Returns true when all elements have been revealed.
	get finished() {
		return this.#step >= this.#elements.length;
	}
}

// Represents a collection of elements within a slide to be revealed sequentially.
// Has no side effects until show() is called.
export class SlideElements {
	#elements;
	#slide;

	constructor(slide, elements) {
		this.#slide = slide;
		this.#elements = elements;
	}

	// Create a stateful SlideBuilder for this element collection with default options.
	// @parameter options [Object] Default options applied to every show() / next() call.
	//   group: prefix for view-transition-name (default: "build")
	//   effect: "fade", "fly-up", "fly-down", "fly-left", "fly-right", "scale"
	// @returns [SlideBuilder]
	builder(options = {}) {
		return new SlideBuilder(this.#slide, this.#elements, options);
	}

	// Show the first `count` elements and hide the rest.
	// Delegates to SlideBuilder for the actual implementation.
	// @parameter count [Integer] Number of elements to show.
	// @parameter options [Object]
	//   group: prefix for view-transition-name (default: "build")
	//   effect: "fade", "fly-up", "fly-down", "fly-left", "fly-right", "scale"
	// @returns [Promise] Resolves when the animation completes (or immediately if no effect).
	show(count, options = {}) {
		return new SlideBuilder(this.#slide, this.#elements, options).show(count);
	}
}

// Scoped scripting context used both for chaining after() calls and as the
// argument passed to slide.loop() callbacks. Accumulates elapsed time across
// after() calls so each delay is relative to the previous step. Delegates
// find() and setTimeout() to the parent Slide so element queries are scoped
// correctly and all timeouts are cancelled automatically on slide change.
export class SlideContext {
	#slide;
	#elapsed;

	constructor(slide, elapsed = 0) {
		this.#slide = slide;
		this.#elapsed = elapsed;
	}

	// The slide body element.
	// Delegates to the parent Slide.
	// @returns [HTMLElement]
	get element() {
		return this.#slide.element;
	}

	// Find elements within the slide matching the given CSS selector.
	// Delegates to the parent Slide.
	// @parameter selector [String] A CSS selector scoped to the slide body.
	// @returns [SlideElements]
	find(selector) {
		return this.#slide.find(selector);
	}

	// Tracked setTimeout — delegates to the parent Slide so timeouts are
	// cancelled automatically when the slide changes.
	// @parameter callback [Function] The function to call after the delay.
	// @parameter delay [Number] Delay in milliseconds.
	// @returns [Number] The timeout ID.
	setTimeout(callback, delay) {
		return this.#slide.setTimeout(callback, delay);
	}

	// Schedule a callback relative to the previous step, accumulating elapsed time.
	// @parameter delay [Number] Delay in milliseconds after the previous step.
	// @parameter callback [Function] The function to call.
	// @returns [SlideContext]
	after(delay, callback) {
		this.#elapsed += delay;
		this.#slide.setTimeout(callback, this.#elapsed);
		return this;
	}

	// Total time accumulated across all after() calls.
	// Used by slide.loop() to know when to schedule the next iteration.
	// @returns [Number] Elapsed time in milliseconds.
	get elapsed() {
		return this.#elapsed;
	}
}

// The scripting context passed to each slide's javascript block.
// Scopes element queries to the slide body.
export class Slide {
	#element;
	#timeouts = [];

	constructor(element) {
		this.#element = element;
	}

	// The slide body element.
	// @returns [HTMLElement]
	get element() {
		return this.#element;
	}

	// Find elements within this slide matching the given CSS selector.
	// Use comma-separated selectors to combine multiple element types, e.g. "h2, li".
	// @parameter selector [String] A CSS selector scoped to the slide body.
	// @returns [SlideElements]
	find(selector) {
		const elements = Array.from(this.#element.querySelectorAll(selector));
		return new SlideElements(this, elements);
	}

	// Tracked setTimeout — use this in slide scripts instead of the global.
	// Registered timeouts are automatically cancelled when the slide changes.
	// @parameter callback [Function] The function to call after the delay.
	// @parameter delay [Number] Delay in milliseconds.
	// @returns [Number] The timeout ID.
	setTimeout(callback, delay) {
		const timeoutId = window.setTimeout(callback, delay);
		this.#timeouts.push(timeoutId);
		return timeoutId;
	}

	// Schedule a callback after a delay, returning a SlideContext so
	// subsequent .after(delay) calls are relative to the previous step.
	// All timeouts are tracked and cancelled automatically on slide change.
	// @parameter delay [Number] Delay in milliseconds from now.
	// @parameter callback [Function] The function to call after the delay.
	// @returns [SlideContext]
	after(delay, callback) {
		this.setTimeout(callback, delay);
		return new SlideContext(this, delay);
	}

	// Run a callback in a loop, repeating indefinitely until the slide changes.
	// The callback receives a SlideContext so it can use after() to schedule
	// steps within each iteration. The loop waits for all steps to complete
	// (ctx.elapsed) plus an optional extra delay before starting the next iteration.
	// @parameter callback [Function] Receives a fresh SlideContext as `context` each iteration.
	// @parameter delay [Number] Extra pause in milliseconds after the last step before restarting.
	loop(callback, { delay = 0 } = {}) {
		const iterate = () => {
			const context = new SlideContext(this);
			callback(context);
			this.setTimeout(iterate, context.elapsed + delay);
		};
		iterate();
	}

	// Cancel all pending timeouts registered by this slide's script.
	cancelTimeouts() {
		this.#timeouts.forEach(timeoutId => clearTimeout(timeoutId));
		this.#timeouts = [];
	}
}
