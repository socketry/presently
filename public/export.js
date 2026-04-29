import Syntax from '@socketry/syntax';
import {runAllSlideScripts} from '/slide-scripts.js';
import {applyCodeFocus} from '/code-focus.js';


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
	runAllSlideScripts({animated: false});

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
