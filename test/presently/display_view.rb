# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/display_view"
require "presently/presentation"
require "presently/presentation_controller"
require "tmpdir"
require "fileutils"

describe Presently::DisplayView do
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
		File.write(File.join(dir, "010-first.md"), "---\ntransition: fade\n---\nFirst slide\n")
		File.write(File.join(dir, "020-second.md"), "Second slide\n")
	end
	
	after do
		FileUtils.remove_entry(dir)
	end
	
	it "renders the current slide" do
		html = view.to_html.to_s
		
		expect(html).to be(:include?, "First slide")
		expect(html).to be(:include?, 'data-transition="fade"')
		expect(html).to be(:include?, "1 / 2")
	end
	
	it "binds, updates, and closes cleanly" do
		view.bind(page)
		expect(updates.last.dig(3, :detail, :transition)).to be == "fade"
		
		controller.advance!
		expect(updates.last.first).to be == :dispatchEvent
		expect(updates.last.dig(3, :detail, :html)).to be(:include?, "Second slide")
		
		view.close
		expect(view.page).to be_nil
	end
	
	it "handles forward and backward navigation" do
		view.handle(detail: {action: "next"})
		expect(controller.current_index).to be == 1
		
		view.handle(detail: {action: "previous"})
		expect(controller.current_index).to be == 0
	end
	
	it "renders nothing when the presentation is empty" do
		empty = Dir.mktmpdir
		begin
			controller = Presently::PresentationController.new(Presently::Presentation.load(empty))
			view = subject.root(controller: controller)
			
			expect(view.to_html.to_s).not.to be(:include?, 'class="display"')
		ensure
			FileUtils.remove_entry(empty)
		end
	end
end
