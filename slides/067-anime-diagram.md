---
duration: 60
marker: Anime Diagram
template: diagram
transition: fade
speaker: Samuel
---

# Title

Coordinated animation with Anime.js

# Body

<div class="anime-flow" role="img" aria-label="An animated request travels from a browser through an edge server and worker to a data store, then a response returns to the browser.">
  <div class="anime-flow-network">
    <div class="anime-flow-lane" aria-hidden="true"></div>
    <div class="anime-flow-node browser-node">
      <span class="anime-flow-role">Client</span>
      <strong>Browser</strong>
    </div>
    <div class="anime-flow-node edge-node">
      <span class="anime-flow-role">Gateway</span>
      <strong>Edge</strong>
    </div>
    <div class="anime-flow-node worker-node">
      <span class="anime-flow-role">Application</span>
      <strong>Worker</strong>
    </div>
    <div class="anime-flow-node store-node">
      <span class="anime-flow-role">Storage</span>
      <strong>Database</strong>
    </div>
    <span class="anime-flow-packet request-packet" aria-hidden="true">GET</span>
    <span class="anime-flow-packet response-packet" aria-hidden="true">200</span>
  </div>
  <div class="anime-flow-events" aria-hidden="true">
    <span>Route request</span>
    <span>Load record</span>
    <span>Render response</span>
  </div>
</div>

---

`slide.anime()` scopes selectors and automatically cleans up the looping timeline when the slide changes.

```javascript
slide.anime(({createTimeline, stagger}) => {
  const timeline = createTimeline({
    autoplay: slide.animated,
    loop: slide.animated,
    loopDelay: 1400,
    defaults: {ease: "inOutQuad"},
  })
    .add(".anime-flow-node", {
      opacity: [0.35, 1],
      y: [10, 0],
      delay: stagger(120),
      duration: 500,
    }, 0)
    .add(".request-packet", {
      left: ["12.5%", "87.5%"],
      opacity: [0, 1, 1, 0],
      duration: 2400,
    }, 700)
    .add(".anime-flow-events span", {
      opacity: [0, 1],
      y: [8, 0],
      delay: stagger(220),
      duration: 450,
    }, 1600)
    .add(".response-packet", {
      left: ["87.5%", "12.5%"],
      opacity: [0, 1, 1, 0],
      duration: 1900,
    }, 3300)

  if (!slide.animated) timeline.seek(timeline.duration)
})
```
