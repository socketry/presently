---
duration: 60
marker: Build Demo
template: diagram
transition: fade
speaker: Samuel
---

# Title

Presently Architecture

# Body

<div class="arch" style="width: 100%; border: 2px solid #555; border-radius: 0.25em; padding: 0.6em; font-family: monospace; font-size: 0.85em;">
  <div style="display: grid; grid-template-columns: 1fr 1.5fr 1fr; gap: 0.5em;">
    <div class="pane display-pane" style="border: 2px solid #4a9eff; border-radius: 0.2em; padding: 0.35em; display: flex; flex-direction: column; gap: 0.25em;">
      <div style="font-weight: bold; margin-bottom: 0.125em;">Display</div>
      <div class="component display-render" style="border: 1px solid #666; border-radius: 0.125em; padding: 0.2em; text-align: center; flex: 1; display: flex; align-items: center; justify-content: center;">Slide Renderer</div>
      <div class="component display-ws" style="border: 1px solid #4a9eff; border-radius: 0.125em; padding: 0.2em; text-align: center; color: #4a9eff;">WebSocket</div>
    </div>
    <div class="pane server-pane" style="border: 2px solid #f90; border-radius: 0.2em; padding: 0.35em; display: flex; flex-direction: column; gap: 0.25em;">
      <div style="font-weight: bold; margin-bottom: 0.125em;">Server</div>
      <div class="component server-controller" style="border: 1px solid #666; border-radius: 0.125em; padding: 0.2em; text-align: center;">Presentation Controller</div>
      <div class="component server-presentation" style="border: 1px solid #666; border-radius: 0.125em; padding: 0.2em; text-align: center;">Presentation</div>
      <div class="component server-slides" style="border: 1px solid #666; border-radius: 0.125em; padding: 0.2em; text-align: center; flex: 1; display: flex; align-items: center; justify-content: center;">Markdown Slides</div>
    </div>
    <div class="pane presenter-pane" style="border: 2px solid #a78bfa; border-radius: 0.2em; padding: 0.35em; display: flex; flex-direction: column; gap: 0.25em;">
      <div style="font-weight: bold; margin-bottom: 0.125em;">Presenter</div>
      <div class="component presenter-notes" style="border: 1px solid #666; border-radius: 0.125em; padding: 0.2em; text-align: center; flex: 1; display: flex; align-items: center; justify-content: center;">Notes &amp; Timer</div>
      <div class="component presenter-ws" style="border: 1px solid #a78bfa; border-radius: 0.125em; padding: 0.2em; text-align: center; color: #a78bfa;">WebSocket</div>
    </div>
  </div>
</div>

---

An HTML grid layout with animated step-by-step reveals using `slide.after()`.

```javascript
const panes = slide.find(".pane").builder({effect: "fade"})
const components = slide.find(".component").builder({effect: "fly-up"})
panes.show(0)
components.show(0)
slide
  .after(400, () => panes.next())
  .after(400, () => components.next())
  .after(300, () => components.next())
  .after(400, () => panes.next())
  .after(300, () => components.next())
  .after(200, () => components.next())
  .after(200, () => components.next())
  .after(400, () => panes.next())
  .after(300, () => components.next())
  .after(300, () => components.next())
```
