---
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
const panes = slide.find(".pane").builder({group: "pane", effect: "fade"})
const displayDetails = slide.find(".display-detail").builder({group: "display-detail", effect: "fly-up"})
panes.show(0)
displayDetails.show(0)
slide
  .after(400, () => panes.next())
  .after(400, () => displayDetails.next())
  .after(300, () => displayDetails.next())
  .after(400, () => panes.next())
```
