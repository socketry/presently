---
duration: 60
marker: Loop Demo
template: diagram
transition: fade
speaker: Samuel
---

# Title

Slide change lifecycle

# Body

<div class="request-lifecycle">
  <div class="request-lifecycle-steps">
    <div class="step request-lifecycle-step client-step">
      <span class="request-lifecycle-number">1</span>
      <span class="request-lifecycle-role">Presenter</span>
      <strong>Navigation input</strong>
      <span class="request-lifecycle-detail">Keyboard or controls</span>
    </div>
    <div class="step request-lifecycle-step client-step">
      <span class="request-lifecycle-number">2</span>
      <span class="request-lifecycle-role">Live.js</span>
      <strong>Forward event</strong>
      <span class="request-lifecycle-detail">Sent over WebSocket</span>
    </div>
    <div class="step request-lifecycle-step server-step">
      <span class="request-lifecycle-number">3</span>
      <span class="request-lifecycle-role">PresenterView</span>
      <strong>Handle action</strong>
      <span class="request-lifecycle-detail">Advance or retreat</span>
    </div>
    <div class="step request-lifecycle-step state-step">
      <span class="request-lifecycle-number">4</span>
      <span class="request-lifecycle-role">Controller</span>
      <strong>Update state</strong>
      <span class="request-lifecycle-detail">Notify every view</span>
    </div>
    <div class="step request-lifecycle-step client-step">
      <span class="request-lifecycle-number">5</span>
      <span class="request-lifecycle-role">Live views</span>
      <strong>Render clients</strong>
      <span class="request-lifecycle-detail">Patch each display</span>
    </div>
  </div>
</div>

---

A looping animation that replays the request lifecycle automatically using `slide.loop()`.

```javascript
const steps = slide.find(".step").builder({effect: "fly-up"})
steps.show(0)

slide.loop((context) => {
  steps.show(0)
  context
    .after(1800, () => steps.next())
    .after(1500, () => steps.next())
    .after(1500, () => steps.next())
    .after(1800, () => steps.next())
    .after(1800, () => steps.next())
}, { delay: 4500 })
```
