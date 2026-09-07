# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/slide_view"

describe Presently::SlideView do
	let(:view) {subject.new("example", {})}
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
			expect(selector).to be == "#example"
			expect(event).to be == "presently:slide:render"
			expect(options[:bubbles]).to be == true
			expect(options.dig(:detail, :html)).to be(:include?, '<live-view id="example"')
			expect(options.dig(:detail, :transition)).to be == "fade"
		end
	end
end
