# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "xrb/template"

require_relative "slide_renderer"

module Presently
	# Renders an isolated, narrated presentation for review and video capture.
	#
	# Unlike the live display, playback owns its current slide entirely in the
	# browser and does not update the shared presentation controller.
	class Playback
		TEMPLATE = XRB::Template.load_file(File.expand_path("playback.xrb", __dir__))
		
		# Extract playback options from decoded query parameters.
		# @parameter parameters [Hash] The decoded query parameters.
		# @returns [Hash] Options suitable for passing to {.new}.
		def self.options_from_parameters(parameters)
			{
				autoplay: parameters["autoplay"] == "true",
				controls: parameters["controls"] != "false",
			}
		end
		
		# @parameter presentation [Presentation] The presentation to play.
		# @parameter recording_urls [Array(String | Nil)] Narration URL for each slide.
		# @parameter autoplay [Boolean] Whether playback should begin when ready.
		# @parameter controls [Boolean] Whether playback controls should be visible.
		# @parameter asset_prefix [String] Prefix for playback, component, and slide asset URLs.
		def initialize(presentation:, recording_urls:, autoplay: false, controls: true, asset_prefix: "")
			@presentation = presentation
			@recording_urls = recording_urls
			@autoplay = autoplay
			@controls = controls
			@asset_prefix = asset_prefix
			@renderer = SlideRenderer.new(templates: presentation.templates)
		end
		
		attr :autoplay
		attr :controls
		
		# @returns [Array(Stylesheet)] The ordered presentation stylesheets.
		def stylesheets
			@presentation.stylesheets
		end
		
		# @returns [Array(Slide)] The slides in playback order.
		def slides
			@presentation.slides
		end
		
		# @returns [String | Nil] The narration URL for a slide index.
		def recording_url(index)
			@recording_urls[index]
		end
		
		# Prefix an application-relative asset URL for the current playback target.
		# @parameter path [String] An absolute application asset path.
		# @returns [String] The prefixed asset URL.
		def asset_url(path)
			return path if @asset_prefix.empty?
			
			@asset_prefix.sub(%r{/\z}, "") + "/" + path.sub(%r{\A/}, "")
		end
		
		# Resolve a presentation stylesheet URL for the current playback target.
		# @parameter stylesheet [Stylesheet] The presentation stylesheet.
		# @returns [String] The prefixed stylesheet URL.
		def stylesheet_url(stylesheet)
			asset_url(stylesheet.url)
		end
		
		# Render one slide as HTML.
		# @parameter slide [Slide] The slide to render.
		# @returns [XRB::MarkupString]
		def render_slide(slide)
			html = @renderer.render_to_html(slide)
			return html if @asset_prefix.empty?
			
			XRB::MarkupString.raw(html.to_s.gsub(Stylesheet::PREFIX, asset_url(Stylesheet::PREFIX)))
		end
		
		# Render the complete playback page.
		# @returns [String]
		def call
			TEMPLATE.to_string(self)
		end
	end
end
