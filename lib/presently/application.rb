# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "lively"
require "protocol/url"

require_relative "presentation"
require_relative "presentation_controller"
require_relative "home_view"
require_relative "display_view"
require_relative "presenter_view"
require_relative "recording_view"
require_relative "recordings"
require_relative "slide_assets"
require_relative "playback"
require_relative "export"
require_relative "page"
require_relative "state"

module Presently
	# Represents the main Presently application middleware.
	#
	# Routes the presentation, recording, playback, export, and live interfaces.
	# Creates a shared {PresentationController} that keeps connected clients in sync.
	class Application < Lively::Application
		# Initialize a new Presently application.
		# @parameter delegate [Protocol::HTTP::Middleware] The next middleware in the chain.
		# @parameter slides_root [String] The directory containing slide files.
		# @parameter templates_roots [Array(String)] Additional directories to search for templates.
		# @parameter recordings_root [String | Nil] Directory where source narration is stored. Defaults to `audio` beside the slides directory.
		# @parameter playback_recordings_root [String | Nil] Directory containing normalized narration. Defaults to `audio-normalized` beside the slides directory.
		def initialize(delegate, slides_root: "slides", templates_roots: [], recordings_root: nil, playback_recordings_root: nil)
			@slides_root = slides_root
			@templates_roots = templates_roots
			@recordings = Recordings.new(recordings_root || File.expand_path("../audio", slides_root))
			@playback_recordings = Recordings.new(playback_recordings_root || File.expand_path("../audio-normalized", slides_root))
			
			slide_assets = SlideAssets.new(delegate, root: @slides_root, stylesheets: ->{controller.presentation.stylesheets})
			super(slide_assets)
		end
		
		# The view classes that this application allows.
		# @returns [Array(Class)] The allowed view classes.
		def allowed_views
			[HomeView, DisplayView, PresenterView, RecordingView]
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
				presentation = Presentation.load(@slides_root, templates)
				
				PresentationController.new(presentation, state: State.new)
			end
		end
		
		# The application title shown in the browser.
		# @returns [String] The page title.
		def title
			"Presently"
		end
		
		# Create a Presently page with the presentation-specific stylesheets.
		# @parameter view [Live::View] The root view for the page.
		# @returns [Page] The presentation page.
		def make_page(view)
			stylesheets = controller.presentation.stylesheets.map(&:url)
			Page.new(title: title, body: view, stylesheets: stylesheets)
		end
		
		# Add Presently's application routes.
		# @parameter router [Lively::Router::Builder] The router to configure.
		def configure_routes(router)
			router.get("/") do
				body = resolver.root(HomeView)
				Page.new(title: title, body: body).call
			end
			
			router.get("/display"){make_page(resolver.root(DisplayView)).call}
			router.get("/presenter"){make_page(resolver.root(PresenterView)).call}
			router.get("/record"){make_page(resolver.root(RecordingView)).call}
			
			router.route("/recordings", methods: ["GET", "HEAD", "PUT"]) do |request|
				handle_recording(request, request_parameters(request))
			end
			
			router.route("/playback/recordings", methods: ["GET", "HEAD"]) do |request|
				handle_playback_recording(request, request_parameters(request))
			end
			
			router.get("/playback") do |request|
				render_playback(request_parameters(request))
			end
			
			router.get("/export") do |request|
				render_export(request_parameters(request))
			end
		end
		
		private
		
		# Parse query parameters from the incoming request target.
		# @parameter request [Protocol::HTTP::Request] The incoming request.
		# @returns [Hash] The decoded query parameters.
		def request_parameters(request)
			Protocol::URL::Reference[request.path].parse_query!
		end
		
		# Render the narrated playback interface.
		def render_playback(parameters)
			presentation = Presentation.load(@slides_root, controller.templates)
			recording_urls = presentation.slides.each_index.map do |index|
				slide = presentation.slides[index]
				if @playback_recordings.exist?(slide) || @recordings.exist?(slide)
					"/playback/recordings?index=#{index}"
				end
			end
			
			playback = Playback.new(
				presentation: presentation,
				recording_urls: recording_urls,
				**Playback.options_from_parameters(parameters),
			)
			
			Protocol::HTTP::Response[200, [["content-type", "text/html"]], [playback.call]]
		end
		
		# Render the printable export interface.
		def render_export(parameters)
			presentation = Presentation.load(@slides_root, controller.templates)
			export = Export.new(presentation: presentation, **Export.options_from_parameters(parameters))
			
			Protocol::HTTP::Response[200, [["content-type", "text/html"]], [export.call]]
		end
		
		# Handle reading and writing a slide recording.
		# @parameter request [Protocol::HTTP::Request] The incoming request.
		# @parameter parameters [Hash] The decoded query parameters.
		# @returns [Protocol::HTTP::Response]
		def handle_recording(request, parameters)
			index = recording_index(parameters)
			return Protocol::HTTP::Response[400, [], ["A valid slide index is required."]] unless index
			
			slide = controller.slides[index]
			return Protocol::HTTP::Response[404, [], ["Slide not found."]] unless slide
			
			case request.method
			when "GET", "HEAD"
				serve_recording(request, slide, @recordings)
			when "PUT"
				store_recording(request, slide)
			end
		end
		
		# Serve normalized narration for playback, falling back to the source take.
		def handle_playback_recording(request, parameters)
			index = recording_index(parameters)
			return Protocol::HTTP::Response[400, [], ["A valid slide index is required."]] unless index
			
			slide = controller.slides[index]
			return Protocol::HTTP::Response[404, [], ["Slide not found."]] unless slide
			
			recordings = @playback_recordings.exist?(slide) ? @playback_recordings : @recordings
			serve_recording(request, slide, recordings)
		end
		
		# Extract the slide index from decoded query parameters.
		# @parameter parameters [Hash] The decoded query parameters.
		# @returns [Integer | Nil]
		def recording_index(parameters)
			index = Integer(parameters.fetch("index"))
			index if index >= 0
		rescue ArgumentError, KeyError
			nil
		end
		
		# Serve an existing recording.
		# @parameter request [Protocol::HTTP::Request] The incoming request.
		# @parameter slide [Slide] The requested slide.
		# @returns [Protocol::HTTP::Response]
		def serve_recording(request, slide, recordings)
			unless recordings.exist?(slide)
				return Protocol::HTTP::Response[404, [], ["Recording not found."]]
			end
			
			headers = [
				["content-type", Recordings::CONTENT_TYPE],
				["cache-control", "no-store"],
			]
			body = recordings.read(slide) unless request.method == "HEAD"
			
			Protocol::HTTP::Response[200, headers, body]
		end
		
		# Store an uploaded recording.
		# @parameter request [Protocol::HTTP::Request] The incoming request.
		# @parameter slide [Slide] The slide being recorded.
		# @returns [Protocol::HTTP::Response]
		def store_recording(request, slide)
			content_type = request.headers["content-type"]&.split(";", 2)&.first
			unless content_type == Recordings::CONTENT_TYPE
				return Protocol::HTTP::Response[415, [], ["Expected #{Recordings::CONTENT_TYPE}."]]
			end
			
			unless request.body
				return Protocol::HTTP::Response[400, [], ["A recording body is required."]]
			end
			
			@recordings.write(slide, request.body)
			Protocol::HTTP::Response[201, [["content-type", "application/json"]], ["{\"saved\":true}"]]
		rescue Recordings::TooLarge => error
			Protocol::HTTP::Response[413, [], [error.message]]
		end
	end
end
