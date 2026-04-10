# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/presentation"

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
	
	with "#reload!" do
		it "reloads slides from disk" do
			presentation.reload!
			expect(presentation.slides).not.to be(:empty?)
		end
	end
end
