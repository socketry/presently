# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/presentation_controller"
require "sus/fixtures/temporary_directory_context"

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
			expect(controller.clock).not.to be(:started?)
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
	
	with "slide timer actions" do
		include Sus::Fixtures::TemporaryDirectoryContext
		
		let(:presentation) {Presently::Presentation.load(root)}
		let(:state) {Presently::State.new(File.join(root, "state.json"))}
		let(:controller) {subject.new(presentation, state: state)}
		
		before do
			File.write(File.join(root, "010-title.md"), "---\ntimer: start\nduration: 0\n---\n# Waiting\n")
			File.write(File.join(root, "020-content.md"), "---\ntimer: pause\nduration: 60\n---\n# Content\n")
			File.write(File.join(root, "030-break.md"), "---\ntimer: resume\nduration: 0\n---\n# Break\n")
			File.write(File.join(root, "040-ending.md"), "---\ntimer: pause\nduration: 60\n---\n# Ending\n")
		end
		
		it "starts only when advancing away from the title" do
			expect(controller.clock).not.to be(:started?)
			controller.advance!
			
			expect(controller.current_index).to be == 1
			expect(controller.clock).to be(:running?)
			expect(controller.pacing).to be == :on_time
			expect(controller.total_duration).to be == 120
		end
		
		it "can advance without starting, pausing, or resuming the timer" do
			controller.advance!(timer: false)
			expect(controller.current_index).to be == 1
			expect(controller.clock).not.to be(:started?)
			
			controller.clock.start!
			controller.advance!(timer: false)
			expect(controller.current_index).to be == 2
			expect(controller.clock).to be(:running?)
			
			controller.clock.pause!
			elapsed = controller.clock.elapsed
			controller.advance!(timer: false)
			expect(controller.current_index).to be == 3
			expect(controller.clock).to be(:paused?)
			expect(controller.clock.elapsed).to be == elapsed
		end
		
		it "pauses before the break and resumes afterwards without resetting elapsed time" do
			controller.advance!
			controller.clock.restore!(42, running: true)
			controller.advance!
			
			expect(controller.current_index).to be == 2
			expect(controller.clock).to be(:paused?)
			elapsed = controller.clock.elapsed
			expect(elapsed).to be >= 42
			
			controller.advance!
			expect(controller.current_index).to be == 3
			expect(controller.clock).to be(:running?)
			expect(controller.clock.elapsed).to be >= elapsed
		end
		
		it "does not restart a running timer when revisiting the title" do
			controller.advance!
			controller.clock.restore!(42, running: true)
			sleep 0.01
			elapsed = controller.clock.elapsed
			
			controller.retreat!
			controller.advance!
			expect(controller.clock.elapsed).to be >= elapsed
		end
		
		it "preserves a manual pause when advancing from the title again" do
			controller.advance!
			controller.clock.restore!(42, running: false)
			controller.retreat!
			controller.advance!
			
			expect(controller.clock).to be(:paused?)
			expect(controller.clock.elapsed).to be == 42
		end
		
		it "does not start the timer for pause or resume actions" do
			controller.go_to(1)
			controller.advance!
			expect(controller.clock).not.to be(:started?)
			controller.advance!
			expect(controller.clock).not.to be(:started?)
			expect(controller.clock).not.to be(:running?)
		end
		
		it "does not trigger actions when navigating backwards, jumping, or reloading" do
			controller.go_to(2)
			controller.retreat!
			controller.go_to(0)
			controller.reload!
			expect(controller.clock).not.to be(:started?)
			
			controller.clock.start!
			controller.go_to(1)
			controller.retreat!
			controller.go_to(2)
			controller.reload!
			expect(controller.clock).to be(:running?)
		end
		
		it "does not trigger an action when advancing past the last slide" do
			controller.go_to(3)
			controller.clock.start!
			controller.advance!
			
			expect(controller.current_index).to be == 3
			expect(controller.clock).to be(:running?)
		end
		
		it "persists the updated timer together with the new slide position" do
			controller.advance!
			restored = subject.new(presentation, state: state)
			
			expect(restored.current_index).to be == 1
			expect(restored.clock).to be(:running?)
			
			controller.advance!
			restored = subject.new(presentation, state: state)
			expect(restored.current_index).to be == 2
			expect(restored.clock).to be(:paused?)
		end
		
		it "restores the waiting slide without starting the timer" do
			controller.save_state!
			restored = subject.new(presentation, state: state)
			
			expect(restored.current_index).to be == 0
			expect(restored.clock).not.to be(:started?)
		end
		
		it "notifies listeners after updating both the slide and the timer" do
			observed = []
			controller = self.controller
			listener = Object.new
			listener.define_singleton_method(:slide_changed!) do
				observed << [controller.current_index, controller.clock.running?]
			end
			controller.add_listener(listener)
			
			controller.advance!
			expect(observed).to be == [[1, true]]
		end
		
		it "returns zero progress for a zero-duration slide before the timer starts" do
			expect(controller.slide_progress).to be == 0.0
		end
		
		it "returns zero progress for a zero-duration slide before its expected start" do
			controller.go_to(2)
			controller.clock.restore!(59.0, running: false)
			expect(controller.slide_progress).to be == 0.0
		end
		
		it "returns full progress for a zero-duration slide at its expected start" do
			controller.clock.restore!(0.0, running: false)
			expect(controller.slide_progress).to be == 1.0
			
			controller.go_to(2)
			controller.clock.restore!(60.0, running: false)
			expect(controller.slide_progress).to be == 1.0
		end
		
		it "returns full progress for a zero-duration slide after its expected start" do
			controller.go_to(2)
			controller.clock.restore!(61.0, running: false)
			expect(controller.slide_progress).to be == 1.0
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
	
	with "#save_state!" do
		it "saves through the configured state" do
			saved = nil
			state = Object.new
			state.define_singleton_method(:restore){|controller|}
			state.define_singleton_method(:save){|controller| saved = controller}
			controller = subject.new(presentation, state: state)
			
			controller.save_state!
			
			expect(saved).to be == controller
		end
	end
	
	it "continues notifying listeners when one fails" do
		failed = Object.new
		failed.define_singleton_method(:slide_changed!){raise "Failed"}
		notified = false
		succeeded = Object.new
		succeeded.define_singleton_method(:slide_changed!){notified = true}
		controller.add_listener(failed)
		controller.add_listener(succeeded)
		
		controller.advance!
		
		expect(notified).to be == true
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
