# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

def initialize(context)
	super
	
	require "presently"
	require "json"
	require "fileutils"
end

# Rehearse the presentation interactively.
#
# Prints each slide's headline and speaker notes, then waits for ENTER to
# advance. Records planned vs actual time per slide and prints a report at
# the end.
#
# Press `q` + ENTER to stop early and still see the partial report.
#
# @parameter slides_root [String] The slides directory. Default: `slides`.
# @parameter speaker [String | Nil] Only rehearse slides for this speaker.
# @parameter from [String | Nil] Substring match — start at the first slide whose filename contains this.
# @parameter to [String | Nil] Substring match — stop after the first slide whose filename contains this.
# @parameter resume [Boolean] Resume from the slide after the last one recorded in the log. Keeps prior records and appends new ones.
# @parameter log [String] Path to write the JSON log. Default: `tmp/rehearsal.json`.
def rehearse(slides_root: "slides", speaker: nil, from: nil, to: nil, resume: false, log: "tmp/rehearsal.json")
	presentation = Presently::Presentation.load(slides_root)
	slides = presentation.slides
	slides = slides.select{|slide| slide.speaker == speaker} if speaker
	
	if from
		start_index = slides.index{|slide| File.basename(slide.path).include?(from)}
		slides = slides[start_index..] if start_index
	end
	
	if to
		end_index = slides.index{|slide| File.basename(slide.path).include?(to)}
		slides = slides[..end_index] if end_index
	end
	
	prior_records = []
	if resume
		unless File.exist?(log)
			puts "No log at #{log} to resume from. Run `bake presently:rehearse:rehearse` first."
			return
		end
		
		prior_records = JSON.parse(File.read(log), symbolize_names: true)
		last_path = prior_records.last&.dig(:path)
		resume_index = slides.index{|slide| File.basename(slide.path) == last_path}
		
		if resume_index.nil?
			puts "Last rehearsed slide (#{last_path}) not found in current slide set. Nothing to resume."
			return
		end
		
		slides = slides[(resume_index + 1)..] || []
		if slides.empty?
			puts "Already at end of rehearsal set. Nothing to resume."
			return
		end
		
		puts "Resuming after #{last_path} — #{prior_records.length} prior slide(s) kept."
	end
	
	if slides.empty?
		puts "No slides to rehearse."
		return
	end
	
	planned_total = slides.sum(&:duration)
	puts
	puts "Rehearsal — #{slides.length} slides, planned #{format_duration(planned_total)}"
	puts "Press ENTER to advance. `q`+ENTER to stop early."
	puts
	print "Press ENTER to start..."
	$stdin.gets
	
	records = []
	offset = prior_records.length
	slides.each_with_index do |slide, index|
		basename = File.basename(slide.path)
		headline = extract_headline(slide)
		absolute = offset + index + 1
		total = offset + slides.length
		
		puts
		puts "─" * 72
		puts "[#{absolute}/#{total}] #{basename}  planned: #{format_duration(slide.duration)}  speaker: #{slide.speaker || "—"}"
		puts "  #{headline}" unless headline.empty?
		if slide.notes
			notes = slide.notes.to_commonmark.strip
			unless notes.empty?
				puts
				notes.lines.each{|line| puts "  │ #{line.rstrip}"}
			end
		end
		puts "─" * 72
		
		start_time = Time.now
		input = $stdin.gets
		elapsed = Time.now - start_time
		
		records << {
			index: absolute,
			path: basename,
			speaker: slide.speaker,
			planned: slide.duration,
			actual: elapsed.round(1),
		}
		
		break if input.nil? || input.strip.downcase == "q"
	end
	
	all_records = prior_records + records
	FileUtils.mkdir_p(File.dirname(log))
	File.write(log, JSON.pretty_generate(all_records))
	
	print_report(all_records, log)
	
	print "Apply these durations to the slide files? [y/N] "
	answer = $stdin.gets&.strip&.downcase
	if answer == "y" || answer == "yes"
		apply(slides_root: slides_root, log: log)
	else
		puts "Not applied. Run `bake presently:rehearse:apply` later if you change your mind."
	end
end

