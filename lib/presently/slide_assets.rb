# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "protocol/http/body/file"
require "protocol/http/middleware"
require "protocol/media/registry"
require "protocol/url"

require_relative "stylesheet"

module Presently
	# Serves scoped presentation stylesheets and their adjacent assets.
	class SlideAssets < Protocol::HTTP::Middleware
		# @parameter delegate [Protocol::HTTP::Middleware] The next middleware.
		# @parameter root [String] The presentation slides root.
		# @parameter stylesheets [Proc] Returns the currently discovered stylesheets.
		def initialize(delegate, root:, stylesheets:)
			super(delegate)
			
			@root = File.realpath(root)
			@stylesheets = stylesheets
		end
		
		# Serve a presentation stylesheet or adjacent asset.
		def call(request)
			path = request_path(request)
			return super unless path&.start_with?(Stylesheet::PREFIX)
			
			unless request.method == "GET" || request.method == "HEAD"
				return Protocol::HTTP::Response[405, [["allow", "GET, HEAD"]]]
			end
			
			relative_path = decode_path(path.delete_prefix(Stylesheet::PREFIX))
			return Protocol::HTTP::Response[404] unless relative_path
			
			if File.extname(relative_path) == ".css"
				serve_stylesheet(request, relative_path)
			else
				serve_asset(request, relative_path)
			end
		end
		
		private
		
		def request_path(request)
			Protocol::URL::Reference[request.path]&.path&.to_s
		rescue ArgumentError
			nil
		end
		
		def decode_path(path)
			components = Protocol::URL::Path[path].components(Protocol::URL::Encoding::System)
			return if components.empty? || components.any?{|component| component.empty? || component == "." || component == ".."}
			
			components.join(File::SEPARATOR)
		rescue ArgumentError
			nil
		end
		
		def serve_stylesheet(request, relative_path)
			stylesheet = @stylesheets.call.find{|stylesheet| stylesheet.path == relative_path}
			return Protocol::HTTP::Response[404] unless stylesheet
			
			headers = asset_headers(media_type_for(relative_path))
			body = [stylesheet.read] unless request.method == "HEAD"
			Protocol::HTTP::Response[200, headers, body]
		end
		
		def serve_asset(request, relative_path)
			media_type = media_type_for(relative_path)
			return Protocol::HTTP::Response[404] unless media_type
			
			path = resolve_path(relative_path)
			return Protocol::HTTP::Response[404] unless path
			
			body = Protocol::HTTP::Body::File.open(path) unless request.method == "HEAD"
			Protocol::HTTP::Response[200, asset_headers(media_type), body]
		end
		
		def media_type_for(path)
			Protocol::Media::Registry.for_path(path)&.type&.to_s
		end
		
		def resolve_path(relative_path)
			path = File.realpath(File.join(@root, relative_path))
			prefix = @root.end_with?(File::SEPARATOR) ? @root : @root + File::SEPARATOR
			path if path.start_with?(prefix) && File.file?(path)
		rescue Errno::ENOENT
			nil
		end
		
		def asset_headers(content_type)
			[
				["content-type", content_type],
				["cache-control", "no-store, no-cache, must-revalidate, max-age=0"],
			]
		end
	end
end
