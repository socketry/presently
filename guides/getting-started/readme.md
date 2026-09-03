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

# Title

Welcome to My Talk

# Subtitle

A presentation built with Presently

---

These are presenter notes — only visible in the presenter view.
```

Each slide has three parts:

1. **YAML frontmatter** between `---` markers at the top, specifying the template, duration, and other metadata.
2. **Content** with Markdown headings that become named sections for the template.
3. **Presenter notes** after a `---` separator in the body (optional).

### Running the Presentation

Start the server from your presentation directory:

``` bash
$ presently
```

Then open two browser windows:

- `http://localhost:9292/` — the audience display.
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

Templates define the visual layout of each slide. Select a template using the `template` field in the frontmatter.

### Default

A general-purpose content slide. All content without a heading goes into the `body` section.

``` markdown
---
template: default
duration: 60
---

- First point
- Second point
- Third point
```

### Title

A large title with a subtitle, centered on the slide.

``` markdown
---
template: title
duration: 30
---

# Title

My Presentation Title

# Subtitle

A subtitle or tagline
```

### Section

A section divider slide with a large heading and accent background.

``` markdown
---
template: section
duration: 15
---

# Heading

Part Two
```

### Two Column

A side-by-side layout with `left` and `right` sections.

``` markdown
---
template: two_column
duration: 90
---

# Left

**Server Side**

- Ruby + Lively
- WebSocket connections

# Right

**Client Side**

- Live DOM updates
- CSS animations
```

### Code

A syntax-highlighted code slide with optional focus regions for code walkthroughs. Use the `focus` frontmatter to specify which lines to highlight (1-based). Lines outside the focus range are dimmed, and the code scrolls to center the focused region.

``` markdown
---
template: code
duration: 60
focus: 2-8
title: Constructor
---

```ruby
class Presentation
  def initialize
    @slides = []
    @current_index = 0
  end

  def advance!
    @current_index += 1
  end
end
​```
```

Create animated walkthroughs by using multiple slides with the same code but different `focus` ranges. The transition between them smoothly scrolls and shifts the dim overlays.

### Statement

A prominent statement or quote, centered on the slide. Supports an optional `# Translation` section.

``` markdown
---
template: statement
duration: 30
---

The best way to predict the future is to create it.

# Translation

未来を予測する最善の方法は、それを創ることである。
```

### Translations

All templates support an optional `# Translation` section. When present, the translation is displayed below the main content in a lighter style. This works with `title`, `section`, `statement`, and `image` templates.

### Image

A centered image with an optional caption.

``` markdown
---
template: image
duration: 30
---

![Architecture diagram](/images/architecture.png)

# Caption

System architecture overview
```

### Diagram

A free-form layout slide with a `position: relative` container. Direct `<div>` children are `position: absolute` by default, so you can place elements precisely using inline styles. Use this for custom diagrams, annotated layouts, or any slide that doesn't fit a standard template.

``` markdown
---
template: diagram
duration: 60
---

<div style="left: 10%; top: 20%; width: 35%; height: 25%;">
  Browser
</div>

<div style="left: 55%; top: 20%; width: 35%; height: 25%;">
  Server
</div>
```

All other templates also support absolutely positioned overlays since the slide container is `position: relative`. This lets you add callouts, badges, or annotations on top of any template's normal content.

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

## Custom Templates

You can provide your own `.xrb` template files by configuring the templates root:

``` ruby
# In your environment configuration:
service "presently" do
  include Presently::Environment::Application

  def templates_root
    File.expand_path("templates", self.root)
  end
end
```

Templates receive a {ruby Presently::TemplateScope} with access to `self.slide` (the {ruby Presently::Slide} instance) and `self.section(name)` for retrieving named content sections.

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
