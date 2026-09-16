# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "fileutils"
require "tmpdir"
require "protocol/media/registry"

require_relative "playback"
require_relative "recordings"

module Presently
	# Exports narrated playback as a directory of static HTML and supporting assets.
	class HTMLExport
		# Raised when one or more slides do not have narration to export.
		class MissingRecordings < StandardError
			# @parameter paths [Array(String)] Slide paths without narration.
			def initialize(paths)
				@paths = paths
				super("Missing narration for: #{paths.join(", ")}")
			end
			
			# @attribute [Array(String)] Slide paths without narration.
			attr :paths
		end
		
		# The public assets bundled with Presently.
		PUBLIC_ROOT = File.expand_path("../../public", __dir__)
		
		# Build the ordered public asset roots used by the Presently server.
		# Later roots replace files from earlier roots.
		# @parameter public_root [String | Nil] The presentation-specific public directory.
		# @returns [Array(String)] Public directories in increasing precedence.
		def self.public_roots(public_root = nil)
			require "lively"
			
			lively_root = File.join(Gem.loaded_specs.fetch("lively").full_gem_path, "public")
			roots = [lively_root, PUBLIC_ROOT]
			roots << File.expand_path(public_root) if public_root
			roots
		end
		
		# @parameter presentation [Presentation] The presentation to export.
		# @parameter recordings_root [String | Nil] Source narration directory.
		# @parameter playback_recordings_root [String | Nil] Normalized narration directory.
		# @parameter public_roots [Array(String)] Ordered public asset directories.
		def initialize(presentation:, recordings_root: nil, playback_recordings_root: nil, public_roots: self.class.public_roots)
			@presentation = presentation
			@recordings = Recordings.new(recordings_root || File.expand_path("../audio", presentation.root))
			@playback_recordings = Recordings.new(playback_recordings_root || File.expand_path("../audio-normalized", presentation.root))
			@public_roots = public_roots.map{|root| File.expand_path(root)}
		end
		
		# Write the complete static playback directory.
		# @parameter output [String] Destination directory.
		# @parameter force [Boolean] Replace an existing destination.
		# @returns [String] The absolute destination path.
		def write(output, force: false)
			output = File.expand_path(output)
			recording_sources = recording_sources!
			validate_destination!(output)
			
			if File.exist?(output) || File.symlink?(output)
				raise ArgumentError, "Output already exists: #{output} (pass force: true to replace it)" unless force
				raise ArgumentError, "Refusing to replace a symbolic link: #{output}" if File.symlink?(output)
			end
			
			parent = File.dirname(output)
			FileUtils.mkdir_p(parent)
			staging = Dir.mktmpdir(".presently-html-", parent)
			
			begin
				copy_public_assets(staging)
				copy_slide_assets(staging)
				recording_urls = copy_recordings(staging, recording_sources)
				write_playback(staging, recording_urls)
				
				FileUtils.rm_rf(output) if File.exist?(output)
				FileUtils.mv(staging, output)
			ensure
				FileUtils.rm_rf(staging) if File.exist?(staging)
			end
			
			output
		end
		
		private
		
		def recording_sources!
			missing = []
			
			sources = @presentation.slides.map do |slide|
				if @playback_recordings.exist?(slide)
					[@playback_recordings, slide]
				elsif @recordings.exist?(slide)
					[@recordings, slide]
				else
					missing << slide.path
					nil
				end
			end
			
			raise MissingRecordings, missing unless missing.empty?
			
			sources
		end
		
		def validate_destination!(output)
			sources = [@presentation.root, @recordings.root, @playback_recordings.root, *@public_roots]
			separator = File::SEPARATOR
			
			sources.each do |source|
				source = File.expand_path(source)
				if source == output || source.start_with?(output + separator) || output.start_with?(source + separator)
					raise ArgumentError, "Output must not overlap source directory: #{source}"
				end
			end
		end
		
		def copy_public_assets(output)
			@public_roots.each do |root|
				next unless File.directory?(root)
				
				FileUtils.cp_r(File.join(root, "."), output, preserve: true)
			end
		end
		
		def copy_slide_assets(output)
			root = File.realpath(@presentation.root)
			prefix = root.end_with?(File::SEPARATOR) ? root : root + File::SEPARATOR
			
			Dir.glob("**/*", File::FNM_DOTMATCH, base: root).sort.each do |relative_path|
				next if File.extname(relative_path) == ".md"
				next unless Protocol::Media::Registry.for_path(relative_path)
				
				source = File.join(root, relative_path)
				next unless File.file?(source)
				
				real_source = File.realpath(source)
				next unless real_source.start_with?(prefix)
				
				destination = File.join(output, "_slides", relative_path)
				FileUtils.mkdir_p(File.dirname(destination))
				FileUtils.copy_file(real_source, destination, true)
			end
			
			@presentation.stylesheets.each do |stylesheet|
				destination = File.join(output, "_slides", stylesheet.path)
				FileUtils.mkdir_p(File.dirname(destination))
				File.write(destination, stylesheet.read)
			end
		end
		
		def copy_recordings(output, sources)
			sources.map do |recordings, slide|
				relative_path = recordings.relative_path(slide)
				destination = File.join(output, "audio", relative_path)
				FileUtils.mkdir_p(File.dirname(destination))
				FileUtils.copy_file(recordings.path(slide), destination, true)
				
				"./audio/" + Stylesheet.encode_path(relative_path)
			end
		end
		
		def write_playback(output, recording_urls)
			playback = Playback.new(
				presentation: @presentation,
				recording_urls: recording_urls,
				asset_prefix: ".",
			)
			
			File.write(File.join(output, "index.html"), playback.call)
		end
	end
end
