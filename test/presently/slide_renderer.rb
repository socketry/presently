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
	
	with "a slide with named sections" do
		before do
			File.write(path, "# Title\n\nHello World\n\n# Subtitle\n\nA tagline\n")
		end
		
		let(:slide) {load_slide(path)}
		let(:scope) {Presently::TemplateScope.new(slide)}
		
		it "renders a section to HTML" do
			expect(scope.section("title")).to be(:include?, "Hello World")
		end
		
		it "exposes the slide content" do
			expect(scope.content).to be == slide.content
		end
		
		it "returns true for section? when section exists" do
			expect(scope.section?("title")).to be_truthy
		end
		
		it "returns nil for section? when section is missing" do
			expect(scope.section?("missing")).to be_nil
		end
		
		it "returns empty string for missing section" do
			expect(scope.section("missing")).to be == ""
		end
	end
	
	with "slide header metadata" do
		before do
			File.write(path, "---\ntitle: Request lifecycle\nsection: Architecture\n---\n\nContent\n")
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
			translation = scope.extract("translation")
			header = scope.slide_header
			body = scope.document
			
			expect(translation).to be(:include?, "Translated content")
			expect(header).to be(:include?, "<h1>Request lifecycle</h1>")
			expect(body).to be(:include?, "Main content")
			expect(body).not.to be(:include?, "Translation")
			expect(slide.document.to_html).to be(:include?, "Translation")
		end
	end
	
	with "a title matching a placeholder name" do
		before do
			File.write(path, "# Translation\n\nMain content.\n")
		end
		
		let(:slide) {load_slide(path)}
		let(:scope) {Presently::TemplateScope.new(slide)}
		
		it "reserves H1 for the semantic slide title" do
			expect(scope.extract("translation")).to be_nil
			expect(scope.slide_header).to be(:include?, "<h1>Translation</h1>")
			expect(scope.document).to be(:include?, "Main content")
		end
	end
	
	with "a slide with no sections" do
		before do
			File.write(path, "Just some content\n")
		end
		
		let(:slide) {load_slide(path)}
		let(:scope) {Presently::TemplateScope.new(slide)}
		
		it "returns nil for any section?" do
			expect(scope.section?("title")).to be_nil
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
			title: Request lifecycle
			section: Architecture
			---
			
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
