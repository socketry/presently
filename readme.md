# Presently

A web-based presentation tool built with [Lively](https://github.com/socketry/lively). Write your slides in Markdown, present them in the browser, and control everything from a separate presenter display.

![Presenter Display](presenter.png)

[![Development Status](https://github.com/socketry/presently/workflows/Test/badge.svg)](https://github.com/socketry/presently/actions?workflow=Test)

## Features

  - **Markdown slides** with YAML frontmatter for metadata and template selection.
  - **Presenter display** with current slide, next slide preview, notes, and timing.
  - **Real-time sync** between display and presenter via WebSockets.
  - **Code highlighting** with [@socketry/syntax](https://github.com/socketry/syntax-js), including animated focus regions for code walkthroughs.
  - **Multiple templates** — title, section, two-column, code, translation, image, and default.
  - **Timing and pacing** — per-slide duration metadata with elapsed/remaining time and pacing indicators.
  - **Full-screen support** — press `F` on the display view.
  - **Keyboard navigation** — arrow keys, space, Page Up/Down.

## Usage

Please see the [project documentation](https://socketry.github.io/presently/) for more details.

  - [Getting Started](https://socketry.github.io/presently/guides/getting-started/index) - This guide explains how to use `presently` to create and deliver web-based presentations using Markdown slides.

  - [Animating Slides](https://socketry.github.io/presently/guides/animating-slides/index) - This guide explains how to animate content within slides using the `morph` transition and the slide scripting system.

## Releases

Please see the [project releases](https://socketry.github.io/presently/releases/index) for all releases.

### v0.5.0

  - Add optional `speaker` front matter key to slides. When present, the current speaker's name is shown in the timing bar. If the next slide has a different speaker, a handoff indicator (e.g. `→ Next Speaker`) is shown alongside, giving presenters an at-a-glance cue for tag-team talks.

### v0.4.0

  - Add `bake presently:slides:notes` task to extract all presenter notes into a single Markdown document, with each slide's file path as a heading. Useful for reviewing or sharing speaker notes outside of the presentation.
  - Presenter notes are now kept as a Markdown AST internally and rendered to HTML on demand, so the notes you write are faithfully round-tripped rather than converted to HTML at parse time.

### v0.3.0

  - Add `diagram` template with a `position: relative` container — direct `<div>` children are `position: absolute` by default for free-form layouts.
  - All slide templates now have `position: relative` on the slide inner container, allowing absolutely positioned overlays in any template.
  - Add slide scripting: a fenced ` ```javascript ``` ` block at the end of presenter notes is extracted and executed in the browser after each slide renders. The script receives a `slide` object scoped to the slide body.
  - Add `Slide#find(selector)` — a pure CSS selector query returning a `SlideElements` collection with no side effects.
  - Add `SlideElements#build(n, options)` — shows the first `n` matched elements, hides the rest, and assigns `view-transition-name` for morph transition matching. Accepts `group` (name prefix) and `effect` (entry animation) options.
  - Add build effects via `view-transition-class`: `fade`, `fly-left`, `fly-right`, `fly-up`, `fly-down`, `scale`. Requires Chromium 125+; degrades gracefully to instant appear in other browsers.
  - Rename `magic-move` transition to `morph`.
  - Italic text in presenter notes is styled in amber to distinguish stage directions from spoken words.
  - Add transitions guide and animating slides guide to documentation.

### v0.2.0

  - Use Markly's native front matter parser (`Markly::FRONT_MATTER`) instead of manual string splitting, parsing each slide document once and extracting front matter directly from the AST.
  - Use the last `---` hrule in the AST as the presenter notes separator, so earlier `---` dividers in slide content are preserved correctly.
  - Add support for Mermaid diagrams in slides.

### v0.1.0

  - Initial release.
  - Slide files are Markdown with YAML front matter for metadata (`template`, `duration`, `title`, `skip`, `marker`, `transition`, `focus`).
  - Slide content is split into named sections by top-level headings, rendered to HTML via Markly.
  - Presenter notes are separated from slide content by a `---` divider.
  - Magic move transitions between slides.
  - Navigation control in the presenter view.
  - Code highlighting with line-range focus support.
  - Live state synchronisation between display and presenter views over WebSockets.

## See Also

  - [lively](https://github.com/socketry/lively) — The real-time application framework that powers Presently.
  - [falcon](https://github.com/socketry/falcon) — The web server used to host presentations.
  - [syntax-js](https://github.com/socketry/syntax-js) — Syntax highlighting for code slides.
  - [markly](https://github.com/socketry/markly) — CommonMark parser used for slide content.

## Contributing

We welcome contributions to this project.

1.  Fork it.
2.  Create your feature branch (`git checkout -b my-new-feature`).
3.  Commit your changes (`git commit -am 'Add some feature'`).
4.  Push to the branch (`git push origin my-new-feature`).
5.  Create new Pull Request.

### Running Tests

To run the test suite:

``` shell
bundle exec sus
```

### Making Releases

To make a new release:

``` shell
bundle exec bake gem:release:patch # or minor or major
```

### Developer Certificate of Origin

In order to protect users of this project, we require all contributors to comply with the [Developer Certificate of Origin](https://developercertificate.org/). This ensures that all contributions are properly licensed and attributed.

### Community Guidelines

This project is best served by a collaborative and respectful environment. Treat each other professionally, respect differing viewpoints, and engage constructively. Harassment, discrimination, or harmful behavior is not tolerated. Communicate clearly, listen actively, and support one another. If any issues arise, please inform the project maintainers.
