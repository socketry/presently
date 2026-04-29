# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "uri"
require "xrb/template"
require "xrb/markup"

require_relative "slide_renderer"

module Presently
	# Renders a self-contained, print-ready HTML page containing all slides for PDF export.
	#
	# All slides are rendered in a single page with CSS `break-after: page`, so a single
	# WebDriver `print()` call produces a multi-page PDF without any merging step.
	#
	# Page dimensions are fixed at 1280×720 px (16:9) for the slide area, with an optional
	# 200 px notes panel below each slide. The corresponding centimetre values are used as
	# WebDriver print page dimensions so the output is pixel-perfect at 96 dpi.
	class Export
		# Slide canvas dimensions in CSS pixels.
		SLIDE_WIDTH_PX  = 1280
		SLIDE_HEIGHT_PX = 720
		
		# Notes panel height in CSS pixels.
		NOTES_HEIGHT_PX = 200
		
		# Slide dimensions in centimetres for WebDriver print (96 px/inch × 2.54 cm/inch).
		SLIDE_WIDTH_CM  = (SLIDE_WIDTH_PX  / 96.0 * 2.54).round(4)
		SLIDE_HEIGHT_CM = (SLIDE_HEIGHT_PX / 96.0 * 2.54).round(4)
		NOTES_HEIGHT_CM = (NOTES_HEIGHT_PX / 96.0 * 2.54).round(4)
		
		TEMPLATE = XRB::Template.load_file(File.expand_path("export.xrb", __dir__))
		
		# Parse export options from a URL query string.
		# @parameter query [String | Nil] The raw query string, e.g. `"notes=true&speaker=true"`.
		# @returns [Hash] Options suitable for passing to {.new}.
		def self.options_from_query(query)
			return {} unless query
			
			params = URI.decode_www_form(query).to_h
			{
				notes:   params["notes"]   != "false",
				speaker: params["speaker"] != "false",
				timing:  params["timing"]  != "false",
			}
		end
		
		# @parameter presentation [Presentation] The presentation to export.
		# @parameter notes [Boolean] Whether to include presenter notes below each slide.
		# @parameter speaker [Boolean] Whether to include the speaker name.
		# @parameter timing [Boolean] Whether to include per-slide timing information.
		def initialize(presentation:, notes: true, speaker: true, timing: true)
			@presentation = presentation
			@notes        = notes
			@speaker      = speaker
			@timing       = timing
			@renderer     = SlideRenderer.new
		end
		
		# @attribute [Boolean] Whether presenter notes are included.
		attr :notes
		
		# @attribute [Boolean] Whether speaker names are included.
		attr :speaker
		
		# @attribute [Boolean] Whether slide timing is included.
		attr :timing
		
		# Render a single slide to an HTML string.
		# @parameter slide [Slide] The slide to render.
		# @returns [XRB::MarkupString]
		def render_slide(slide)
			@renderer.render_to_html(slide)
		end
		
		# Render the notes panel for a single slide.
		# @parameter slide [Slide] The slide to render notes for.
		# @parameter index [Integer] The 1-based slide index.
		# @returns [XRB::MarkupString]
		def render_notes(slide, index)
			builder = XRB::Builder.new
			
			# Meta strip — mirrors the presenter view's timing bar.
			builder.tag(:div, class: "export-meta") do
				builder.tag(:span, class: "export-slide-number") do
					builder.text("Slide #{index} of #{@presentation.slide_count}")
				end
				
				builder.tag(:span, class: "export-filename") do
					builder.tag(:code) { builder.text(File.basename(slide.path)) }
				end
				
				if @timing
					elapsed = expected_time_at(index - 1)
					builder.tag(:span, class: "export-elapsed") do
						builder.text("Elapsed: #{format_duration(elapsed)}")
					end
					builder.tag(:span, class: "export-duration") do
						builder.text("Slide: #{format_duration(slide.duration)}")
					end
				end
				
				if @speaker && slide.speaker
					builder.tag(:span, class: "export-speaker") do
						builder.tag(:span, class: "speaker-label") { builder.text("🎤") }
						builder.text(" #{slide.speaker}")
					end
				end
			end
			
			# Notes panel — mirrors the presenter view's .notes section.
			builder.tag(:div, class: "notes") do
				builder.tag(:div, class: "notes-content") do
					if slide.notes && !slide.notes.empty?
						builder.raw(slide.notes.to_html)
					else
						builder.tag(:p, class: "no-notes") { builder.text("No presenter notes for this slide.") }
					end
				end
			end
			
			XRB::MarkupString.raw(builder.to_s)
		end
		
		# Format a duration in seconds as `MM:SS`.
		# @parameter seconds [Integer] Duration in seconds.
		# @returns [String]
		def format_duration(seconds)
			minutes = seconds / 60
			secs    = seconds % 60
			format("%02d:%02d", minutes, secs)
		end
		
		# Calculate the expected elapsed time at the start of the given slide index.
		# @parameter index [Integer] Zero-based slide index.
		# @returns [Integer] Elapsed seconds up to (but not including) that slide.
		def expected_time_at(index)
			@presentation.slides.first(index).sum(&:duration)
		end
		
		# Render the full export page to an HTML string.
		# @returns [String]
		def call
			TEMPLATE.to_string(self)
		end
		
		# The slides in the presentation.
		# @returns [Array(Slide)]
		def slides
			@presentation.slides
		end
	end
end
