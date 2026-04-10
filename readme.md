# Presently

A web-based presentation tool built with [Lively](https://github.com/socketry/lively). Write your slides in Markdown, present them in the browser, and control everything from a separate presenter display.

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

### Installation

Add the gem to your project:

``` bash
$ gem install presently
```

### Create Your Slides

Create a `slides/` directory with one Markdown file per slide, numbered for ordering:

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

### Run the Presentation

``` bash
$ presently
```

Then open two browser windows:

  - `http://localhost:9292/` — the audience display.
  - `http://localhost:9292/presenter` — the presenter console.

Changes made in either window (advancing slides, etc.) are reflected in both.

### Slide Format

Each slide is a Markdown file with optional YAML frontmatter:

``` yaml
---
template: default    # Which template to use
duration: 60         # Expected duration in seconds
focus: 3-8           # For code template: lines to highlight
title: My Slide      # Used by some templates
---
```

Content is split into sections by headings. Each heading becomes a named field available to the template. Content after a `---` separator (within the body) becomes presenter notes.

### Templates

  - **`default`** — General content slide. Uses the `body` section.
  - **`title`** — Large title with subtitle. Uses `title` and `subtitle` sections.
  - **`section`** — Section divider with large heading. Uses the `heading` section.
  - **`two_column`** — Side-by-side layout. Uses `left` and `right` sections.
  - **`code`** — Syntax-highlighted code with optional focus/dim regions. Uses `body` section with optional `focus` frontmatter.
  - **`translation`** — Primary text with translation below. Uses `title` and `translation` sections.
  - **`image`** — Centered image with optional caption. Uses `body` and `caption` sections.

### Code Walkthroughs

Use the `code` template with `focus` frontmatter to create animated code walkthroughs. Two adjacent slides with the same code but different `focus` ranges will smoothly scroll and dim between focus regions:

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

### Custom Templates

Create `.xrb` template files and configure the templates directory:

``` ruby
service "presently" do
  include Presently::Environment::Application

  def templates_directory
    File.expand_path("templates", self.root)
  end
end
```

Templates receive a `TemplateScope` with access to `self.slide` and `self.section(name)`.

### Presenter Controls

The presenter display provides:

  - **Start/Pause/Resume** — control the presentation timer.
  - **Reset** — reset timing to the expected time for the current slide.
  - **Reload** — reload slides from disk without restarting the server.
  - **Progress bar** — visual indicator of time consumed for the current slide.
  - **Pacing indicator** — shows whether you're on time, ahead, or behind schedule.

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

### Developer Certificate of Origin

In order to protect users of this project, we require all contributors to comply with the [Developer Certificate of Origin](https://developercertificate.org/). This ensures that all contributions are properly licensed and attributed.

### Community Guidelines

This project is best served by a collaborative and respectful environment. Treat each other professionally, respect differing viewpoints, and engage constructively. Harassment, discrimination, or harmful behavior is not tolerated. Communicate clearly, listen actively, and support one another. If any issues arise, please inform the project maintainers.
