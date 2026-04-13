# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require_relative "../application"
require "lively/environment/application"

module Presently
	# Namespace for environment mixins that configure a Presently server.
	module Environment
		# The environment configuration for a Presently application server.
		#
		# Extends the Lively environment with Presently-specific middleware and configuration.
		# Override {#slides_root} and {#templates_roots} to customize paths.
		module Application
			include Lively::Environment::Application
			
			# The root directory containing slide Markdown files.
			# @returns [String] Absolute path to the slides root.
			def slides_root
				File.expand_path("slides", self.root)
			end
			
			# Additional directories to search for slide templates.
			# These are searched before the gem's bundled templates,
			# allowing selective overrides without duplicating all templates.
			# @returns [Array(String)] Ordered list of template directories.
			def templates_roots
				[File.expand_path("templates", self.root)].select{|d| File.directory?(d)}
			end
			
			# The application class to use.
			# @returns [Class] The Presently application class.
			def application
				Presently::Application
			end
			
			# Build the middleware stack with Presently's public assets.
			# @returns [Protocol::HTTP::Middleware] The complete middleware stack.
			def middleware
				application = self.application
				slides_root = self.slides_root
				templates_roots = self.templates_roots
				root = self.root
				
				::Protocol::HTTP::Middleware.build do |builder|
					# Serve assets from the user's public directory:
					builder.use Lively::Assets, root: File.expand_path("public", root)
					
					# Serve Presently's bundled assets (CSS, JS, components, etc.):
					builder.use Lively::Assets, root: File.expand_path("../../../public", __dir__)
					
					# Serve Lively's built-in assets (Live.js, morphdom, etc.):
					builder.use Lively::Assets, root: File.expand_path("public", Gem.loaded_specs["lively"].full_gem_path)
					
					builder.use application,
						slides_root: slides_root,
						templates_roots: templates_roots
				end
			end
		end
	end
end
