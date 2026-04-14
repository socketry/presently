---
template: default
duration: 20
transition: morph
speaker: Samuel
---

- Real-time synchronization between display and presenter
- Markdown-based slides with YAML frontmatter
- Multiple templates for different slide layouts
- Presenter notes and timing information
- HTML5 animations for smooth transitions

<div class="callout" style="position: absolute; bottom: 3rem; right: 3rem; background: var(--accent); color: white; padding: 0.5rem 1rem; border-radius: 6px; font-size: 1rem; font-weight: 600;">You are here →</div>

---

And finally, transitions. These are handled with the View Transitions API and standard CSS — no JavaScript animation library required. Morph, fade, slide left and right are all built in, and you can add your own with a few lines of CSS.

*Open two browser windows side by side to demonstrate.*

```javascript
slide.find("li").show(5, {group: "bullet"})
slide.find(".callout").show(1, {effect: "fly-up"})
```
