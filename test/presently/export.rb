# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/export"
require "presently/presentation"
require "tmpdir"
require "fileutils"

describe Presently::Export do
	let(:dir) {Dir.mktmpdir}
	
	after do
		FileUtils.remove_entry(dir)
	end
	
	def write_slide(name, content)
		File.write(File.join(dir, name), content)
	end
	
	before do
		write_slide("01.md", <<~MD)
			---
			duration: 30
			speaker: Alice
			---
			
			Hello World
			
			---
			
			These are presenter notes.
		MD
		
		write_slide("02.md", <<~MD)
			---
			duration: 60
			---
			
			Second slide
		MD
	end
	
	let(:presentation) {Presently::Presentation.load(dir)}
	let(:export) {subject.new(presentation: presentation)}
	
	with ".options_from_parameters" do
		it "returns an empty hash without parameters" do
			expect(subject.options_from_parameters({})).to be == {}
		end
		
		it "extracts notes, speaker, and timing" do
			options = subject.options_from_parameters("notes" => "true", "speaker" => "true", "timing" => "true")
			expect(options[:notes]).to be_truthy
			expect(options[:speaker]).to be_truthy
			expect(options[:timing]).to be_truthy
		end
		
		it "parses false values" do
			options = subject.options_from_parameters("notes" => "false", "speaker" => "false", "timing" => "false")
			expect(options[:notes]).to be_falsey
			expect(options[:speaker]).to be_falsey
			expect(options[:timing]).to be_falsey
		end
	end
	
	with "#format_duration" do
		it "formats zero as 00:00" do
			expect(export.format_duration(0)).to be == "00:00"
		end
		
		it "formats seconds only" do
			expect(export.format_duration(45)).to be == "00:45"
		end
		
		it "formats minutes and seconds" do
			expect(export.format_duration(90)).to be == "01:30"
		end
	end
	
	with "#expected_time_at" do
		it "returns 0 before the first slide" do
			expect(export.expected_time_at(0)).to be == 0
		end
		
		it "returns the duration of the first slide before the second" do
			expect(export.expected_time_at(1)).to be == 30
		end
	end
	
	with "#render_slide" do
		it "returns markup string" do
			html = export.render_slide(presentation.slides.first)
			expect(html).to be_a(XRB::MarkupString)
		end
	end
	
	with "#render_notes" do
		it "includes the slide number" do
			html = export.render_notes(presentation.slides.first, 1).to_s
			expect(html).to be(:include?, "Slide 1 of")
		end
		
		it "includes the slide filename" do
			html = export.render_notes(presentation.slides.first, 1).to_s
			expect(html).to be(:include?, "01.md")
		end
		
		it "includes the speaker name when present" do
			html = export.render_notes(presentation.slides.first, 1).to_s
			expect(html).to be(:include?, "Alice")
		end
		
		it "includes presenter notes content" do
			html = export.render_notes(presentation.slides.first, 1).to_s
			expect(html).to be(:include?, "presenter notes")
		end
		
		it "shows a placeholder when no notes" do
			html = export.render_notes(presentation.slides.last, 2).to_s
			expect(html).to be(:include?, "No presenter notes")
		end
	end
	
	with "#call" do
		it "returns an HTML string" do
			html = export.call
			expect(html).to be(:include?, "<!DOCTYPE html>")
		end
		
		it "includes all slides" do
			html = export.call
			expect(html).to be(:include?, "Hello")
			expect(html).to be(:include?, "Second slide")
		end
		
		it "loads export.js" do
			html = export.call
			expect(html).to be(:include?, "export.js")
		end
	end
	
	with "notes disabled" do
		let(:export) {subject.new(presentation: presentation, notes: false)}
		
		it "omits the notes panel from the output" do
			html = export.call
			expect(html).not.to be(:include?, "export-notes-area")
		end
	end
end
