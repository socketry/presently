# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

module Presently
	# A simple clock that tracks elapsed time with start, pause, resume, and reset.
	#
	# A ready clock waits to start at its current elapsed time. It accumulates time
	# while running and freezes it when paused.
	class Clock
		# Initialize a new clock in the ready state at zero.
		def initialize
			@elapsed = 0
			@started = false
			@running = false
			@last_tick = nil
		end
		
		# Whether the clock is running or paused; false when ready.
		# @returns [Boolean]
		def started?
			@started
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
		# Includes time accumulated up to now if running, or frozen time if paused or ready.
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
			@started = true
			@running = true
			@last_tick = Time.now
		end
		
		# Directly restore the clock to a previously persisted state.
		# @parameter elapsed [Numeric] The elapsed time to restore.
		# @parameter running [Boolean] Whether the clock should resume running.
		def restore!(elapsed, running:)
			@started = true
			@elapsed = elapsed
			@running = running
			@last_tick = running ? Time.now : nil
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
		
		# Reset the clock to its initial, ready state, or set its elapsed time.
		# A numeric value preserves whether the clock is running; a ready clock becomes paused.
		# Pass `started: false` to make the clock ready at the given elapsed time.
		# @parameter elapsed [Numeric | Nil] The elapsed time in seconds, or `nil` to clear the clock.
		# @parameter started [Boolean] Whether the clock is running or paused at the reset position; false makes it ready.
		def reset!(elapsed = nil, started: !elapsed.nil?)
			@elapsed = elapsed || 0
			@started = started
			@running = @started && @running
			@last_tick = @running ? Time.now : nil
		end
	end
end
