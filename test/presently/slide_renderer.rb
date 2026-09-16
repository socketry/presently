# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/presentation"
require "presently/slide_renderer"
require "tmpdir"
require "fileutils"

describe Presently::TemplateScope do
	def load_slide(path)
		presentation = Presently::Presentation.new(File.dirname(path))
		Presently::Slide.load(presentation, File.basename(path))
	end
	
	let(:dir) {Dir.mktmpdir}
	let(:path) {File.join(dir, "test.md")}
	
	after do
		FileUtils.remove_entry(dir)
	end
	
	with "slide header metadata" do
		before do
			File.write(path, "---\nsection: Architecture\n---\n\n# Request lifecycle\n\nContent\n")
		end
		
		let(:slide) {load_slide(path)}
		let(:scope) {Presently::TemplateScope.new(slide)}
		
		it "renders a semantic header" do
			header = scope.slide_header
			expect(header).to be(:include?, '<header class="slide-header">')
			expect(header).to be(:include?, '<div class="slide-section-heading">')
			expect(header).to be(:include?, "Architecture")
			expect(header).to be(:include?, "<h1>")
			expect(header).to be(:include?, "Request lifecycle")
		end
		
		it "extracts the title before the document is rendered" do
			expect(scope.document).not.to be(:include?, "<h1>")
			expect(scope.slide_header).to be(:include?, "<h1>Request lifecycle</h1>")
		end
		
		it "renders the same header repeatedly" do
			first = scope.slide_header
			second = scope.slide_header
			
			expect(second).to be == first
		end
	end
	
	with "section metadata without a title" do
		before do
			File.write(path, "---\nsection: Architecture\n---\n\nContent\n")
		end
		
		let(:slide) {load_slide(path)}
		let(:scope) {Presently::TemplateScope.new(slide)}
		
		it "renders a section-only header" do
			header = scope.slide_header
			expect(header).to be(:include?, '<div class="slide-section-heading">')
			expect(header).to be(:include?, "Architecture")
			expect(header).not.to be(:include?, "<h1>")
		end
	end
	
	with "front matter title metadata" do
		before do
			File.write(path, "---\ntitle: Navigation label\n---\n\nContent\n")
		end
		
		let(:slide) {load_slide(path)}
		let(:scope) {Presently::TemplateScope.new(slide)}
		
		it "does not use metadata as the displayed heading" do
			expect(scope.slide_header).to be == ""
		end
	end
	
	with "a title named Title" do
		before do
			File.write(path, "# Title\n\nMain content.\n")
		end
		
		let(:slide) {load_slide(path)}
		let(:scope) {Presently::TemplateScope.new(slide)}
		
		it "does not treat the H1 as a legacy placeholder" do
			expect(scope.slide_header).to be(:include?, "<h1>Title</h1>")
			expect(scope.document).to be(:include?, "Main content")
		end
	end
	
	with "a title containing inline markup" do
		before do
			File.write(path, "# <span style=\"view-transition-name: welcome-title\">Welcome</span>\n\nMain content.\n")
		end
		
		let(:slide) {load_slide(path)}
		let(:scope) {Presently::TemplateScope.new(slide)}
		
		it "preserves title markup while removing the H1 from the body" do
			header = scope.slide_header
			body = scope.document
			
			expect(header).to be(:include?, '<h1><span style="view-transition-name: welcome-title">Welcome</span></h1>')
			expect(body).to be(:include?, "Main content")
			expect(body).not.to be(:include?, "welcome-title")
		end
	end
	
	with "document placeholders" do
		before do
			File.write(path, <<~MARKDOWN)
				# Request lifecycle
				
				Main content.
				
				## Translation
				
				Translated content.
			MARKDOWN
		end
		
		let(:slide) {load_slide(path)}
		let(:scope) {Presently::TemplateScope.new(slide)}
		
		it "extracts placeholders before rendering the remaining document" do
			translation = scope.extract("Translation")
			header = scope.slide_header
			body = scope.document
			
			expect(translation).to be(:include?, "Translated content")
			expect(header).to be(:include?, "<h1>Request lifecycle</h1>")
			expect(body).to be(:include?, "Main content")
			expect(body).not.to be(:include?, "Translation")
			expect(slide.document.to_html).to be(:include?, "Translation")
		end
		
		it "returns the cached placeholder on repeated extraction" do
			first = scope.extract("Translation")
			second = scope.extract("Translation")
			
			expect(second).to be == first
			expect(second).to be(:include?, "Translated content")
			expect(scope.document).not.to be(:include?, "Translation")
		end
	end
	
	with "a title matching a placeholder name" do
		before do
			File.write(path, "# Translation\n\nMain content.\n")
		end
		
		let(:slide) {load_slide(path)}
		let(:scope) {Presently::TemplateScope.new(slide)}
		
		it "reserves H1 for the semantic slide title" do
			expect(scope.extract("Translation")).to be_nil
			expect(scope.slide_header).to be(:include?, "<h1>Translation</h1>")
			expect(scope.document).to be(:include?, "Main content")
		end
	end
	
end

