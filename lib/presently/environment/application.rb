# frozen_string_literal: true

require_relative "../application"
require "lively/environment/application"

module Presently
	module Environment
		# Environment configuration for a Presently application server.
		# Extends the Lively environment with Presently-specific middleware.
		module Application
			include Lively::Environment::Application
			
			# The directory containing slide markdown files.
			# @returns [String] Absolute path to the slides directory.
			def slides_directory
				File.expand_path("slides", self.root)
			end
			
			# The directory containing slide templates.
			# Defaults to the gem's bundled templates.
			# @returns [String] Absolute path to the templates directory.
			def templates_directory
				File.expand_path("../../templates", __dir__)
			end
			
			# Resolve the application class to use.
			# @returns [Class] The application class.
			def application
				Presently::Application
			end
			
			# Build the middleware stack with Presently's public assets.
			# @returns [Protocol::HTTP::Middleware] The complete middleware stack.
			def middleware
				application = self.application
				slides_directory = self.slides_directory
				templates_directory = self.templates_directory
				
				::Protocol::HTTP::Middleware.build do |builder|
					# Serve assets from the user's public directory:
					builder.use Lively::Assets, root: File.expand_path("public", self.root)
					
					# Serve Presently's bundled assets (syntax-js, CSS, etc.):
					builder.use Lively::Assets, root: File.expand_path("../../../public", __dir__)
					
					# Serve Lively's built-in assets (Live.js, morphdom, etc.):
					builder.use Lively::Assets, root: File.expand_path("public", Gem.loaded_specs["lively"].full_gem_path)
					
					builder.use application,
						slides_directory: slides_directory,
						templates_directory: templates_directory
				end
			end
		end
	end
end
