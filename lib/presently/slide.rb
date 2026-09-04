# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "yaml"
require "markly"
require "protocol/url"

require "markly/renderer/html"

require_relative "stylesheet"

module Presently
	# A single slide parsed from a Markdown file.
	#
	# Each slide has YAML front_matter for metadata (template, duration, focus), content sections
	# split by Markdown headings, and optional presenter notes separated by `---`.
	class Slide
		# A fragment of a Markly AST document.
		#
		# Wraps a `Markly::Node` of type `:document` and provides rendering helpers.
		# Used for both content sections and presenter notes so callers can choose
		# their output format without the parser pre-committing to one.
		class Fragment
			# Markly extensions enabled for all slide Markdown rendering.
			EXTENSIONS = [:table, :tasklist, :strikethrough, :autolink]
			
			# Initialize a fragment from a Markly document node.
			# @parameter node [Markly::Node] A document node containing the fragment content.
			def initialize(node)
				@node = node
			end
			
			# @attribute [Markly::Node] The underlying AST document node.
			attr :node
			
			# Whether the fragment has no content.
			# @returns [Boolean]
			def empty?
				@node.first_child.nil?
			end
			
			# Render the fragment to HTML.
			# @returns [String] The rendered HTML.
			def to_html
				Markly::Renderer::HTML.new(flags: Markly::UNSAFE, extensions: EXTENSIONS).render(@node)
			end
			
			# Render the fragment back to CommonMark Markdown.
			# @returns [String] The CommonMark source.
			def to_commonmark
				@node.to_commonmark
			end
			
			alias to_s to_commonmark
		end
		
		# Parses a Markdown slide file into structured data for {Slide}.
		#
		# Handles YAML front_matter extraction, presenter note separation, and
		# Markdown AST construction via Markly.
		module Parser
			module_function
			
			# Parse the file and return a {Slide}.
			# @parameter presentation [Presentation] The presentation which owns the slide.
			# @parameter path [String] The slide path relative to the presentation root.
			# @returns [Slide]
			def load(presentation, path)
				source_path = File.join(presentation.root, path)
				raw = File.read(source_path)
				
				# Parse once, with native front matter support.
				document = Markly.parse(raw, flags: Markly::UNSAFE | Markly::FRONT_MATTER, extensions: Fragment::EXTENSIONS)
				
				expand_includes!(document, File.dirname(source_path), presentation.root)
				rewrite_image_urls!(document, source_path, presentation.root)
				
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
					notes_node = Markly::Node.new(:document)
					while child = last_hrule.next
						notes_node.append_child(child)
					end
					last_hrule.delete
					
					# Extract the last javascript code block from the notes as the slide script.
					script_node = nil
					notes_node.each do |node|
						if node.type == :code_block && node.fence_info.to_s.strip == "javascript"
							script_node = node
						end
					end
					
					script = nil
					if script_node
						script = script_node.string_content
						script_node.delete
					end
					
					content = parse_sections(document)
					notes = Fragment.new(notes_node)
				else
					content = parse_sections(document)
					notes = nil
					script = nil
				end
				
				Slide.new(presentation, path, front_matter: front_matter, content: content, notes: notes, script: script)
			end
			
			# Expand `![[path/to/file.md]]` include directives in a parsed document.
			#
			# Scans top-level paragraph nodes for the Obsidian-style embed syntax and
			# replaces each one with the parsed AST of the referenced file. Includes
			# are resolved relative to `base_dir`. Front matter in included files is
			# stripped. Nested includes are expanded recursively up to a depth of 10.
			#
			# @parameter document [Markly::Node] The document to expand in-place.
			# @parameter base_dir [String] Directory used to resolve relative paths.
			# @parameter root [String] The presentation asset root.
			# @parameter depth [Integer] Current recursion depth (guards against cycles).
			def expand_includes!(document, base_dir, root, depth: 0)
				raise "Include depth limit exceeded" if depth > 10
				
				# Collect matching paragraphs first — mutating the tree while iterating is unsafe.
				to_replace = []
				document.each do |node|
					next unless node.type == :paragraph
					child = node.first_child
					next unless child && child.next.nil? && child.type == :text
					next unless child.string_content =~ /\A!\[\[(.+?)\]\]\z/
					to_replace << [node, $1.strip]
				end
				
				to_replace.each do |paragraph, relative_path|
					included_path = File.expand_path(relative_path, base_dir)
					included_raw = File.read(included_path)
					included_document = Markly.parse(included_raw, flags: Markly::UNSAFE | Markly::FRONT_MATTER, extensions: Fragment::EXTENSIONS)
					
					# Strip front matter from included file if present.
					front_matter_node = included_document.first_child
					if front_matter_node&.type == :front_matter
						front_matter_node.delete
					end
					
					expand_includes!(included_document, File.dirname(included_path), root, depth: depth + 1)
					rewrite_image_urls!(included_document, included_path, root)
					
					included_document.each{|node| paragraph.insert_before(node.dup)}
					paragraph.delete
				end
			end
			
			# Rewrite relative Markdown image destinations so they remain relative to
			# the source file after its content is rendered into a shared HTML page.
			# @parameter document [Markly::Node] The document containing image nodes.
			# @parameter source_path [String] The Markdown source path.
			# @parameter root [String] The presentation asset root.
			def rewrite_image_urls!(document, source_path, root)
				directory = File.dirname(File.expand_path(source_path))
				root = File.expand_path(root)
				return unless directory == root || directory.start_with?(root + File::SEPARATOR)
				
				relative_directory = directory.delete_prefix(root).delete_prefix(File::SEPARATOR)
				base_path = Stylesheet::PREFIX
				base_path += Stylesheet.encode_path(relative_directory) + "/" unless relative_directory.empty?
				base_url = Protocol::URL::Relative.new(base_path)
				
				document.walk do |node|
					next unless node.type == :image
					
					url = Protocol::URL[node.url]
					next unless url.is_a?(Protocol::URL::Relative)
					next if url.path.empty? || url.path.absolute?
					
					node.url = (base_url + url).to_s
				end
			end
			
			# Parse a Markly document into content sections based on top-level headings.
			#
			# Each heading becomes a named key; content before the first heading is
			# collected under `"body"`. Each value is a {Fragment} wrapping a document node.
			# @parameter document [Markly::Node] The document to parse.
			# @returns [Hash(String, Fragment)] Sections keyed by heading name.
			def parse_sections(document)
				sections = {}
				current_key = "body"
				current_node = Markly::Node.new(:document)
				
				document.each do |node|
					if node.type == :header
						sections[current_key] = Fragment.new(current_node) unless current_node.first_child.nil?
						current_key = node.to_plaintext.strip.downcase.gsub(/\s+/, "_")
						current_node = Markly::Node.new(:document)
					else
						current_node.append_child(node.dup)
					end
				end
				
				sections[current_key] = Fragment.new(current_node) unless current_node.first_child.nil?
				
				sections
			end
		end
		
		# Load and parse a slide from a Markdown file.
		# @parameter presentation [Presentation] The presentation which owns the slide.
		# @parameter path [String] The slide path relative to the presentation root.
		# @returns [Slide]
		def self.load(presentation, path)
			Parser.load(presentation, path)
		end
		
		# Initialize a slide with pre-parsed data.
		# @parameter presentation [Presentation] The presentation which owns the slide.
		# @parameter path [String] The slide path relative to the presentation root.
		# @parameter front_matter [Hash | Nil] The parsed YAML front_matter.
		# @parameter content [Hash(String, Fragment)] Content sections keyed by heading name.
		# @parameter notes [Fragment | Nil] The presenter notes as a Markly AST fragment.
		# @parameter script [String | Nil] JavaScript to execute after the slide renders.
		def initialize(presentation, path, front_matter: nil, content: {}, notes: nil, script: nil)
			@presentation = presentation
			@path = path
			@front_matter = front_matter
			@content = content
			@notes = notes
			@script = script
		end
		
		# @attribute [Presentation] The presentation which owns the slide.
		attr :presentation
		
		# @attribute [String] The slide path relative to the presentation root.
		attr :path
		
		# The absolute path of the slide source file.
		# @returns [String]
		def source_path
			File.join(@presentation.root, @path)
		end
		
		# @attribute [Hash | Nil] The parsed YAML front_matter.
		attr :front_matter
		
		# @attribute [Hash(String, Fragment)] The content sections keyed by heading name.
		attr :content
		
		# @attribute [Fragment | Nil] The presenter notes as a Markly AST fragment.
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
		# @returns [String | Nil] The transition name (e.g. `"fade"`, `"slide-left"`, `"slide-right"`), or `nil` for instant swap.
		def transition
			@front_matter&.fetch("transition", nil)
		end
		
		# The name of the speaker presenting this slide.
		# @returns [String | Nil] The speaker name from front_matter, or `nil` if not specified.
		def speaker
			@front_matter&.fetch("speaker", nil)
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
