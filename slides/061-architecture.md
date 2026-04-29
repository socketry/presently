---
duration: 45
transition: morph
speaker: Samuel
---

<div class="arch-diagram">
  <!-- Server morphs to the right -->
  <div class="arch-box arch-server" style="top: 15%; right: 4%; width: 36%; view-transition-name: arch-server;">
    <div class="arch-box-title">Server</div>
    <div class="arch-component">Presentation Controller</div>
    <div class="arch-component">Presentation</div>
    <div class="arch-component">Markdown Files</div>
  </div>

  <!-- Display View fades in on the left -->
  <div class="arch-box arch-display arch-reveal" style="top: 15%; left: 4%; width: 36%; view-transition-name: arch-display;">
    <div class="arch-box-title">Display View</div>
    <div class="arch-component arch-ws display-ws">WebSocket</div>
    <div class="arch-component display-render">Slide Renderer</div>
  </div>

  <!-- WebSocket arrow -->
  <div class="arch-arrow arch-reveal" style="top: 30%; left: 41%; width: 18%; view-transition-name: arch-arrow-display;">
    ←── WS ──→
  </div>
</div>

---

The Display View runs in the browser. It connects back to the server over a WebSocket, and the server pushes the current slide HTML down to it whenever something changes.

There's no polling, no page reload — the display updates in under a millisecond.

```javascript
const reveals = slide.find(".arch-reveal").builder({group: "reveal", effect: "fade"})
reveals.show(0)
slide
  .after(600, () => reveals.next())
  .after(400, () => reveals.next())
```
