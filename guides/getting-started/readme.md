# Getting Started

This guide explains how to use `presently` to create and deliver web-based presentations using Markdown slides.

## Installation

Add the gem to your project:

``` bash
$ gem install presently
```

## Core Concepts

Presently has several core concepts:

- A {ruby Presently::Presentation} which loads and manages slide content from Markdown files.
- A {ruby Presently::PresentationController} which manages the mutable state of a presentation: current slide, clock, and listeners.
- A {ruby Presently::Slide} which represents a single slide parsed from a Markdown file with YAML frontmatter.
- A {ruby Presently::DisplayView} which renders the audience-facing full-screen display.
- A {ruby Presently::PresenterView} which renders the presenter console with notes, timing, and slide previews.

## Creating Your First Presentation

Create a new directory for your presentation:

``` bash
$ mkdir my-talk
$ cd my-talk
$ mkdir slides
```

### Writing Slides

Each slide is a Markdown file in the `slides/` directory. Files are ordered by path, and every directory and slide filename must begin with a numeric prefix:

``` text
slides/
├── 010-welcome.md
├── 020-performance/
│   ├── 010-introduction.md
│   └── 020-results.md
└── 030-conclusion.md
```

This allows related slides to be grouped in nested directories while retaining an unambiguous presentation order. Markdown files with any unnumbered path component, such as `slides/shared/example.md`, are not treated as slides and can be used for included content.

The `presently:slides:renumber` task only renumbers files directly inside the selected directory. Run it without arguments for the top-level slides, or pass a nested directory explicitly:

``` shell
$ bake presently:slides:renumber
$ bake presently:slides:renumber slides_root=slides/020-performance
```

A slide file contains Markdown with optional frontmatter and presenter notes:

``` markdown
---
template: title
duration: 30
---

# Welcome to My Talk

A presentation built with Presently

---

These are presenter notes — only visible in the presenter view.
```

Each slide has three parts:

1. **YAML frontmatter** between `---` markers at the top, specifying the template, duration, and other metadata.
2. **Content** with an optional H1 title and any template placeholders written as H2 sections.
3. **Presenter notes** after a `---` separator in the body (optional).

### Styling Slides

CSS can be colocated with the slides it styles:

``` text
slides/
├── style.css
├── 010-introduction.md
└── 020-scheduling/
    ├── style.css
    ├── 010-overview.md
    ├── 020-queue.md
    └── 020-queue.css
```

`slides/style.css` applies globally. A nested `style.css` applies to every slide below that directory, while a CSS file matching a Markdown filename applies only to that slide. In the example above, `020-scheduling/style.css` applies to both scheduling slides and `020-queue.css` applies only to `020-queue.md`.

