# Releases

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
