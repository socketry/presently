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
	let(:view) {subject.new(controller: controller)}
	
	before do
		File.write(path, "---\nmarker: Example\n---\nExample slide\n\n---\nNarrate this slide.\n")
	end
	
	after do
		FileUtils.remove_entry(dir)
	end
	
	it "renders a dedicated recording interface" do
		html = Presently::Page.new(body: view).to_html
		
		expect(html).to be(:include?, "Example slide")
		expect(html).to be(:include?, "Narrate this slide.")
		expect(html).to be(:include?, "<presently-recorder")
		expect(html).to be(:include?, 'data-recording-url="/recordings?index=0"')
		expect(html).to be(:include?, 'class="recording-toggle"')
		expect(html).to be(:include?, "● Record")
		expect(html).not.to be(:include?, 'class="recording-stop"')
		expect(html).to be(:include?, 'class="recording-indicator"')
	end
	
	it "navigates independently of the presenter interface" do
		File.write(File.join(dir, "020-next.md"), "Next slide\n")
		controller.reload!
		
		view.handle(detail: {action: "next"})
		expect(controller.current_index).to be == 1
	end
end
