# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/presentation"
require "presently/recordings"
require "protocol/http/body/buffered"
require "tmpdir"
require "fileutils"

describe Presently::Recordings do
	let(:dir) {Dir.mktmpdir}
	let(:slides_root) {File.join(dir, "slides")}
	let(:recordings_root) {File.join(dir, "audio")}
	let(:presentation) {Presently::Presentation.load(slides_root)}
	let(:slide) {presentation.slides.first}
	let(:recordings) {subject.new(recordings_root)}
	
	before do
		FileUtils.mkdir_p(File.join(slides_root, "020-topic"))
		File.write(File.join(slides_root, "020-topic", "010-example.md"), "Example\n")
	end
	
	after do
		FileUtils.remove_entry(dir)
	end
	
	it "maps the slide path to a WebM recording path" do
		expect(recordings.relative_path(slide)).to be == "020-topic/010-example.webm"
		expect(recordings.path(slide)).to be == File.join(recordings_root, "020-topic", "010-example.webm")
	end
	
	it "writes and reads the recording" do
		body = Protocol::HTTP::Body::Buffered.wrap(["audio", " data"])
		recordings.write(slide, body)
		
		expect(recordings).to be(:exist?, slide)
		expect(recordings.read(slide).join).to be == "audio data"
	end
	
	it "does not replace an existing recording when an upload is too large" do
		FileUtils.mkdir_p(File.dirname(recordings.path(slide)))
		File.binwrite(recordings.path(slide), "existing")
		limited_recordings = subject.new(recordings_root, maximum_size: 4)
		body = Protocol::HTTP::Body::Buffered.wrap("larger")
		expect{limited_recordings.write(slide, body)}.to raise_exception(Presently::Recordings::TooLarge)
		
		expect(File.binread(recordings.path(slide))).to be == "existing"
	end
end
