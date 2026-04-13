# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "live"
require_relative "slide_renderer"
require_relative "editor"

module Presently
	# The presenter-facing view with notes, timing, and slide previews.
	#
	# Shows the current slide, next slide preview, presenter notes, timing controls,
	# and pacing indicators. Updates the timing display every second via a background task.
	class PresenterView < Live::View
		# Initialize a new presenter view.
		# @parameter id [String] The unique element identifier.
		# @parameter data [Hash] The element data attributes.
		# @parameter controller [PresentationController | Nil] The shared presentation controller.
		def initialize(id = Live::Element.unique_id, data = {}, controller: nil)
			super(id, data)
			@controller = controller
			@clock_task = nil
			@preview_renderer = SlideRenderer.new(css_class: "slide preview-slide", templates: controller&.templates)
		end
		
		# Bind this view to a page and start the timing update loop.
		# @parameter page [Live::Page] The page this view is bound to.
		def bind(page)
			super
			@controller.add_listener(self)
			
			# Update only the timing section every second.
			@clock_task = Async do
				while true
					update_timing!
					sleep 1
				end
			end
		end
		
		# Close this view and stop the timing update loop.
		def close
			@clock_task&.stop
			@controller.remove_listener(self)
			super
		end
		
		# Called by the controller when the slide changes.
		def slide_changed!
			self.update!
		end
		
		# Push an update to just the timing section.
		def update_timing!
			replace(".timing") do |builder|
				render_timing(builder, @controller.current_slide)
			end
		end
		
		# Handle an event from the client.
		# @parameter event [Hash] The event data with `:detail` containing the action.
		def handle(event)
			action = event.dig(:detail, :action)
			
			case action
			when "next"
				@controller.advance!
			when "previous"
				@controller.retreat!
			when "pause"
				if !@controller.clock.started?
					@controller.clock.start!
				elsif @controller.clock.paused?
					@controller.clock.resume!
				else
					@controller.clock.pause!
				end
				@controller.save_state!
			when "reset"
				@controller.reset_timer!
			when "reload"
				@controller.reload!
			when "jump"
				if index = event.dig(:detail, :index)
					@controller.go_to(index.to_i)
				end
			end
		end
		
		# Generate an editor URL for the given file path.
		# @parameter path [String] The file path.
		# @parameter line [Integer] The line number.
		# @returns [String | Nil] The editor URL, or `nil`.
		def editor_url_for(path, line = 1)
			Editor.url_for(path, line)
		end
		
		# Render the timing bar with controls, elapsed/remaining time, and pacing.
		# @parameter builder [XRB::Builder] The HTML builder.
		# @parameter slide [Slide | Nil] The current slide.
		def render_timing(builder, slide)
			progress = (@controller.slide_progress * 100).round(1)
			builder.tag(:div, class: "timing", style: "--slide-progress: #{progress}%") do
				pacing = @controller.pacing
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
						label = if !@controller.clock.started?
							"▶ Start"
						elsif @controller.clock.paused?
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
						builder.text("Elapsed: #{format_duration(@controller.clock.elapsed)}")
					end
					
					builder.tag(:span, class: "remaining") do
						builder.text("Remaining: #{format_duration(@controller.time_remaining)}")
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
		
		# Format a duration in seconds as `M:SS`.
		# @parameter seconds [Numeric] The duration in seconds.
		# @returns [String] The formatted duration string.
		def format_duration(seconds)
			seconds = seconds.to_i
			minutes = seconds / 60
			secs = seconds % 60
			format("%d:%02d", minutes, secs)
		end
		
		# Render the full presenter view.
		# @parameter builder [XRB::Builder] The HTML builder.
		def render(builder)
			slide = @controller.current_slide
			next_slide = @controller.next_slide
			
			builder.tag(:div, class: "presenter") do
				# Controls bar
				builder.tag(:div, class: "controls") do
					builder.tag(:button,
						onClick: forward_event(action: "previous")
					) do
						builder.text("← Previous")
					end
					
					builder.tag(:span, class: "slide-info") do
						builder.text("Slide #{@controller.current_index + 1} of #{@controller.slide_count}")
						
						if slide
							builder.text(" · ")
							builder.tag(:code, class: "slide-path") do
								builder.text(File.basename(slide.path))
							end
							
							if editor_url = editor_url_for(slide.path)
								builder.tag(:a, href: editor_url, class: "edit-link") do
									builder.text("✎")
								end
							end
						end
					end
					
					builder.tag(:button,
						onClick: forward_event(action: "next")
					) do
						builder.text("Next →")
					end
					
					# Jump-to dropdown for marked slides
					markers = []
					@controller.slides.each_with_index do |s, i|
						if s.marker
							markers << [i, s.marker]
						end
					end
					
					unless markers.empty?
						builder.tag(:select,
							class: "jump-to",
							data: {live_id: @id}
						) do
							builder.tag(:option, value: "", disabled: true, selected: true) do
								builder.text("Jump to…")
							end
							
							markers.each do |index, label|
								builder.tag(:option, value: index) do
									builder.text(label)
								end
							end
						end
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
							@preview_renderer.render(builder, slide)
						end
					end
					
					# Next slide
					builder.tag(:div, class: "preview next-preview") do
						builder.tag(:h3){builder.text("Next")}
						builder.tag(:div, class: "preview-frame") do
							if next_slide
								@preview_renderer.render(builder, next_slide)
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
						if notes = slide&.notes
							builder.raw(notes.to_html)
						else
							builder.tag(:p, class: "no-notes"){builder.text("No presenter notes for this slide.")}
						end
					end
				end
			end
		end
	end
end
