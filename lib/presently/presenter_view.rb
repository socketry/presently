# frozen_string_literal: true

require "live"
require_relative "slide_view"

module Presently
	# The presenter-facing view with notes, timing, and slide previews.
	class PresenterView < Live::View
		def initialize(id = Live::Element.unique_id, data = {}, presentation: nil)
			super(id, data)
			@presentation = presentation
			@clock_task = nil
		end
		
		def bind(page)
			super
			@presentation.add_listener(self)
			
			# Update only the timing section every second.
			@clock_task = Async do
				while true
					update_timing!
					sleep 1
				end
			end
		end
		
		def close
			@clock_task&.stop
			@presentation.remove_listener(self)
			super
		end
		
		def slide_changed!
			self.update!
		end
		
		def update_timing!
			replace(".timing") do |builder|
				render_timing(builder, @presentation.current_slide)
			end
		end
		
		def handle(event)
			Console.info(self, "Presenter handle event", event: event)
			action = event.dig(:detail, :action)
			
			case action
			when "next"
				@presentation.advance!
			when "previous"
				@presentation.retreat!
			when "pause"
				if !@presentation.clock.started?
					@presentation.clock.start!
				elsif @presentation.clock.paused?
					@presentation.clock.resume!
				else
					@presentation.clock.pause!
				end
			when "reset"
				@presentation.reset_timer!
			when "reload"
				@presentation.reload!
			end
		end
		
		def render_timing(builder, slide)
			progress = (@presentation.slide_progress * 100).round(1)
			builder.tag(:div, class: "timing", style: "--slide-progress: #{progress}%") do
				pacing = @presentation.pacing
				pacing_class = case pacing
				when :behind then "behind"
				when :ahead then "ahead"
				else "on-time"
				end
				
				builder.tag(:div, class: "timing-info #{pacing_class}") do
					builder.tag(:button,
						class: "pause-button",
						onClick: forward_event(action: "pause")
					) do
						label = if !@presentation.clock.started?
							"▶ Start"
						elsif @presentation.clock.paused?
							"▶ Resume"
						else
							"⏸ Pause"
						end
						builder.text(label)
					end
					
					builder.tag(:button,
						class: "pause-button",
						onClick: forward_event(action: "reset")
					) do
						builder.text("↺ Reset")
					end
					
					builder.tag(:span, class: "elapsed") do
						builder.text("Elapsed: #{format_duration(@presentation.clock.elapsed)}")
					end
					
					builder.tag(:span, class: "remaining") do
						builder.text("Remaining: #{format_duration(@presentation.time_remaining)}")
					end
					
					builder.tag(:span, class: "pacing-indicator") do
						indicator = case pacing
						when :behind then "⏩ Speed up"
						when :ahead then "⏪ Slow down"
						else "✓ On time"
						end
						builder.text(indicator)
					end
					
					if slide
						builder.tag(:span, class: "slide-duration") do
							builder.text("Slide: #{format_duration(slide.duration)}")
						end
					end
				end
			end
		end
		
		def format_duration(seconds)
			seconds = seconds.to_i
			minutes = seconds / 60
			secs = seconds % 60
			format("%d:%02d", minutes, secs)
		end
		
		def render(builder)
			slide = @presentation.current_slide
			next_slide = @presentation.next_slide
			
			builder.tag(:div, class: "presenter") do
				# Controls bar
				builder.tag(:div, class: "controls") do
					builder.tag(:button,
						onClick: forward_event(action: "previous")
					) do
						builder.text("← Previous")
					end
					
					builder.tag(:span, class: "slide-info") do
						builder.text("Slide #{@presentation.current_index + 1} of #{@presentation.slide_count}")
					end
					
					builder.tag(:button,
						onClick: forward_event(action: "next")
					) do
						builder.text("Next →")
					end
					
					builder.tag(:button,
						onClick: forward_event(action: "reload"),
						class: "reload"
					) do
						builder.text("↻ Reload")
					end
				end
				
				# Slide previews
				builder.tag(:div, class: "previews") do
					# Current slide
					builder.tag(:div, class: "preview current-preview") do
						builder.tag(:h3){builder.text("Current")}
						builder.tag(:div, class: "preview-frame") do
							if slide
								renderer = SlideView.new(css_class: "slide preview-slide")
								renderer.render_slide(builder, slide)
							end
						end
					end
					
					# Next slide
					builder.tag(:div, class: "preview next-preview") do
						builder.tag(:h3){builder.text("Next")}
						builder.tag(:div, class: "preview-frame") do
							if next_slide
								renderer = SlideView.new(css_class: "slide preview-slide")
								renderer.render_slide(builder, next_slide)
							else
								builder.tag(:div, class: "no-slide") do
									builder.text("End of presentation")
								end
							end
						end
					end
				end
				
				# Timing
				render_timing(builder, slide)
				
				# Presenter notes
				builder.tag(:div, class: "notes") do
					builder.tag(:h3){builder.text("Notes")}
					builder.tag(:div, class: "notes-content") do
						if slide&.notes
							builder.raw(slide.notes)
						else
							builder.tag(:p, class: "no-notes"){builder.text("No presenter notes for this slide.")}
						end
					end
				end
			end
		end
	end
end
