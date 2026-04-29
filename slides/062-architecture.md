---
duration: 45
transition: morph
speaker: Samuel
---

<div class="arch-diagram">
  <!-- Server morphs to centre -->
  <div class="arch-box arch-server" style="top: 15%; left: 32%; width: 36%; view-transition-name: arch-server;">
    <div class="arch-box-title">Server</div>
    <div class="arch-component">Presentation Controller</div>
    <div class="arch-component">Presentation</div>
    <div class="arch-component">Markdown Files</div>
  </div>

  <!-- Display View morphs to the left -->
  <div class="arch-box arch-display" style="top: 15%; left: 4%; width: 26%; view-transition-name: arch-display;">
    <div class="arch-box-title">Display View</div>
    <div class="arch-component arch-ws">WebSocket</div>
    <div class="arch-component">Slide Renderer</div>
  </div>

  <!-- Display WebSocket arrow morphs -->
  <div class="arch-arrow" style="top: 30%; left: 31%; width: 10%; view-transition-name: arch-arrow-display;">
    ←WS→
  </div>

  <!-- Presenter View fades in on the right -->
  <div class="arch-box arch-presenter arch-reveal" style="top: 15%; right: 4%; width: 26%; view-transition-name: arch-presenter;">
    <div class="arch-box-title">Presenter View</div>
    <div class="arch-component arch-ws presenter-ws">WebSocket</div>
    <div class="arch-component">Notes &amp; Timer</div>
  </div>

  <!-- Presenter WebSocket arrow -->
  <div class="arch-arrow arch-reveal" style="top: 30%; right: 31%; width: 10%; view-transition-name: arch-arrow-presenter;">
    ←WS→
  </div>
</div>

---

And this is what you're looking at right now — the Presenter View. It connects to the same server over its own WebSocket. When you hit Next, the event goes up to the controller, which notifies every connected client simultaneously.

Both windows stay in sync with zero coordination code on the client side.

```javascript
const reveals = slide.find(".arch-reveal").builder({group: "reveal", effect: "fade"})
reveals.show(0)
slide
  .after(600, () => reveals.next())
  .after(400, () => reveals.next())
```
