#!/usr/bin/env lively
# frozen_string_literal: true

require "live"
require "lively"
require_relative "lib/presently/presentation"
require_relative "lib/presently/display_view"
require_relative "lib/presently/presenter_view"

# Shared presentation state across all connected clients.
PRESENTATION = Presently::Presentation.new("slides")

class DisplayPage < Lively::Pages::Index
	def initialize
		super(title: "Presently")
	end
	
	def body
		Presently::DisplayView.new
	end
end

class PresenterPage < Lively::Pages::Index
	def initialize
		super(title: "Presently — Presenter")
	end
	
	def body
		Presently::PresenterView.new
	end
end

class Application < Lively::Application
	def self.resolver
		Live::Resolver.allow(Presently::DisplayView, Presently::PresenterView)
	end
	
	def call(request)
		case request.path
		when "/"
			return Protocol::HTTP::Response[200, [
				["content-type", "text/html"]
			], [DisplayPage.new.call]]
		when "/presenter"
			return Protocol::HTTP::Response[200, [
				["content-type", "text/html"]
			], [PresenterPage.new.call]]
		when "/live"
			return Async::WebSocket::Adapters::HTTP.open(request, &self.method(:live)) || Protocol::HTTP::Response[400]
		else
			super
		end
	end
end
