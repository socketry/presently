---
duration: 15
transition: fade
speaker: Samuel
---

![[shared/features.md]]

---

The foundation is real-time sync — the display and presenter views both connect to the server over a WebSocket, so when you advance a slide, the audience sees it immediately. No refresh, no polling.

```javascript
slide.find("li").show(1)
```
