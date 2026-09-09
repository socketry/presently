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

<div class="anime-flow" role="img" aria-label="A next-slide event travels from Live.js through Live and Lively to Presently, then a rendered slide update returns to Live.js.">
  <div class="anime-flow-network">
    <div class="anime-flow-nodes">
      <div class="anime-flow-node live-js-node">
        <span class="anime-flow-role">Client</span>
        <strong>Live.js</strong>
      </div>
      <div class="anime-flow-node live-node">
        <span class="anime-flow-role">Views</span>
        <strong>Live</strong>
      </div>
      <div class="anime-flow-node lively-node">
        <span class="anime-flow-role">Application</span>
        <strong>Lively</strong>
      </div>
      <div class="anime-flow-node presently-node">
        <span class="anime-flow-role">Presentation</span>
        <strong>Presently</strong>
      </div>
    </div>
    <div class="anime-flow-lane" aria-hidden="true">
      <span class="anime-flow-lane-label">Live WebSocket</span>
      <span class="anime-flow-packet event-packet">NEXT</span>
      <span class="anime-flow-packet render-packet">RENDER</span>
    </div>
  </div>
  <div class="anime-flow-events" aria-hidden="true">
    <span>Dispatch input</span>
    <span>Advance shared state</span>
    <span>Render slide</span>
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
    .add(".event-packet", {
      left: ["0%", "100%"],
      opacity: [0, 1, 1, 0],
      duration: 2200,
    })
    .add(".render-packet", {
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
