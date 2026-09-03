# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

def initialize(context)
	super
	
	require "base64"
	require "fileutils"
	require "uri"
end

# Export the presentation to a PDF file.
#
# Starts a Presently server in-process, opens a headless Chrome browser,
# navigates to the `/export` page, waits for all slides to finish rendering,
# then prints the multi-page document to PDF.
#
# @parameter output [String] Output PDF path. Default: `presentation.pdf`.
# @parameter slides_root [String] The slides directory. Default: `slides`.
# @parameter notes [Boolean] Include presenter notes below each slide. Default: `true`.
# @parameter speaker [Boolean] Include the speaker name below each slide. Default: `true`.
# @parameter timing [Boolean] Include slide duration and elapsed time. Default: `true`.
# @parameter timeout [Integer] Seconds to wait for the page to signal readiness. Default: `60`.
def pdf(output: "presentation.pdf", slides_root: "slides", notes: true, speaker: true, timing: true, slide_width_px: 1920, slide_height_px: 1080, notes_height_px: 300, timeout: 60)
	require "presently"
	
	page_size = Presently::Export::PageSize.new(
		slide_width_px:  slide_width_px,
		slide_height_px: slide_height_px,
		notes_height_px: notes_height_px,
	)
	
	page_height_cm = (page_size.slide_height_cm + (notes ? page_size.notes_height_cm : 0.0)).round(4)
	
	query = URI.encode_www_form(
		notes: notes, speaker: speaker, timing: timing,
		slide_width_px: slide_width_px, slide_height_px: slide_height_px, notes_height_px: notes_height_px
	)
	
	with_browser_session(slides_root: slides_root, timeout: timeout) do |session, base_url|
		session.resize_window(
			page_size.slide_width_px,
			page_size.slide_height_px
		)
		
		session.navigate_to("#{base_url}/export?#{query}")
		
		# Block until export.js dispatches presently:ready.
		session.execute_async(<<~JS)
			const done = arguments[arguments.length - 1];
			if (window.__PRESENTLY_READY) { done(); return; }
			document.addEventListener('presently:ready', () => done(), {once: true});
		JS
		
		pdf_data = session.print(
			background:    true,
			margin:        {top: 0, bottom: 0, left: 0, right: 0},
			page:          {width: page_size.slide_width_cm, height: page_height_cm},
			shrink_to_fit: false
		)
		
		FileUtils.mkdir_p(File.dirname(File.expand_path(output)))
		File.write(output, pdf_data, mode: "wb")
	end
	
	return {path: output}
end

# Export the narrated presentation to an MP4 video.
#
# This uses Chromium's experimental `Page.startScreenRecording` DevTools
# command. Until that command reaches Chrome for Testing, pass matching
# Chromium and ChromeDriver paths explicitly (or through the
# `PRESENTLY_CHROME_PATH` and `PRESENTLY_CHROMEDRIVER_PATH` environment
# variables).
#
# @parameter output [String] Output MP4 path. Default: `presentation.mp4`.
# @parameter slides_root [String] The slides directory. Default: `slides`.
# @parameter width [Integer] Maximum video width. Default: `1920`.
# @parameter height [Integer] Maximum video height. Default: `1080`.
# @parameter frame_rate [Integer] Maximum video frame rate. Default: `30`.
# @parameter timeout [Integer] Seconds to wait for the playback page to load. Default: `60`.
# @parameter duration_limit [Integer] Maximum presentation duration in seconds. Default: `3600`.
# @parameter browser_version [String] Chrome for Testing version used when explicit paths are omitted. Default: `canary`.
# @parameter browser_path [String | Nil] Path to a Chromium executable supporting screen recording.
# @parameter driver_path [String | Nil] Path to a matching ChromeDriver executable.
def video(output: "presentation.mp4", slides_root: "slides", width: 1920, height: 1080, frame_rate: 30, timeout: 60, duration_limit: 3600, browser_version: "canary", browser_path: nil, driver_path: nil)
	browser_path ||= ENV["PRESENTLY_CHROME_PATH"]
	driver_path ||= ENV["PRESENTLY_CHROMEDRIVER_PATH"]
	
	with_browser_session(
		slides_root: slides_root,
		timeout: timeout,
		script_timeout: duration_limit,
		browser_version: browser_version,
		browser_path: browser_path,
		driver_path: driver_path,
		chrome_arguments: ["--autoplay-policy=no-user-gesture-required", "--hide-scrollbars"]
	) do |session, base_url|
		resize_viewport(session, width, height)
		session.navigate_to("#{base_url}/playback?autoplay=false&controls=false")
		
		ready = session.execute_async(<<~JS)
			const done = arguments[arguments.length - 1];
			if (window.__PRESENTLY_PLAYBACK_ERROR) { done({error: window.__PRESENTLY_PLAYBACK_ERROR}); return; }
			if (window.__PRESENTLY_PLAYBACK_READY) { done({ready: true}); return; }
			document.addEventListener('presently:playback-error', event => done({error: event.detail.message}), {once: true});
			document.addEventListener('presently:playback-ready', () => done({ready: true}), {once: true});
		JS
		
		raise "Playback preparation failed: #{ready["error"]}" if ready["error"]
		
		recording_started = false
		stream = nil
		playback = nil
		
		begin
			devtools(session, "Page.startScreenRecording", audio: true, maxWidth: width, maxHeight: height, frameRate: frame_rate)
			recording_started = true
			
			session.execute("window.__PRESENTLY_PLAYBACK_START();")
			playback = session.execute_async(<<~JS)
				const done = arguments[arguments.length - 1];
				if (window.__PRESENTLY_PLAYBACK_ERROR) { done({error: window.__PRESENTLY_PLAYBACK_ERROR}); return; }
				if (window.__PRESENTLY_PLAYBACK_FINISHED) { done({finished: true}); return; }
				document.addEventListener('presently:playback-error', event => done({error: event.detail.message}), {once: true});
				document.addEventListener('presently:playback-finished', () => done({finished: true}), {once: true});
			JS
		ensure
			if recording_started
				stream = devtools(session, "Page.stopScreenRecording")["stream"]
			end
		end
		
		raise "Playback failed: #{playback["error"]}" if playback&.dig("error")
		raise "Chromium did not return the recorded video stream!" unless stream
		
		write_devtools_stream(session, stream, output)
	end
	
	return {path: output}
