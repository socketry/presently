# Animated Diagrams

This guide explains how to design responsive, lifecycle-safe animated diagrams in Presently using semantic markup, slide-specific CSS, and Anime.js choreography.

## Why Animated Diagrams?

Animation is useful when a diagram describes change rather than merely structure. A carefully paced diagram can show causality, ordering, concurrency, or data movement without presenting every relationship simultaneously.

Use an animated diagram when you need:

- **A process unfolding over time:** Requests, protocols, state machines, and deployment workflows.
- **Attention control:** Introduce one relationship at a time while keeping the complete layout stable.
- **Coordinated motion:** Move packets, highlight participants, update counters, or trace paths together.

Prefer a static diagram when motion does not add meaning. Prefer Presently's build effects or `slide.after()` when elements only need to appear sequentially.

## Separate Structure, Appearance, and Choreography

A maintainable diagram has three layers:

1. The slide's Markdown file contains the complete semantic structure.
2. A matching sidecar stylesheet defines layout and visual language.
3. The slide script describes how the scene changes over time.

For `slides/040-request-flow.md`, place its styles in `slides/040-request-flow.css`. Presently scopes that stylesheet to the matching slide automatically.

Keeping the complete scene in the document makes the diagram understandable without animation, prevents layout shifts, and gives agentic tools clear boundaries for editing each concern.

## Choose the Right Rendering Medium

Presently does not require SVG. Choose the simplest medium that expresses the diagram:

| Medium | Best suited to |
|---|---|
| HTML with Grid or Flexbox | Cards, services, queues, labels, dashboards, and responsive process diagrams. |
| SVG with a `viewBox` | Edges, paths, graphs, precise coordinates, and shapes that must scale as one scene. |
| Canvas | Large numbers of particles or frequently redrawn objects where retained DOM elements become expensive. |
| Mixed HTML and SVG | Accessible HTML nodes over an SVG layer containing connectors and moving paths. |

Start with HTML and CSS. Introduce SVG when relationships or geometry require it, not merely because the result is called a diagram.

## Create a Scoped Anime.js Timeline

`slide.anime(callback)` creates an Anime.js scope rooted at the current slide body. The callback receives Anime.js's exports and the raw scope:

``` javascript
slide.anime(({createTimeline, stagger}, scope) => {
  const timeline = createTimeline({
    autoplay: slide.animated,
    loop: slide.animated,
    loopDelay: 1200,
  })
    .add(".diagram-node", {
      opacity: [0.35, 1],
      y: [12, 0],
      delay: stagger(100),
    })

  if (!slide.animated) timeline.seek(timeline.duration)
})
```

String selectors are resolved within the slide rather than the whole document. The same scope is returned from every call to `slide.anime()` and can be used for advanced Anime.js features:

``` javascript
const scope = slide.anime()
```

Presently calls `scope.revert()` when the slide is deactivated. This cancels its animations and restores properties modified through the scope. Additional resources such as audio, observers, and third-party controls should still use `slide.defer()` or `slide.signal`.

## Reuse a Diagram Across Slides

Shared Markdown can define both a diagram and its Anime.js timeline. Mark the reusable setup with a `javascript presently` fence so Presently removes it from the rendered diagram and executes it before the slide-specific script:

```` markdown
<div class="request-flow">
  <!-- Shared diagram structure. -->
</div>

```javascript presently
slide.anime(({createTimeline}, scope) => {
  scope.data.timeline = createTimeline({autoplay: false})
    .label("request")
    // Define the complete shared choreography.
})
```
````

Include that fragment in each slide:

``` markdown
![[shared/request-flow.md]]
```

The ordinary JavaScript block in the slide's presenter notes runs afterward and can select the state appropriate for that slide:

``` javascript
const timeline = slide.anime().data.timeline
timeline.seek("request")
timeline.play()
```

Every executable block has its own JavaScript lexical scope but receives the same `slide` object. Use the Anime scope's `data` or `methods` properties for intentional communication between shared setup and slide-specific control. All of those resources remain local to the rendered slide and are reverted together when it is deactivated.

## Design the Static Scene First

Build and style the final diagram before adding animation. Every node should have a stable position, and hidden elements should still reserve the space they require.

Use a descriptive accessible label for a primarily visual scene:

``` html
<div
  class="request-flow"
  role="img"
  aria-label="A request travels from the browser through the application to the database, then returns as a response."
>
  <!-- Complete diagram structure. -->
</div>
```

If individual controls are interactive, keep them accessible instead of hiding the entire subtree behind `role="img"`.

## Choreograph Meaning, Not Decoration