Presently automatically wraps nested and slide-specific stylesheets in an [`@scope`](https://developer.mozilla.org/en-US/docs/Web/CSS/@scope) rule rooted at the rendered slide. Write these files as scoped CSS fragments containing ordinary style rules and nestable grouping rules such as `@media`, `@supports`, `@container`, and `@layer`. Keep stylesheet-level rules such as `@charset`, `@import`, and `@namespace`, and globally named definitions such as `@font-face`, `@keyframes`, and `@property`, in the root `slides/style.css` or the existing `public/_static/custom.css`.

Relative images and fonts remain adjacent to the stylesheet that uses them:

``` css
.architecture {
	background-image: url("architecture.svg");
}
```

Presently uses `protocol-media-registry` to determine asset content types. Files with unrecognized media types are not served.

Relative images embedded in Markdown resolve from the Markdown file's directory, including images in included Markdown files:

``` markdown
![Architecture](architecture.svg)
```

Presently loads each discovered stylesheet once in deterministic presentation order. Directory styles are loaded from parent to child before the matching slide sidecar, so more specific styles naturally appear later in the cascade. The same stylesheets are used by the display, presenter, recorder, playback, and export interfaces.

### Running the Presentation

Start the server from your presentation directory:

``` bash
$ presently
```

Open the launcher, or go directly to one of the presentation interfaces:

- `http://localhost:9292/` — the interface launcher.
- `http://localhost:9292/display` — the audience display.
- `http://localhost:9292/presenter` — the presenter console.
- `http://localhost:9292/record` — the slide narration recorder.
- `http://localhost:9292/playback` — automatic playback with recorded narration.

Advancing slides in either window updates both in real-time via WebSockets.

### Recording Slide Narration

The recording interface is separate from the presenter console because narration is an authoring workflow: each slide can be recorded, reviewed, retaken, and explicitly saved without changing the live presentation controls.

Presently records WebM/Opus audio using the browser microphone, preserving its dynamics for offline normalization. A short delayed audio pipeline excludes approximately 100 milliseconds around the mouse clicks at the beginning and end. Saved recording paths mirror their slide paths under the presentation's `audio/` directory:

``` text
slides/020-problem/010-overview.md
audio/020-problem/010-overview.webm
```

To record narration:

1. Open `http://localhost:9292/record` in a browser with WebM/Opus `MediaRecorder` support.
2. Select the slide and press **Record**.
3. Press **Stop**, then review the recording with the audio player.
4. Press **Save** to replace that slide's existing narration.

Navigating away before saving discards the retake and preserves the previously saved recording.

To normalize completed takes to a consistent `-16 LUFS` target, install FFmpeg and run:

``` shell
bundle exec bake presently:recordings:normalize
```

Originals remain under `audio/`; normalized WebM/Opus copies are written under `audio-normalized/` using the same relative paths. The task skips outputs that are newer than their source, so it can be rerun after recording additional slides.

### Playing Recorded Narration

Open `http://localhost:9292/playback` after every slide has a recording. Press **Start presentation** and Presently will play each narration track, run the slide's script, preserve its transition, and advance when the narration ends. Normalized recordings are preferred, with the corresponding original recording used as a fallback.

For browser automation or video capture, open:

``` text
http://localhost:9292/playback?autoplay=true&controls=false
```

The playback page sets `window.__PRESENTLY_PLAYBACK_READY` after its slides, fonts, syntax highlighting, and audio metadata are loaded. It sets `window.__PRESENTLY_PLAYBACK_FINISHED` when the final narration ends. It also dispatches `presently:playback-ready` and `presently:playback-finished` events for event-driven integrations.

To export the narrated presentation directly to MP4, use a Chromium and matching ChromeDriver build that supports the experimental `Page.startScreenRecording` DevTools command:

``` shell
PRESENTLY_CHROME_PATH=/path/to/chromium \
PRESENTLY_CHROMEDRIVER_PATH=/path/to/chromedriver \
bundle exec bake presently:export:video output=presentation.mp4
```

The defaults are 1920×1080 at up to 30 frames per second. The exporter starts an isolated Presently server, waits for playback to become ready, records until the final narration ends, and writes Chromium's MP4 stream to the selected output path.

### Keyboard Controls

- **Arrow Right / Space / Page Down** — next slide.
- **Arrow Left / Page Up** — previous slide.
- **F** — toggle full-screen (display view).

## Templates

Templates define the visual layout of each slide. Select one with the `template` field in the frontmatter; slides without it use `default`. Common choices include `title` for an opening slide, `two_column` for comparisons, and `code` for code walkthroughs.

See the [Templates guide](../templates/index) for built-in layouts, examples, translations, and custom templates.

## Transitions

Slides transition instantly by default. Add a `transition` key to the frontmatter to animate between slides:

``` markdown
---
template: default
transition: fade
---
```

Available transitions:

| Transition | Effect |
|---|---|
| `fade` | Crossfade between slides |
| `slide-left` | Current slide exits left, next enters from right |
| `slide-right` | Current slide exits right, next enters from left |

## Presenter Notes

Presenter notes appear after a `---` separator in the slide body. They support standard Markdown including **bold** and *italic*. Italic text is styled as a stage direction — use it for cues that shouldn't be spoken aloud:

``` markdown
---

*Take a breath and wait for the room to settle.*

Hi everyone, thanks for being here.

*Make eye contact with the front row.*
```

## Presenter Console

The presenter view at `/presenter` provides:

- **Current and next slide previews** — see what's coming without switching windows.
- **Presenter notes** — notes from the slide's `---` separator section.
- **Timer controls** — Start, Pause, Resume, and Reset buttons.
- **Pacing indicator** — shows whether you're on time, ahead, or behind based on per-slide `duration` metadata.
- **Progress bar** — visual indicator of time consumed for the current slide.
- **Reload button** — reload slides from disk without restarting the server.

### Starting the Timer from a Title Slide

A title slide can stay on screen while the audience settles. Add `timer: start` to its frontmatter to start the presentation timer when you advance to the next slide:

``` markdown
---
template: title
duration: 0
timer: start
---

# My Presentation

We'll begin shortly.
```

The timer stays stopped while the title is displayed. Advancing from it in `/presenter` or `/display` starts the timer before showing the next slide. Setting `duration: 0` excludes the waiting slide from the expected presentation duration and pacing calculations. The `title` template itself does not control the timer.

Durations are read as floating-point seconds, including numeric strings. Negative, invalid, or non-finite values are treated as `0.0`. An unspecified or null duration defaults to `0.0` seconds, meaning no time has been allocated to that slide. Set explicit durations, or apply recorded narration durations, to establish a pacing schedule. When the total allocated duration is zero, the presenter shows elapsed time without pacing indicators, a progress bar, or a remaining-time estimate.

The `timer` field supports these actions:

| Value | Effect when advancing from this slide |
|---|---|
| `start` | Starts the timer only if it has never started. Revisiting the slide does not reset elapsed time or resume a manually paused timer. |
| `pause` | Pauses the timer, preserving elapsed time. Has no effect before the timer starts. |
| `resume` | Resumes a started timer, preserving elapsed time. Has no effect before the timer starts or while it is already running. |

For a break, put `timer: pause` on the slide immediately before the break slide, and `timer: resume` on the break slide itself. Give the break slide `duration: 0` to exclude the break from pacing calculations. Advancing into the break pauses timing; advancing out resumes it.

Timer actions run only when **Next** successfully moves to another slide. Going backwards, jumping directly to a slide, reloading, reconnecting, and restoring saved state do not trigger them. Neither does navigation in `/record`, or recorded playback. Slides without a recognized timer action leave the timer unchanged; the manual timer controls remain available.

## Customizing the Application

For advanced customization, create an `application.rb` and run with `presently application.rb`:

``` ruby
#!/usr/bin/env presently

class Application < Presently::Application
  def title
    "My Conference Talk"
  end
end
```
