# frozen_string_literal: true

module Presently
	# A simple clock that tracks elapsed time with start, pause, resume, and reset.
	class Clock
		def initialize
			@elapsed = 0
			@running = false
			@last_tick = nil
		end
		
		def started?
			!@last_tick.nil?
		end
		
		def running?
			@running
		end
		
		def paused?
			started? && !@running
		end
		
		def elapsed
			if @running
				@elapsed + (Time.now - @last_tick)
			else
				@elapsed
			end
		end
		
		def start!
			@running = true
			@last_tick = Time.now
		end
		
		def pause!
			return unless @running
			
			@elapsed += Time.now - @last_tick
			@running = false
		end
		
		def resume!
			return if @running
			
			@running = true
			@last_tick = Time.now
		end
		
		def reset!(elapsed = 0)
			@elapsed = elapsed
			@last_tick = Time.now if @running
		end
	end
end
