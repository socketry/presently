# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

module Presently
	# A simple clock that tracks elapsed time with start, pause, resume, and reset.
	#
	# The clock accumulates elapsed time while running and freezes it when paused.
	class Clock
		# Initialize a new clock in the stopped state.
		def initialize
			@elapsed = 0
			@running = false
			@last_tick = nil
		end
		
		# Whether the clock has been started at least once.
		# @returns [Boolean]
		def started?
			!@last_tick.nil?
		end
		
		# Whether the clock is currently running and accumulating time.
		# @returns [Boolean]
		def running?
			@running
		end
		
		# Whether the clock has been started but is currently paused.
		# @returns [Boolean]
		def paused?
			started? && !@running
		end
		
		# The total elapsed time in seconds.
		# Includes time accumulated up to now if running, or frozen time if paused.
		# @returns [Numeric] The elapsed time in seconds.
		def elapsed
			if @running
				@elapsed + (Time.now - @last_tick)
			else
				@elapsed
			end
		end
		
		# Start the clock. Begins accumulating time from now.
		def start!
			@running = true
			@last_tick = Time.now
		end
		
		# Pause the clock. Freezes the elapsed time at the current value.
		def pause!
			return unless @running
			
			@elapsed += Time.now - @last_tick
			@running = false
		end
		
		# Resume the clock after a pause. Continues accumulating time from now.
		def resume!
			return if @running
			
			@running = true
			@last_tick = Time.now
		end
		
		# Reset the elapsed time to the given value.
		# If running, continues from the new value. If paused, sets the frozen value.
		# @parameter elapsed [Numeric] The new elapsed time in seconds.
		def reset!(elapsed = 0)
			@elapsed = elapsed
			@last_tick = Time.now if @running
		end
	end
end
