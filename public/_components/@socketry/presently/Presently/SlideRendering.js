import Syntax from '@socketry/syntax';
import {applyCodeFocus} from './CodeFocus.js';
import {runScript} from './Scripts.js';

const SLIDE_CHANGE_EVENT = 'presently:slide:change';

async function prepareSlides() {
	await Syntax.highlight();
	await applyCodeFocus();
}

// Owns the scripts and view transition associated with one rendering of a slide view.
export class SlideRendering {
	#view;
	#transitionName;
	#viewTransition = null;
	#slides = [];
	#disposed = false;

	constructor(view, {transition = null, previous = null} = {}) {
		this.#view = view;
		this.#transitionName = transition;

		if (previous) {
			// Cancel stale rendering work immediately, but retain the visible slides
			// until the browser has captured the outgoing transition snapshot.
			this.#slides = previous.#slides;
			previous.#slides = [];
			previous.dispose();
		}
	}

	// Initialize the slides already rendered within the view.
	// @returns [Promise(Boolean)] Whether the rendering was initialized.
	async initialize() {
		if (this.#disposed) return false;

		// Establish script-controlled visibility before yielding to asynchronous
		// highlighting, so partially initialized slide content is never painted.
		this.#view.querySelectorAll('.slide').forEach(slideElement => {
			const slide = runScript(slideElement);
			if (slide) this.#slides.push(slide);
		});

		await prepareSlides();
		return !this.#disposed;
	}

	// Update the view, initialize its slides, and emit the change event.
	// The update must mutate the view synchronously so slide scripts can establish
	// their initial state before the browser can paint the updated DOM.
	// @parameter update [Function] Updates the view's DOM synchronously.
	// @returns [Promise(Boolean)] Whether the rendering was completed.
	async render(update) {
		if (this.#disposed) return false;

		let initialized = false;
		const render = async () => {
			if (this.#disposed) return;

			// View transitions invoke this callback after capturing the old state.
			// Revert outgoing animations before updating potentially reused DOM nodes.
			this.#disposeSlides();
			update(this.#view);
			initialized = await this.initialize();
		};

		if (this.#transitionName && document.startViewTransition && !document.hidden) {
			document.documentElement.dataset.transition = this.#transitionName;
			let viewTransition = null;

			try {
				viewTransition = document.startViewTransition(render);
				this.#viewTransition = viewTransition;

				// A hidden document may abort the visual transition, but the DOM update should still complete.
				viewTransition.ready.catch(() => {});
				const finished = viewTransition.finished.catch(() => {});
				await viewTransition.updateCallbackDone;
				await finished;
			} finally {
				if (this.#viewTransition === viewTransition) {
					this.#viewTransition = null;
					delete document.documentElement.dataset.transition;
				}
			}
		} else {
			await render();
		}

		if (initialized && !this.#disposed) {
			this.dispatchChange();
			return true;
		}

		return false;
	}

	// Emit the slide change event if this rendering is still active.
	dispatchChange() {
		if (this.#disposed) return;

		this.#view.dispatchEvent(new CustomEvent(SLIDE_CHANGE_EVENT, {bubbles: true}));
	}

	// Dispose all slide resources and skip any view transition still in progress.
	dispose() {
		if (this.#disposed) return;
		this.#disposed = true;

		if (this.#viewTransition) {
			try {
				this.#viewTransition.skipTransition();
			} catch (error) {
				console.error('Could not skip slide transition:', error);
			}

			this.#viewTransition = null;
			delete document.documentElement.dataset.transition;
		}

		this.#disposeSlides();
	}

	#disposeSlides() {
		this.#slides.forEach(slide => slide.dispose());
		this.#slides = [];
	}
}
