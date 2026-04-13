# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "yaml"
require "markly"

require_relative "renderer"

module Presently
	# A single slide parsed from a Markdown file.
	#
	# Each slide has YAML front_matter for metadata (template, duration, focus), content sections
	# split by Markdown headings, and optional presenter notes separated by `---`.
	class Slide
		# Parses a Markdown slide file into structured data for {Slide}.
		#
		# Handles YAML front_matter extraction, presenter note separation, and
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

				# Parse once, with native front matter support.
				document = Markly.parse(raw, flags: Markly::UNSAFE | Markly::FRONT_MATTER, extensions: EXTENSIONS)

				# Extract front matter from the first AST node if present.
				front_matter = nil
				if (front_matter_node = document.first_child) && front_matter_node.type == :front_matter
					front_matter = YAML.safe_load(front_matter_node.string_content)
					front_matter_node.delete
				end

				# Find the last hrule, which acts as the separator between slide content and presenter notes.
				last_hrule = nil
				document.each{|node| last_hrule = node if node.type == :hrule}

				if last_hrule
					notes_fragment = Markly::Node.new(:document)
					while child = last_hrule.next
						notes_fragment.append_child(child)
					end
					last_hrule.delete

					# Extract the last javascript code block from the notes as the slide script.
					script_node = nil
					notes_fragment.each do |node|
						if node.type == :code_block && node.fence_info.to_s.strip == "javascript"
							script_node = node
						end
					end

					script = nil
					if script_node
						script = script_node.string_content
						script_node.delete
					end

					content = parse_sections(document.each)
					notes = render_nodes(notes_fragment.each)
				else
					content = parse_sections(document.each)
					notes = nil
					script = nil
				end

				Slide.new(path, front_matter: front_matter, content: content, notes: notes, script: script)
			end

			# Parse a list of AST nodes into sections based on top-level Markdown headings.
			# Each heading becomes a named key; content before the first heading
			# is collected under `"body"`. Headings inside code blocks are invisible
			# to this method as they never appear as top-level AST nodes.
			# @parameter nodes [Array(Markly::Node)] The nodes to parse into sections.
			# @returns [Hash(String, String)] Sections keyed by heading name, with rendered HTML values.
			def parse_sections(nodes)
				sections = {}
				current_key = "body"
				current_nodes = []

				nodes.each do |node|
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
		end

		# Load and parse a slide from a Markdown file.
		# @parameter path [String] The file path to the Markdown slide.
		# @returns [Slide]
		def self.load(path)
			Parser.load(path)
		end

		# Initialize a slide with pre-parsed data.
		# @parameter path [String] The file path of the slide.
		# @parameter front_matter [Hash | Nil] The parsed YAML front_matter.
		# @parameter content [Hash(String, String)] Content sections keyed by heading name.
		# @parameter notes [String | Nil] The rendered HTML presenter notes.
		# @parameter script [String | Nil] JavaScript to execute after the slide renders.
		def initialize(path, front_matter: nil, content: {}, notes: nil, script: nil)
			@path = path
			@front_matter = front_matter
			@content = content
			@notes = notes
			@script = script
		end

		# @attribute [String] The file path of the slide.
		attr :path

		# @attribute [Hash | Nil] The parsed YAML front_matter.
		attr :front_matter

		# @attribute [Hash(String, String)] The content sections keyed by heading name.
		attr :content

		# @attribute [String | Nil] The rendered HTML presenter notes.
		attr :notes

		# @attribute [String | Nil] JavaScript to execute after the slide renders on the display.
		attr :script

		# The template to use for rendering this slide.
		# @returns [String] The template name from front_matter, or `"default"`.
		def template
			@front_matter&.fetch("template", "default") || "default"
		end

		# The expected duration of this slide in seconds.
		# @returns [Integer] The duration from front_matter, or `60`.
		def duration
			@front_matter&.fetch("duration", 60) || 60
		end

		# The title of this slide.
		# @returns [String] The title from front_matter, or the filename without extension.
		def title
			@front_matter&.fetch("title", File.basename(@path, ".md")) || File.basename(@path, ".md")
		end

		# Whether this slide should be skipped in the presentation.
		# @returns [Boolean]
		def skip?
			@front_matter&.fetch("skip", false) || false
		end

		# The navigation marker for this slide, used in the presenter's jump-to dropdown.
		# @returns [String | Nil] The marker label, or `nil` if not marked.
		def marker
			@front_matter&.fetch("marker", nil)
		end

		# The transition type for animating into this slide.
		# @returns [String | Nil] The transition name (e.g. `"fade"`, `"slide-left"`, `"morph"`), or `nil` for instant swap.
		def transition
			@front_matter&.fetch("transition", nil)
		end

		# The line range to focus on for code slides.
		# @returns [Array(Integer, Integer) | Nil] The `[start, end]` line numbers (1-based), or `nil`.
		def focus
			if range = @front_matter&.fetch("focus", nil)
				parts = range.to_s.split("-").map(&:to_i)
				parts.length == 2 ? parts : nil
			end
		end
	end
end
