# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/playback"
require "presently/presentation"
require "tmpdir"
require "fileutils"

describe Presently::Playback do
	let(:dir) {Dir.mktmpdir}
	
	after do
		FileUtils.remove_entry(dir)
	end
	
	before do
		File.write(File.join(dir, "01.md"), "First slide\n")
		File.write(File.join(dir, "02.md"), "Second slide\n")
	end
	
	let(:presentation) {Presently::Presentation.load(dir)}
	let(:recording_urls) {["/recordings?index=0", "/recordings?index=1"]}
	let(:playback) {subject.new(presentation: presentation, recording_urls: recording_urls)}
	
	with ".options_from_parameters" do
		it "uses interactive playback by default" do
			expect(subject.options_from_parameters({})).to be == {autoplay: false, controls: true}
		end
		
		it "parses autoplay and controls" do
			expect(subject.options_from_parameters("autoplay" => "true", "controls" => "false")).to be == {autoplay: true, controls: false}
		end
	end
	
	with "#call" do
		it "renders every slide and narration track" do
			html = playback.call
			
			expect(html).to be(:include?, "First slide")
			expect(html).to be(:include?, "Second slide")
			expect(html.scan("<audio ").size).to be == 2
		end
		
		it "loads the playback controller" do
			expect(playback.call).to be(:include?, "playback.js")
		end
		
		it "loads presentation stylesheets" do
			File.write(File.join(dir, "style.css"), ".slide { color: blue; }\n")
			
			expect(playback.call).to be(:include?, 'href="/_slides/style.css"')
		end
		
		it "omits an unavailable narration track" do
			playback = subject.new(presentation: presentation, recording_urls: [recording_urls.first, nil])
			
			expect(playback.call.scan("<audio ").size).to be == 1
		end
		
		it "embeds playback options" do
			playback = subject.new(presentation: presentation, recording_urls: recording_urls, autoplay: true, controls: false)
			
			expect(playback.call).to be(:include?, 'data-autoplay="true"')
			expect(playback.call).to be(:include?, 'data-controls="false"')
		end
	end
end
