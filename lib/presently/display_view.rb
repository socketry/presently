# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "live"
require_relative "slide_view"

module Presently
	# The audience-facing display view that renders the current slide full-screen.
	#
	# Connects to the {PresentationController} as a listener and updates
	# whenever the slide changes. Pushes the current state on WebSocket reconnect.
	class DisplayView < Live::View
		# Initialize a new display view.
		# @parameter id [String] The unique element identifier.
		# @parameter data [Hash] The element data attributes.
		# @parameter controller [PresentationController | Nil] The shared presentation controller.
		def initialize(id = Live::Element.unique_id, data = {}, controller: nil)
			super(id, data)
			@controller = controller
			@slide_renderer = SlideView.new(css_class: "slide current", controller: controller)
		end
		
		# Bind this view to a page and register as a listener.
		# Immediately pushes the current state to the client.
		# @parameter page [Live::Page] The page this view is bound to.
		def bind(page)
			super
			@controller.add_listener(self)
			self.update!
		end
		
		# Close this view and unregister as a listener.
		def close
			@controller.remove_listener(self)
			super
		end
		
		# Called by the controller when the slide changes.
		def slide_changed!
			self.update!
		end
		
		# Handle an event from the client.
		# @parameter event [Hash] The event data with `:detail` containing the action.
		def handle(event)
			case event.dig(:detail, :action)
			when "next"
				@controller.advance!
			when "previous"
				@controller.retreat!
			end
		end
		
		# Render the display view.
		# @parameter builder [XRB::Builder] The HTML builder.
		def render(builder)
			slide = @controller.current_slide
			return unless slide
			
			builder.tag(:div, class: "display", data: {transition: slide.transition}) do
				builder.tag(:div, class: "slide-container") do
					@slide_renderer.render_slide(builder, slide)
				end
				
				builder.tag(:div, class: "slide-counter") do
					builder.text("#{@controller.current_index + 1} / #{@controller.slide_count}")
				end
			end
		end
	end
end
