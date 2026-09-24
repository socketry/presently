# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/presenter_view"
require "presently/presentation"
require "presently/presentation_controller"
require "async"
require "sus/fixtures/temporary_directory_context"

describe Presently::PresenterView do
	include Sus::Fixtures::TemporaryDirectoryContext
	
	let(:presentation) {Presently::Presentation.load(root)}
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
		File.write(File.join(root, "010-first.md"), <<~MARKDOWN)
			---
			duration: 30
			marker: Introduction
			speaker: Alice
			---
			First slide

			---

			First notes
		MARKDOWN
		File.write(File.join(root, "020-second.md"), <<~MARKDOWN)
			---
			duration: 45
			marker: Details
			speaker: Bob
			---
			Second slide
		MARKDOWN
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
	
	it "shows elapsed time without pacing indicators when no time is allocated" do
		File.write(File.join(root, "010-first.md"), "First slide\n")
		File.write(File.join(root, "020-second.md"), "Second slide\n")
		
		expect(controller.pacing).to be_nil
		expect(view.to_html.to_s).to be(:include?, "▶ Start")
		controller.clock.restore!(42.0, running: true)
		expect(controller.pacing).to be_nil
		
		html = view.to_html.to_s
		expect(html).to be(:include?, "Elapsed: 0:42")
		expect(html).to be(:include?, "⏸ Pause")
		expect(html).to be(:include?, "--slide-progress: 0.0%")
		expect(html).not.to be(:include?, 'class="remaining"')
		expect(html).not.to be(:include?, 'class="pacing-indicator"')
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
	
	it "starts timing when advancing from a waiting slide" do
		File.write(File.join(root, "010-first.md"), "---\ntimer: start\nduration: 0\n---\nWaiting slide\n")
		
		expect(view.to_html.to_s).to be(:include?, "▶ Start")
		view.handle(detail: {action: "next"})
		expect(controller.current_index).to be == 1
		expect(view.to_html.to_s).to be(:include?, "⏸ Pause")
		
		view.handle(detail: {action: "previous"})
		expect(view.to_html.to_s).to be(:include?, "Waiting slide")
	end
	
	it "can start timing again after resetting on the waiting slide" do
		File.write(File.join(root, "010-first.md"), "---\ntimer: start\nduration: 0\n---\nWaiting slide\n")
		
		view.handle(detail: {action: "next"})
		view.handle(detail: {action: "previous"})
		expect(view.to_html.to_s).to be(:include?, "⏸ Pause")
		
		view.handle(detail: {action: "reset"})
		expect(view.to_html.to_s).to be(:include?, "▶ Start")
		
		view.handle(detail: {action: "next"})
		expect(controller.clock).to be(:running?)
		expect(controller.clock.elapsed).to be_within(0.1).of(0)
	end
	
	it "renders an empty presentation" do
		empty = File.join(root, "empty")
		Dir.mkdir(empty)
		controller = Presently::PresentationController.new(Presently::Presentation.load(empty))
		view = subject.root(controller: controller)
		html = view.to_html.to_s
		
		expect(html).to be(:include?, "End of presentation")
		expect(html).to be(:include?, "No presenter notes")
		expect(html).not.to be(:include?, "slide-duration")
	end
end
