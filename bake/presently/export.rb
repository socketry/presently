# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

def initialize(context)
	super
	
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
# @parameter port [Integer] Local port for the temporary server. Default: a free ephemeral port.
# @parameter timeout [Integer] Seconds to wait for the page to signal readiness. Default: `60`.
def pdf(output: "presentation.pdf", slides_root: "slides", notes: true, speaker: true, timing: true, port: nil, timeout: 60)
	require "async"
	require "async/service"
	require "async/webdriver"
	require "presently"
	require "presently/environment/application"
	
	port ||= ephemeral_port
	base_url = "http://localhost:#{port}"
	query = URI.encode_www_form(notes: notes, speaker: speaker, timing: timing)
	export_url = "#{base_url}/export?#{query}"
	
	page_width_cm   = Presently::ExportPage::SLIDE_WIDTH_CM
	slide_height_cm = Presently::ExportPage::SLIDE_HEIGHT_CM
	notes_height_cm = notes ? Presently::ExportPage::NOTES_HEIGHT_CM : 0.0
	page_height_cm  = (slide_height_cm + notes_height_cm).round(4)
	
	# Build the service environment using the standard Presently stack, then
	# override `url` and `slides_root` for this ephemeral export server.
	configuration = Async::Service::Configuration.build(root: context.root) do
		service "presently" do
			include Presently::Environment::Application
		end
	end
	
	environment = configuration.environments.first.with(
		url: base_url,
		slides_root: File.expand_path(slides_root, context.root)
	)
	
	evaluator = environment.evaluator
	
	slide_count = Presently::Presentation.load(evaluator.slides_root).slide_count
	Console.info(self, "Exporting #{slide_count} slides...", output: output)
	
	Async do |task|
		# Start the Falcon server in a background fiber using the same
		# make_server path the production service uses.
		server = evaluator.make_server(evaluator.endpoint)
		server_task = task.async { server.run }
		
		# Yield once so the server fiber can bind the port before we proceed.
		task.yield
		
		begin
			bridge = Async::WebDriver::Bridge::Chrome.for(:stable)
			driver = bridge.start
			
			begin
				client = Async::WebDriver::Client.open(driver.endpoint)
				
				begin
					session = client.session(bridge.default_capabilities)
					
					begin
						session.resize_window(
							Presently::ExportPage::SLIDE_WIDTH_PX,
							Presently::ExportPage::SLIDE_HEIGHT_PX
						)
						
						session.page_load_timeout = timeout * 1000
						session.script_timeout    = timeout * 1000
						
						Console.info(self, "Navigating to export page...", url: export_url)
						session.navigate_to(export_url)
						
						# Block until export.js dispatches presently:ready.
						session.execute_async(<<~JS)
							const done = arguments[arguments.length - 1];
							if (window.__PRESENTLY_READY) { done(); return; }
							document.addEventListener('presently:ready', () => done(), {once: true});
						JS
						
						Console.info(self, "Page ready, printing PDF...")
						
						pdf_data = session.print(
							background:    true,
							margin:        {top: 0, bottom: 0, left: 0, right: 0},
							page:          {width: page_width_cm, height: page_height_cm},
							shrink_to_fit: false
						)
						
						FileUtils.mkdir_p(File.dirname(File.expand_path(output)))
						File.write(output, pdf_data, mode: "wb")
						
						Console.info(self, "Export complete.", output: output, slides: slide_count)
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
		end
	end
end

private

# Find a free TCP port on localhost.
# @returns [Integer]
def ephemeral_port
	require "socket"
	server = TCPServer.new("localhost", 0)
	port   = server.local_address.ip_port
	server.close
	port
end
