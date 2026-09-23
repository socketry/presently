# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/application"
require "protocol/http/body/buffered"
require "protocol/http/middleware"
require "fileutils"
require "sus/fixtures/temporary_directory_context"

describe Presently::Application do
	include Sus::Fixtures::TemporaryDirectoryContext
	
	let(:slides_root) {File.join(root, "slides")}
	let(:recordings_root) {File.join(root, "audio")}
	let(:playback_recordings_root) {File.join(root, "audio-normalized")}
	let(:application) do
		subject.new(
			Protocol::HTTP::Middleware::NotFound,
			slides_root: slides_root,
			recordings_root: recordings_root,
			playback_recordings_root: playback_recordings_root,
		)
	end
	
	before do
		FileUtils.mkdir_p(slides_root)
		File.write(File.join(slides_root, "010-example.md"), "Example slide\n")
	end
	
	def request(method, path, headers = {}, body = nil)
		Protocol::HTTP::Request[method, path, headers, Protocol::HTTP::Body::Buffered.wrap(body)]
	end
	
	it "resolves recording controls independently of their parent view" do
		view = application.resolver.call("recorder:recording-controls", {
			class: "Presently::RecordingControlsView"
		})
		
		expect(view).to be_a(Presently::RecordingControlsView)
	end
	
	it "serves a home page linking to each presentation interface" do
		response = application.call(request("GET", "/"))
		html = response.read
		
		expect(response.status).to be == 200
		expect(html).not.to be(:include?, 'href="/_static/site.css"')
		expect(html).to be(:include?, 'href="/_static/index.css"')
		expect(html).to be(:include?, 'href="/_static/home.css"')
		expect(html).not.to be(:include?, 'href="/_static/slides.css"')
		expect(html).to be(:include?, 'href="/display"')
		expect(html).to be(:include?, 'href="/presenter"')
		expect(html).to be(:include?, 'href="/recorder"')
		expect(html).to be(:include?, 'href="/playback"')
	end
	
	it "exposes page construction as a public customization interface" do
		view = application.resolver.root(Presently::DisplayView)
		page = application.make_page(view)
		
		expect(page).to be_a(Presently::Page)
	end
	
	it "serves the audience display separately from the home page" do
		response = application.call(request("GET", "/display"))
		html = response.read
		
		expect(response.status).to be == 200
		expect(html).not.to be(:include?, 'href="/_static/site.css"')
		expect(html).to be(:include?, 'href="/_static/slides.css"')
		expect(html).to be(:include?, 'href="/_static/display.css"')
		expect(html).not.to be(:include?, 'href="/_static/presenter.css"')
		expect(html).to be(:include?, "Example slide")
		expect(html).to be(:include?, 'class="slide-container slide-viewport"')
		expect(html).to be(:include?, '"animejs": "/_components/animejs/dist/bundles/anime.esm.min.js"')
	end
	
	it "uses responsive slide viewports in the presenter interface" do
		response = application.call(request("GET", "/presenter"))
		html = response.read
		
		expect(response.status).to be == 200
		expect(html).to be(:include?, 'href="/_static/slides.css"')
		expect(html).to be(:include?, 'href="/_static/presenter.css"')
		expect(html.scan('class="preview-frame slide-viewport"').size).to be == 2
	end
	
	it "connects the presenter jump control to its live view" do
		File.write(File.join(slides_root, "010-example.md"), "---\nmarker: Example\n---\nExample slide\n")
		
		response = application.call(request("GET", "/presenter"))
		html = response.read
		
		expect(response.status).to be == 200
		expect(html).to be(:match?, /<select class="jump-to" data-live-id="[^"]+">/)
		expect(html).not.to be(:include?, "data-live_id")
	end
	
	it "serves the recording interface separately from the presenter" do
		response = application.call(request("GET", "/recorder"))
		html = response.read
		
		expect(response.status).to be == 200
		expect(html).to be(:include?, 'href="/_static/slides.css"')
		expect(html).to be(:include?, 'href="/_static/recorder.css"')
		expect(html).to be(:include?, "Record, review, and save one audio track")
		expect(html).to be(:include?, 'data-recording-state="missing"')
		expect(html).not.to be(:include?, "data-playback-state")
	end
	
	it "renders existing recording availability without a client-side check" do
		FileUtils.mkdir_p(recordings_root)
		File.write(File.join(recordings_root, "010-example.webm"), "audio")
		html = application.call(request("GET", "/recorder")).read
		
		expect(html).to be(:include?, 'data-recording-state="present"')
		expect(html).not.to be(:include?, "data-playback-state")
		expect(html).not.to be(:include?, "● Retake")
	end
	
	it "loads interface styles before presentation overrides" do
		File.write(File.join(slides_root, "style.css"), ".slide { color: blue; }\n")
		html = application.call(request("GET", "/display")).read
		
		expect(html.index("/_static/display.css")).to be < html.index("/_static/custom.css")
		expect(html.index("/_static/custom.css")).to be < html.index("/_slides/style.css")
	end
	
	it "only serves page interfaces via GET" do
		response = application.call(request("POST", "/recorder"))
		
		expect(response.status).to be == 405
		expect(response.headers["allow"]).to be == ["GET"]
	end
	
	it "delegates unknown routes" do
		response = application.call(request("GET", "/unknown"))
		
		expect(response.status).to be == 404
	end
	
	it "includes presentation stylesheets in live pages" do
		File.write(File.join(slides_root, "style.css"), ".slide { color: blue; }\n")
		
		response = application.call(request("GET", "/display"))
		
		expect(response.read).to be(:include?, 'href="/_slides/style.css"')
	end
	
	it "serves scoped directory stylesheets" do
		directory = File.join(slides_root, "020-section")
		FileUtils.mkdir_p(directory)
		File.write(File.join(directory, "010-example.md"), "Example\n")
		File.write(File.join(directory, "style.css"), ".diagram { color: orange; }\n")
		
		response = application.call(request("GET", "/_slides/020-section/style.css"))
		css = response.read
		
		expect(response.status).to be == 200
		expect(response.headers["content-type"]).to be == "text/css"
		expect(css).to be(:include?, '@scope (.slide[data-slide-path^="020-section/"])')
		expect(css).to be(:include?, ".diagram { color: orange; }")
	end
	
	it "serves assets adjacent to presentation stylesheets" do
		directory = File.join(slides_root, "020-section")
		FileUtils.mkdir_p(directory)
		File.write(File.join(directory, "diagram.svg"), "<svg></svg>")
		
		response = application.call(request("GET", "/_slides/020-section/diagram.svg"))
		
		expect(response.status).to be == 200
		expect(response.headers["content-type"]).to be == "image/svg+xml"
		expect(response.read).to be == "<svg></svg>"
	end
	
	it "uses the media registry for adjacent asset content types" do
		directory = File.join(slides_root, "020-section")
		FileUtils.mkdir_p(directory)
		File.binwrite(File.join(directory, "diagram.avif"), "image data")
		
		response = application.call(request("GET", "/_slides/020-section/diagram.avif"))
		
		expect(response.status).to be == 200
		expect(response.headers["content-type"]).to be == "image/avif"
		expect(response.read).to be == "image data"
	end
	
	it "serves Markdown using its registered content type" do
		response = application.call(request("GET", "/_slides/010-example.md"))
		
		expect(response.status).to be == 200
		expect(response.headers["content-type"]).to be == "text/markdown"
		expect(response.read).to be == "Example slide\n"
	end
	
	it "rejects malformed and missing presentation assets" do
		expect(application.call(request("GET", "/_slides/%")).status).to be == 404
		expect(application.call(request("GET", "/_slides/missing.svg")).status).to be == 404
	end
	
	it "only reads presentation assets" do
		response = application.call(request("POST", "/_slides/010-example.css"))
		
		expect(response.status).to be == 405
		expect(response.headers["allow"]).to be == ["GET", "HEAD"]
	end
	
	it "stores and serves a slide recording" do
		put = application.call(request("PUT", "/recordings?index=0", {"content-type" => "audio/webm;codecs=opus"}, "audio data"))
		expect(put.status).to be == 201
		
		get = application.call(request("GET", "/recordings?index=0"))
		expect(get.status).to be == 200
		expect(get.headers["content-type"]).to be == "audio/webm"
		expect(get.read).to be == "audio data"
	end
	
	it "optionally updates the slide duration when storing a recording" do
		put = application.call(request("PUT", "/recordings?index=0&duration=23", {"content-type" => "audio/webm"}, "audio data"))
		
		expect(put.status).to be == 201
		expect(put.read).to be(:include?, '"duration":23')
		expect(application.controller.current_slide.duration).to be == 23
		expect(File.read(File.join(slides_root, "010-example.md"))).to be(:start_with?, "---\nduration: 23\n---\n")
	end
	
	it "rejects an invalid recording duration" do
		response = application.call(request("PUT", "/recordings?index=0&duration=0", {"content-type" => "audio/webm"}, "audio data"))
		
		expect(response.status).to be == 400
		expect(File).not.to be(:file?, File.join(recordings_root, "010-example.webm"))
	end
	
	it "updates the duration of an existing recording without replacing it" do
		application.call(request("PUT", "/recordings?index=0", {"content-type" => "audio/webm"}, "audio data"))
		response = application.call(request("PATCH", "/recordings?index=0&duration=14"))
		
		expect(response.status).to be == 200
		expect(response.read).to be(:include?, '"duration":14')
		expect(application.controller.current_slide.duration).to be == 14
		expect(File.binread(File.join(recordings_root, "010-example.webm"))).to be == "audio data"
	end
	
	it "only updates duration when the recording exists" do
		response = application.call(request("PATCH", "/recordings?index=0&duration=14"))
		
		expect(response.status).to be == 404
		expect(application.controller.current_slide.duration).to be == 0.0
	end
	
	it "requires a valid duration when updating recording metadata" do
		application.call(request("PUT", "/recordings?index=0", {"content-type" => "audio/webm"}, "audio data"))
		
		expect(application.call(request("PATCH", "/recordings?index=0")).status).to be == 400
		expect(application.call(request("PATCH", "/recordings?index=0&duration=invalid")).status).to be == 400
	end
	
	it "supports checking for a recording without returning its body" do
		application.call(request("PUT", "/recordings?index=0", {"content-type" => "audio/webm"}, "audio data"))
		response = application.call(request("HEAD", "/recordings?index=0"))
		
		expect(response.status).to be == 200
		expect(response.body).to be_nil
	end
	
	it "rejects unsupported recording formats" do
		response = application.call(request("PUT", "/recordings?index=0", {"content-type" => "audio/mpeg"}, "audio data"))
		expect(response.status).to be == 415
	end
	
	it "requires a recording body" do
		response = application.call(request("PUT", "/recordings?index=0", {"content-type" => "audio/webm"}))
		
		expect(response.status).to be == 400
	end
	
	it "rejects oversized recordings" do
		application.instance_variable_set(:@recordings, Presently::Recordings.new(recordings_root, maximum_size: 4))
		response = application.call(request("PUT", "/recordings?index=0", {"content-type" => "audio/webm"}, "audio data"))
		
		expect(response.status).to be == 413
		expect(response.read).to be(:include?, "4 bytes")
	end
	
	it "rejects an invalid slide index" do
		expect(application.call(request("GET", "/recordings")).status).to be == 400
		expect(application.call(request("GET", "/recordings?index=20")).status).to be == 404
	end
	
	it "serves the playback interface" do
		FileUtils.mkdir_p(recordings_root)
		File.binwrite(File.join(recordings_root, "010-example.webm"), "source audio")
		
		response = application.call(request("GET", "/playback?autoplay=true&controls=false"))
		html = response.read
		
		expect(response.status).to be == 200
		expect(html).to be(:include?, "playback.js")
		expect(html).to be(:include?, 'data-autoplay="true"')
		expect(html).to be(:include?, "/playback/recordings?index=0")
	end
	
	it "prefers normalized narration for playback" do
		FileUtils.mkdir_p(recordings_root)
		FileUtils.mkdir_p(playback_recordings_root)
		File.binwrite(File.join(recordings_root, "010-example.webm"), "source audio")
		File.binwrite(File.join(playback_recordings_root, "010-example.webm"), "normalized audio")
		
		response = application.call(request("GET", "/playback/recordings?index=0"))
		
		expect(response.status).to be == 200
		expect(response.read).to be == "normalized audio"
	end
	
	it "falls back to source narration for playback" do
		FileUtils.mkdir_p(recordings_root)
		File.binwrite(File.join(recordings_root, "010-example.webm"), "source audio")
		
		response = application.call(request("GET", "/playback/recordings?index=0"))
		
		expect(response.status).to be == 200
		expect(response.read).to be == "source audio"
	end
	
	it "reports missing narration" do
		response = application.call(request("GET", "/playback/recordings?index=0"))
		
		expect(response.status).to be == 404
	end
	
	it "serves the printable export interface" do
		response = application.call(request("GET", "/export?notes=true"))
		
		expect(response.status).to be == 200
		expect(response.read).to be(:include?, "Example slide")
	end
	
	it "only reads playback narration" do
		response = application.call(request("PUT", "/playback/recordings?index=0"))
		
		expect(response.status).to be == 405
		expect(response.headers["allow"]).to be == ["GET", "HEAD"]
	end
end