Organize the timeline into meaningful phases. Introduce the structure once, then repeat only the activity that represents ongoing work. The following example reveals a stable diagram before repeatedly sending a request and response through a traffic lane:

``` javascript
slide.anime(({createTimeline, stagger}) => {
  const traffic = createTimeline({
    autoplay: false,
    loop: true,
    loopDelay: 900,
    defaults: {ease: "inOutQuad"},
  })
    .add(".request", {
      left: ["0%", "100%"],
      opacity: [0, 1, 1, 0],
      duration: 2200,
    })
    .add(".response", {
      left: ["100%", "0%"],
      opacity: [0, 1, 1, 0],
      duration: 1800,
    }, "+=350")

  const intro = createTimeline({
    autoplay: slide.animated,
    onComplete: () => {
      if (slide.animated) traffic.restart()
    },
  })
    .add(".diagram-lane", {
      opacity: [0, 1],
      scaleX: [0.85, 1],
      duration: 450,
    })
    .add(".diagram-node", {
      opacity: [0.35, 1],
      y: [10, 0],
      delay: stagger(120),
      duration: 500,
    }, 150)
    .add(".event", {
      opacity: [0, 1],
      y: [8, 0],
      delay: stagger(180),
      duration: 450,
    }, 550)

  if (!slide.animated) intro.seek(intro.duration)
})
```

Place each moving element inside the lane which defines its path. This makes `0%` and `100%` meaningful endpoints and keeps traffic from obscuring node labels. Use separate lanes only when they communicate a meaningful distinction, such as concurrent channels or different routes.

Give moving elements a hidden initial state in the sidecar stylesheet, since the repeating timeline remains paused while the scene is introduced:

``` css
.request,
.response {
  opacity: 0;
}
```

Prefer transformations and opacity for continuous movement. Use CSS Grid, Flexbox, percentages, container query units, or an SVG `viewBox` to keep geometry responsive. Avoid repeatedly measuring layout inside animation callbacks.

## Establish a Consistent Visual Language

Use semantic classes and CSS custom properties so that meaning remains separate from a particular color or coordinate:

``` css
.diagram-node {
  --node-color: var(--accent);
  border: 0.08em solid var(--node-color);
  background: color-mix(in srgb, var(--node-color) 10%, var(--slide-bg));
}

.diagram-node[data-tone="storage"] {
  --node-color: #f90;
}

.diagram-node[data-state="active"] {
  box-shadow: 0 0 1em color-mix(in srgb, var(--node-color) 25%, transparent);
}
```

Useful conventions include:

- `data-tone` for stable semantic roles such as client, processing, storage, success, and failure.
- `data-state` for runtime states such as idle, active, pending, complete, and unavailable.
- CSS variables for colors, line widths, spacing, timing, and repeated dimensions.
- Short labels and restrained color usage so motion remains the primary cue.

These conventions help separate agents generate diagrams that still look and behave like parts of the same presentation.

## Static Export and Reduced Motion

`slide.animated` is false during static export and when the viewer prefers reduced motion. Do not autoplay or loop in that case. Seek to a frame which communicates the diagram's result:

``` javascript
const timeline = createTimeline({
  autoplay: slide.animated,
  loop: slide.animated,
})

// Add the complete choreography before selecting the static frame.

if (!slide.animated) timeline.seek(timeline.duration)
```

The final frame is not always the best summary. When necessary, add a timeline label and seek to that position instead.

## Common Pitfalls

- Do not create or remove the primary layout repeatedly during animation. Construct it once and animate its state.
- Do not select from `document` when a selector should be scoped to the current slide.
- Do not leave timelines, event listeners, media, or observers active after navigation.
- Do not rely on color alone to communicate state.
- Do not animate every available property. Motion should explain the system rather than compete with it.
- Do not assume animation will run during export or for every viewer.

## Instructions for Agentic Authoring

When asking an agent to create a diagram, provide the following constraints:

``` text
Create a Presently diagram slide that explains [process].

Keep semantic structure in the Markdown slide, appearance in the matching
sidecar CSS file, and choreography in the slide's JavaScript block. Construct
the complete scene before animating it. Use HTML/CSS unless SVG materially
simplifies connectors or geometry. Use slide.anime() for coordinated motion,
respect slide.animated, and choose a meaningful static export frame. Keep all
selectors scoped to the slide, use data-state/data-tone for semantic state,
include an accessible description, and ensure cleanup is owned by the slide.
Use motion only to clarify causality, ordering, concurrency, or data flow.
```

Ask the agent to verify the diagram at the audience display size and in the presenter preview. It should remain legible before the animation begins, at its busiest frame, and in its static exported state.
