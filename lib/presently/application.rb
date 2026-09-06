# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "lively"

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
		
		# Add Presently's application routes.
		# @parameter router [Lively::Router] The router to configure.
		def configure_routes(router)
			router.get("/") do |request|
				Page.new(title: title, body: make_view(HomeView)).call(request)
			end
			
			router.get("/display"){|request| render_view(request, DisplayView)}
			router.get("/presenter"){|request| render_view(request, PresenterView)}
			router.get("/record"){|request| render_view(request, RecordingView)}
			
			router.route("/recordings", methods: ["GET", "HEAD", "PUT"]) do |request, parameters|
				handle_recording(request, parameters)
			end
			
			router.route("/playback/recordings", methods: ["GET", "HEAD"]) do |request, parameters|
				handle_playback_recording(request, parameters)
			end
			
			router.get("/playback") do |_request, parameters|
				render_playback(parameters)
			end
			
			router.get("/export") do |_request, parameters|
				render_export(parameters)
			end
		end
		
		private
		
		# Create a Presently page with the presentation-specific stylesheets.
		# @parameter view [Live::View] The root view for the page.
		# @returns [Page] The presentation page.
		def make_page(view)
			stylesheets = controller.presentation.stylesheets.map(&:url)
			Page.new(title: title, body: view, stylesheets: stylesheets)
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
			Integer(parameters.fetch("index"))
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
