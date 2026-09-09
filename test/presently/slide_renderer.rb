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
	
	it "renders an optional diagram title" do
		File.write(path, <<~MARKDOWN)
			---
			template: diagram
			---
			
			# Title
			
			Request lifecycle
			
			# Body
			
			<div>Diagram</div>
		MARKDOWN
		
		presentation = Presently::Presentation.load(dir)
		html = subject.new(templates: presentation.templates).render_to_html(presentation.slides.first)
		
		expect(html).to be(:include?, 'class="slide-title"')
		expect(html).to be(:include?, "Request lifecycle")
		expect(html).to be(:include?, "Diagram")
	end
end
