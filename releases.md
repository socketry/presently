# Releases

## Unreleased

  - Add `bake presently:slides:speakers` task to print a timing breakdown grouped by speaker. Each speaker's slides are listed in presentation order with individual and total durations, making it easy to balance talk time in multi-speaker presentations. Slides without a `speaker` key are grouped under `(no speaker)`.

## v0.5.0

  - Add optional `speaker` front matter key to slides. When present, the current speaker's name is shown in the timing bar. If the next slide has a different speaker, a handoff indicator (e.g. `→ Next Speaker`) is shown alongside, giving presenters an at-a-glance cue for tag-team talks.

## v0.4.0

  - Add `bake presently:slides:notes` task to extract all presenter notes into a single Markdown document, with each slide's file path as a heading. Useful for reviewing or sharing speaker notes outside of the presentation.
  - Presenter notes are now kept as a Markdown AST internally and rendered to HTML on demand, so the notes you write are faithfully round-tripped rather than converted to HTML at parse time.

## v0.3.0

  - Add `diagram` template with a `position: relative` container — direct `<div>` children are `position: absolute` by default for free-form layouts.
  - All slide templates now have `position: relative` on the slide inner container, allowing absolutely positioned overlays in any template.
  - Add slide scripting: a fenced ` ```javascript ``` ` block at the end of presenter notes is extracted and executed in the browser after each slide renders. The script receives a `slide` object scoped to the slide body.
  - Add `Slide#find(selector)` — a pure CSS selector query returning a `SlideElements` collection with no side effects.
  - Add `SlideElements#build(n, options)` — shows the first `n` matched elements, hides the rest, and assigns `view-transition-name` for morph transition matching. Accepts `group` (name prefix) and `effect` (entry animation) options.
  - Add build effects via `view-transition-class`: `fade`, `fly-left`, `fly-right`, `fly-up`, `fly-down`, `scale`. Requires Chromium 125+; degrades gracefully to instant appear in other browsers.
  - Rename `magic-move` transition to `morph`.
  - Italic text in presenter notes is styled in amber to distinguish stage directions from spoken words.
  - Add transitions guide and animating slides guide to documentation.

## v0.2.0

  - Use Markly's native front matter parser (`Markly::FRONT_MATTER`) instead of manual string splitting, parsing each slide document once and extracting front matter directly from the AST.
  - Use the last `---` hrule in the AST as the presenter notes separator, so earlier `---` dividers in slide content are preserved correctly.
  - Add support for Mermaid diagrams in slides.

## v0.1.0

  - Initial release.
  - Slide files are Markdown with YAML front matter for metadata (`template`, `duration`, `title`, `skip`, `marker`, `transition`, `focus`).
  - Slide content is split into named sections by top-level headings, rendered to HTML via Markly.
  - Presenter notes are separated from slide content by a `---` divider.
  - Magic move transitions between slides.
  - Navigation control in the presenter view.
  - Code highlighting with line-range focus support.
  - Live state synchronisation between display and presenter views over WebSockets.
