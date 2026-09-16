---
duration: 12
marker: Build Demo
template: diagram
transition: fade
speaker: Samuel
---

# Presently Architecture

<div class="arch">
  <div class="arch-grid">
    <div class="pane display-pane">
      <div class="pane-title">Display</div>
      <div class="component display-render">Slide Renderer</div>
      <div class="component display-ws">WebSocket</div>
    </div>
    <div class="pane server-pane">
      <div class="pane-title">Server</div>
      <div class="component server-controller">Presentation Controller</div>
      <div class="component server-presentation">Presentation</div>
      <div class="component server-slides">Markdown Slides</div>
    </div>
    <div class="pane presenter-pane">
      <div class="pane-title">Presenter</div>
      <div class="component presenter-notes">Notes &amp; Timer</div>
      <div class="component presenter-ws">WebSocket</div>
    </div>
  </div>
</div>

---

Presently has a client and server side component, communicating via a WebSocket. Animations, like this one, are revealed step by step using JavaScript.

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
