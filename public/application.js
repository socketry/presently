import { Live } from 'live';
import {SlideRendering} from '@socketry/presently';

import './recorder.js';

const SLIDE_RENDER_EVENT = 'presently:slide:render';

let live = null;

let activeRendering = null;

function activateRendering(view, detail = {}) {
	const rendering = new SlideRendering(view, detail);
	const previousRendering = activeRendering;
	activeRendering = rendering;
	previousRendering?.dispose();

	return rendering;
}

async function renderSlide(event) {
	const view = event.target.closest?.('live-view');
	if (!view) return;

	const rendering = activateRendering(view, event.detail);
	await rendering.render(live);
}

document.addEventListener(SLIDE_RENDER_EVENT, (event) => {
	renderSlide(event).catch(error => console.error('Could not render slide:', error));
});

// Begin initializing the server-rendered slide before connecting. If the server
// sends a newer render while this is in progress, its rendering takes precedence.
const initialView = document.querySelector('live-view');
const initialRendering = initialView ? activateRendering(initialView) : null;
const initialSlide = initialRendering?.initialize();
live = Live.start();

if (await initialSlide) initialRendering.dispatchChange();

// Jump-to select: forward the selected slide index to the presenter view.
document.addEventListener('change', (event) => {
	const select = event.target.closest('select.jump-to');
	if (!select) return;
	const liveId = select.dataset.liveId;
	if (!liveId) return;
	live.forwardEvent(liveId, event, {action: 'jump', index: parseInt(select.value)});
	select.value = '';
});

// Keyboard navigation
document.addEventListener('keydown', (event) => {
	if (event.target.closest('button, input, textarea, select, audio, presently-recorder')) return;
	
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
