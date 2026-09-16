# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "live"

module Presently
	# The persistent narration controls nested within {RecorderView}.
	class RecordingControlsView < Live::View
		# Initialize the recording controls view.
		# @parameter id [String] The stable element identifier.
		# @parameter data [Hash] The element data attributes.
		# @parameter controller [PresentationController] The shared presentation controller.
		def initialize(id, data, controller:)
			super(id, data)
			@controller = controller
		end
		
		# Use the client-side recorder as this live view's custom element.
		def tag_name
			"presently-recording-controls"
		end
		
		# Render the recorder host. Its shadow DOM owns the controls themselves.
		# @parameter builder [XRB::Builder] The HTML builder.
		def build_markup(builder)
			slide = @controller.current_slide
			return unless slide
			
			index = @controller.current_index
			recording_present = @controller.recording_available?(slide)
			
			builder.inline_tag(tag_name,
				id: @id,
				data: @data,
				"data-slide-index": index,
				"data-recording-url": "/recordings?index=#{index}",
				"data-slide-duration": slide.duration,
				"data-recording-state": recording_present ? "present" : "missing"
			)
		end
	end
end
