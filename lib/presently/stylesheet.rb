# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "protocol/url"

module Presently
	# A presentation stylesheet loaded beside slides.
	#
	# Root `style.css` is global. Nested `style.css` files apply to slides below
	# their directory, while a CSS file matching a slide name applies only to
	# that slide.
	class Stylesheet
		PREFIX = "/_slides/"
		STYLE_NAME = "style.css"
		
		class << self
			# Encode a presentation-relative path while preserving its directory structure.
			# @parameter path [String] A path relative to the slides root.
			# @returns [String] The URL-encoded path.
			def encode_path(path)
				components = path.split(File::SEPARATOR)
				Protocol::URL::Path.for(components, encoding: Protocol::URL::Encoding::System).to_s
			end
			
			# Discover stylesheets in the order they should enter the cascade.
			# @parameter root [String] The presentation slides root.
			# @parameter slides [Array(Slide)] The ordered presentation slides.
			# @returns [Array(Stylesheet)] The discovered stylesheets.
			def discover(root, slides)
				root = File.expand_path(root)
				stylesheets = {}
				
				add(stylesheets, root, STYLE_NAME, nil)
				
				slides.each do |slide|
					directory = File.dirname(slide.path)
					
					unless directory == "."
						components = directory.split(File::SEPARATOR)
						components.each_index do |index|
							path = File.join(*components[0..index], STYLE_NAME)
							scope = directory_scope(File.dirname(path))
							add(stylesheets, root, path, scope)
						end
					end
					
					path = slide.path.sub(/\.md\z/, ".css")
					add(stylesheets, root, path, slide_scope(slide.path))
				end
				
				stylesheets.values
			end
			
			private
			
			def add(stylesheets, root, path, scope)
				return if stylesheets.key?(path)
				return unless File.file?(File.join(root, path))
				
				stylesheets[path] = new(root, path, scope)
			end
			
			def directory_scope(directory)
				path = encode_path(directory) + "/"
				%(.slide[data-slide-path^="#{path}"])
			end
			
			def slide_scope(path)
				%(.slide[data-slide-path="#{encode_path(path)}"])
			end
		end
		
		# Initialize a stylesheet.
		# @parameter root [String] The presentation slides root.
		# @parameter path [String] The path relative to the slides root.
		# @parameter scope [String | Nil] The CSS scope selector, or nil for global CSS.
		def initialize(root, path, scope = nil)
			@root = File.expand_path(root)
			@path = path
			@scope = scope
		end
		
		# @attribute [String] The path relative to the presentation root.
		attr :path
		
		# @attribute [String | Nil] The generated CSS scope selector.
		attr :scope
		
		# The URL from which this stylesheet is served.
		# @returns [String]
		def url
			PREFIX + self.class.encode_path(@path)
		end
		
		# The absolute source path.
		# @returns [String]
		def source_path
			File.join(@root, @path)
		end
		
		# Read this stylesheet and apply its generated scope when required.
		# @returns [String]
		def read
			content = File.read(source_path)
			return content unless @scope
			
			"@scope (#{@scope}) {\n#{content}\n}\n"
		end
	end
end
