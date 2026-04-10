# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/slide"
require "tmpdir"
require "fileutils"

describe Presently::Slide do
	let(:slide_path) {File.expand_path("../../slides/01-welcome.md", __dir__)}
	let(:slide) {subject.new(slide_path)}
	
	with "#template" do
		it "reads template from frontmatter" do
			expect(slide.template).to be == "title"
		end
	end
	
	with "#duration" do
		it "reads duration from frontmatter" do
			expect(slide.duration).to be == 30
		end
	end
	
	with "#content" do
		it "parses headings into named sections" do
			expect(slide.content).to have_keys("title", "subtitle")
		end
		
		it "renders markdown to HTML" do
			expect(slide.content["title"]).to be(:include?, "Welcome to Presently")
		end
	end
	
	with "#notes" do
		it "extracts presenter notes" do
			expect(slide.notes).to be(:include?, "Welcome the audience")
		end
	end
	
	with "a slide without frontmatter" do
		let(:dir) {Dir.mktmpdir}
		let(:path) {File.join(dir, "test.md")}
		
		before do
			File.write(path, "Just some content\n")
		end
		
		after do
			FileUtils.remove_entry(dir)
		end
		
		let(:slide) {Presently::Slide.new(path)}
		
		it "uses default template" do
			expect(slide.template).to be == "default"
		end
		
		it "uses default duration" do
			expect(slide.duration).to be == 60
		end
		
		it "has no notes" do
			expect(slide.notes).to be_nil
		end
		
		it "puts content in body section" do
			expect(slide.content).to have_keys("body")
			expect(slide.content["body"]).to be(:include?, "Just some content")
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
		
		let(:slide) {Presently::Slide.new(path)}
		
		it "separates content from notes" do
			expect(slide.content["body"]).to be(:include?, "Content here")
			expect(slide.notes).to be(:include?, "These are notes")
		end
	end
end
