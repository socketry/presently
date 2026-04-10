# frozen_string_literal: true

require "presently/presentation"

describe Presently::Presentation do
	let(:presentation) {subject.new("slides")}
	
	with "#slides" do
		it "loads slides from the directory" do
			expect(presentation.slides).not.to be(:empty?)
		end
		
		it "sorts slides by filename" do
			paths = presentation.slides.map(&:path)
			expect(paths).to be == paths.sort
		end
	end
	
	with "#current_slide" do
		it "returns the first slide initially" do
			expect(presentation.current_slide).to be == presentation.slides.first
		end
	end
	
	with "#next_slide" do
		it "returns the second slide initially" do
			expect(presentation.next_slide).to be == presentation.slides[1]
		end
		
		it "returns nil on the last slide" do
			presentation.go_to(presentation.slide_count - 1)
			expect(presentation.next_slide).to be_nil
		end
	end
	
	with "#previous_slide" do
		it "returns nil on the first slide" do
			expect(presentation.previous_slide).to be_nil
		end
		
		it "returns the first slide when on the second" do
			presentation.go_to(1)
			expect(presentation.previous_slide).to be == presentation.slides.first
		end
	end
	
	with "#total_duration" do
		it "sums all slide durations" do
			expected = presentation.slides.sum(&:duration)
			expect(presentation.total_duration).to be == expected
		end
	end
	
	with "#go_to" do
		it "changes the current index" do
			presentation.go_to(2)
			expect(presentation.current_index).to be == 2
		end
		
		it "ignores negative indices" do
			presentation.go_to(-1)
			expect(presentation.current_index).to be == 0
		end
		
		it "ignores indices beyond the end" do
			presentation.go_to(999)
			expect(presentation.current_index).to be == 0
		end
		
		it "notifies listeners" do
			notified = false
			listener = Object.new
			listener.define_singleton_method(:slide_changed!) { notified = true }
			presentation.add_listener(listener)
			
			presentation.go_to(1)
			expect(notified).to be == true
		end
	end
	
	with "#advance!" do
		it "moves to the next slide" do
			presentation.advance!
			expect(presentation.current_index).to be == 1
		end
		
		it "does not advance past the last slide" do
			(presentation.slide_count + 1).times { presentation.advance! }
			expect(presentation.current_index).to be == presentation.slide_count - 1
		end
	end
	
	with "#retreat!" do
		it "moves to the previous slide" do
			presentation.go_to(2)
			presentation.retreat!
			expect(presentation.current_index).to be == 1
		end
		
		it "does not retreat before the first slide" do
			presentation.retreat!
			expect(presentation.current_index).to be == 0
		end
	end
	
	with "#pacing" do
		it "returns on_time when clock is not started" do
			expect(presentation.pacing).to be == :on_time
		end
		
		it "returns on_time when within the slide window" do
			presentation.clock.start!
			expect(presentation.pacing).to be == :on_time
		end
		
		it "returns ahead when on a later slide than expected" do
			presentation.clock.start!
			# Jump ahead without time passing
			presentation.go_to(3)
			expect(presentation.pacing).to be == :ahead
		end
	end
	
	with "#slide_progress" do
		it "returns 0.0 when clock is not started" do
			expect(presentation.slide_progress).to be == 0.0
		end
		
		it "returns 0.0 at the start of a slide" do
			presentation.clock.start!
			expect(presentation.slide_progress).to be_within(0.1).of(0.0)
		end
	end
	
	with "#time_remaining" do
		it "returns total duration when clock is not started" do
			expect(presentation.time_remaining).to be == presentation.total_duration
		end
	end
	
	with "#reset_timer!" do
		it "resets elapsed to expected time for current slide" do
			presentation.clock.start!
			sleep 0.05
			presentation.go_to(2)
			presentation.reset_timer!
			
			expected = presentation.slides[0..1].sum(&:duration)
			expect(presentation.clock.elapsed).to be_within(0.1).of(expected)
		end
	end
	
	with "#reload!" do
		it "reloads slides and notifies listeners" do
			notified = false
			listener = Object.new
			listener.define_singleton_method(:slide_changed!) { notified = true }
			presentation.add_listener(listener)
			
			presentation.reload!
			expect(notified).to be == true
			expect(presentation.slides).not.to be(:empty?)
		end
	end
end
