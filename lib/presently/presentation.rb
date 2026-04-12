# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require_relative "slide"
require_relative "templates"

module Presently
	# An immutable collection of slides with configuration.
	#
	# Use {.load} to create a presentation from a directory of Markdown files,
	# or initialize directly with an array of {Slide} instances.
	class Presentation
		# Load and sort slide files from a directory.
		# @parameter slides_root [String] The directory containing `.md` slide files.
		# @returns [Array(Slide)] The loaded, sorted, non-skipped slides.
		def self.slides_from(slides_root)
			Dir.glob(File.join(slides_root, "*.md")).sort.map{|path| Slide.load(path)}.reject(&:skip?)
		end
		
		# Load a presentation from a directory of Markdown slide files.
		# @parameter slides_root [String] The directory containing `.md` slide files.
		# @parameter options [Hash] Additional options passed to {#initialize}.
		# @returns [Presentation] A new presentation with slides loaded from the directory.
		def self.load(slides_root = "slides", **options)
			new(slides_from(slides_root), slides_root: slides_root, **options)
		end
		
		# Initialize a new presentation.
		# @parameter slides [Array(Slide)] The ordered list of slides.
		# @parameter slides_root [String | Nil] The directory slides were loaded from, used by {#reload}.
		# @parameter templates [Templates] The template resolver for loading slide templates.
		def initialize(slides = [], slides_root: nil, templates: Templates.for)
			@slides = slides
			@slides_root = slides_root
			@templates = templates
		end
		
		# @attribute [Array(Slide)] The ordered list of slides.
		attr :slides
		
		# @attribute [String | Nil] The directory slides were loaded from.
		attr :slides_root
		
		# @attribute [Templates] The template resolver.
		attr :templates
		
		# The number of slides in the presentation.
		# @returns [Integer] The slide count.
		def slide_count
			@slides.length
		end
		
		# The total expected duration of the presentation in seconds.
		# @returns [Numeric] The sum of all slide durations.
		def total_duration
			@slides.sum(&:duration)
		end
		
		# Calculate the expected elapsed time for slides up to the given index.
		# @parameter index [Integer] The slide index (exclusive).
		# @returns [Numeric] The sum of durations for slides before the given index.
		def expected_time_at(index)
			@slides[0...index].sum(&:duration)
		end
		
		# Return a new {Presentation} with freshly loaded slides and a cleared template cache.
		# Only works if the presentation was created with {.load}.
		# @returns [Presentation] A new presentation instance, or `self` if no slides root is set.
		def reload
			return self unless @slides_root
			
			self.class.new(self.class.slides_from(@slides_root), slides_root: @slides_root, templates: @templates.reload)
		end
	end
end
