# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "live"

module Presently
	# The home view which links to each presentation interface.
	class HomeView < Live::View
		INTERFACES = [
			{
				href: "/display",
				title: "Audience Display",
				description: "Show the synchronized presentation full-screen for the audience.",
			},
			{
				href: "/presenter",
				title: "Presenter Console",
				description: "Control the presentation with speaker notes, timing, and slide previews.",
			},
			{
				href: "/record",
				title: "Narration Recorder",
				description: "Record, review, and save narration for each slide.",
			},
			{
				href: "/playback",
				title: "Narrated Playback",
				description: "Review the complete presentation with its recorded narration.",
			},
		].map(&:freeze).freeze
		
		# Initialize the home view.
		# @parameter id [String] The unique element identifier.
		# @parameter data [Hash] The element data attributes.
		# @parameter controller [PresentationController | Nil] The shared presentation controller.
		def initialize(id = Live::Element.unique_id, data = {}, controller: nil)
			super(id, data)
		end
		
		# Render links to the available presentation interfaces.
		# @parameter builder [XRB::Builder] The HTML builder.
		def render(builder)
			builder.tag(:main, class: "home") do
				builder.tag(:div, class: "home-heading") do
					builder.tag(:p, class: "home-kicker"){builder.text("Presently")}
					builder.tag(:h1){builder.text("Presentation interfaces")}
					builder.tag(:p, class: "home-introduction") do
						builder.text("Choose an interface to present, control, record, or review your presentation.")
					end
				end
				
				builder.tag(:nav, class: "home-interfaces", "aria-label": "Presentation interfaces") do
					INTERFACES.each do |interface|
						builder.tag(:a, class: "home-interface", href: interface[:href]) do
							builder.tag(:strong){builder.text(interface[:title])}
							builder.tag(:span){builder.text(interface[:description])}
						end
					end
				end
			end
		end
	end
end
