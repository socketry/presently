# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/presenter_view"
require "presently/presentation"
require "presently/presentation_controller"
require "async"
require "tmpdir"
require "fileutils"

describe Presently::PresenterView do
	let(:dir) {Dir.mktmpdir}
	let(:presentation) {Presently::Presentation.load(dir)}
	let(:controller) {Presently::PresentationController.new(presentation)}
	let(:view) {subject.root(controller: controller)}
	let(:updates) {[]}
	let(:page) do
		updates = self.updates
		Object.new.tap do |page|
			page.define_singleton_method(:enqueue){|update| updates << update}
		end
	end
	
	before do
		File.write(File.join(dir, "010-first.md"), <<~MARKDOWN)
			---
			duration: 30
			marker: Introduction
			speaker: Alice
			---
			First slide

			---

			First notes
		MARKDOWN
		File.write(File.join(dir, "020-second.md"), <<~MARKDOWN)
			---
			duration: 45
			marker: Details
			speaker: Bob
			---
			Second slide
		MARKDOWN
	end
	
	after do
		FileUtils.remove_entry(dir)
	end
	
	it "renders previews, notes, timing, speakers, and navigation" do
		previous_editor = ENV["PRESENTLY_EDITOR"]
		ENV["PRESENTLY_EDITOR"] = "code"
		begin
			html = view.to_html.to_s
		ensure
			ENV["PRESENTLY_EDITOR"] = previous_editor
		end
		
		expect(html).to be(:include?, "First slide")
		expect(html).to be(:include?, "Second slide")
		expect(html).to be(:include?, "First notes")
		expect(html).to be(:include?, "▶ Start")
		expect(html).to be(:include?, "✓ On time")
		expect(html).to be(:include?, "Alice")
		expect(html).to be(:include?, "→ Bob")
		expect(html).to be(:include?, "Jump to…")
		expect(html).to be(:include?, 'class="edit-link"')
	end
	
	it "renders running, paused, ahead, and behind timing states" do
		controller.clock.start!
		running = view.to_html.to_s
		expect(running).to be(:include?, "⏸ Pause")
		
		controller.clock.pause!
		paused = view.to_html.to_s
		expect(paused).to be(:include?, "▶ Resume")
		
		controller.go_to(1)
		ahead = view.to_html.to_s
		expect(ahead).to be(:include?, "⏪ Slow down")
		expect(ahead).to be(:include?, "No presenter notes")
		expect(ahead).to be(:include?, "End of presentation")
		
		controller.go_to(0)
		controller.clock.reset!(controller.current_slide.duration + 1)
		behind = view.to_html.to_s
		expect(behind).to be(:include?, "⏩ Speed up")
	end
	
	it "binds, updates timing and slides, and closes cleanly" do
		Sync do
			view.bind(page)
			expect(updates.last.first).to be == :replace
			
			view.slide_changed!
			expect(updates.last.first).to be == :dispatchEvent
			
			view.close
			expect(view.page).to be_nil
		end
	end
	
	it "handles navigation and timing actions" do
		view.handle(detail: {action: "next"})
		expect(controller.current_index).to be == 1
		
		view.handle(detail: {action: "previous"})
		expect(controller.current_index).to be == 0
		
		view.handle(detail: {action: "pause"})
		expect(controller.clock).to be(:running?)
		view.handle(detail: {action: "pause"})
		expect(controller.clock).to be(:paused?)
		view.handle(detail: {action: "pause"})
		expect(controller.clock).to be(:running?)
		
		view.handle(detail: {action: "jump", index: "1"})
		expect(controller.current_index).to be == 1
		view.handle(detail: {action: "jump"})
		expect(controller.current_index).to be == 1
		
		view.handle(detail: {action: "reset"})
		expect(controller.clock.elapsed).to be_within(0.1).of(30)
		
		view.handle(detail: {action: "reload"})
		expect(controller.slide_count).to be == 2
	end
	
	it "renders an empty presentation" do
		empty = Dir.mktmpdir
		begin
			controller = Presently::PresentationController.new(Presently::Presentation.load(empty))
			view = subject.root(controller: controller)
			html = view.to_html.to_s
			
			expect(html).to be(:include?, "End of presentation")
			expect(html).to be(:include?, "No presenter notes")
			expect(html).not.to be(:include?, "slide-duration")
		ensure
			FileUtils.remove_entry(empty)
		end
	end
end
