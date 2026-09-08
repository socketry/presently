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
	#html;
	#transitionName;
	#viewTransition = null;
	#slides = [];
	#disposed = false;

	constructor(view, {html = null, transition = null} = {}) {
		this.#view = view;
		this.#html = html;
		this.#transitionName = transition;
	}

	// Initialize the slides already rendered within the view.
	// @returns [Promise(Boolean)] Whether the rendering was initialized.
	async initialize() {
		if (this.#disposed) return false;

		await prepareSlides();
		if (this.#disposed) return false;

		this.#view.querySelectorAll('.slide').forEach(slideElement => {
			const slide = runScript(slideElement);
			if (slide) this.#slides.push(slide);
		});

		return true;
	}

	// Update the view, initialize its slides, and emit the change event.
	// @parameter live [Live] The connected Live client.
	// @returns [Promise(Boolean)] Whether the rendering was completed.
	async render(live) {
		if (this.#disposed) return false;

		let initialized = false;
		const update = async () => {
			if (this.#disposed) return;

			live.update(this.#view.id, this.#html);
			initialized = await this.initialize();
		};

		if (this.#transitionName && document.startViewTransition) {
			document.documentElement.dataset.transition = this.#transitionName;
			let viewTransition = null;

			try {
				viewTransition = document.startViewTransition(update);
				this.#viewTransition = viewTransition;
				await viewTransition.finished;
			} finally {
				if (this.#viewTransition === viewTransition) {
					this.#viewTransition = null;
					delete document.documentElement.dataset.transition;
				}
			}
		} else {
			await update();
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

		this.#slides.forEach(slide => slide.dispose());
		this.#slides = [];
	}
}
