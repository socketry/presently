# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "fileutils"
require "tempfile"

require "protocol/http/body/file"

module Presently
	# Stores one WebM narration recording for each slide.
	#
	# Recording paths mirror slide paths. For example,
	# `slides/020-topic/010-example.md` is stored as
	# `audio/020-topic/010-example.webm`.
	class Recordings
		# The media type produced by the browser recorder.
		CONTENT_TYPE = "audio/webm"
		
		# The maximum accepted recording size (128 MiB).
		MAXIMUM_SIZE = 128 * 1024 * 1024
		
		# Raised when an uploaded recording exceeds {MAXIMUM_SIZE}.
		class TooLarge < StandardError
		end
		
		# Initialize the recording store.
		# @parameter root [String] The directory where recordings are stored.
		# @parameter maximum_size [Integer] Maximum accepted recording size in bytes.
		def initialize(root, maximum_size: MAXIMUM_SIZE)
			@root = File.expand_path(root)
			@maximum_size = maximum_size
		end
		
		# @attribute [String] The absolute recording root.
		attr :root
		
		# The recording path relative to {#root} for the given slide.
		# @parameter slide [Slide] The slide whose recording path is required.
		# @returns [String]
		def relative_path(slide)
			slide.path.sub(/\.md\z/, ".webm")
		end
		
		# The absolute recording path for the given slide.
		# @parameter slide [Slide] The slide whose recording path is required.
		# @returns [String]
		def path(slide)
			File.join(@root, relative_path(slide))
		end
		
		# Whether the slide has a recording.
		# @parameter slide [Slide] The slide to check.
		# @returns [Boolean]
		def exist?(slide)
			File.file?(path(slide))
		end
		
		# Open the recording as an HTTP body.
		# @parameter slide [Slide] The slide to read.
		# @returns [Protocol::HTTP::Body::File | Nil]
		def read(slide)
			if exist?(slide)
				Protocol::HTTP::Body::File.open(path(slide))
			end
		end
		
		# Write a recording atomically.
		#
		# The request body is copied to a temporary file in the destination
		# directory, then renamed over the existing recording only after the
		# upload completes successfully.
		# @parameter slide [Slide] The slide being recorded.
		# @parameter body [Protocol::HTTP::Body::Readable] The uploaded recording.
		# @returns [String] The absolute destination path.
		# @raises [TooLarge] If the recording exceeds {MAXIMUM_SIZE}.
		def write(slide, body)
			destination = path(slide)
			directory = File.dirname(destination)
			FileUtils.mkdir_p(directory)
			
			Tempfile.create(["presently-recording", ".webm"], directory, binmode: true) do |file|
				size = 0
				
				while chunk = body.read
					size += chunk.bytesize
					raise TooLarge, "Recording exceeds #{@maximum_size} bytes!" if size > @maximum_size
					
					file.write(chunk)
				end
				
				file.flush
				File.rename(file.path, destination)
			end
			
			return destination
		end
	end
end
