---
template: default
duration: 30
marker: Morph + Build
transition: morph
speaker: Samuel
---

<div style="position: relative; width: 100%; height: 80%;">
  <div style="position: absolute; top: 20%; left: 25%; width: 50%; padding: 1.5rem;
              border: 2px solid #f90; border-radius: 8px; font-family: monospace;
              view-transition-name: server-box;">
    <div style="font-weight: bold; font-size: 1.1em; margin-bottom: 0.75rem;">Server</div>
    <div class="detail" style="border: 1px solid #666; border-radius: 4px; padding: 0.4rem; margin-bottom: 0.4rem; text-align: center;">Presentation Controller</div>
    <div class="detail" style="border: 1px solid #666; border-radius: 4px; padding: 0.4rem; text-align: center;">Markdown Slides</div>
  </div>
</div>

---

Start with the Server box centred and large. Details build in one by one.

```javascript
const details = slide.find(".detail").builder({group: "detail", effect: "fly-up"})
details.show(0)
slide
  .after(500, () => details.next())
  .after(400, () => details.next())
```
