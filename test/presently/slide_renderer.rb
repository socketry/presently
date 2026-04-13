# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/slide"
require "presently/slide_renderer"
require "tmpdir"
require "fileutils"

describe Presently::TemplateScope do
	let(:dir) {Dir.mktmpdir}
	let(:path) {File.join(dir, "test.md")}
	
	after do
		FileUtils.remove_entry(dir)
	end
	
	with "a slide with named sections" do
		before do
			File.write(path, "# Title\n\nHello World\n\n# Subtitle\n\nA tagline\n")
		end
		
		let(:slide) {Presently::Slide.load(path)}
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
		
		let(:slide) {Presently::Slide.load(path)}
		let(:scope) {Presently::TemplateScope.new(slide)}
		
		it "returns nil for any section?" do
			expect(scope.section?("title")).to be_nil
		end
	end
end
