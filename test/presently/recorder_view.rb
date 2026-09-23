# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/page"
require "presently/presentation"
require "presently/presentation_controller"
require "presently/recorder_view"
require "presently/recordings"
require "fileutils"
require "sus/fixtures/temporary_directory_context"

describe Presently::RecorderView do
	include Sus::Fixtures::TemporaryDirectoryContext
	
	let(:path) {File.join(root, "010-example.md")}
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
		File.write(path, "---\nmarker: Example\n---\nExample slide\n\n---\nNarrate this slide.\n")
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
		expect(html).to be(:include?, "<presently-recording-controls")
		expect(html).to be(:include?, 'data-class="Presently::RecordingControlsView"')
		expect(html).to be(:include?, 'data-slide-index="0"')
		expect(html).to be(:include?, 'data-recording-url="/recordings?index=0"')
		expect(html).to be(:include?, 'data-slide-duration="0.0"')
		expect(html).to be(:include?, 'data-recording-state="missing"')
		expect(html).to be(:match?, /<presently-recording-controls\b[^>]*><\/presently-recording-controls>/)
		expect(html).not.to be(:include?, "data-playback-state")
		expect(html).not.to be(:include?, 'class="recording-toggle"')
		expect(html).not.to be(:include?, 'class="recording-playback"')
		expect(html).not.to be(:include?, 'class="recording-apply-duration"')
		expect(html).not.to be(:include?, 'class="recording-update-duration"')
		expect(html).not.to be(:include?, "recording-status")
		expect(html).to be(:include?, 'class="edit-link"')
	end
	
	it "preserves the recorder identity between slides" do
		File.write(File.join(root, "020-next.md"), "Next slide\n")
		controller.reload!
		
		first_html = view.to_html.to_s
		controller.go_to(1)
		second_html = view.to_html.to_s
		first_id = first_html[/<presently-recording-controls id="([^"]+)"/, 1]
		second_id = second_html[/<presently-recording-controls id="([^"]+)"/, 1]
		
		expect(first_id).to be == second_id
		expect(first_html).to be(:include?, 'data-slide-index="0"')
		expect(second_html).to be(:include?, 'data-slide-index="1"')
	end
	
	it "renders existing recording availability immediately" do
		recordings = Presently::Recordings.new(File.join(root, "audio"))
		FileUtils.mkdir_p(File.dirname(recordings.path(presentation.slides.first)))
		File.write(recordings.path(presentation.slides.first), "audio")
		controller = Presently::PresentationController.new(presentation, recordings: recordings)
		html = Presently::Page.new(body: subject.root(controller: controller)).to_html
		
		expect(html).to be(:include?, 'data-recording-state="present"')
		expect(html).to be(:include?, 'data-recording-url="/recordings?index=0"')
		expect(html).not.to be(:include?, "data-playback-state")
		expect(html).not.to be(:include?, 'class="recording-playback"')
		expect(html).not.to be(:include?, "● Retake")
	end
	
	it "navigates independently of the presenter interface" do
		File.write(File.join(root, "020-next.md"), "Next slide\n")
		controller.reload!
		
		view.handle(detail: {action: "next"})
		expect(controller.current_index).to be == 1
	end
	
	it "does not run timer actions when navigating while recording" do
		File.write(path, "---\ntimer: start\n---\nWaiting slide\n")
		File.write(File.join(root, "020-next.md"), "Next slide\n")
		
		view.handle(detail: {action: "next"})
		expect(controller.current_index).to be == 1
		expect(controller.clock).not.to be(:started?)
	end
	
	it "binds, updates, and closes cleanly" do
		view.bind(page)
		view.slide_changed!
		expect(updates.last.first).to be == :dispatchEvent
		
		view.close
		expect(view.page).to be_nil
	end
	
	it "handles all navigation actions" do
		File.write(File.join(root, "020-next.md"), "Next slide\n")
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
