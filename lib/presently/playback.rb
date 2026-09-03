# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "uri"
require "xrb/template"

require_relative "slide_renderer"

module Presently
	# Renders an isolated, narrated presentation for review and video capture.
	#
	# Unlike the live display, playback owns its current slide entirely in the
	# browser and does not update the shared presentation controller.
	class Playback
		TEMPLATE = XRB::Template.load_file(File.expand_path("playback.xrb", __dir__))
		
		# Parse playback options from a URL query string.
		# @parameter query [String | Nil] The raw query string.
		# @returns [Hash] Options suitable for passing to {.new}.
		def self.options_from_query(query)
			parameters = URI.decode_www_form(query.to_s).to_h
			
			{
				autoplay: parameters["autoplay"] == "true",
				controls: parameters["controls"] != "false",
			}
		end
		
		# @parameter presentation [Presentation] The presentation to play.
		# @parameter recording_urls [Array(String | Nil)] Narration URL for each slide.
		# @parameter autoplay [Boolean] Whether playback should begin when ready.
		# @parameter controls [Boolean] Whether playback controls should be visible.
		def initialize(presentation:, recording_urls:, autoplay: false, controls: true)
			@presentation = presentation
			@recording_urls = recording_urls
			@autoplay = autoplay
			@controls = controls
			@renderer = SlideRenderer.new(templates: presentation.templates)
		end
		
		attr :autoplay
		attr :controls
		
		# @returns [Array(Slide)] The slides in playback order.
		def slides
			@presentation.slides
		end
		
		# @returns [String | Nil] The narration URL for a slide index.
		def recording_url(index)
			@recording_urls[index]
		end
		
		# Render one slide as HTML.
		# @parameter slide [Slide] The slide to render.
		# @returns [XRB::MarkupString]
		def render_slide(slide)
			@renderer.render_to_html(slide)
		end
		
		# Render the complete playback page.
		# @returns [String]
		def call
			TEMPLATE.to_string(self)
		end
	end
end
