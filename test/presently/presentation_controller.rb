# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/presentation_controller"

describe Presently::PresentationController do
	let(:presentation) {Presently::Presentation.load("slides")}
	let(:controller) {subject.new(presentation)}
	
	with "#current_slide" do
		it "returns the first slide initially" do
			expect(controller.current_slide).to be == presentation.slides.first
		end
	end
	
	with "#next_slide" do
		it "returns the second slide initially" do
			expect(controller.next_slide).to be == presentation.slides[1]
		end
		
		it "returns nil on the last slide" do
			controller.go_to(controller.slide_count - 1)
			expect(controller.next_slide).to be_nil
		end
	end
	
	with "#previous_slide" do
		it "returns nil on the first slide" do
			expect(controller.previous_slide).to be_nil
		end
		
		it "returns the first slide when on the second" do
			controller.go_to(1)
			expect(controller.previous_slide).to be == presentation.slides.first
		end
	end
	
	with "#go_to" do
		it "changes the current index" do
			controller.go_to(2)
			expect(controller.current_index).to be == 2
		end
		
		it "ignores negative indices" do
			controller.go_to(-1)
			expect(controller.current_index).to be == 0
		end
		
		it "ignores indices beyond the end" do
			controller.go_to(999)
			expect(controller.current_index).to be == 0
		end
		
		it "notifies listeners" do
			notified = false
			listener = Object.new
			listener.define_singleton_method(:slide_changed!){notified = true}
			controller.add_listener(listener)
			
			controller.go_to(1)
			expect(notified).to be == true
		end
	end
	
	with "#advance!" do
		it "moves to the next slide" do
			controller.advance!
			expect(controller.current_index).to be == 1
		end
		
		it "does not advance past the last slide" do
			(controller.slide_count + 1).times{controller.advance!}
			expect(controller.current_index).to be == controller.slide_count - 1
		end
	end
	
	with "#retreat!" do
		it "moves to the previous slide" do
			controller.go_to(2)
			controller.retreat!
			expect(controller.current_index).to be == 1
		end
		
		it "does not retreat before the first slide" do
			controller.retreat!
			expect(controller.current_index).to be == 0
		end
	end
	
	with "#pacing" do
		it "returns on_time when clock is not started" do
			expect(controller.pacing).to be == :on_time
		end
		
		it "returns on_time when within the slide window" do
			controller.clock.start!
			expect(controller.pacing).to be == :on_time
		end
		
		it "returns ahead when on a later slide than expected" do
			controller.clock.start!
			controller.go_to(3)
			expect(controller.pacing).to be == :ahead
		end
		
		it "returns behind when elapsed exceeds the current slide window" do
			# Start, then fast-forward elapsed past the end of the first slide.
			controller.clock.start!
			controller.clock.reset!(controller.current_slide.duration + 1)
			expect(controller.pacing).to be == :behind
		end
	end
	
	with "#slide_progress" do
		it "returns 0.0 when clock is not started" do
			expect(controller.slide_progress).to be == 0.0
		end
		
		it "returns 0.0 at the start of a slide" do
			controller.clock.start!
			expect(controller.slide_progress).to be_within(0.1).of(0.0)
		end
	end
	
	with "#time_remaining" do
		it "returns total duration when clock is not started" do
			expect(controller.time_remaining).to be == controller.total_duration
		end
	end
	
	with "#reset_timer!" do
		it "resets elapsed to expected time for current slide" do
			controller.clock.start!
			sleep 0.05
			controller.go_to(2)
			controller.reset_timer!
			
			expected = presentation.slides[0..1].sum(&:duration)
			expect(controller.clock.elapsed).to be_within(0.1).of(expected)
		end
	end
	
	with "#remove_listener" do
		it "stops notifying a removed listener" do
			call_count = 0
			listener = Object.new
			listener.define_singleton_method(:slide_changed!){call_count += 1}
			controller.add_listener(listener)
			
			controller.advance!
			expect(call_count).to be == 1
			
			controller.remove_listener(listener)
			controller.advance!
			expect(call_count).to be == 1
		end
	end
	
	with "#reload!" do
		it "reloads slides and notifies listeners" do
			notified = false
			listener = Object.new
			listener.define_singleton_method(:slide_changed!){notified = true}
			controller.add_listener(listener)
			
			controller.reload!
			expect(notified).to be == true
			expect(controller.slides).not.to be(:empty?)
		end
	end
end
