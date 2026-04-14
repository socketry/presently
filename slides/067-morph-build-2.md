---
template: default
duration: 30
transition: morph
speaker: Samuel
---

<div style="position: relative; width: 100%; height: 80%;">
  <!-- Server morphs from centre to right -->
  <div style="position: absolute; top: 15%; right: 4%; width: 30%; padding: 1rem;
              border: 2px solid #f90; border-radius: 8px; font-family: monospace;
              view-transition-name: server-box;">
    <div style="font-weight: bold; margin-bottom: 0.5rem;">Server</div>
    <div style="border: 1px solid #666; border-radius: 4px; padding: 0.4rem; margin-bottom: 0.4rem; text-align: center; font-size: 0.85em;">Presentation Controller</div>
    <div style="border: 1px solid #666; border-radius: 4px; padding: 0.4rem; text-align: center; font-size: 0.85em;">Markdown Slides</div>
  </div>
  <!-- Display appears on the left -->
  <div class="pane" style="position: absolute; top: 15%; left: 4%; width: 30%; padding: 1rem;
              border: 2px solid #4a9eff; border-radius: 8px; font-family: monospace;
              view-transition-name: display-box;">
    <div style="font-weight: bold; margin-bottom: 0.5rem;">Display</div>
    <div class="display-detail" style="border: 1px solid #666; border-radius: 4px; padding: 0.4rem; margin-bottom: 0.4rem; text-align: center; font-size: 0.85em;">Slide Renderer</div>
    <div class="display-detail" style="border: 1px solid #4a9eff; border-radius: 4px; padding: 0.4rem; text-align: center; font-size: 0.85em; color: #4a9eff;">WebSocket</div>
  </div>
  <!-- Connection arrow -->
  <div class="pane" style="position: absolute; top: 38%; left: 35%; width: 30%; text-align: center;
              font-family: monospace; font-size: 0.9em; color: #888;
              view-transition-name: connection-label;">
    ←── WebSocket ──→
  </div>
</div>

---

Server morphs to the right. Display fades in on the left. Connection label appears.

```javascript
slide.find(".pane").build(0, {group: "pane"})
slide.find(".display-detail").build(0, {group: "display-detail"})

slide
  .after(400, () => slide.find(".pane").build(1, {group: "pane", effect: "fade"}))
  .after(400, () => slide.find(".display-detail").build(1, {group: "display-detail", effect: "fly-up"}))
  .after(300, () => slide.find(".display-detail").build(2, {group: "display-detail", effect: "fly-up"}))
  .after(400, () => slide.find(".pane").build(2, {group: "pane", effect: "fade"}))
```
