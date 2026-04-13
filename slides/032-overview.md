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

---

There are several built-in layouts — title, statement, code, two-column, image, and the default bullet list you're looking at now. Each one is an XRB template, so they're easy to customise or add to.

```javascript
slide.find("li").build(2, {group: "bullet"})
```
