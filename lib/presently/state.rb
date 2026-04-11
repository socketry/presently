# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "json"

module Presently
	# Persists and restores presentation controller state to/from a JSON file.
	#
	# Tracks the current slide index, clock elapsed time, and clock running state.
	# This allows the presentation to survive server restarts without losing position.
	class State
		# The default state file path.
		DEFAULT_PATH = ".presently.json"
		
		# Initialize a new state instance.
		# @parameter path [String] The file path for the state file.
		def initialize(path = DEFAULT_PATH)
			@path = path
		end
		
		# @attribute [String] The file path for the state file.
		attr :path
		
		# Save the controller's current state to disk.
		# @parameter controller [PresentationController] The controller to save.
		def save(controller)
			data = {
				current_index: controller.current_index,
				elapsed: controller.clock.elapsed,
				running: controller.clock.running?,
				started: controller.clock.started?,
			}
			
			File.write(@path, JSON.pretty_generate(data))
		rescue => error
			Console.warn(self, "Failed to save state", error: error)
		end
		
		# Restore state into the given controller.
		# @parameter controller [PresentationController] The controller to restore into.
		def load(controller)
			return unless File.exist?(@path)
			
			data = JSON.parse(File.read(@path), symbolize_names: true)
			
			# Restore slide position:
			if index = data[:current_index]
				controller.go_to(index.to_i)
			end
			
			# Restore clock state:
			if data[:started]
				controller.clock.start!
				controller.clock.reset!(data[:elapsed].to_f)
				
				unless data[:running]
					controller.clock.pause!
				end
			end
		rescue => error
			Console.warn(self, "Failed to load state", error: error)
		end
	end
end
