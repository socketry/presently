# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/slide"
require "tmpdir"
require "fileutils"

describe Presently::Slide do
	let(:slide_path) {File.expand_path("../../slides/010-welcome.md", __dir__)}
	let(:slide) {subject.load(slide_path)}
	
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
	
	with "#title" do
		it "uses filename when not set in front_matter" do
			expect(slide.title).to be == "010-welcome"
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
	
	with "#content" do
		it "parses headings into named sections" do
			expect(slide.content).to have_keys("title", "subtitle")
		end
		
		it "renders markdown to HTML" do
			expect(slide.content["title"].to_html).to be(:include?, "Welcome to Presently")
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
		
		let(:slide) {Presently::Slide.load(path)}
		
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
		
		it "puts content in body section" do
			expect(slide.content).to have_keys("body")
			expect(slide.content["body"].to_html).to be(:include?, "Just some content")
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
		
		let(:slide) {Presently::Slide.load(path)}
		
		it "separates content from notes" do
			expect(slide.content["body"].to_html).to be(:include?, "Content here")
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
		
		let(:slide) {Presently::Slide.load(path)}
		
		it "extracts the script" do
			expect(slide.script).to be(:include?, "console.log")
		end
		
		it "removes the script block from notes" do
			expect(slide.notes.to_commonmark).to be(:include?, "Some notes")
			expect(slide.notes.to_commonmark).not.to be(:include?, "console.log")
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
		
		let(:slide) {Presently::Slide.load(path)}
		
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
