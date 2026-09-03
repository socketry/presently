# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

def initialize(context)
	super
	
	require "pathname"
	require "presently/recordings/normalizer"
end

# Normalize all completed slide recordings to a consistent loudness.
#
# Original recordings are preserved under `input_root`. Normalized WebM/Opus
# files are written to the corresponding paths under `output_root`. Existing
# outputs newer than their source are skipped unless `force` is enabled.
#
# @parameter input_root [String] Source recordings directory. Default: `audio`.
# @parameter output_root [String] Normalized recordings directory. Default: `audio-normalized`.
# @parameter integrated_loudness [Float] Target integrated loudness in LUFS. Default: `-16.0`.
# @parameter true_peak [Float] Maximum true peak in dBTP. Default: `-1.5`.
# @parameter loudness_range [Float] Target loudness range in LU. Default: `11.0`.
# @parameter bitrate [String] Output Opus bitrate. Default: `128k`.
# @parameter force [Boolean] Normalize recordings even when output is current. Default: `false`.
# @parameter command [String] FFmpeg executable. Default: `ffmpeg`.
def normalize(input_root: "audio", output_root: "audio-normalized", integrated_loudness: -16.0, true_peak: -1.5, loudness_range: 11.0, bitrate: "128k", force: false, command: "ffmpeg")
	input_root = File.expand_path(input_root)
	output_root = File.expand_path(output_root)
	
	if input_root == output_root
		raise ArgumentError, "output_root must be different from input_root so originals are preserved!"
	end
	
	files = Dir.glob(File.join(input_root, "**", "*.webm")).sort
	if files.empty?
		puts "No WebM recordings found under #{input_root}."
		return {processed: 0, skipped: 0, output_root: output_root}
	end
	
	normalizer = Presently::Recordings::Normalizer.new(command: command)
	processed = 0
	skipped = 0
	
	files.each do |input_path|
		relative_path = Pathname.new(input_path).relative_path_from(Pathname.new(input_root)).to_s
		output_path = File.join(output_root, relative_path)
		
		if !force && File.file?(output_path) && File.mtime(output_path) >= File.mtime(input_path)
			puts "Skipping #{relative_path} (already normalized)."
			skipped += 1
			next
		end
		
		print "Normalizing #{relative_path}... "
		measurements = normalizer.normalize(
			input_path,
			output_path,
			integrated_loudness: integrated_loudness,
			true_peak: true_peak,
			loudness_range: loudness_range,
			bitrate: bitrate,
		)
		input = measurements.fetch(:input)
		output = measurements.fetch(:output)
		puts "#{input.fetch("input_i")} LUFS → #{output.fetch("input_i")} LUFS, #{output.fetch("input_tp")} dBTP"
		processed += 1
	end
	
	puts "Normalized #{processed} recording#{"s" unless processed == 1}; skipped #{skipped}."
	return {processed: processed, skipped: skipped, output_root: output_root}
end
