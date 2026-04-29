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
# @parameter timeout [Integer] Seconds to wait for the page to signal readiness. Default: `60`.
def pdf(output: "presentation.pdf", slides_root: "slides", notes: true, speaker: true, timing: true, slide_width_px: 1920, slide_height_px: 1080, notes_height_px: 300, timeout: 60)
	require "async"
	require "async/http/endpoint"
	require "async/service"
	require "async/webdriver"
	require "presently"
	require "presently/environment/application"
	
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
	
	Async do |task|
		# Bind port 0 first so we know the actual address before starting the server.
		bound_endpoint = Async::HTTP::Endpoint.parse("http://localhost:0").bound
		
		begin
			environment = Async::Service::Environment.for(
				Presently::Environment::Application,
				root: context.root,
				slides_root: File.expand_path(slides_root, context.root),
				endpoint: bound_endpoint,
			)
			
			evaluator = environment.evaluator
			server = evaluator.make_server(evaluator.endpoint)
			server_task = task.async { server.run }
			
			begin
				# Derive the actual base URL from the bound socket address.
				base_url = nil
				bound_endpoint.local_address_endpoint.each do |ep|
					addr = ep.address
					host = addr.ipv6? ? "[#{addr.ip_address}]" : addr.ip_address
					base_url = "http://#{host}:#{addr.ip_port}"
					break
				end
				
				export_url = "#{base_url}/export?#{query}"
				
				bridge = Async::WebDriver::Bridge::Chrome.for(:stable)
				driver = bridge.start
				
				begin
					client = Async::WebDriver::Client.open(driver.endpoint)
					
					begin
						session = client.session(bridge.default_capabilities)
						
						begin
							session.resize_window(
								page_size.slide_width_px,
								page_size.slide_height_px
							)
							
							session.page_load_timeout = timeout * 1000
							session.script_timeout = timeout * 1000
							
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
								page:          {width: page_size.slide_width_cm, height: page_height_cm},
								shrink_to_fit: false
							)
							
							FileUtils.mkdir_p(File.dirname(File.expand_path(output)))
							File.write(output, pdf_data, mode: "wb")
							
							Console.info(self, "Export complete.", output: output)
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
end
