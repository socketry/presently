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
		].freeze
		SLIDES_STYLESHEET = {href: "/_static/slides.css", media: "screen"}.freeze
		INTERFACE_STYLESHEETS = {
			home: [{href: "/_static/home.css", media: "screen"}.freeze].freeze,
			display: [SLIDES_STYLESHEET, {href: "/_static/display.css", media: "screen"}.freeze].freeze,
			presenter: [SLIDES_STYLESHEET, {href: "/_static/presenter.css", media: "screen"}.freeze].freeze,
			recorder: [SLIDES_STYLESHEET, {href: "/_static/recorder.css", media: "screen"}.freeze].freeze,
		}.freeze
		DEFAULT_INTERFACE_STYLESHEETS = INTERFACE_STYLESHEETS.values.flatten.uniq.freeze
		TRAILING_STYLESHEETS = [
			{href: "/_static/custom.css", media: "screen"}.freeze,
			{href: "/_components/@socketry/syntax/themes/base/syntax.css", media: "screen"}.freeze,
		].freeze
		IMPORTS = {
			"live" => "/_components/@socketry/live/Live.js",
			"live-audio" => "/_components/@socketry/live-audio/Live/Audio.js",
			"morphdom" => "/_components/morphdom/morphdom-esm.js",
			"@socketry/presently" => "/_components/@socketry/presently/Presently.js",
			"@socketry/syntax" => "/_components/@socketry/syntax/Syntax.js",
			"animejs" => "/_components/animejs/dist/bundles/anime.esm.min.js",
		}.freeze
		MODULES = ["/application.js"].freeze
		
		# Initialize a new page.
		# @parameter title [String] The page title.
		# @parameter body [Live::View | Nil] The Live view to embed in the page.
		# @parameter interface [Symbol | Nil] The interface-specific stylesheets to load, or all interface stylesheets by default for compatibility.
		# @parameter stylesheets [Array(String | Hash)] Presentation-specific stylesheets.
		def initialize(title: "Presently", body: nil, interface: nil, stylesheets: [])
			interface_stylesheets = interface ? INTERFACE_STYLESHEETS.fetch(interface) : DEFAULT_INTERFACE_STYLESHEETS
			
			super(
				title: title,
				body: body,
				icon: ICON,
				stylesheets: STYLESHEETS + interface_stylesheets + TRAILING_STYLESHEETS + stylesheets,
				imports: IMPORTS,
				modules: MODULES,
			)
		end
	end
end
