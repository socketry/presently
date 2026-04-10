# Examples

This directory contains example pages demonstrating syntax highlighting for various languages.

## Structure

All example pages follow a consistent structure:

### HTML Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>[Language] Examples - @socketry/syntax</title>
	<link rel="stylesheet" href="examples.css">
</head>
<body>
	<header>
		<h1>[Language] Examples</h1>
		<p class="subtitle">[Brief description]</p>
	</header>
	
	<nav>
		<a href="index.html">Back to Examples</a>
		<a href="[related].html">[Related Language]</a>
	</nav>
	
	<div class="example">
		<h2>[Feature Name]</h2>
		<p class="description">[Description of what this demonstrates]</p>
		
		<syntax-code language="[language-id]">
[code example]
		</syntax-code>
	</div>
	
	<script type="module">
		import Syntax from '../Syntax.js';
		import register[Language] from '../Syntax/Language/[language].js';
		
		register[Language](Syntax.default);
		
		await Syntax.highlight({
			autoUpgrade: true,
			syntax: Syntax.default
		});
	</script>
</body>
</html>
```

## Shared Styles

All examples use `examples.css` which provides:

- Consistent header and navigation styling
- Responsive layout
- Dark mode support
- Semantic HTML structure
- Example containers with descriptions

## Adding a New Example

1. Copy `_template.html` to `[language].html`
2. Replace placeholders with your language details
3. Add code examples in `<div class="example">` blocks
4. Update the navigation links to related languages
5. Add a link to your example in `index.html`

## Guidelines

- **Header**: Use `<header>` with `<h1>` and subtitle
- **Navigation**: Always include "Back to Examples" as first link
- **Examples**: Wrap each example in `<div class="example">` with an `<h2>` heading and description
- **Code**: Use `<syntax-code language="...">` elements
- **Initialization**: Import and register the language, then call `Syntax.highlight()`
