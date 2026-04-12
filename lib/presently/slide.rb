# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "yaml"
require "markly"

require_relative "renderer"

module Presently
	# A single slide parsed from a Markdown file.
	#
	# Each slide has YAML frontmatter for metadata (template, duration, focus), content sections
	# split by Markdown headings, and optional presenter notes separated by `---`.
	class Slide
		# Parses a Markdown slide file into structured data for {Slide}.
		#
		# Handles YAML frontmatter extraction, presenter note separation, and
		# Markdown-to-HTML rendering using the Markly AST.
		module Parser
			# Markly extensions enabled for all slide Markdown rendering.
			EXTENSIONS = [:table, :tasklist, :strikethrough, :autolink]
			
			module_function
			
			# Parse the file and return a {Slide}.
			# @parameter path [String] The file path to parse.
			# @returns [Slide]
			def load(path)
				raw = File.read(path)
				frontmatter, body = extract_frontmatter(raw)
				content, notes = extract_body(body)
				Slide.new(path, frontmatter: frontmatter, content: content, notes: notes)
			end
			
			# Split raw file content into frontmatter and body.
			# @parameter raw [String] The raw file content.
			# @returns [Array(Hash | Nil, String)] The parsed frontmatter and remaining body.
			def extract_frontmatter(raw)
				if raw.start_with?("---\n")
					parts = raw.split("---\n", 3)
					if parts.length >= 3
						return [YAML.safe_load(parts[1]), parts[2]]
					end
				end
				
				[nil, raw]
			end
			
			# Split the body into content sections and optional presenter notes.
			# @parameter body [String] The slide body after frontmatter.
			# @returns [Array(Hash, String | Nil)] The content sections and rendered notes HTML.
			def extract_body(body)
				if body.include?("\n---\n")
					content_part, notes_part = body.split("\n---\n", 2)
					[parse_sections(content_part.strip), render_markdown(notes_part.strip)]
				else
					[parse_sections(body.strip), nil]
				end
			end
			
			# Parse content into sections based on top-level Markdown headings.
			# Each heading becomes a named key; content before the first heading
			# is collected under `"body"`. Headings inside code blocks are invisible
			# to this method as they never appear as top-level AST nodes.
			# @parameter text [String] The Markdown content to parse.
			# @returns [Hash(String, String)] Sections keyed by heading name, with rendered HTML values.
			def parse_sections(text)
				document = Markly.parse(text, flags: Markly::UNSAFE, extensions: EXTENSIONS)
				
				sections = {}
				current_key = "body"
				current_nodes = []
				
				document.each do |node|
					if node.type == :header
						sections[current_key] = render_nodes(current_nodes) unless current_nodes.empty?
						current_key = node.to_plaintext.strip.downcase.gsub(/\s+/, "_")
						current_nodes = []
					else
						current_nodes << node
					end
				end
				
				sections[current_key] = render_nodes(current_nodes) unless current_nodes.empty?
				
				sections
			end
			
			# Render a list of AST nodes to HTML via a temporary document.
			# @parameter nodes [Array(Markly::Node)] The nodes to render.
			# @returns [String] The rendered HTML.
			def render_nodes(nodes)
				doc = Markly::Node.new(:document)
				nodes.each{|node| doc.append_child(node.dup)}
				Renderer.new(flags: Markly::UNSAFE, extensions: EXTENSIONS).render(doc)
			end
			
			# Render a Markdown string to HTML.
			# @parameter text [String] The Markdown text.
			# @returns [String] The rendered HTML.
			def render_markdown(text)
				return "" if text.nil? || text.empty?
				
				document = Markly.parse(text, flags: Markly::UNSAFE, extensions: EXTENSIONS)
				Renderer.new(flags: Markly::UNSAFE, extensions: EXTENSIONS).render(document)
			end
		end
		
		# Load and parse a slide from a Markdown file.
		# @parameter path [String] The file path to the Markdown slide.
		# @returns [Slide]
		def self.load(path)
			Parser.load(path)
		end
		
		# Initialize a slide with pre-parsed data.
		# @parameter path [String] The file path of the slide.
		# @parameter frontmatter [Hash | Nil] The parsed YAML frontmatter.
		# @parameter content [Hash(String, String)] Content sections keyed by heading name.
		# @parameter notes [String | Nil] The rendered HTML presenter notes.
		def initialize(path, frontmatter: nil, content: {}, notes: nil)
			@path = path
			@frontmatter = frontmatter
			@content = content
			@notes = notes
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
		
		# Whether this slide should be skipped in the presentation.
		# @returns [Boolean]
		def skip?
			@frontmatter&.fetch("skip", false) || false
		end
		
		# The navigation marker for this slide, used in the presenter's jump-to dropdown.
		# @returns [String | Nil] The marker label, or `nil` if not marked.
		def marker
			@frontmatter&.fetch("marker", nil)
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
	end
end
