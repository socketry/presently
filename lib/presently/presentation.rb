# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require_relative "slide"
require_relative "stylesheet"
require_relative "templates"

module Presently
	# An immutable collection of slides with configuration.
	#
	# Use {.load} to create a presentation from a directory of Markdown files.
	# Each loaded {Slide} is attached to its presentation and identified by a
	# path relative to the presentation root.
	class Presentation
		# Load a presentation from a directory of Markdown slide files.
		# @parameter root [String] The directory containing `.md` slide files.
		# @parameter templates [Templates] The template resolver for loading slide templates.
		# @returns [Presentation] A new presentation with slides loaded from the directory.
		def self.load(root = "slides", templates = Templates.for)
			new(root, templates)
		end
		
		# Initialize a new presentation.
		# @parameter root [String] The root directory containing slide files.
		# @parameter templates [Templates] The template resolver for loading slide templates.
		def initialize(root = "slides", templates = Templates.for)
			@root = File.expand_path(root)
			@templates = templates
			@slides = load_slides
			@stylesheets = Stylesheet.discover(@root, @slides)
		end
		
		# @attribute [String] The absolute root directory containing slide files.
		attr :root
		
		# @attribute [Array(Slide)] The ordered list of slides.
		attr :slides
		
		# @attribute [Array(Stylesheet)] The ordered presentation stylesheets.
		attr :stylesheets
		
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
		# @returns [Presentation] A new presentation instance.
		def reload
			self.class.new(@root, @templates.reload)
		end
		
		private
		
		# Load slides recursively in relative path order.
		# @returns [Array(Slide)] The loaded, sorted, non-skipped slides.
		def load_slides
			Dir.glob("**/*.md", base: @root).sort.filter_map do |path|
				components = path.split(File::SEPARATOR)
				next unless components.all?{|component| component.match?(/\A\d/)}
				
				slide = Slide.load(self, path)
				slide unless slide.skip?
			end
		end
	end
end
