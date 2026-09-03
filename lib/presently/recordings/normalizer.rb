# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "fileutils"
require "json"
require "open3"
require "tempfile"

module Presently
	class Recordings
		# Normalizes recording loudness using measured gain and peak limiting.
		#
		# Short spoken recordings can have isolated peaks which prevent FFmpeg's
		# two-pass `loudnorm` filter from reaching its integrated loudness target.
		# This implementation measures the result of a gain and limiter filter,
		# adjusting the gain until the complete recording reaches the target. The
		# limiter retains headroom for peaks introduced by Opus encoding.
		class Normalizer
			# The default integrated loudness target for spoken web content.
			INTEGRATED_LOUDNESS = -16.0
			
			# The default maximum true peak, in dBTP.
			TRUE_PEAK = -1.5
			
			# The default loudness range target.
			LOUDNESS_RANGE = 11.0
			
			# The default Opus bitrate used for normalized recordings.
			BITRATE = "128k"
			
			# Additional headroom retained before lossy encoding, in dB.
			ENCODER_HEADROOM = 0.75
			
			# Maximum acceptable difference from the integrated loudness target.
			LOUDNESS_TOLERANCE = 0.05
			
			# Maximum gain refinements performed before encoding.
			MAXIMUM_ITERATIONS = 12
			
			# Maximum encodings performed while accounting for codec peak overshoot.
			MAXIMUM_ENCODINGS = 4
			
			# Additional headroom added when an encoded file exceeds the peak target.
			PEAK_CORRECTION_MARGIN = 0.1
			
			# Raised when FFmpeg cannot analyze or normalize a recording.
			class Error < StandardError
			end
			
			# Initialize the normalizer.
			# @parameter command [String] The FFmpeg executable.
			def initialize(command: "ffmpeg")
				@command = command
			end
			
			# Normalize one recording to a separate output path.
			# @parameter input_path [String] Source WebM recording.
			# @parameter output_path [String] Destination WebM recording.
			# @parameter integrated_loudness [Numeric] Target integrated loudness in LUFS.
			# @parameter true_peak [Numeric] Maximum true peak in dBTP.
			# @parameter loudness_range [Numeric] Target loudness range in LU.
			# @parameter bitrate [String] Output Opus bitrate.
			# @returns [Hash] Input and normalized loudness measurements.
			def normalize(input_path, output_path, integrated_loudness: INTEGRATED_LOUDNESS, true_peak: TRUE_PEAK, loudness_range: LOUDNESS_RANGE, bitrate: BITRATE)
				input_path = File.expand_path(input_path)
				output_path = File.expand_path(output_path)
				input_measurements = measure(input_path, integrated_loudness, true_peak, loudness_range)
				limiter_peak = true_peak - ENCODER_HEADROOM
				
				FileUtils.mkdir_p(File.dirname(output_path))
				
				Tempfile.create(["presently-normalized", ".webm"], File.dirname(output_path), binmode: true) do |temporary|
					temporary.close
					
					MAXIMUM_ENCODINGS.times do
						filter, gain = normalization_filter(input_path, integrated_loudness, limiter_peak, loudness_range, input_measurements)
						
						run(
							"-i", input_path,
							"-map", "0:a:0",
							"-af", filter,
							"-c:a", "libopus",
							"-b:a", bitrate,
							"-vbr", "on",
							"-vn",
							"-f", "webm",
							"-y", temporary.path,
						)
						
						output_measurements = measure(temporary.path, integrated_loudness, true_peak, loudness_range)
						output_peak = Float(output_measurements.fetch("input_tp"))
						
						if output_peak <= true_peak
							File.rename(temporary.path, output_path)
							
							return {
								input: input_measurements,
								output: output_measurements,
								gain: gain,
							}
						end
						
						limiter_peak -= output_peak - true_peak + PEAK_CORRECTION_MARGIN
					end
					
					raise Error, "Could not constrain the encoded true peak to #{true_peak} dBTP for #{input_path}!"
				end
			end
			
			private
			
			def measure(input_path, integrated_loudness, true_peak, loudness_range, before: nil)
				filter = [
					before,
					"loudnorm=I=#{integrated_loudness}:TP=#{true_peak}:LRA=#{loudness_range}:print_format=json",
				].compact.join(",")
				output = run(
					"-i", input_path,
					"-map", "0:a:0",
					"-af", filter,
					"-f", "null",
					"-",
				)
				
				json = output.match(/\{\s*"input_i".*?\}/m)&.[](0)
				raise Error, "FFmpeg did not report loudness measurements for #{input_path}!" unless json
				
				measurements = JSON.parse(json)
				%w[input_i input_tp input_lra input_thresh target_offset].each do |key|
					Float(measurements.fetch(key))
				rescue ArgumentError, KeyError
					raise Error, "FFmpeg reported an invalid #{key} measurement for #{input_path}!"
				end
				
				return measurements
			end
			
			def normalization_filter(input_path, integrated_loudness, limiter_peak, loudness_range, input_measurements)
				gain = integrated_loudness - Float(input_measurements.fetch("input_i"))
				limiter = 10.0 ** (limiter_peak / 20.0)
				
				MAXIMUM_ITERATIONS.times do
					filter = gain_and_limiter_filter(gain, limiter)
					measurements = measure(input_path, integrated_loudness, limiter_peak, loudness_range, before: filter)
					correction = integrated_loudness - Float(measurements.fetch("input_i"))
					
					return [filter, gain] if correction.abs <= LOUDNESS_TOLERANCE
					
					gain += correction
				end
				
				raise Error, "Could not converge on #{integrated_loudness} LUFS for #{input_path}!"
			end
			
			def gain_and_limiter_filter(gain, limiter)
				gain = format("%.4f", gain)
				limiter = format("%.8f", limiter)
				
				return "volume=#{gain}dB,alimiter=limit=#{limiter}:attack=5:release=50:level=false:latency=true"
			end
			
			def run(*arguments)
				_output, error, status = Open3.capture3(
					@command,
					"-hide_banner",
					"-nostats",
					"-nostdin",
					*arguments,
				)
				
				unless status.success?
					raise Error, error.lines.last(20).join
				end
				
				return error
			rescue Errno::ENOENT
				raise Error, "Could not execute #{@command.inspect}; install FFmpeg or specify command:!"
			end
		end
	end
end
