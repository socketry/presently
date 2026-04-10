# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require_relative "../application"
require "lively/environment/application"

module Presently
	module Environment
		# The environment configuration for a Presently application server.
		#
		# Extends the Lively environment with Presently-specific middleware and configuration.
		# Override {#slides_root} and {#templates_root} to customize paths.
		module Application
			include Lively::Environment::Application
			
			# The root directory containing slide Markdown files.
			# @returns [String] Absolute path to the slides root.
			def slides_root
				File.expand_path("slides", self.root)
			end
			
			# The root directory containing slide templates.
			# Defaults to the gem's bundled templates.
			# @returns [String] Absolute path to the templates root.
			def templates_root
				File.expand_path("../../../templates", __dir__)
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
				templates_root = self.templates_root
				root = self.root
				
				::Protocol::HTTP::Middleware.build do |builder|
					# Serve assets from the user's public directory:
					builder.use Lively::Assets, root: File.expand_path("public", root)
					
					# Serve Presently's bundled assets (syntax-js, CSS, etc.):
					builder.use Lively::Assets, root: File.expand_path("../../../public", __dir__)
					
					# Serve Lively's built-in assets (Live.js, morphdom, etc.):
					builder.use Lively::Assets, root: File.expand_path("public", Gem.loaded_specs["lively"].full_gem_path)
					
					builder.use application,
						slides_root: slides_root,
						templates_root: templates_root
				end
			end
		end
	end
end
