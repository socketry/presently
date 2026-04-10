# frozen_string_literal: true

require "live"
require "lively"

require_relative "presentation"
require_relative "display_view"
require_relative "presenter_view"
require_relative "page"

module Presently
	class Resolver < Live::Resolver
		def initialize(**state)
			super()
			@state = state
		end
		
		attr :state
		
		def call(id, data)
			if klass = @allowed[data[:class]]
				return klass.new(id, data, **@state)
			end
		end
	end
	
	class Application < Lively::Application
		def initialize(delegate, slides_directory: "slides", templates_directory: nil, **options)
			@slides_directory = slides_directory
			@templates_directory = templates_directory
			
			resolver = Resolver.new(
				presentation: Presentation.new(@slides_directory),
				templates_directory: @templates_directory,
			).tap do |resolver|
				resolver.allow(DisplayView, PresenterView)
			end
			
			super(delegate, resolver: resolver, **options)
		end
		
		def presentation
			resolver.state[:presentation]
		end
		
		def title
			"Presently"
		end
		
		def body(request)
			case request.path
			when "/"
				DisplayView.new(presentation: presentation, templates_directory: @templates_directory)
			when "/presenter"
				PresenterView.new(presentation: presentation, templates_directory: @templates_directory)
			end
		end
		
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
