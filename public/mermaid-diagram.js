import mermaid from 'mermaid';

mermaid.initialize({
	startOnLoad: false,
	theme: 'dark',
	flowchart: {useMaxWidth: false},
});

let diagramId = 0;

export class MermaidDiagram extends HTMLElement {
	#shadow;
	#rendered = false;
	
	connectedCallback() {
		if (this.#rendered) return;
		
		this.#shadow = this.attachShadow({mode: 'open'});
		this.#render();
	}
	
	async #render() {
		const source = this.textContent.trim();
		if (!source) return;
		
		const id = `mermaid-${++diagramId}`;
		
		try {
			const {svg} = await mermaid.render(id, source);
			this.#shadow.innerHTML = `
				<style>
					svg {
						max-width: 100%;
						height: auto;
					}
				</style>
				${svg}
			`;
			
			this.#rendered = true;
			
			// Clear light DOM source text:
			this.textContent = '';
		} catch (error) {
			console.warn('Mermaid render failed:', error);
			this.#shadow.innerHTML = `<pre style="color: red;">${error.message}</pre>`;
		}
	}
}

if (!customElements.get('mermaid-diagram')) {
	customElements.define('mermaid-diagram', MermaidDiagram);
}
