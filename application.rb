#!/usr/bin/env lively
# frozen_string_literal: true

require "live"
require "lively"
require_relative "lib/presently/presentation"
require_relative "lib/presently/display_view"
require_relative "lib/presently/presenter_view"
require_relative "lib/presently/page"

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
	def self.resolver
		Resolver.new(presentation: Presently::Presentation.new("slides")).tap do |resolver|
			resolver.allow(Presently::DisplayView, Presently::PresenterView)
		end
	end
	
	def presentation
		@resolver.state[:presentation]
	end
	
	def title
		"Presently"
	end
	
	def body(request)
		case request.path
		when "/"
			Presently::DisplayView.new(presentation: presentation)
		when "/presenter"
			Presently::PresenterView.new(presentation: presentation)
		end
	end
	
	def handle(request)
		if body = self.body(request)
			page = Presently::Page.new(title: title, body: body)
			return Protocol::HTTP::Response[200, [], [page.call]]
		else
			return Protocol::HTTP::Response[404, [], ["Not Found"]]
		end
	end
end
