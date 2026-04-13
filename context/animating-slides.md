# Animating Slides

This guide explains how to animate content within slides using the `morph` transition and the slide scripting system.

## How Morph Works

The `morph` transition uses the browser's View Transitions API. When navigating between two slides, any element that has a `view-transition-name` style on both the old and new slide is matched — the browser captures its position and appearance in both states and animates between them.

Elements without a matching name crossfade. The slide background stays completely still (no container animation).

This is the mechanism that makes build animations possible: the same element appears on consecutive slides with the same name, so it stays pinned in place while hidden elements appear around it.

## Slide Scripts

Any slide can include a JavaScript block at the end of its presenter notes section. The script runs in the browser immediately after the slide renders, inside the view transition callback, so DOM changes it makes are captured and animated.

``` markdown
---
template: default
duration: 30
transition: morph
---

- First point
- Second point
- Third point

---

Your presenter notes here.

```javascript
slide.find("li").build(1, {group: "bullet"})
```
```

The script receives a `slide` object — an instance of the `Slide` class from `slide.js` — scoped to the current slide's body.

If the script contains a syntax error or throws an exception, the error is logged to the browser console and the presentation continues unaffected.

## The Slide API

### `slide.find(selector)`

Queries elements within the slide body matching the given CSS selector. Returns a `SlideElements` collection. This is a pure query with no side effects.

``` javascript
slide.find("li")           // all list items
slide.find("h2, li")       // headings and list items in document order
slide.find(".callout")     // elements with a specific class
```

### `elements.build(n, options)`

Shows the first `n` elements in the collection and hides the rest. Assigns `view-transition-name` to each element so the morph transition can match them across consecutive slides.

``` javascript
slide.find("li").build(0)  // all hidden
slide.find("li").build(1)  // first visible, rest hidden
slide.find("li").build(3)  // first three visible, rest hidden
```

Options:

| Option | Description |
|---|---|
| `group` | Name prefix for `view-transition-name` — must be consistent across slides for morph to match elements. Defaults to `"build"`. |
| `effect` | Entry animation for the newly revealed element. See effects below. |

## Build Sequences

A build sequence is a series of consecutive slides with the same content, each revealing one more element. Because the slides are real files, each has its own duration and presenter notes — you can write exactly what to say when each element appears.

``` markdown
<!-- 030-overview.md -->
---
template: default
duration: 20
transition: morph
---

- Real-time synchronization
- Markdown-based slides
- Multiple templates

---

Let's walk through the key features.

```javascript
slide.find("li").build(0, {group: "bullet"})
```
```

``` markdown
<!-- 031-overview.md -->
---
template: default
duration: 20
transition: morph
---

- Real-time synchronization
- Markdown-based slides
- Multiple templates

---

The display and presenter stay in sync over a WebSocket connection.

```javascript
slide.find("li").build(1, {group: "bullet"})
```
```

The `group` option must be identical across all slides in the sequence so the browser matches the same elements. Without it, each slide uses the default `"build"` prefix — which is fine as long as only one build sequence is active per slide.

Because all elements are in the DOM from the start (just hidden), the vertical layout stays consistent throughout the sequence — there is no shift as elements appear.

## Build Effects

Pass an `effect` option to animate the newly revealed element as it appears. The effect only applies to the element transitioning from hidden to visible — already-visible elements morph normally and hidden elements are suppressed entirely.

``` javascript
slide.find("li").build(2, {group: "bullet", effect: "fly-up"})
```

Available effects:

| Effect | Animation |
|---|---|
| `fade` | Fades in |
| `fly-left` | Slides in from the left |
| `fly-right` | Slides in from the right |
| `fly-up` | Rises in from below |
| `fly-down` | Drops in from above |
| `scale` | Scales up from 80% |

Effects use `view-transition-class` and are implemented in CSS via `::view-transition-new(.build-*)` rules. They require Chromium 125 or later. In other browsers the element appears instantly — the presentation is unaffected.

## Multiple Build Groups

A slide can have multiple independent build groups. Each `find().build()` call is self-contained:

``` javascript
// Reveal list items as one group, callout div as another
slide.find("li").build(3, {group: "bullet"})
slide.find(".callout").build(1, {group: "callout", effect: "fly-up"})
```

The two groups track their own visibility independently. To interleave elements from different groups into a single sequence, use a comma-separated CSS selector:

``` javascript
slide.find("h2, li").build(4, {group: "item"})
```

Elements are collected in document order, so headings and list items are interleaved as they appear in the HTML.

## Absolutely Positioned Elements

All slide templates support absolutely positioned elements since the slide container is `position: relative`. You can overlay any element on top of normal slide content:

``` markdown
<div style="position: absolute; bottom: 2rem; right: 2rem; background: var(--accent); color: white; padding: 0.5rem 1rem; border-radius: 6px;">
  Callout text
</div>
```

In the `diagram` template, all direct `<div>` children are `position: absolute` by default, so you can build free-form layouts without repeating the positioning declaration:

``` markdown
---
template: diagram
---

<div style="left: 10%; top: 20%; width: 35%; height: 30%; background: var(--surface-light);">
  Node A
</div>

<div style="left: 55%; top: 20%; width: 35%; height: 30%; background: var(--surface-light);">
  Node B
</div>
```

Combine with the scripting system to animate diagram elements into place:

``` javascript
slide.find("div").build(2, {group: "node", effect: "fade"})
```

## Advanced Scripting

The script block is plain JavaScript with full browser API access. For anything beyond sequential reveals, write it directly:

``` javascript
// Reveal elements after a delay
setTimeout(() => {
    document.querySelector('.annotation').style.opacity = '1';
}, 800);

// Conditional logic
const step = 3;
slide.find("li").build(step, {group: "bullet"});

if (step >= 2) {
    document.querySelector('.note').style.visibility = 'visible';
}
```

The script runs inside `document.startViewTransition()`, so any synchronous DOM changes are captured and animated. Use `setTimeout` for effects that should happen after the transition settles.
