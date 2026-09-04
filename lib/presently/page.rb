# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "lively/page"

module Presently
	# The HTML page shell for a Presently view.
	#
	# Configures Lively's generic page with Presently's assets and embedded Live
	# view component.
	class Page < Lively::Page
		ICON = "/_static/icon.png"
		STYLESHEETS = [
			{href: "/_static/site.css", media: "screen"}.freeze,
			{href: "/_static/index.css", media: "screen"}.freeze,
			{href: "/_static/custom.css", media: "screen"}.freeze,
			{href: "/_components/@socketry/syntax/themes/base/syntax.css", media: "screen"}.freeze,
		].freeze
		IMPORTS = {
			"live" => "/_components/@socketry/live/Live.js",
			"live-audio" => "/_components/@socketry/live-audio/Live/Audio.js",
			"morphdom" => "/_components/morphdom/morphdom-esm.js",
			"@socketry/syntax" => "/_components/@socketry/syntax/Syntax.js",
		}.freeze
		MODULES = ["/application.js"].freeze
		
		# Initialize a new page.
		# @parameter title [String] The page title.
		# @parameter body [Live::View | Nil] The Live view to embed in the page.
		def initialize(title: "Presently", body: nil)
			super(
				title: title,
				body: body,
				icon: ICON,
				stylesheets: STYLESHEETS,
				imports: IMPORTS,
				modules: MODULES,
			)
		end
	end
end
