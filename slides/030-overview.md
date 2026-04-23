---
duration: 20
transition: morph
speaker: Samuel
---

![[shared/features.md]]

---

Presently has a few key features. Let's walk through them.

The foundation is real-time sync — the display and presenter views both connect to the server over a WebSocket, so when you advance a slide, the audience sees it immediately. No refresh, no polling.

```javascript
slide.find("li").show(0, {group: "bullet"})
```
