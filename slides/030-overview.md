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

Presently has a few key features. Let's walk through them.

The foundation is real-time sync — the display and presenter views both connect to the server over a WebSocket, so when you advance a slide, the audience sees it immediately. No refresh, no polling.

```javascript
slide.find("li").build(0, {group: "bullet"})
```
