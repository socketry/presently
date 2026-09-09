# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/slide_view"

describe Presently::SlideView do
	let(:view) {subject.new("2eef0b2c-fe65-4aba-ba90-0a6a83a6ce80", {})}
	let(:updates) {[]}
	let(:page) do
		updates = self.updates
		
		Object.new.tap do |page|
			page.define_singleton_method(:enqueue) do |update|
				updates << update
			end
		end
	end
	
	with "#render_slide!" do
		it "dispatches a client-side slide render event" do
			view.bind(page)
			view.render_slide!(transition: "fade")
			
			method, selector, event, options = updates.last
			
			expect(method).to be == :dispatchEvent
			expect(selector).to be == '[id="2eef0b2c-fe65-4aba-ba90-0a6a83a6ce80"]'
			expect(event).to be == "presently:slide:render"
			expect(options[:bubbles]).to be == true
			expect(options.dig(:detail, :html)).to be(:include?, '<live-view id="2eef0b2c-fe65-4aba-ba90-0a6a83a6ce80"')
			expect(options.dig(:detail, :transition)).to be == "fade"
		end
	end
	
	with "#render_slide_path" do
		it "separates the directory from the filename for responsive truncation" do
			builder = XRB::Builder.new
			view.render_slide_path(builder, "010-section/020-topic/030-example.md")
			html = builder.to_s
			
			expect(html).to be(:include?, 'title="010-section/020-topic/030-example.md"')
			expect(html).to be(:include?, 'class="slide-path-directory"')
			expect(html).to be(:include?, "010-section/020-topic")
			expect(html).to be(:include?, 'class="slide-path-filename"')
			expect(html).to be(:include?, "/030-example.md")
		end
		
		it "renders a top-level filename without a separator" do
			builder = XRB::Builder.new
			view.render_slide_path(builder, "010-example.md")
			html = builder.to_s
			
			expect(html).not.to be(:include?, "slide-path-directory")
			expect(html).to be(:include?, 'class="slide-path-filename"')
			expect(html).to be(:include?, "010-example.md")
		end
	end
end
