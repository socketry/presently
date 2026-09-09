# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/page"
require "presently/presentation"
require "presently/presentation_controller"
require "presently/recording_view"
require "tmpdir"
require "fileutils"

describe Presently::RecordingView do
	let(:dir) {Dir.mktmpdir}
	let(:path) {File.join(dir, "010-example.md")}
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
		File.write(path, "---\nmarker: Example\n---\nExample slide\n\n---\nNarrate this slide.\n")
	end
	
	after do
		FileUtils.remove_entry(dir)
	end
	
	it "renders a dedicated recording interface" do
		previous_editor = ENV["PRESENTLY_EDITOR"]
		ENV["PRESENTLY_EDITOR"] = "code"
		begin
			html = Presently::Page.new(body: view).to_html
		ensure
			ENV["PRESENTLY_EDITOR"] = previous_editor
		end
		
		expect(html).to be(:include?, "Example slide")
		expect(html).to be(:include?, "Narrate this slide.")
		expect(html).to be(:include?, 'class="recording-preview slide-viewport"')
		expect(html).to be(:include?, "<presently-recorder")
		expect(html).to be(:include?, 'data-recording-url="/recordings?index=0"')
		expect(html).to be(:include?, 'class="recording-toggle"')
		expect(html).to be(:include?, "● Record")
		expect(html).not.to be(:include?, 'class="recording-stop"')
		expect(html).to be(:include?, 'class="recording-indicator"')
		expect(html).to be(:include?, 'class="edit-link"')
	end
	
	it "navigates independently of the presenter interface" do
		File.write(File.join(dir, "020-next.md"), "Next slide\n")
		controller.reload!
		
		view.handle(detail: {action: "next"})
		expect(controller.current_index).to be == 1
	end
	
	it "binds, updates, and closes cleanly" do
		view.bind(page)
		view.slide_changed!
		expect(updates.last.first).to be == :dispatchEvent
		
		view.close
		expect(view.page).to be_nil
	end
	
	it "handles all navigation actions" do
		File.write(File.join(dir, "020-next.md"), "Next slide\n")
		controller.reload!
		
		view.handle(detail: {action: "next"})
		expect(controller.current_index).to be == 1
		view.handle(detail: {action: "previous"})
		expect(controller.current_index).to be == 0
		view.handle(detail: {action: "jump", index: "1"})
		expect(controller.current_index).to be == 1
		view.handle(detail: {action: "jump"})
		expect(controller.current_index).to be == 1
		view.handle(detail: {action: "reload"})
		expect(controller.slide_count).to be == 2
	end
	
	it "renders a slide without notes or markers" do
		File.write(path, "Example slide\n")
		controller.reload!
		html = Presently::Page.new(body: view).to_html
		
		expect(html).to be(:include?, "No presenter notes")
		expect(html).not.to be(:include?, "Jump to…")
	end
	
	it "renders nothing when the presentation is empty" do
		File.unlink(path)
		controller.reload!
		
		expect(view.to_html.to_s).not.to be(:include?, 'class="recorder"')
	end
end
