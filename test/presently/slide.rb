# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/presentation"
require "tmpdir"
require "fileutils"

describe Presently::Slide do
	def load_slide(path)
		presentation = Presently::Presentation.new(File.dirname(path))
		Presently::Slide.load(presentation, File.basename(path))
	end
	
	let(:slide_path) {File.expand_path("../../slides/010-welcome.md", __dir__)}
	let(:slide) {load_slide(slide_path)}
	
	with "its presentation" do
		it "retains its relative and source paths" do
			expect(slide.path).to be == "010-welcome.md"
			expect(slide.source_path).to be == slide_path
		end
	end
	
	with "#template" do
		it "reads template from front_matter" do
			expect(slide.template).to be == "title"
		end
	end
	
	with "#duration" do
		it "reads duration from front_matter" do
			expect(slide.duration).to be == 30
		end
	end
	
	with "#update_duration!" do
		let(:dir) {Dir.mktmpdir}
		let(:path) {File.join(dir, "test.md")}
		
		after do
			FileUtils.remove_entry(dir)
		end
		
		it "replaces an existing duration without rewriting other content" do
			File.write(path, "---\nmarker: Example\nduration: 30 # timing target\n---\n# Slide\n")
			slide = load_slide(path)
			
			expect(slide.update_duration!(42)).to be == 42
			expect(slide.duration).to be == 42
			expect(File.read(path)).to be == "---\nmarker: Example\nduration: 42 # timing target\n---\n# Slide\n"
		end
		
		it "adds duration to existing front matter" do
			File.write(path, "---\nmarker: Example\n---\n# Slide\n")
			slide = load_slide(path)
			
			slide.update_duration!(17)
			expect(File.read(path)).to be == "---\nmarker: Example\nduration: 17\n---\n# Slide\n"
		end
		
		it "creates front matter when the slide has none" do
			File.write(path, "# Slide\n")
			slide = load_slide(path)
			
			slide.update_duration!(8)
			expect(File.read(path)).to be == "---\nduration: 8\n---\n# Slide\n"
		end
	end
	
	with "#title" do
		it "uses the semantic H1 text" do
			expect(slide.title).to be == "Welcome to Presently"
		end
	end
	
	with "display metadata" do
		let(:dir) {Dir.mktmpdir}
		let(:path) {File.join(dir, "test.md")}
		
		before do
			File.write(path, "---\ntitle: Request lifecycle\nsection: Architecture\n---\n\nContent\n")
		end
		
		after do
			FileUtils.remove_entry(dir)
		end
		
		let(:slide) {load_slide(path)}
		
		it "exposes the title and section" do
			expect(slide.title).to be == "Request lifecycle"
			expect(slide.section).to be == "Architecture"
		end
	end
	
	with "an H1 and title metadata" do
		let(:dir) {Dir.mktmpdir}
		let(:path) {File.join(dir, "test.md")}
		
		before do
			File.write(path, "---\ntitle: Navigation label\n---\n\n# Display title\n")
		end
		
		after do
			FileUtils.remove_entry(dir)
		end
		
		let(:slide) {load_slide(path)}
		
		it "prefers the semantic H1" do
			expect(slide.title).to be == "Display title"
		end
	end
	
	with "document extraction" do
		let(:dir) {Dir.mktmpdir}
		let(:path) {File.join(dir, "test.md")}
		
		before do
			File.write(path, <<~MARKDOWN)
				# Request lifecycle
				
				Main content.
				
				## Translation
				
				Translated content.
				
				### Attribution
				
				A nested section.
				
				## Caption
				
				A caption.
			MARKDOWN
		end
		
		after do
			FileUtils.remove_entry(dir)
		end
		
		let(:slide) {load_slide(path)}
		
		it "extracts a named H2 placeholder from a duplicate document" do
			document = slide.document.dup
			expect(document.extract("translation")).to be_nil
			translation = document.extract("Translation")
			
			expect(translation.to_html).to be(:include?, "Translated content")
			expect(translation.to_html).to be(:include?, "Attribution")
			expect(translation.to_html).not.to be(:include?, "Caption")
			expect(document.to_html).to be(:include?, "Request lifecycle")
			expect(document.to_html).to be(:include?, "A caption")
			expect(document.to_html).not.to be(:include?, "Translation")
			expect(slide.document.to_html).to be(:include?, "Translation")
		end
		
		it "does not extract headings at other levels" do
			document = slide.document.dup
			
			expect(document.extract("Request lifecycle")).to be_nil
			expect(document.extract("Attribution")).to be_nil
		end
	end
	
	with "#marker" do
		it "reads marker from front_matter" do
			expect(slide.marker).to be == "Welcome"
		end
	end
	
	with "#skip?" do
		it "returns false when not set" do
			expect(slide.skip?).to be == false
		end
	end
	
	with "#speaker" do
		it "reads speaker from front_matter" do
			expect(slide.speaker).to be == "Samuel"
		end
	end
	
	with "#document" do
		it "retains the semantic slide title" do
			expect(slide.document.to_html).to be(:include?, "<h1>")
			expect(slide.document.to_html).to be(:include?, "Welcome to Presently")
		end
	end
	
	with "#notes" do
		it "extracts presenter notes" do
			expect(slide.notes.to_commonmark).to be(:include?, "Presently")
		end
		
		it "renders notes to HTML" do
			expect(slide.notes.to_html).to be(:include?, "Presently")
		end
	end
	
	with "a slide without front_matter" do
		let(:dir) {Dir.mktmpdir}
		let(:path) {File.join(dir, "test.md")}
		
		before do
			File.write(path, "Just some content\n")
		end
		
		after do
			FileUtils.remove_entry(dir)
		end
		
		let(:slide) {load_slide(path)}
		
		it "uses default template" do
			expect(slide.template).to be == "default"
		end
		
		it "uses default duration" do
			expect(slide.duration).to be == 60
		end
		
		it "has no notes" do
			expect(slide.notes).to be_nil
		end
		
		it "has no speaker" do
			expect(slide.speaker).to be_nil
		end
		
		it "has no marker" do
			expect(slide.marker).to be_nil
		end
		
		it "has no transition" do
			expect(slide.transition).to be_nil
		end
		
		it "has no focus" do
			expect(slide.focus).to be_nil
		end
		
		it "uses filename as title" do
			expect(slide.title).to be == "test"
		end
		
		it "has no section" do
			expect(slide.section).to be_nil
		end
		
		it "preserves the slide document" do
			expect(slide.document.to_html).to be(:include?, "Just some content")
		end
	end
	
	with "a slide with notes separator" do
		let(:dir) {Dir.mktmpdir}
		let(:path) {File.join(dir, "test.md")}
		
		before do
			File.write(path, "Content here\n\n---\n\nThese are notes\n")
		end
		
		after do
			FileUtils.remove_entry(dir)
		end
		
		let(:slide) {load_slide(path)}
		
		it "separates content from notes" do
			expect(slide.document.to_html).to be(:include?, "Content here")
			expect(slide.notes.to_commonmark).to be(:include?, "These are notes")
		end
	end
	
	with "a slide with a javascript script block in notes" do
		let(:dir) {Dir.mktmpdir}
		let(:path) {File.join(dir, "test.md")}
		
		before do
			File.write(path, "Content\n\n---\n\nSome notes\n\n```javascript\nconsole.log('hello')\n```\n")
		end
		
		after do
			FileUtils.remove_entry(dir)
		end
		
		let(:slide) {load_slide(path)}
		
		it "extracts the script" do
			expect(slide.scripts).to have_value(be(:include?, "console.log"))
		end
		
		it "removes the script block from notes" do
			expect(slide.notes.to_commonmark).to be(:include?, "Some notes")
			expect(slide.notes.to_commonmark).not.to be(:include?, "console.log")
		end
	end
	
	with "a slide with an ![[include]] directive" do
		let(:dir) {Dir.mktmpdir}
		let(:path) {File.join(dir, "main.md")}
		let(:shared_path) {File.join(dir, "shared", "snippet.md")}
		
		before do
			FileUtils.mkdir_p(File.dirname(shared_path))
			File.write(shared_path, "# Included\n\nThis content was included.\n")
			File.write(path, "# Before\n\nIntro text\n\n![[shared/snippet.md]]\n\n# After\n\nTrailing text\n")
		end
		
		after do
			FileUtils.remove_entry(dir)
		end
		
		let(:slide) {load_slide(path)}
		
		it "expands the include into the document" do
			html = slide.document.to_html
			expect(html).to be(:include?, "<h1>Before</h1>")
			expect(html).to be(:include?, "<h1>Included</h1>")
			expect(html).to be(:include?, "<h1>After</h1>")
		end
		
		it "preserves content before the include" do
			expect(slide.document.to_html).to be(:include?, "Intro text")
		end
		
		it "inlines the included content" do
			expect(slide.document.to_html).to be(:include?, "This content was included")
		end
		
		it "preserves content after the include" do
			expect(slide.document.to_html).to be(:include?, "Trailing text")
		end
	end
	
	with "an included reusable setup script" do
		let(:dir) {Dir.mktmpdir}
		let(:path) {File.join(dir, "main.md")}
		let(:shared_path) {File.join(dir, "shared", "diagram.md")}
		
		before do
			FileUtils.mkdir_p(File.dirname(shared_path))
			File.write(shared_path, <<~MARKDOWN)
				<div class="diagram">Shared diagram</div>
				
				```javascript presently
				slide.anime().data.timeline = "shared"
				```
			MARKDOWN
			File.write(path, <<~MARKDOWN)
				![[shared/diagram.md]]
				
				---
				
				Slide-specific notes.
				
				```javascript
				slide.anime().data.timeline.play()
				```
			MARKDOWN
		end
		
		after do
			FileUtils.remove_entry(dir)
		end
		
		let(:slide) {load_slide(path)}
		
		it "extracts setup and slide scripts in execution order" do
			expect(slide.scripts.size).to be == 2
			expect(slide.scripts.first).to be(:include?, 'timeline = "shared"')
			expect(slide.scripts.last).to be(:include?, "timeline.play()")
		end
		
		it "removes the setup script from rendered content" do
			html = slide.document.to_html
			expect(html).to be(:include?, "Shared diagram")
			expect(html).not.to be(:include?, "timeline")
		end
	end
	
	with "a javascript example in slide content" do
		let(:dir) {Dir.mktmpdir}
		let(:path) {File.join(dir, "main.md")}
		
		before do
			File.write(path, "```javascript\nconsole.log('example')\n```\n")
		end
		
		after do
			FileUtils.remove_entry(dir)
		end
		
		let(:slide) {load_slide(path)}
		
		it "renders rather than executes the example" do
			expect(slide.scripts).to be(:empty?)
			expect(slide.document.to_html).to be(:include?, "console.log")
		end
	end
	
	with "inline code language prefixes" do
		let(:dir) {Dir.mktmpdir}
		let(:path) {File.join(dir, "main.md")}
		
		before do
			File.write(path, "Call ruby:`Object.new` to create an object.\n")
		end
		
		after do
			FileUtils.remove_entry(dir)
		end
		
		let(:slide) {load_slide(path)}
		
		it "renders the language as a class" do
			html = slide.document.to_html
			expect(html).to be(:include?, '<code class="language-ruby">Object.new</code>')
			expect(html).not.to be(:include?, "ruby:")
		end
	end
	
	with "blank lines in HTML blocks" do
		let(:dir) {Dir.mktmpdir}
		let(:path) {File.join(dir, "main.md")}
		let(:slide) {load_slide(path)}
		let(:html) {slide.document.to_html}
		
		after do
			FileUtils.remove_entry(dir)
		end
		
		it "preserves consistently indented slide HTML" do
			File.write(path, <<~MARKDOWN)
				<div class="diagram">
					<div class="first">First</div>
					
					<div class="second">Second</div>
				</div>
			MARKDOWN
			
			expect(html).to be(:include?, '<div class="second">Second</div>')
			expect(html).not.to be(:include?, "<pre><code>")
		end
		
		it "preserves consistently indented included HTML" do
			included_path = File.join(dir, "diagram.md")
			File.write(included_path, <<~MARKDOWN)
				<div class="diagram">
					<div class="first">First</div>
					
					<div class="second">Second</div>
				</div>
			MARKDOWN
			File.write(path, "![[diagram.md]]\n")
			
			expect(html).to be(:include?, '<div class="second">Second</div>')
			expect(html).not.to be(:include?, "<pre><code>")
		end
	end
	
	with "a slide with a nested ![[include]] directive" do
		let(:dir) {Dir.mktmpdir}
		let(:path) {File.join(dir, "main.md")}
		let(:middle_path) {File.join(dir, "middle.md")}
		let(:inner_path) {File.join(dir, "inner.md")}
		
		before do
			File.write(inner_path, "Deeply nested ruby:`Object.new` content.\n")
			File.write(middle_path, "Middle content.\n\n![[inner.md]]\n")
			File.write(path, "![[middle.md]]\n")
		end
		
		after do
			FileUtils.remove_entry(dir)
		end
		
		let(:slide) {load_slide(path)}
		
		it "recursively expands nested includes" do
			html = slide.document.to_html
			expect(html).to be(:include?, "Middle content")
			expect(html).to be(:include?, "Deeply nested")
			expect(html).to be(:include?, '<code class="language-ruby">Object.new</code>')
		end
	end
	
	with "an included file that has front matter" do
		let(:dir) {Dir.mktmpdir}
		let(:path) {File.join(dir, "main.md")}
		let(:shared_path) {File.join(dir, "snippet.md")}
		
		before do
			File.write(shared_path, "---\ntitle: Ignored\n---\nShared body.\n")
			File.write(path, "![[snippet.md]]\n")
		end
		
		after do
			FileUtils.remove_entry(dir)
		end
		
		let(:slide) {load_slide(path)}
		
		it "strips front matter from the included file" do
			html = slide.document.to_html
			expect(html).to be(:include?, "Shared body")
			expect(html).not.to be(:include?, "Ignored")
		end
	end
	
	with "relative Markdown images" do
		let(:dir) {Dir.mktmpdir}
		let(:path) {File.join(dir, "010-section", "010-images.md")}
		
		before do
			FileUtils.mkdir_p(File.dirname(path))
			File.write(path, <<~MARKDOWN)
				![Local](diagram.svg)
				![Parent](../shared/diagram.svg?size=large#preview)
				![Root](/images/diagram.svg)
				![Remote](https://example.com/diagram.svg)
			MARKDOWN
		end
		
		after do
			FileUtils.remove_entry(dir)
		end
		
		let(:slide) {Presently::Presentation.new(dir).slides.first}
		let(:html) {slide.document.to_html}
		
		it "resolves local images relative to the slide source" do
			expect(html).to be(:include?, 'src="/_slides/010-section/diagram.svg"')
			expect(html).to be(:include?, 'src="/_slides/shared/diagram.svg?size=large#preview"')
		end
		
		it "preserves root-relative and external images" do
			expect(html).to be(:include?, 'src="/images/diagram.svg"')
			expect(html).to be(:include?, 'src="https://example.com/diagram.svg"')
		end
	end
	
	with "a relative image in an included Markdown file" do
		let(:dir) {Dir.mktmpdir}
		let(:path) {File.join(dir, "010-main.md")}
		let(:included_path) {File.join(dir, "shared", "snippet.md")}
		
		before do
			FileUtils.mkdir_p(File.dirname(included_path))
			File.write(included_path, "![Included](images/diagram.svg)\n")
			File.write(path, "![[shared/snippet.md]]\n")
		end
		
		after do
			FileUtils.remove_entry(dir)
		end
		
		let(:slide) {load_slide(path)}
		
		it "resolves the image relative to the included source" do
			expect(slide.document.to_html).to be(:include?, 'src="/_slides/shared/images/diagram.svg"')
		end
	end
	
	with "a slide with transition and focus front_matter" do
		let(:dir) {Dir.mktmpdir}
		let(:path) {File.join(dir, "test.md")}
		
		before do
			File.write(path, "---\ntransition: fade\nfocus: 3-7\nskip: true\nspeaker: Alice\n---\nContent\n")
		end
		
		after do
			FileUtils.remove_entry(dir)
		end
		
		let(:slide) {load_slide(path)}
		
		it "reads transition" do
			expect(slide.transition).to be == "fade"
		end
		
		it "reads focus as a two-element array" do
			expect(slide.focus).to be == [3, 7]
		end
		
		it "reads skip" do
			expect(slide.skip?).to be == true
		end
		
		it "reads speaker" do
			expect(slide.speaker).to be == "Alice"
		end
	end
end
