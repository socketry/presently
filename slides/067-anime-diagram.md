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
    <div class="anime-flow-nodes">
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
    </div>
    <div class="anime-flow-lane" aria-hidden="true">
      <span class="anime-flow-lane-label">Request / response</span>
      <span class="anime-flow-packet request-packet">GET</span>
      <span class="anime-flow-packet response-packet">200</span>
    </div>
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
  const traffic = createTimeline({
    autoplay: false,
    loop: true,
    loopDelay: 900,
    defaults: {ease: "inOutQuad"},
  })
    .add(".request-packet", {
      left: ["0%", "100%"],
      opacity: [0, 1, 1, 0],
      duration: 2200,
    })
    .add(".response-packet", {
      left: ["100%", "0%"],
      opacity: [0, 1, 1, 0],
      duration: 1800,
    }, "+=350")

  const intro = createTimeline({
    autoplay: slide.animated,
    defaults: {ease: "outQuad"},
    onComplete: () => {
      if (slide.animated) traffic.restart()
    },
  })
    .add(".anime-flow-lane", {
      opacity: [0, 1],
      scaleX: [0.85, 1],
      delay: stagger(100),
      duration: 450,
    })
    .add(".anime-flow-node", {
      opacity: [0.35, 1],
      y: [10, 0],
      delay: stagger(120),
      duration: 500,
    }, 150)
    .add(".anime-flow-events span", {
      opacity: [0, 1],
      y: [8, 0],
      delay: stagger(180),
      duration: 450,
    }, 550)

  if (!slide.animated) intro.seek(intro.duration)
})
```
