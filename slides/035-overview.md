---
duration: 20
transition: morph
speaker: Samuel
---

![[shared/features.md]]

<div class="callout" style="position: absolute; bottom: 3rem; right: 3rem; background: var(--accent); color: white; padding: 0.5rem 1rem; border-radius: 6px; font-size: 1rem; font-weight: 600;">You are here →</div>

---

*Pause — let the callout land.*

And yes — this slide is itself a live example. The "You are here" badge just faded up on the display using exactly the same animation system we're about to look at.

That's the whole point of Presently: the tool eats its own cooking.

```javascript
slide.find("li").show(5, {group: "bullet"})
slide.find(".callout").show(1, {effect: "fly-up"})
```
