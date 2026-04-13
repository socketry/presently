---
template: default
duration: 20
transition: morph
---

- Real-time synchronization between display and presenter
- Markdown-based slides with YAML frontmatter
- Multiple templates for different slide layouts
- Presenter notes and timing information
- HTML5 animations for smooth transitions

---

And finally, transitions. These are handled with the View Transitions API and standard CSS — no JavaScript animation library required. Morph, fade, slide left and right are all built in, and you can add your own with a few lines of CSS.

*Open two browser windows side by side to demonstrate.*

```javascript
slide.find("li").build(4, {group: "bullet"})
```
