# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/presentation"
require "tmpdir"
require "fileutils"

describe Presently::Presentation do
	let(:presentation) {subject.load("slides")}
	
	with ".load" do
		it "loads slides from the directory" do
			expect(presentation.slides).not.to be(:empty?)
		end
		
		it "sorts slides by filename" do
			paths = presentation.slides.map(&:path)
			expect(paths).to be == paths.sort
		end
		
		with "nested directories" do
			around do |&block|
				Dir.mktmpdir do |root|
					@root = root
					FileUtils.mkdir_p(File.join(root, "020-performance", "030-details"))
					FileUtils.mkdir_p(File.join(root, "shared"))
					
					File.write(File.join(root, "010-introduction.md"), "Introduction\n")
					File.write(File.join(root, "020-performance", "010-overview.md"), "Overview\n")
					File.write(File.join(root, "020-performance", "030-details", "010-cpu.md"), "CPU\n")
					File.write(File.join(root, "020-performance", "notes.md"), "Not a slide\n")
					File.write(File.join(root, "shared", "010-example.md"), "Not a slide\n")
					File.write(File.join(root, "030-conclusion.md"), "Conclusion\n")
					
					block.call
				end
			end
			
			let(:presentation) {subject.load(@root)}
			
			it "loads recursively in path order" do
				expect(presentation.slides.map(&:path)).to be == [
					"010-introduction.md",
					File.join("020-performance", "010-overview.md"),
					File.join("020-performance", "030-details", "010-cpu.md"),
					"030-conclusion.md",
				]
			end
			
			it "attaches slides to the presentation" do
				slide = presentation.slides.first
				expect(slide.presentation).to be_equal(presentation)
				expect(slide.source_path).to be == File.join(@root, slide.path)
			end
			
			it "requires every path component to have a numeric prefix" do
				contents = presentation.slides.map{|slide| slide.content.fetch("body").to_commonmark}
				expect(contents).not.to have_value(be(:include?, "Not a slide"))
			end
		end
	end
	
	with "#slide_count" do
		it "returns the number of slides" do
			expect(presentation.slide_count).to be == presentation.slides.length
		end
	end
	
	with "#total_duration" do
		it "sums all slide durations" do
			expected = presentation.slides.sum(&:duration)
			expect(presentation.total_duration).to be == expected
		end
	end
	
	with "#expected_time_at" do
		it "returns 0 for the first slide" do
			expect(presentation.expected_time_at(0)).to be == 0
		end
		
		it "sums durations up to the given index" do
			expected = presentation.slides[0..1].sum(&:duration)
			expect(presentation.expected_time_at(2)).to be == expected
		end
	end
	
	with "#reload" do
		it "returns a new presentation with slides loaded from disk" do
			reloaded = presentation.reload
			expect(reloaded).not.to be == presentation
			expect(reloaded.slides).not.to be(:empty?)
		end
	end
end
