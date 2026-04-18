---
duration: 60
marker: Loop Demo
transition: fade
speaker: Samuel
---

<div style="display: flex; flex-direction: column; align-items: center; gap: 1rem; font-family: monospace; font-size: 0.9em; width: 75%;">
  <div style="color: #aaa; font-size: 0.85em; margin-bottom: 0.5rem;">Request Lifecycle</div>
  <div class="step" style="width: 100%; display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; border-radius: 6px; border: 2px solid #4a9eff; background: rgba(74, 158, 255, 0.08);">
    <span style="color: #4a9eff; font-size: 1.2em;">①</span>
    <span>Client sends HTTP request</span>
  </div>
  <div class="step" style="width: 100%; display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; border-radius: 6px; border: 2px solid #f90; background: rgba(255, 153, 0, 0.08);">
    <span style="color: #f90; font-size: 1.2em;">②</span>
    <span>Server parses &amp; routes request</span>
  </div>
  <div class="step" style="width: 100%; display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; border-radius: 6px; border: 2px solid #f90; background: rgba(255, 153, 0, 0.08);">
    <span style="color: #f90; font-size: 1.2em;">③</span>
    <span>Presentation controller updates state</span>
  </div>
  <div class="step" style="width: 100%; display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; border-radius: 6px; border: 2px solid #a78bfa; background: rgba(167, 139, 250, 0.08);">
    <span style="color: #a78bfa; font-size: 1.2em;">④</span>
    <span>Listeners notified, slide rendered</span>
  </div>
  <div class="step" style="width: 100%; display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; border-radius: 6px; border: 2px solid #4a9eff; background: rgba(74, 158, 255, 0.08);">
    <span style="color: #4a9eff; font-size: 1.2em;">⑤</span>
    <span>Client receives update via WebSocket</span>
  </div>
</div>

---

A looping animation that replays the request lifecycle automatically using `slide.loop()`.

```javascript
const steps = slide.find(".step").builder({ effect: "fly-up" })
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
