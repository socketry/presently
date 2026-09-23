# Templates

This guide explains how to choose slide templates and create custom layouts in Presently.

## Built-in Templates

Templates define the visual layout of each slide. Select a template using the `template` field in the frontmatter.

### Default

A general-purpose content slide. An H1 becomes the slide title and the remaining document becomes its body.

``` markdown
---
template: default
duration: 60
---

# Key points

- First point
- Second point
- Third point
```

### Title

A large title with a short body, centered on the slide.

``` markdown
---
template: title
duration: 30
---

# My Presentation Title

A subtitle or tagline
```

### Section

A section divider slide with a large heading, optional supporting body, and accent background.

``` markdown
---
template: section
duration: 15
---

# Part Two

Architecture and design
```

### Two Column

A side-by-side layout with `left` and `right` sections.

``` markdown
---
template: two_column
duration: 90
---

# Client and server responsibilities

The application is split across two cooperating environments.

## Left

**Server Side**

- Ruby + Lively
- WebSocket connections

## Right

**Client Side**

- Live DOM updates
- CSS animations
```

### Code

A syntax-highlighted code slide with optional focus regions for code walkthroughs. Use the `focus` frontmatter to specify which lines to highlight (1-based). Lines outside the focus range are dimmed, and the code scrolls to center the focused region.

```` markdown
---
template: code
duration: 60
focus: 2-8
---

# Constructor

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
```
````

Create animated walkthroughs by using multiple slides with the same code but different `focus` ranges. The transition between them smoothly scrolls and shifts the dim overlays.

### Statement

A prominent statement or quote, centered on the slide. Supports an optional `## Translation` placeholder.

``` markdown
---
template: statement
duration: 30
---

The best way to predict the future is to create it.

## Translation

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

## Caption

System architecture overview
```

### Diagram

A centered canvas for diagrams and other custom visual layouts, with an optional title. A single grid or flex container is usually enough to create a diagram that remains centered as the slide scales:

``` markdown
---
template: diagram
duration: 60
---

# Request lifecycle

<div style="display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 2em; width: 80%;">
  <div>Browser</div>
  <div>→</div>
  <div>Server</div>
</div>
```

For coordinate-based layouts, wrap the elements in `<div class="diagram-freeform">`. The wrapper fills the canvas and absolutely positions each direct child.

All other templates also support absolutely positioned overlays since the slide container is `position: relative`. This lets you add callouts, badges, or annotations on top of any template's normal content.

## Translations

Templates can extract an optional `## Translation` section and position it independently from the main document. Every standard template displays it separately in a lighter style.

## Custom Templates

For layouts specific to your presentation, put `.xrb` files in a `templates/` directory alongside `slides/`. Presently searches this directory before its bundled templates, so you can add new layouts or override individual built-in templates.

To search additional directories, configure `templates_roots`, which returns an ordered array of paths:

``` ruby
# In your environment configuration:
service "presently" do
	include Presently::Environment::Application
	
	def templates_roots
		[File.expand_path("shared-templates", self.root)] + super
	end
end
```

For example, save the following template as `templates/custom.xrb` and select it with `template: custom` in a slide's frontmatter.

Templates receive a {ruby Presently::TemplateScope}. `self.slide_header` renders the semantic H1 title and optional section metadata, while `self.document` renders the remaining slide body. `self.extract(name)` removes an H2 placeholder with that exact heading text from the body and returns its rendered content. Extract placeholders before rendering the remaining document:

``` xrb
<?r translation = self.extract("Translation") ?>
#{self.slide_header}
<div class="slide-body">
	#{self.document}
</div>
<?r if translation ?>
	<div class="slide-translation">#{translation}</div>
<?r end ?>
```

Extraction stops at the next heading of the same or a higher level, so lower-level headings remain inside the extracted fragment. Placeholder names are case-sensitive and must match the heading text exactly. Only placeholders requested by the template are removed; other headings remain ordinary document content.
