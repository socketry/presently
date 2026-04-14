---
template: default
duration: 60
marker: Build Demo
transition: fade
speaker: Samuel
---

<div class="arch" style="border: 2px solid #555; border-radius: 8px; padding: 1.25rem; font-family: monospace; font-size: 0.85em; height: 70vh;">
  <div style="color: #aaa; margin-bottom: 0.75rem; font-size: 0.9em;">Presently Architecture</div>
  <div style="display: grid; grid-template-columns: 1fr 1.5fr 1fr; gap: 1rem; height: calc(100% - 2rem);">
    <div class="pane display-pane" style="border: 2px solid #4a9eff; border-radius: 6px; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem;">
      <div style="font-weight: bold; margin-bottom: 0.25rem;">Display</div>
      <div class="component display-render" style="border: 1px solid #666; border-radius: 4px; padding: 0.4rem; text-align: center; flex: 1; display: flex; align-items: center; justify-content: center;">Slide Renderer</div>
      <div class="component display-ws" style="border: 1px solid #4a9eff; border-radius: 4px; padding: 0.4rem; text-align: center; color: #4a9eff;">WebSocket</div>
    </div>
    <div class="pane server-pane" style="border: 2px solid #f90; border-radius: 6px; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem;">
      <div style="font-weight: bold; margin-bottom: 0.25rem;">Server</div>
      <div class="component server-controller" style="border: 1px solid #666; border-radius: 4px; padding: 0.4rem; text-align: center;">Presentation Controller</div>
      <div class="component server-presentation" style="border: 1px solid #666; border-radius: 4px; padding: 0.4rem; text-align: center;">Presentation</div>
      <div class="component server-slides" style="border: 1px solid #666; border-radius: 4px; padding: 0.4rem; text-align: center; flex: 1; display: flex; align-items: center; justify-content: center;">Markdown Slides</div>
    </div>
    <div class="pane presenter-pane" style="border: 2px solid #a78bfa; border-radius: 6px; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem;">
      <div style="font-weight: bold; margin-bottom: 0.25rem;">Presenter</div>
      <div class="component presenter-notes" style="border: 1px solid #666; border-radius: 4px; padding: 0.4rem; text-align: center; flex: 1; display: flex; align-items: center; justify-content: center;">Notes &amp; Timer</div>
      <div class="component presenter-ws" style="border: 1px solid #a78bfa; border-radius: 4px; padding: 0.4rem; text-align: center; color: #a78bfa;">WebSocket</div>
    </div>
  </div>
</div>

---

An HTML grid layout with animated step-by-step reveals using `slide.after()`.

```javascript
slide.find(".pane").build(0, {group: "pane"})
slide.find(".component").build(0, {group: "component"})
slide
  .after(400, () => slide.find(".pane").build(1, {group: "pane", effect: "fade"}))
  .after(400, () => slide.find(".component").build(1, {group: "component", effect: "fly-up"}))
  .after(300, () => slide.find(".component").build(2, {group: "component", effect: "fly-up"}))
  .after(400, () => slide.find(".pane").build(2, {group: "pane", effect: "fade"}))
  .after(300, () => slide.find(".component").build(3, {group: "component", effect: "fly-up"}))
  .after(200, () => slide.find(".component").build(4, {group: "component", effect: "fly-up"}))
  .after(200, () => slide.find(".component").build(5, {group: "component", effect: "fly-up"}))
  .after(400, () => slide.find(".pane").build(3, {group: "pane", effect: "fade"}))
  .after(300, () => slide.find(".component").build(6, {group: "component", effect: "fly-up"}))
  .after(300, () => slide.find(".component").build(7, {group: "component", effect: "fly-up"}))
```
