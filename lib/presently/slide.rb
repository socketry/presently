# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "yaml"
require "markly"
require "protocol/url"
require "tempfile"

require "markly/renderer/html"

require_relative "stylesheet"

module Presently
	# A single slide parsed from a Markdown file.
	#
	# Each slide has YAML front_matter for metadata (template, duration, focus), a Markdown
	# document, and optional presenter notes separated by `---`.
	class Slide
		# A fragment of a Markly AST document.
		#
		# Wraps a `Markly::Node` of type `:document` and provides rendering helpers.
		# Used for both slide documents and presenter notes so callers can choose
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
			
			# Duplicate this fragment and its underlying AST.
			# @returns [Fragment] An independently mutable copy.
			def initialize_copy(other)
				super
				@node = other.node.dup
			end
			
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
			
			# Extract the content belonging to a named H2 placeholder.
			#
			# The matching heading itself is removed. Following nodes are extracted up
			# to the next heading of the same or a higher level. Lower-level headings
			# remain part of the extracted content.
			# @parameter name [String] The heading name to extract.
			# @returns [Fragment | Nil] The extracted content, or `nil` when not found.
			def extract(name)
				heading = find_heading(name)
				return unless heading
				
				level = heading.header_level
				fragment = Markly::Node.new(:document)
				node = heading.next
				heading.delete
				
				while node
					next_node = node.next
					break if node.type == :header && node.header_level <= level
					
					fragment.append_child(node)
					node = next_node
				end
				
				Fragment.new(fragment)
			end
			
			# Extract the first heading at the given level, retaining the heading node.
			# @parameter level [Integer] The Markdown heading level.
			# @returns [Fragment | Nil] A fragment containing the extracted heading.
			def extract_heading(level = 1)
				heading = nil
				@node.each do |node|
					if node.type == :header && node.header_level == level
						heading = node
						break
					end
				end
				return unless heading
				
				fragment = Markly::Node.new(:document)
				fragment.append_child(heading)
				Fragment.new(fragment)
			end
			
			# Render the fragment back to CommonMark Markdown.
			# @returns [String] The CommonMark source.
			def to_commonmark
				@node.to_commonmark
			end
			
			alias to_s to_commonmark
			
			# Return the plain text of the first heading at the given level.
			# @parameter level [Integer] The Markdown heading level.
			# @returns [String | Nil] The heading text, or `nil` when not found.
			def heading_text(level = 1)
				@node.each do |node|
					if node.type == :header && node.header_level == level
						return node.dup.extract_children.to_plaintext
					end
				end
			end
			
			private
			
			def find_heading(name)
				@node.each do |node|
					return node if node.type == :header && node.header_level == 2 && node.dup.extract_children.to_plaintext == name
				end
				
				nil
			end
		end
		
		# Parses a Markdown slide file into structured data for {Slide}.
		#
		# Handles YAML front_matter extraction, presenter note separation, and
		# Markdown AST construction via Markly.
		module Parser
			FLAGS = Markly::UNSAFE | Markly::FRONT_MATTER | Markly::INLINE_CODE_INFO | Markly::HTML_BLOCK_BLANK_LINES
			
			module_function
			
			# Parse slide Markdown with the standard flags and extensions.
			# @parameter source [String] The Markdown source.
			# @returns [Markly::Node] The parsed document.
			def parse(source)
				Markly.parse(source, flags: FLAGS, extensions: Fragment::EXTENSIONS)
			end
			
			# Parse the file and return a {Slide}.
			# @parameter presentation [Presentation] The presentation which owns the slide.
			# @parameter path [String] The slide path relative to the presentation root.
			# @returns [Slide]
			def load(presentation, path)
				source_path = File.join(presentation.root, path)
				raw = File.read(source_path)
				
				# Parse once, with native front matter support.
				document = parse(raw)
				
				expand_includes!(document, File.dirname(source_path), presentation.root)
				rewrite_image_urls!(document, source_path, presentation.root)
				scripts = extract_setup_scripts!(document)
				
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
					
					if script_node
						scripts << script_node.string_content
						script_node.delete
					end
					
					notes = Fragment.new(notes_node)
				else
					notes = nil
				end
				
				Slide.new(presentation, path, front_matter: front_matter, document: Fragment.new(document), notes: notes, scripts: scripts)
			end
			
			# Extract reusable setup scripts from the expanded slide document.
			#
			# Setup scripts use a `javascript presently` fenced code block. They are
			# removed from rendered Markdown and executed in document order before the
			# slide-specific script from the presenter notes.
			# @parameter document [Markly::Node] The expanded slide document.
			# @returns [Array(String)] The extracted JavaScript sources.
			def extract_setup_scripts!(document)
				script_nodes = []
				
				document.each do |node|
					if node.type == :code_block && node.fence_info.to_s.strip == "javascript presently"
						script_nodes << node
					end
				end
				
				script_nodes.map do |node|
					script = node.string_content
					node.delete
					script
				end
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
					included_document = parse(included_raw)
					
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
		# @parameter document [Fragment | Nil] The complete slide document.
		# @parameter notes [Fragment | Nil] The presenter notes as a Markly AST fragment.
		# @parameter scripts [Array(String)] JavaScript sources to execute after the slide renders.
		def initialize(presentation, path, front_matter: nil, document: nil, notes: nil, scripts: [])
			@presentation = presentation
			@path = path
			@front_matter = front_matter
			@document = document || Fragment.new(Markly::Node.new(:document))
			@notes = notes
			@scripts = scripts.dup
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
		
		# @attribute [Fragment] The complete slide document.
		attr :document
		
		# @attribute [Fragment | Nil] The presenter notes as a Markly AST fragment.
		attr :notes
		
		# @attribute [Array(String)] JavaScript sources to execute after the slide renders on the display.
		attr :scripts
		
		# The template to use for rendering this slide.
		# @returns [String] The template name from front_matter, or `"default"`.
		def template
			@front_matter&.fetch("template", "default") || "default"
		end
		
		# The expected duration of this slide in seconds.
		# Negative, invalid, or non-finite values are treated as zero.
		# @returns [Float] A finite duration of at least `0.0`, or `60.0` when unspecified or null.
		def duration
			value = @front_matter&.fetch("duration", nil)
			return 60.0 if value.nil?
			
			duration = Float(value, exception: false)
			return 0.0 unless duration&.finite?
			
			duration.clamp(0.0, nil)
		end
		
		# The timer action to apply when advancing from this slide.
		# @returns [String | Nil] `"start"`, `"pause"`, `"resume"`, or `nil` when unspecified.
		def timer
			@front_matter&.fetch("timer", nil)
		end
		
		# Update the expected duration in the slide's YAML front matter.
		# Preserves the remainder of the source file rather than reserializing it.
		# @parameter duration [Integer] The new positive duration in seconds.
		# @returns [Integer] The persisted duration.
		def update_duration!(duration)
			duration = Integer(duration)
			raise ArgumentError, "Duration must be positive!" unless duration.positive?
			
			path = source_path
			source = File.read(path)
			newline = source.include?("\r\n") ? "\r\n" : "\n"
			
			front_matter_pattern = /\A---[ \t]*(?<newline>\r?\n)(?<body>.*?)(?<closing>^---[ \t]*(?:\r?\n|\z))/m
			if match = front_matter_pattern.match(source)
				body = match[:body]
				
				if line = /^duration:[^#\r\n]*(?<comment>[ \t]+#[^\r\n]*)?(?<newline>\r?\n|\z)/.match(body)
					replacement = "duration: #{duration}#{line[:comment]}#{line[:newline]}"
					body = body[0...line.begin(0)] + replacement + body[line.end(0)..]
				else
					body += match[:newline] unless body.empty? || body.end_with?("\n")
					body += "duration: #{duration}#{match[:newline]}"
				end
				
				source = source[0...match.begin(:body)] + body + source[match.end(:body)..]
			else
				source = "---#{newline}duration: #{duration}#{newline}---#{newline}#{source}"
			end
			
			stat = File.stat(path)
			Tempfile.create([".presently-slide", ".md"], File.dirname(path), binmode: true) do |file|
				file.chmod(stat.mode & 0o7777)
				file.write(source)
				file.flush
				File.rename(file.path, path)
			end
			
			(@front_matter ||= {})["duration"] = duration
			return duration
		end
		
		# The title of this slide.
		# @returns [String] The H1 text, front matter title, or filename without extension.
		def title
			@document.heading_text(1) || @front_matter&.fetch("title", nil) || File.basename(@path, ".md")
		end
		
		# The section name for this slide.
		# @returns [String | Nil] The section from front matter, or `nil` when it was not specified.
		def section
			@front_matter&.fetch("section", nil)
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
