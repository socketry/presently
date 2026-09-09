# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "live"

module Presently
	# A live view containing presentation slide content.
	class SlideView < Live::View
		# Render a presentation-relative slide path which can truncate its directory.
		# @parameter builder [XRB::Builder] The HTML builder.
		# @parameter path [String] The presentation-relative slide path.
		def render_slide_path(builder, path)
			directory = File.dirname(path)
			filename = File.basename(path)
			
			builder.tag(:code, class: "slide-path", title: path) do
				unless directory == "."
					builder.tag(:span, class: "slide-path-directory") do
						builder.text(directory)
					end
				end
				
				builder.tag(:span, class: "slide-path-filename") do
					builder.text(directory == "." ? filename : "/#{filename}")
				end
			end
		end
		
		# Ask the client to render the current slide view.
		# @parameter transition [String | Nil] The transition to apply while rendering.
		def render_slide!(transition: nil)
			dispatch_event(self.selector, "presently:slide:render",
				bubbles: true,
				detail: {
					html: self.to_html.to_s,
					transition: transition,
				}
			)
		end
	end
end
