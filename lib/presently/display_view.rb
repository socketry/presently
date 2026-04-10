# frozen_string_literal: true

require "live"
require_relative "slide_view"

module Presently
	# The audience-facing display view (full screen presentation).
	class DisplayView < Live::View
		def initialize(id = Live::Element.unique_id, data = {}, presentation: nil)
			super(id, data)
			@presentation = presentation
			@slide_renderer = SlideView.new(css_class: "slide current")
		end
		
		def bind(page)
			super
			@presentation.add_listener(self)
			self.update!
		end
		
		def close
			@presentation.remove_listener(self)
			super
		end
		
		def slide_changed!
			self.update!
		end
		
		def handle(event)
			Console.info(self, "Display handle event", event: event)
			case event.dig(:detail, :action)
			when "next"
				@presentation.advance!
			when "previous"
				@presentation.retreat!
			end
		end
		
		def render(builder)
			slide = @presentation.current_slide
			return unless slide
			
			builder.tag(:div, class: "display") do
				builder.tag(:div, class: "slide-container") do
					@slide_renderer.render_slide(builder, slide)
				end
				
				# Slide counter
				builder.tag(:div, class: "slide-counter") do
					builder.text("#{@presentation.current_index + 1} / #{@presentation.slide_count}")
				end
			end
		end
	end
end
