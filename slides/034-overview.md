---
duration: 20
transition: morph
speaker: Samuel
---

![[shared/features.md]]

---

And finally, transitions. These are handled with the View Transitions API and standard CSS — no JavaScript animation library required. Morph, fade, slide left and right are all built in, and you can add your own with a few lines of CSS.

*Open two browser windows side by side to demonstrate.*

```javascript
slide.find("li").show(4, {group: "bullet"})
```