describe Presently::SlideRenderer do
	let(:dir) {Dir.mktmpdir}
	let(:path) {File.join(dir, "010-example.md")}
	
	before do
		File.write(path, "Example slide\n")
	end
	
	after do
		FileUtils.remove_entry(dir)
	end
	
	it "identifies the rendered slide by its presentation path" do
		presentation = Presently::Presentation.load(dir)
		html = subject.new(templates: presentation.templates).render_to_html(presentation.slides.first)
		
		expect(html).to be(:include?, 'data-slide-path="010-example.md"')
		expect(html.scan("data-slide-path=").size).to be == 1
	end
	
	it "renders a fixed-aspect slide within a full-size surface" do
		presentation = Presently::Presentation.load(dir)
		html = subject.new(templates: presentation.templates).render_to_html(presentation.slides.first)
		
		expect(html).to be(:include?, 'class="slide-surface"')
	end
	
	it "renders an H1 as the diagram title" do
		File.write(path, <<~MARKDOWN)
			---
			template: diagram
			---
			
			# Request lifecycle
			
			<div>Diagram</div>
		MARKDOWN
		
		presentation = Presently::Presentation.load(dir)
		html = subject.new(templates: presentation.templates).render_to_html(presentation.slides.first)
		
		expect(html).to be(:include?, "<h1>Request lifecycle</h1>")
		expect(html).to be(:include?, "Diagram")
	end
	
	it "renders diagram metadata as a semantic header" do
		File.write(path, <<~MARKDOWN)
			---
			template: diagram
			section: Architecture
			---
			
			# Request lifecycle
			
			<div>Diagram</div>
		MARKDOWN
		
		presentation = Presently::Presentation.load(dir)
		html = subject.new(templates: presentation.templates).render_to_html(presentation.slides.first)
		
		expect(html).to be(:include?, '<div class="slide-section-heading">')
		expect(html).to be(:include?, "Architecture")
		expect(html).to be(:include?, "<h1>")
		expect(html).to be(:include?, "Request lifecycle")
	end
	
	it "renders a section slide H1 literally" do
		File.write(path, <<~MARKDOWN)
			---
			template: section
			---
			
			# Heading
			
			Part Two
		MARKDOWN
		
		presentation = Presently::Presentation.load(dir)
		html = subject.new(templates: presentation.templates).render_to_html(presentation.slides.first)
		
		expect(html).to be(:include?, "<h1>Heading</h1>")
		expect(html).not.to be(:include?, "<h1>Part Two</h1>")
		expect(html).to be(:include?, '<div class="slide-body">')
		expect(html).to be(:include?, "Part Two")
	end
	
	it "does not infer a code slide heading from its filename" do
		File.write(path, <<~MARKDOWN)
			---
			template: code
			---
			
			```ruby
			puts "Hello"
			```
		MARKDOWN
		
		presentation = Presently::Presentation.load(dir)
		html = subject.new(templates: presentation.templates).render_to_html(presentation.slides.first)
		
		expect(html).not.to be(:include?, '<header class="slide-header">')
	end
	
	it "renders the title slide document as its body" do
		File.write(path, <<~MARKDOWN)
			---
			template: title
			---
			
			# My Presentation
			
			A subtitle or tagline.
		MARKDOWN
		
		presentation = Presently::Presentation.load(dir)
		html = subject.new(templates: presentation.templates).render_to_html(presentation.slides.first)
		
		expect(html).to be(:include?, '<div class="slide-body">')
		expect(html).to be(:include?, "A subtitle or tagline.")
	end
	
	it "renders image captions from a named placeholder" do
		File.write(path, <<~MARKDOWN)
			---
			template: image
			---
			
			# System overview
			
			![Architecture diagram](architecture.svg)
			
			## Caption
			
			Requests flow from left to right.
		MARKDOWN
		
		presentation = Presently::Presentation.load(dir)
		html = subject.new(templates: presentation.templates).render_to_html(presentation.slides.first)
		
		expect(html).to be(:include?, '<div class="slide-caption">')
		expect(html).to be(:include?, "Requests flow from left to right.")
	end
	
	it "renders two-column body content above independent columns" do
		File.write(path, <<~MARKDOWN)
			---
			template: two_column
			---
			
			# Responsibilities
			
			Shared context.
			
			## Left
			
			Server side.
			
			## Right
			
			Client side.
		MARKDOWN
		
		presentation = Presently::Presentation.load(dir)
		html = subject.new(templates: presentation.templates).render_to_html(presentation.slides.first)
		
		expect(html).to be(:include?, '<div class="slide-body">')
		expect(html).to be(:include?, "Shared context.")
		expect(html).to be(:include?, '<div class="column left-column">')
		expect(html).to be(:include?, "Server side.")
		expect(html).to be(:include?, '<div class="column right-column">')
		expect(html).to be(:include?, "Client side.")
	end
	
	it "renders each slide script separately" do
		File.write(path, <<~MARKDOWN)
			```javascript presently
			globalThis.setup = true
			```
			
			Example slide
			
			---
			
			```javascript
			globalThis.control = true
			```
		MARKDOWN
		
		presentation = Presently::Presentation.load(dir)
		html = subject.new(templates: presentation.templates).render_to_html(presentation.slides.first)
		
		expect(html.scan('type="text/slide-script"').size).to be == 2
		expect(html).to be(:include?, 'class="slide slide-scripted"')
		expect(html).to be(:include?, "globalThis.setup")
		expect(html).to be(:include?, "globalThis.control")
	end
	
	it "renders translation content in every standard template" do
		%w[code default diagram fill image section statement title two_column].each do |template|
			File.write(path, <<~MARKDOWN)
				---
				template: #{template}
				---
				
				# Example slide
				
				## Translation
				
				Translated slide
			MARKDOWN
			
			presentation = Presently::Presentation.load(dir)
			html = subject.new(templates: presentation.templates).render_to_html(presentation.slides.first)
			
			expect(html).to be(:include?, 'class="slide-translation"')
			expect(html).to be(:include?, "Translated slide")
		end
	end
end

describe Presently::Templates do
	it "raises a useful error for a missing template" do
		templates = subject.new([])
		
		expect{templates.resolve("missing")}.to raise_exception(Errno::ENOENT, message: be(:include?, "Template 'missing' not found"))
	end
end
