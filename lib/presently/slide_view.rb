# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "live"

module Presently
	# A live view containing presentation slide content.
	class SlideView < Live::View
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
