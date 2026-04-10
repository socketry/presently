# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "live"
require "lively"

require_relative "presentation"
require_relative "presentation_controller"
require_relative "display_view"
require_relative "presenter_view"
require_relative "page"

module Presently
	# Extends {Live::Resolver} to pass shared state to views on construction.
	#
	# When the browser reconnects via WebSocket, the resolver creates new view
	# instances with the shared {PresentationController} so all clients stay in sync.
	class Resolver < Live::Resolver
		# Initialize a new resolver with shared state.
		# @parameter state [Hash] Key-value pairs to pass to view constructors.
		def initialize(**state)
			super()
			@state = state
		end
		
		# @attribute [Hash] The shared state passed to view constructors.
		attr :state
		
		# Resolve a client-side element to a server-side instance with shared state.
		# @parameter id [String] The unique element identifier.
		# @parameter data [Hash] The element data attributes.
		# @returns [Live::Element | Nil] The resolved element, or `nil`.
		def call(id, data)
			if klass = @allowed[data[:class]]
				return klass.new(id, data, **@state)
			end
		end
	end
	
	# The main Presently application middleware.
	#
	# Handles routing for the display view (`/`), presenter view (`/presenter`),
	# and WebSocket connections (`/live`). Creates a shared {PresentationController}
	# that keeps all connected clients in sync.
	class Application < Lively::Application
		# Initialize a new Presently application.
		# @parameter delegate [Protocol::HTTP::Middleware] The next middleware in the chain.
		# @parameter slides_root [String] The directory containing slide files.
		# @parameter templates_root [String | Nil] The directory containing custom templates.
		# @parameter options [Hash] Additional options passed to the parent.
		def initialize(delegate, slides_root: "slides", templates_root: nil, **options)
			presentation = Presentation.load(slides_root, templates_root: templates_root)
			
			resolver = Resolver.new(
				controller: PresentationController.new(presentation),
			).tap do |resolver|
				resolver.allow(DisplayView, PresenterView)
			end
			
			super(delegate, resolver: resolver, **options)
		end
		
		# The shared presentation controller.
		# @returns [PresentationController] The controller instance.
		def controller
			resolver.state[:controller]
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
