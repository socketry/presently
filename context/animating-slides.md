# Animating Slides

This guide explains how to animate content within slides using the `morph` transition and the slide scripting system.

## How Morph Works

The `morph` transition uses the browser's View Transitions API. When navigating between two slides, any element that has a `view-transition-name` style on both the old and new slide is matched — the browser captures its position and appearance in both states and animates between them.

Elements without a matching name crossfade. The slide background stays completely still (no container animation).

This is the mechanism that makes build sequences possible: the same element appears on consecutive slides with the same name, so it stays pinned in place while hidden elements appear around it.

## Slide Scripts

Any slide can include a JavaScript block at the end of its presenter notes section. The script runs in the browser immediately after the slide renders.

~~~ markdown
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
slide.find("li").show(1, {group: "bullet"})
```
~~~

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

### `elements.show(n, options)`

Shows the first `n` elements in the collection and hides the rest. Assigns `view-transition-name` to each element so the morph transition can match them across consecutive slides. Returns a `Promise` that resolves when any reveal animation completes.

``` javascript
slide.find("li").show(0)  // all hidden
slide.find("li").show(1)  // first visible, rest hidden
slide.find("li").show(3)  // first three visible, rest hidden
```

Options:

| Option | Description |
|---|---|
| `group` | Name prefix for `view-transition-name` — must be consistent across slides for morph to match elements. Defaults to `"build"`. |
| `effect` | Entry animation for the newly revealed element. See effects below. |

### `elements.builder(options)`

Creates a `SlideBuilder` with default options and a cached position. Use this instead of calling `show()` manually when you want to reveal elements one at a time from a script.

``` javascript
const bullets = slide.find("li").builder({group: "bullet", effect: "fly-up"})
bullets.show(0)       // hide all initially
bullets.next()        // reveal first, plays fly-up
bullets.next()        // reveal second, plays fly-up
bullets.finished      // true when all revealed
```

### `SlideBuilder#next(overrides)`

Reveals the next element using the builder's default effect. Only touches the single newly revealed element — O(1). Returns a `Promise`. Accepts optional overrides for this step.

### `SlideBuilder#show(n, overrides)`

Sets the builder to an arbitrary position. Useful for initialization and jumping. Iterates all elements for correctness.

### `SlideBuilder#play(interval, callback)`

Reveals all remaining elements in sequence, with `interval` milliseconds between each step. An optional callback is invoked after each `next()` — return `false` to stop playback early. Requires the builder to be created via `slide.find(...).builder()` so that timeouts are tracked and cancelled when the slide changes.

``` javascript
// Play all elements at 400ms intervals:
boxes.play(400)

// Stop early based on a condition:
boxes.play(400, () => !paused)

// Inspect the builder after each step:
boxes.play(400, (builder) => !builder.finished)
```

### `SlideBuilder#finished`

Returns `true` when all elements have been revealed.

## Build Sequences

A build sequence is a series of consecutive slides with the same content, each revealing one more element. Because the slides are real files, each has its own duration and presenter notes — you can write exactly what to say when each element appears.

~~~ markdown
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
slide.find("li").show(0, {group: "bullet"})
```
~~~

~~~ markdown
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
slide.find("li").show(1, {group: "bullet"})
```
~~~

The `group` option must be identical across all slides in the sequence so the browser matches the same elements. Without it, each slide uses the default `"build"` prefix — which is fine as long as only one build sequence is active per slide.

Because all elements are in the DOM from the start (just hidden), the vertical layout stays consistent throughout the sequence — there is no shift as elements appear.

## Build Effects

Pass an `effect` option to animate the newly revealed element as it appears. The effect plays as a CSS animation on the element and is removed automatically once it completes.

``` javascript
slide.find("li").show(2, {group: "bullet", effect: "fly-up"})
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

## Multiple Build Groups

A slide can have multiple independent build groups. Each `find().show()` call is self-contained:

``` javascript
// Reveal list items as one group, callout div as another
slide.find("li").show(3, {group: "bullet"})
slide.find(".callout").show(1, {group: "callout", effect: "fly-up"})
```

## In-Slide Animation with `slide.after()`

For sequential reveals within a single slide (without navigating to the next slide), use `slide.after()`. Each step fires a delay in milliseconds relative to the previous step.

``` javascript
const panes = slide.find(".pane").builder({group: "pane", effect: "fade"})
const items = slide.find(".item").builder({group: "item", effect: "fly-up"})
panes.show(0)
items.show(0)

slide
  .after(400, () => panes.next())
  .after(400, () => items.next())
  .after(300, () => items.next())
  .after(400, () => panes.next())
```

All timeouts registered via `slide.after()` (and the underlying `slide.setTimeout()`) are automatically cancelled when the user navigates to another slide, so stale callbacks never fire.

The global `setTimeout` in slide scripts is also automatically tracked — you can use it directly and it will be cancelled on slide change.

## Absolutely Positioned Elements

All slide templates support absolutely positioned elements since the slide container is `position: relative`. You can overlay any element on top of normal slide content:

~~~ markdown
<div style="position: absolute; bottom: 2rem; right: 2rem; background: var(--accent); color: white; padding: 0.5rem 1rem; border-radius: 6px;">
  Callout text
</div>
~~~

In the `diagram` template, all direct `<div>` children are `position: absolute` by default, so you can build free-form layouts without repeating the positioning declaration:

~~~ markdown
---
template: diagram
---

<div style="left: 10%; top: 20%; width: 35%; height: 30%; background: var(--surface-light);">
  Node A
</div>

<div style="left: 55%; top: 20%; width: 35%; height: 30%; background: var(--surface-light);">
  Node B
</div>
~~~

Combine with the scripting system to animate diagram elements into place:

``` javascript
const nodes = slide.find("div").builder({group: "node", effect: "fade"})
nodes.show(0)
slide
  .after(400, () => nodes.next())
  .after(400, () => nodes.next())
```
