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
	class Export
		# Holds slide canvas and notes panel dimensions, and converts between CSS pixels
		# and centimetres for WebDriver print (96 px/inch × 2.54 cm/inch).
		PageSize = Struct.new(:slide_width_px, :slide_height_px, :notes_height_px, keyword_init: true) do
			PX_PER_CM = 96.0 / 2.54
			
			def slide_width_cm  = (slide_width_px  / PX_PER_CM).round(4)
			def slide_height_cm = (slide_height_px / PX_PER_CM).round(4)
			def notes_height_cm = (notes_height_px / PX_PER_CM).round(4)
		end
		
		PageSize::DEFAULT = PageSize.new(slide_width_px: 1920, slide_height_px: 1080, notes_height_px: 300)
		
		TEMPLATE = XRB::Template.load_file(File.expand_path("export.xrb", __dir__))
		
		# Parse export options from a URL query string.
		# @parameter query [String | Nil] The raw query string, e.g. `"notes=true&speaker=true"`.
		# @returns [Hash] Options suitable for passing to {.new}.
		def self.options_from_query(query)
			return {} unless query
			
			params = URI.decode_www_form(query).to_h
			
			page_size = PageSize.new(
				slide_width_px:  (params["slide_width_px"]  || PageSize::DEFAULT.slide_width_px).to_i,
				slide_height_px: (params["slide_height_px"] || PageSize::DEFAULT.slide_height_px).to_i,
				notes_height_px: (params["notes_height_px"] || PageSize::DEFAULT.notes_height_px).to_i,
			)
			
			{
				notes:     params["notes"]   != "false",
				speaker:   params["speaker"] != "false",
				timing:    params["timing"]  != "false",
				page_size: page_size,
			}
		end
		
		# @parameter presentation [Presentation] The presentation to export.
		# @parameter page_size [PageSize] Slide canvas and notes panel dimensions.
		# @parameter notes [Boolean] Whether to include presenter notes below each slide.
		# @parameter speaker [Boolean] Whether to include the speaker name.
		# @parameter timing [Boolean] Whether to include per-slide timing information.
		def initialize(presentation:, page_size: PageSize::DEFAULT, notes: true, speaker: true, timing: true)
			@presentation = presentation
			@page_size    = page_size
			@notes        = notes
			@speaker      = speaker
			@timing       = timing
			@renderer     = SlideRenderer.new
		end
		
		# @attribute [PageSize] The slide canvas and notes panel dimensions.
		attr :page_size
		
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
