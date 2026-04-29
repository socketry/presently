---
duration: 45
marker: Architecture
transition: fade
speaker: Samuel
---

<div class="arch-diagram">
  <div class="arch-box arch-server" style="top: 10%; left: 15%; width: 70%; view-transition-name: arch-server;">
    <div class="arch-box-title">Server</div>
    <div class="arch-component server-ctrl">Presentation Controller</div>
    <div class="arch-component server-pres">Presentation</div>
    <div class="arch-component server-slides">Markdown Files</div>
  </div>
</div>

---

At the heart of Presently is the server. It runs a single Presentation Controller that owns all the state — which slide is current, the clock, everything.

Below it sits the Presentation object, which holds the ordered list of Markdown slides loaded from disk.

```javascript
const details = slide.find(".arch-component").builder({group: "detail", effect: "fly-up"})
details.show(0)
slide
  .after(500, () => details.next())
  .after(400, () => details.next())
  .after(400, () => details.next())
```
