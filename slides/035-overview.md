---
duration: 20
transition: fade
speaker: Samuel
---

![[shared/features.md]]

<div class="callout">You are here →</div>

---

*Pause — let the callout land.*

And yes — this slide is itself a live example. The "You are here" badge just faded up on the display using exactly the same animation system we're about to look at.

That's the whole point of Presently: the tool eats its own cooking.

```javascript
slide.find("li").show(5)
slide.find(".callout").show(1, {effect: "fly-up"})
```
