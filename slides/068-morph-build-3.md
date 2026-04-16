---
duration: 30
transition: morph
speaker: Samuel
---

<div style="position: relative; width: 100%; height: 80%;">
  <!-- Server morphs smaller, moves up-right -->
  <div style="position: absolute; top: 8%; right: 4%; width: 26%; padding: 0.75rem;
              border: 2px solid #f90; border-radius: 8px; font-family: monospace; font-size: 0.8em;
              view-transition-name: server-box;">
    <div style="font-weight: bold; margin-bottom: 0.4rem;">Server</div>
    <div style="border: 1px solid #666; border-radius: 4px; padding: 0.3rem; margin-bottom: 0.3rem; text-align: center;">Presentation Controller</div>
    <div style="border: 1px solid #666; border-radius: 4px; padding: 0.3rem; text-align: center;">Markdown Slides</div>
  </div>
  <!-- Display morphs smaller, moves up-left -->
  <div style="position: absolute; top: 8%; left: 4%; width: 26%; padding: 0.75rem;
              border: 2px solid #4a9eff; border-radius: 8px; font-family: monospace; font-size: 0.8em;
              view-transition-name: display-box;">
    <div style="font-weight: bold; margin-bottom: 0.4rem;">Display</div>
    <div style="border: 1px solid #666; border-radius: 4px; padding: 0.3rem; margin-bottom: 0.3rem; text-align: center;">Slide Renderer</div>
    <div style="border: 1px solid #4a9eff; border-radius: 4px; padding: 0.3rem; text-align: center; color: #4a9eff;">WebSocket</div>
  </div>
  <!-- Connection label morphs to centre-top -->
  <div style="position: absolute; top: 20%; left: 31%; width: 38%; text-align: center;
              font-family: monospace; font-size: 0.8em; color: #888;
              view-transition-name: connection-label;">
    ←── WebSocket ──→
  </div>
  <!-- Presenter appears at bottom -->
  <div class="pane" style="position: absolute; bottom: 8%; left: 30%; width: 40%; padding: 1rem;
              border: 2px solid #a78bfa; border-radius: 8px; font-family: monospace;
              view-transition-name: presenter-box;">
    <div style="font-weight: bold; margin-bottom: 0.5rem;">Presenter</div>
    <div class="presenter-detail" style="border: 1px solid #666; border-radius: 4px; padding: 0.4rem; margin-bottom: 0.4rem; text-align: center; font-size: 0.85em;">Notes &amp; Timer</div>
    <div class="presenter-detail" style="border: 1px solid #a78bfa; border-radius: 4px; padding: 0.4rem; text-align: center; font-size: 0.85em; color: #a78bfa;">WebSocket</div>
  </div>
</div>

---

Display and Server morph smaller and move up. Presenter fades in at the bottom with details building in.

```javascript
const panes = slide.find(".pane").builder({group: "pane", effect: "fly-up"})
const presenterDetails = slide.find(".presenter-detail").builder({group: "presenter-detail", effect: "fly-up"})
panes.show(0)
presenterDetails.show(0)
slide
  .after(400, () => panes.next())
  .after(400, () => presenterDetails.next())
  .after(300, () => presenterDetails.next())
```
