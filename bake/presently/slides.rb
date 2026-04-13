# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

def initialize(context)
	super
	
	require "fileutils"
end

# Extract all presenter notes and print them to stdout.
#
# Loads every slide in the slides directory using the Presently API and
# prints each slide's presenter notes to stdout. Each slide's notes are
# preceded by a `##` heading with the slide file path.
#
# @parameter slides_root [String] The slides directory. Default: `slides`.
def notes(slides_root: "slides")
	require "presently"
	
	presentation = Presently::Presentation.load(slides_root)
	
	presentation.slides.each do |slide|
		next unless slide.notes
		
		puts "## #{slide.path}"
		puts
		puts slide.notes.to_commonmark
		puts
	end
	
	return nil
end

# Renumber slide files sequentially with a consistent step size.
#
# Renames all `.md` files in the slides directory to have sequential
# numeric prefixes (010, 020, 030, ...), preserving their current order.
# The descriptive part of the filename (after the number prefix) is kept.
#
# @parameter slides_root [String] The slides directory. Default: `slides`.
# @parameter step [Integer] The step between slide numbers. Default: `10`.
def renumber(slides_root: "slides", step: 10)
	pattern = File.join(slides_root, "*.md")
	# Sort numerically by the leading digits in the filename:
	files = Dir.glob(pattern).sort_by{|f| File.basename(f).to_i}
	
	if files.empty?
		puts "No slides found in #{slides_root}"
		return
	end
	
	# Calculate width from the largest number:
	max_number = files.length * step
	width = [max_number.to_s.length, 3].max
	
	# Build the rename plan:
	renames = []
	files.each_with_index do |old_path, index|
		basename = File.basename(old_path)
		
		# Strip the existing numeric prefix (digits, optionally followed by a letter, then a dash):
		name = basename.sub(/\A\d+[a-z]?-/, "")
		
		number = (index + 1) * step
		new_basename = "%0#{width}d-%s" % [number, name]
		new_path = File.join(slides_root, new_basename)
		
		renames << [old_path, new_path] if old_path != new_path
	end
	
	if renames.empty?
		puts "All slides are already numbered correctly."
		return
	end
	
	# Rename via temporary files to avoid collisions:
	temp_renames = []
	renames.each do |old_path, new_path|
		temp_path = old_path + ".renumber"
		FileUtils.mv(old_path, temp_path)
		temp_renames << [temp_path, new_path]
	end
	
	temp_renames.each do |temp_path, new_path|
		FileUtils::Verbose.mv(temp_path, new_path)
	end
	
	puts "Renumbered #{renames.length} slides."
end
