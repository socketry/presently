# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "yaml"
require "markly"

module Presently
	# A single slide parsed from a Markdown file.
	#
	# Each slide has YAML frontmatter for metadata (template, duration, focus), content sections
	# split by Markdown headings, and optional presenter notes separated by `---`.
	class Slide
		# Initialize a new slide by parsing the given Markdown file.
		# @parameter path [String] The file path to the Markdown slide.
		def initialize(path)
			@path = path
			@frontmatter = nil
			@content = nil
			@notes = nil
			
			parse!
		end
		
		# @attribute [String] The file path of the slide.
		attr :path
		
		# @attribute [Hash | Nil] The parsed YAML frontmatter.
		attr :frontmatter
		
		# @attribute [Hash(String, String)] The content sections keyed by heading name.
		attr :content
		
		# @attribute [String | Nil] The rendered HTML presenter notes.
		attr :notes
		
		# The template to use for rendering this slide.
		# @returns [String] The template name from frontmatter, or `"default"`.
		def template
			@frontmatter&.fetch("template", "default") || "default"
		end
		
		# The expected duration of this slide in seconds.
		# @returns [Integer] The duration from frontmatter, or `60`.
		def duration
			@frontmatter&.fetch("duration", 60) || 60
		end
		
		# The title of this slide.
		# @returns [String] The title from frontmatter, or the filename without extension.
		def title
			@frontmatter&.fetch("title", File.basename(@path, ".md")) || File.basename(@path, ".md")
		end
		
		# The transition type for animating into this slide.
		# @returns [String | Nil] The transition name (e.g. `"fade"`, `"slide-left"`, `"magic-move"`), or `nil` for instant swap.
		def transition
			@frontmatter&.fetch("transition", nil)
		end
		
		# The line range to focus on for code slides.
		# @returns [Array(Integer, Integer) | Nil] The `[start, end]` line numbers (1-based), or `nil`.
		def focus
			if range = @frontmatter&.fetch("focus", nil)
				parts = range.to_s.split("-").map(&:to_i)
				parts.length == 2 ? parts : nil
			end
		end
		
		private
		
		# Parse the Markdown file into frontmatter, content sections, and notes.
		def parse!
			raw = File.read(@path)
			
			# Extract YAML frontmatter:
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
			
			# Split content and presenter notes (notes come after "---" on its own line):
			if body.include?("\n---\n")
				content_part, notes_part = body.split("\n---\n", 2)
				@content = parse_sections(content_part.strip)
				@notes = render_markdown(notes_part.strip)
			else
				@content = parse_sections(body.strip)
				@notes = nil
			end
		end
		
		# Parse content into sections based on Markdown headings.
		# Each heading becomes a named key for the template.
		# @parameter text [String] The Markdown content to parse.
		# @returns [Hash(String, String)] Sections keyed by heading name, with rendered HTML values.
		def parse_sections(text)
			sections = {}
			current_key = "body"
			current_content = []
			
			text.each_line do |line|
				if line.match?(/\A#+\s+/)
					# Save previous section:
					unless current_content.empty?
						sections[current_key] = render_markdown(current_content.join)
					end
					
					# Extract heading text as the key:
					heading_text = line.sub(/\A#+\s+/, "").strip.downcase.gsub(/\s+/, "_")
					current_key = heading_text
					current_content = []
				else
					current_content << line
				end
			end
			
			# Save last section:
			unless current_content.empty?
				sections[current_key] = render_markdown(current_content.join)
			end
			
			sections
		end
		
		# Render Markdown text to HTML.
		# @parameter text [String] The Markdown text.
		# @returns [String] The rendered HTML.
		def render_markdown(text)
			return "" if text.nil? || text.empty?
			Markly.render_html(text, flags: Markly::UNSAFE)
		end
	end
end
