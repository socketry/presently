# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "lively"

require_relative "presentation"
require_relative "presentation_controller"
require_relative "display_view"
require_relative "presenter_view"
require_relative "page"
require_relative "state"

module Presently
	# Represents the main Presently application middleware.
	#
	# Handles routing for the display view (`/`), presenter view (`/presenter`),
	# and WebSocket connections (`/live`). Creates a shared {PresentationController}
	# that keeps all connected clients in sync.
	class Application < Lively::Application
		# Initialize a new Presently application.
		# @parameter delegate [Protocol::HTTP::Middleware] The next middleware in the chain.
		# @parameter slides_root [String] The directory containing slide files.
		# @parameter templates_roots [Array(String)] Additional directories to search for templates.
		def initialize(delegate, slides_root: "slides", templates_roots: [])
			@slides_root = slides_root
			@templates_roots = templates_roots
			
			super(delegate)
		end
		
		# The view classes that this application allows.
		# @returns [Array(Class)] The allowed view classes.
		def allowed_views
			[DisplayView, PresenterView]
		end
		
		# The shared state passed to all views via the resolver.
		# @returns [Hash] The controller as keyword state.
		def state
			{controller: controller}
		end
		
		# The shared presentation controller.
		# @returns [PresentationController] The controller instance.
		def controller
			@controller ||= begin
				templates = Templates.for(@templates_roots)
				presentation = Presentation.load(@slides_root, templates: templates)
				
				PresentationController.new(presentation, state: State.new)
			end
		end
		
		# The application title shown in the browser.
		# @returns [String] The page title.
		def title
			"Presently"
		end
		
		# Create the body view for the given request path.
		# @parameter request [Protocol::HTTP::Request] The incoming request.
		# @returns [Live::View | Nil] The view for the path, or `nil` for unknown paths.
		def body(request)
			case request.path
			when "/"
				DisplayView.new(controller: controller)
			when "/presenter"
				PresenterView.new(controller: controller)
			end
		end
		
		# Handle an HTTP request by rendering the appropriate page.
		# @parameter request [Protocol::HTTP::Request] The incoming request.
		# @returns [Protocol::HTTP::Response] The HTTP response.
		def handle(request)
			if body = self.body(request)
				page = Page.new(title: title, body: body)
				return Protocol::HTTP::Response[200, [], [page.call]]
			else
				return Protocol::HTTP::Response[404, [], ["Not Found"]]
			end
		end
	end
end
