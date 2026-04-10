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

Each slide is a Markdown file in the `slides/` directory. Files are ordered alphabetically, so prefix them with numbers:

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

Advancing slides in either window updates both in real-time via WebSockets.

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

### Translation

Primary text with a translation below.

``` markdown
---
template: translation
duration: 30
---

# Title

The best way to predict the future is to create it.

# Translation

未来を予測する最善の方法は、それを創ることである。
```

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
