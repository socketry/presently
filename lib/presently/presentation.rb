# frozen_string_literal: true

require "yaml"
require "markly"

require_relative "clock"

module Presently
	# Represents a single slide parsed from a markdown file.
	class Slide
		def initialize(path)
			@path = path
			@frontmatter = nil
			@content = nil
			@notes = nil
			
			parse!
		end
		
		attr :path
		attr :frontmatter
		attr :content
		attr :notes
		
		def template
			@frontmatter&.fetch("template", "default") || "default"
		end
		
		def duration
			@frontmatter&.fetch("duration", 60) || 60
		end
		
		def title
			@frontmatter&.fetch("title", File.basename(@path, ".md")) || File.basename(@path, ".md")
		end
		
		# Parse the markdown file into frontmatter, content sections, and notes.
		def parse!
			raw = File.read(@path)
			
			# Extract YAML frontmatter
			if raw.start_with?("---\n")
				parts = raw.split("---\n", 3)
				if parts.length >= 3
					@frontmatter = YAML.safe_load(parts[1])
					body = parts[2]
				else
					body = raw
				end
			else
				body = raw
			end
			
			# Split content and presenter notes (notes come after "---" on its own line)
			if body.include?("\n---\n")
				content_part, notes_part = body.split("\n---\n", 2)
				@content = parse_sections(content_part.strip)
				@notes = render_markdown(notes_part.strip)
			else
				@content = parse_sections(body.strip)
				@notes = nil
			end
		end
		
		# Parse content into sections based on headings.
		# Each heading becomes a named field for the template.
		def parse_sections(text)
			sections = {}
			current_key = "body"
			current_content = []
			
			text.each_line do |line|
				if line.match?(/\A#+\s+/)
					# Save previous section
					unless current_content.empty?
						sections[current_key] = render_markdown(current_content.join)
					end
					
					# Extract heading text as the key
					heading_text = line.sub(/\A#+\s+/, "").strip.downcase.gsub(/\s+/, "_")
					current_key = heading_text
					current_content = []
				else
					current_content << line
				end
			end
			
			# Save last section
			unless current_content.empty?
				sections[current_key] = render_markdown(current_content.join)
			end
			
			sections
		end
		
		def render_markdown(text)
			return "" if text.nil? || text.empty?
			Markly.render_html(text)
		end
	end
	
	# Manages the collection of slides and shared presentation state.
	class Presentation
		def initialize(slides_directory = "slides")
			@slides_directory = slides_directory
			@slides = []
			@current_index = 0
			@clock = Clock.new
			@listeners = []
			
			load_slides!
		end
		
		attr :slides
		attr :current_index
		attr :clock
		
		def current_slide
			@slides[@current_index]
		end
		
		def next_slide
			@slides[@current_index + 1]
		end
		
		def previous_slide
			@slides[@current_index - 1] if @current_index > 0
		end
		
		def slide_count
			@slides.length
		end
		
		def total_duration
			@slides.sum(&:duration)
		end
		
		# Calculate elapsed time for slides up to the given index.
		def expected_time_at(index)
			@slides[0...index].sum(&:duration)
		end
		
		# Returns 0.0 to 1.0 representing progress through the current slide's time.
		def slide_progress
			return 0.0 unless @clock.started?
			
			slide = current_slide
			return 0.0 unless slide
			
			time_into_slide = @clock.elapsed - expected_time_at(@current_index)
			(time_into_slide / slide.duration).clamp(0.0, 1.0)
		end
		
		def reset_timer!
			@clock.reset!(expected_time_at(@current_index))
			notify_listeners!
		end
		
		# Returns :on_time, :ahead, or :behind
		def pacing
			return :on_time unless @clock.started?
			
			elapsed = @clock.elapsed
			slide_start = expected_time_at(@current_index)
			slide_end = expected_time_at(@current_index + 1)
			
			if elapsed > slide_end
				:behind
			elsif elapsed < slide_start
				:ahead
			else
				:on_time
			end
		end
		
		def time_remaining
			return total_duration unless @clock.started?
			
			expected_remaining = expected_time_at(slide_count) - @clock.elapsed
			
			[expected_remaining, 0].max
		end
		
		def go_to(index)
			return if index < 0 || index >= @slides.length
			
			@current_index = index
			notify_listeners!
		end
		
		def advance!
			go_to(@current_index + 1)
		end
		
		def retreat!
			go_to(@current_index - 1)
		end
		
		def add_listener(listener)
			@listeners << listener
		end
		
		def remove_listener(listener)
			@listeners.delete(listener)
		end
		
		def reload!
			load_slides!
			notify_listeners!
		end
		
		private
		
		def load_slides!
			pattern = File.join(@slides_directory, "*.md")
			@slides = Dir.glob(pattern).sort.map{|path| Slide.new(path)}
		end
		
		def notify_listeners!
			@listeners.each do |listener|
				listener.slide_changed! rescue nil
			end
		end
	end
end