# Print a report from a previously recorded rehearsal log.
#
# @parameter log [String] Path to a JSON log written by `rehearse`. Default: `tmp/rehearsal.json`.
def report(log: "tmp/rehearsal.json")
	unless File.exist?(log)
		puts "No log at #{log}. Run `bake presently:rehearse:rehearse` first."
		return
	end
	
	records = JSON.parse(File.read(log), symbolize_names: true)
	print_report(records, log)
end

# Update each slide's `duration:` front matter using the actual time from the last rehearsal log.
#
# Bumps up when you ran over, trims down when you ran under. Skips slides
# whose absolute delta is below #{UPDATE_THRESHOLD} seconds.
#
# @parameter slides_root [String] The slides directory. Default: `slides`.
# @parameter log [String] Path to a JSON log written by `rehearse`. Default: `tmp/rehearsal.json`.
# @parameter dry_run [Boolean] Print planned updates without writing. Default: `false`.
def apply(slides_root: "slides", log: "tmp/rehearsal.json", dry_run: false)
	unless File.exist?(log)
		puts "No log at #{log}. Run `bake presently:rehearse:rehearse` first."
		return
	end
	
	records = JSON.parse(File.read(log), symbolize_names: true)
	updated = 0
	skipped = 0
	
	records.each do |record|
		path = File.join(slides_root, record[:path])
		unless File.exist?(path)
			puts "  skip (missing): #{record[:path]}"
			skipped += 1
			next
		end
		
		delta = record[:actual] - record[:planned]
		if delta.abs < UPDATE_THRESHOLD
			skipped += 1
			next
		end
		
		new_duration = record[:actual].round
		old_duration = record[:planned]
		next if new_duration == old_duration
		
		if dry_run
			puts "  would update #{record[:path]}: #{old_duration} → #{new_duration}"
		else
			replace_duration(path, new_duration)
			puts "  updated #{record[:path]}: #{old_duration} → #{new_duration}"
		end
		updated += 1
	end
	
	puts
	if dry_run
		puts "Dry run. #{updated} slides would change, #{skipped} skipped (|delta| < #{UPDATE_THRESHOLD}s)."
	else
		puts "Applied. #{updated} slides changed, #{skipped} skipped (|delta| < #{UPDATE_THRESHOLD}s)."
	end
end

private

UPDATE_THRESHOLD = 1.0

def extract_headline(slide)
	body = slide.content["body"]
	return slide.title unless body && !body.empty?
	
	first_line = body.to_commonmark.strip.lines.first.to_s.strip
	first_line.empty? ? slide.title : first_line
end

def print_report(records, log_path)
	planned_total = records.sum{|record| record[:planned]}
	actual_total = records.sum{|record| record[:actual]}
	
	puts
	puts "=" * 80
	puts "Rehearsal report — #{records.length} slides"
	puts "=" * 80
	puts "%-32s %-12s %8s %8s %8s  %s" % ["Slide", "Speaker", "Planned", "Actual", "Delta", "Update"]
	puts "-" * 80
	
	update_count = 0
	records.each do |record|
		delta = record[:actual] - record[:planned]
		update = delta.abs >= UPDATE_THRESHOLD
		update_count += 1 if update
		marker = update ? "✱" : ""
		puts "%-32s %-12s %8s %8s %+7.1fs  %s" % [
			record[:path][0, 30],
			(record[:speaker] || "—")[0, 12],
			format_duration(record[:planned]),
			format_duration(record[:actual]),
			delta,
			marker,
		]
	end
	
	puts "-" * 80
	puts "%-32s %-12s %8s %8s %+7.1fs" % [
		"TOTAL",
		"",
		format_duration(planned_total),
		format_duration(actual_total),
		actual_total - planned_total,
	]
	puts
	puts "✱ = |delta| ≥ #{UPDATE_THRESHOLD}s → would be updated by `presently:rehearse:apply` (#{update_count} slides)"
	puts "Log: #{log_path}"
	puts
end

def format_duration(seconds)
	seconds = seconds.to_i
	"%d:%02d" % [seconds / 60, seconds % 60]
end

def replace_duration(path, new_duration)
	raw = File.read(path)
	updated = raw.sub(/^duration:\s*\d+\s*$/, "duration: #{new_duration}")
	File.write(path, updated)
end
