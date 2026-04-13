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

Slides are plain text files. You write Markdown, add a little YAML at the top to set the template and timing, and that's your whole slide. No GUI, no proprietary format.

```javascript
slide.find("li").build(1, {group: "bullet"})
```