end

private

def with_browser_session(slides_root:, timeout:, script_timeout: timeout, browser_version: "stable", browser_path: nil, driver_path: nil, chrome_arguments: [])
	require "async"
	require "async/http/endpoint"
	require "async/service"
	require "async/webdriver"
	require "presently/environment/application"
	
	result = nil
	
	Async do |task|
		# Bind port 0 first so we know the actual address before starting the server.
		bound_endpoint = Async::HTTP::Endpoint.parse("http://localhost:0").bound
		
		begin
			environment = Async::Service::Environment.build(
				Presently::Environment::Application,
				root: Dir.pwd,
				slides_root: slides_root,
				endpoint: Async::HTTP::Endpoint.parse("http://localhost", bound_endpoint)
			)
			
			# Export always requires an HTTP server, regardless of the configured
			# Lively transport:
			transport = environment.with(environment.evaluator.http_environment)
			evaluator = transport.evaluator
			server = evaluator.make_server(evaluator.endpoint)
			server_task = task.async{server.run}
			
			begin
				base_url = export_base_url(bound_endpoint)
				bridge = chrome_bridge(browser_version, browser_path, driver_path)
				driver = bridge.start
				
				begin
					client = Async::WebDriver::Client.open(driver.endpoint)
					
					begin
						capabilities = bridge.default_capabilities
						capabilities[:alwaysMatch][:"goog:chromeOptions"][:args].concat(chrome_arguments)
						session = client.session(capabilities)
						
						begin
							session.page_load_timeout = timeout * 1000
							session.script_timeout = script_timeout * 1000
							result = yield(session, base_url)
						ensure
							session.close
						end
					ensure
						client.close
					end
				ensure
					driver.close
				end
			ensure
				server_task.stop
				server_task.wait
			end
		ensure
			bound_endpoint.close
		end
	end
	
	return result
end

def chrome_bridge(browser_version, browser_path, driver_path)
	if browser_path || driver_path
		options = {}
		options[:browser_path] = File.expand_path(browser_path) if browser_path
		options[:driver_path] = File.expand_path(driver_path) if driver_path
		
		Async::WebDriver::Bridge::Chrome.new(**options)
	else
		Async::WebDriver::Bridge::Chrome.for(browser_version.to_sym)
	end
end

def export_base_url(bound_endpoint)
	bound_endpoint.local_address_endpoint.each do |endpoint|
		address = endpoint.address
		host = address.ipv6? ? "[#{address.ip_address}]" : address.ip_address
		return "http://#{host}:#{address.ip_port}"
	end
	
	raise "Could not determine the export server address!"
end

def resize_viewport(session, width, height)
	# WebDriver sizes the outer window, while screen recording captures the page
	# viewport. Measure the browser decoration after an initial resize and
	# compensate so the recorded video has the requested dimensions.
	session.resize_window(width, height)
	dimensions = session.execute(<<~JS)
		return {outerWidth, outerHeight, innerWidth, innerHeight};
	JS
	
	session.resize_window(
		width + dimensions["outerWidth"] - dimensions["innerWidth"],
		height + dimensions["outerHeight"] - dimensions["innerHeight"]
	)
end

def devtools(session, command, **parameters)
	session.post("goog/cdp/execute", {cmd: command, params: parameters})
rescue Async::WebDriver::Error => error
	raise "Chromium does not support #{command}: #{error.message}"
end

def write_devtools_stream(session, stream, output)
	path = File.expand_path(output)
	FileUtils.mkdir_p(File.dirname(path))
	
	begin
		File.open(path, "wb") do |file|
			loop do
				chunk = devtools(session, "IO.read", handle: stream, size: 1024 * 1024)
				data = chunk["data"]
				data = Base64.strict_decode64(data) if chunk["base64Encoded"]
				file.write(data)
				break if chunk["eof"]
			end
		end
	ensure
		devtools(session, "IO.close", handle: stream)
	end
end
