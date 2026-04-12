# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "xrb/template"

module Presently
	# Resolves and caches XRB templates using a layered search path.
	#
	# Templates are looked up by name across multiple root directories in order.
	# The first match wins, allowing user templates to override gem defaults
	# without duplicating the entire set.
	class Templates
		# The default directory containing bundled slide templates.
		DEFAULT_ROOT = File.expand_path("../../templates", __dir__)
		
		# Create a template resolver for the given user-supplied roots, appending the built-in default.
		# This is the normal way to create a {Templates} instance.
		# @parameter custom_roots [Array(String)] User-supplied directories to search first.
		# @returns [Templates]
		def self.for(custom_roots = [])
			new(custom_roots + [DEFAULT_ROOT])
		end
		
		# Initialize with a fully-resolved root list.
		# Prefer {.build} for normal use; use this when you already have the complete list.
		# @parameter roots [Array(String)] The complete ordered list of directories to search.
		def initialize(roots = [DEFAULT_ROOT])
			@roots = roots
			@cache = {}
		end
		
		# @attribute [Array(String)] The complete ordered search paths.
		attr :roots
		
		# Return a new {Templates} with the same roots and an empty cache.
		def reload
			self.class.new(@roots)
		end
		
		# Resolve and load a template by name.
		# Searches each root directory in order for `{name}.xrb`.
		# @parameter name [String] The template name (without extension).
		# @returns [XRB::Template] The loaded template.
		# @raises [Errno::ENOENT] If the template is not found in any root.
		def resolve(name)
			@cache[name] ||= begin
				path = find(name)
				XRB::Template.load_file(path)
			end
		end
		
		# Find the path to a template by name.
		# @parameter name [String] The template name (without extension).
		# @returns [String] The absolute path to the template file.
		# @raises [Errno::ENOENT] If the template is not found in any root.
		def find(name)
			filename = "#{name}.xrb"
			
			@roots.each do |root|
				path = File.join(root, filename)
				return path if File.exist?(path)
			end
			
			raise Errno::ENOENT, "Template '#{name}' not found in: #{@roots.join(', ')}"
		end
	end
end
