# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "console"

require_relative "clock"
require_relative "presentation"
require_relative "state"

module Presently
	# Manages the mutable state of a presentation: current slide, clock, and listeners.
	#
	# Wraps an immutable {Presentation} and provides navigation, timing, and listener notification.
	# Multiple views (display, presenter) can register as listeners to receive updates.
	class PresentationController
		# Initialize a new controller for the given presentation.
		# @parameter presentation [Presentation] The presentation to control.
		# @parameter state [State | Nil] The state persistence object. If provided, state is saved on changes and restored on initialization.
		# @parameter recordings [Recordings | Nil] The narration recording store, when recording is enabled.
		def initialize(presentation, state: nil, recordings: nil)
			@presentation = presentation
			@recordings = recordings
			@current_index = 0
			@clock = Clock.new
			@listeners = []
			
			state&.restore(self)
			@state = state
		end
		
		# @attribute [Presentation] The underlying presentation data.
		attr :presentation
		
		# @attribute [Integer] The index of the current slide.
		attr :current_index
		
		# @attribute [Clock] The presentation timer.
		attr :clock
		
		# The template resolver, delegated to the presentation.
		# @returns [Templates] The templates instance.
		def templates
			@presentation.templates
		end
		
		# The ordered list of slides, delegated to the presentation.
		# @returns [Array(Slide)] The slides.
		def slides
			@presentation.slides
		end
		
		# The currently displayed slide.
		# @returns [Slide | Nil] The current slide, or `nil` if no slides are loaded.
		def current_slide
			@presentation.slides[@current_index]
		end
		
		# Whether the given slide has a narration recording.
		# @parameter slide [Slide] The slide to check.
		# @returns [Boolean]
		def recording_available?(slide)
			@recordings&.exist?(slide) || false
		end
		
		# The slide following the current one.
		# @returns [Slide | Nil] The next slide, or `nil` if on the last slide.
		def next_slide
			@presentation.slides[@current_index + 1]
		end
		
		# The slide preceding the current one.
		# @returns [Slide | Nil] The previous slide, or `nil` if on the first slide.
		def previous_slide
			@presentation.slides[@current_index - 1] if @current_index > 0
		end
		
		# The total number of slides.
		# @returns [Integer] The slide count.
		def slide_count
			@presentation.slide_count
		end
		
		# The total expected duration of the presentation.
		# @returns [Numeric] The total duration in seconds.
		def total_duration
			@presentation.total_duration
		end
		
		# The progress through the current slide's allocated time.
		# Slides with durations of zero or less are complete once their expected start time is reached.
		# @returns [Float] A value between 0.0 and 1.0.
		def slide_progress
			return 0.0 unless @clock.started?
			
			slide = current_slide
			return 0.0 unless slide
			
			time_into_slide = @clock.elapsed - @presentation.expected_time_at(@current_index)
			if slide.duration <= 0
				time_into_slide.negative? ? 0.0 : 1.0
			else
				(time_into_slide / slide.duration).clamp(0.0, 1.0)
			end
		end
		
		# Reset a paused timer to begin the current slide again.
		# A `timer: start` slide clears the clock, ready to start when advancing.
		# Other slides reset to their expected start time and remain paused.
		def reset_timer!
			return unless @clock.paused? && current_slide
			
			if current_slide.timer == "start"
				@clock.reset!
			else
				@clock.reset!(@presentation.expected_time_at(@current_index))
			end
			
			notify_listeners!
		end
		
		# The current pacing status relative to the slide timing.
		# @returns [Symbol | Nil] One of `:on_time`, `:ahead`, or `:behind`, or `nil` when no presentation time is allocated.
		def pacing
			return unless total_duration.positive?
			return :on_time unless @clock.started?
			
			elapsed = @clock.elapsed
			slide_start = @presentation.expected_time_at(@current_index)
			slide_end = @presentation.expected_time_at(@current_index + 1)
			
			if elapsed > slide_end
				:behind
			elsif elapsed < slide_start
				:ahead
			else
				:on_time
			end
		end
		
		# The estimated time remaining in the presentation.
		# @returns [Numeric] The remaining time in seconds.
		def time_remaining
			return total_duration unless @clock.started?
			
			expected_remaining = @presentation.expected_time_at(slide_count) - @clock.elapsed
			
			[expected_remaining, 0].max
		end
		
		# Navigate to a specific slide by index.
		# Ignores out-of-bounds indices. Notifies listeners on change.
		# @parameter index [Integer] The slide index to navigate to.
		# @parameter timer [Boolean] Whether to apply the outgoing slide's timer action before notifying listeners.
		# @returns [Boolean] Whether the destination index was valid.
		def go_to(index, timer: false)
			return false if index < 0 || index >= slide_count
			
			advance_timer! if timer
			@current_index = index
			notify_listeners!
			return true
		end
		
		# Advance to the next slide, applying the current slide's timer action.
		# Timer actions only run when there is a next slide.
		# @parameter timer [Boolean] Whether to apply the outgoing slide's timer action.
		# @returns [Boolean] Whether the presentation advanced to the next slide.
		def advance!(timer: true)
			go_to(@current_index + 1, timer: timer)
		end
		
		# Go back to the previous slide.
		# @returns [Boolean] Whether the presentation moved to the previous slide.
		def retreat!
			go_to(@current_index - 1)
		end
		
		# Register a listener to be notified when the slide changes.
		# The listener must respond to `#slide_changed!`.
		# @parameter listener [Object] The listener to add.
		def add_listener(listener)
			@listeners << listener
		end
		
		# Remove a previously registered listener.
		# @parameter listener [Object] The listener to remove.
		def remove_listener(listener)
			@listeners.delete(listener)
		end
		
		# Reload slides from disk and notify listeners.
		def reload!
			@presentation = @presentation.reload
			notify_listeners!
		end
		
		# Persist the current state to disk.
		def save_state!
			@state&.save(self)
		end
		
		private
		
		# Apply the outgoing slide's timer action without resetting elapsed time.
		def advance_timer!
			case current_slide.timer
			when "start"
				@clock.start! unless @clock.started?
			when "pause"
				@clock.pause!
			when "resume"
				@clock.resume! if @clock.started?
			end
		end
		
		# Notify all registered listeners that the slide has changed, and persist state.
		def notify_listeners!
			@state&.save(self)
			
			@listeners.each do |listener|
				listener.slide_changed!
			rescue => error
				Console.warn(self, "Listener notification failed", exception: error)
			end
		end
	end
end
