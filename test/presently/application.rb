# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/application"
require "protocol/http/body/buffered"
require "protocol/http/middleware"
require "tmpdir"
require "fileutils"

describe Presently::Application do
	let(:dir) {Dir.mktmpdir}
	let(:slides_root) {File.join(dir, "slides")}
	let(:recordings_root) {File.join(dir, "audio")}
	let(:playback_recordings_root) {File.join(dir, "audio-normalized")}
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
	
	after do
		FileUtils.remove_entry(dir)
	end
	
	def request(method, path, headers = {}, body = nil)
		Protocol::HTTP::Request[method, path, headers, Protocol::HTTP::Body::Buffered.wrap(body)]
	end
	
	it "serves the recording interface separately from the presenter" do
		response = application.handle(request("GET", "/record"))
		
		expect(response.status).to be == 200
		expect(response.read).to be(:include?, "Record, review, and save one audio track")
	end
	
	it "stores and serves a slide recording" do
		put = application.handle(request("PUT", "/recordings?index=0", {"content-type" => "audio/webm;codecs=opus"}, "audio data"))
		expect(put.status).to be == 201
		
		get = application.handle(request("GET", "/recordings?index=0"))
		expect(get.status).to be == 200
		expect(get.headers["content-type"]).to be == "audio/webm"
		expect(get.read).to be == "audio data"
	end
	
	it "supports checking for a recording without returning its body" do
		application.handle(request("PUT", "/recordings?index=0", {"content-type" => "audio/webm"}, "audio data"))
		response = application.handle(request("HEAD", "/recordings?index=0"))
		
		expect(response.status).to be == 200
		expect(response.body).to be_nil
	end
	
	it "rejects unsupported recording formats" do
		response = application.handle(request("PUT", "/recordings?index=0", {"content-type" => "audio/mpeg"}, "audio data"))
		expect(response.status).to be == 415
	end
	
	it "rejects an invalid slide index" do
		expect(application.handle(request("GET", "/recordings")).status).to be == 400
		expect(application.handle(request("GET", "/recordings?index=20")).status).to be == 404
	end
	
	it "serves the playback interface" do
		FileUtils.mkdir_p(recordings_root)
		File.binwrite(File.join(recordings_root, "010-example.webm"), "source audio")
		
		response = application.handle(request("GET", "/playback?autoplay=true&controls=false"))
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
		
		response = application.handle(request("GET", "/playback/recordings?index=0"))
		
		expect(response.status).to be == 200
		expect(response.read).to be == "normalized audio"
	end
	
	it "falls back to source narration for playback" do
		FileUtils.mkdir_p(recordings_root)
		File.binwrite(File.join(recordings_root, "010-example.webm"), "source audio")
		
		response = application.handle(request("GET", "/playback/recordings?index=0"))
		
		expect(response.status).to be == 200
		expect(response.read).to be == "source audio"
	end
	
	it "only reads playback narration" do
		response = application.handle(request("PUT", "/playback/recordings?index=0"))
		
		expect(response.status).to be == 405
		expect(response.headers["allow"]).to be == ["GET", "HEAD"]
	end
end
