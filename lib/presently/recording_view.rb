# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "live"

require_relative "editor"
require_relative "slide_renderer"

module Presently
	# A dedicated interface for recording one narration track per slide.
	#
	# Recording is intentionally separate from {PresenterView}: presenting is a
	# live performance interface, while recording is an authoring workflow with
	# retakes, playback, and explicit saving.
	class RecordingView < Live::View
		# Initialize a recording view.
		# @parameter id [String] The unique element identifier.
		# @parameter data [Hash] The element data attributes.
		# @parameter controller [PresentationController | Nil] The shared presentation controller.
		def initialize(id = Live::Element.unique_id, data = {}, controller: nil)
			super(id, data)
			@controller = controller
			@slide_renderer = SlideRenderer.new(css_class: "slide recording-slide", templates: controller&.templates)
		end
		
		# Bind this view to a page and register for slide changes.
		# @parameter page [Live::Page] The page this view is bound to.
		def bind(page)
			super
			@controller.add_listener(self)
		end
		
		# Close this view and unregister it from the controller.
		def close
			@controller.remove_listener(self)
			super
		end
		
		# Update the recording interface when the current slide changes.
		def slide_changed!
			self.update!
		end
		
		# Handle navigation events from the recording interface.
		# @parameter event [Hash] The forwarded browser event.
		def handle(event)
			case event.dig(:detail, :action)
			when "next"
				@controller.advance!
			when "previous"
				@controller.retreat!
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
		# @returns [String | Nil]
		def editor_url_for(path, line = 1)
			Editor.url_for(path, line)
		end
		
		# Render the recording interface.
		# @parameter builder [XRB::Builder] The HTML builder.
		def render(builder)
			slide = @controller.current_slide
			return unless slide
			
			index = @controller.current_index
			recording_url = "/recordings?index=#{index}"
			
			builder.tag(:div, class: "recorder") do
				render_navigation(builder, slide)
				
				builder.tag(:div, class: "recording-workspace") do
					builder.tag(:div, class: "recording-preview") do
						@slide_renderer.render(builder, slide)
					end
					
					builder.tag(:aside, class: "recording-sidebar") do
						builder.tag(:section, class: "recording-panel") do
							builder.tag(:h2){builder.text("Narration")}
							builder.tag(:p){builder.text("Record, review, and save one audio track for this slide.")}
							
							builder.tag("presently-recorder",
								id: "presently-recorder-#{index}",
								"data-recording-url": recording_url
							) do
								builder.tag(:div, class: "recording-actions") do
									builder.tag(:button, class: "recording-start", type: "button"){builder.text("● Record")}
									builder.tag(:button, class: "recording-stop", type: "button", disabled: true){builder.text("■ Stop")}
									builder.tag(:button, class: "recording-save", type: "button", disabled: true){builder.text("Save")}
									builder.tag(:span, class: "recording-indicator", "aria-hidden": "true"){}
									builder.tag(:span, class: "recording-time"){builder.text("0:00")}
								end
								
								builder.tag(:audio, class: "recording-playback", controls: true, preload: "metadata", hidden: true){}
								builder.tag(:p, class: "recording-status", role: "status"){builder.text("Checking for an existing recording…")}
							end
						end
						
						builder.tag(:section, class: "recording-notes") do
							builder.tag(:h2){builder.text("Notes")}
							if notes = slide.notes
								builder.raw(notes.to_html)
							else
								builder.tag(:p, class: "no-notes"){builder.text("No presenter notes for this slide.")}
							end
						end
					end
				end
			end
		end
		
		private
		
		# Render navigation controls for the recording interface.
		# @parameter builder [XRB::Builder] The HTML builder.
		# @parameter slide [Slide] The current slide.
		def render_navigation(builder, slide)
			builder.tag(:div, class: "controls recording-navigation") do
				builder.tag(:button, onClick: forward_event(action: "previous")){builder.text("← Previous")}
				
				builder.tag(:span, class: "slide-info") do
					builder.text("Slide #{@controller.current_index + 1} of #{@controller.slide_count} · ")
					builder.tag(:code, class: "slide-path"){builder.text(slide.path)}
					
					if editor_url = editor_url_for(slide.source_path)
						builder.tag(:a, href: editor_url, class: "edit-link"){builder.text("✎")}
					end
				end
				
				builder.tag(:button, onClick: forward_event(action: "next")){builder.text("Next →")}
				
				markers = @controller.slides.each_with_index.filter_map do |candidate, index|
					[index, candidate.marker] if candidate.marker
				end
				
				unless markers.empty?
					builder.tag(:select, class: "jump-to", "data-live-id": @id) do
						builder.tag(:option, value: "", disabled: true, selected: true){builder.text("Jump to…")}
						markers.each do |index, label|
							builder.tag(:option, value: index){builder.text(label)}
						end
					end
				end
				
				builder.tag(:button, onClick: forward_event(action: "reload"), class: "reload"){builder.text("↻ Reload")}
			end
		end
	end
end
