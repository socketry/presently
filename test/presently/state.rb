# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/state"
require "presently/presentation_controller"
require "tmpdir"

describe Presently::State do
	let(:dir) {Dir.mktmpdir}
	let(:path) {File.join(dir, "state.json")}
	let(:state) {subject.new(path)}
	let(:presentation) {Presently::Presentation.load("slides")}
	
	after do
		FileUtils.remove_entry(dir)
	end
	
	with "#save and #restore" do
		it "persists the current slide index" do
			controller = Presently::PresentationController.new(presentation)
			controller.go_to(3)
			state.save(controller)
			
			restored = Presently::PresentationController.new(presentation)
			state.restore(restored)
			expect(restored.current_index).to be == 3
		end
		
		it "persists the clock elapsed time" do
			controller = Presently::PresentationController.new(presentation)
			controller.clock.start!
			controller.clock.reset!(120.0)
			controller.clock.pause!
			state.save(controller)
			
			restored = Presently::PresentationController.new(presentation)
			state.restore(restored)
			expect(restored.clock.elapsed).to be_within(0.1).of(120.0)
		end
		
		it "persists the clock running state" do
			controller = Presently::PresentationController.new(presentation)
			controller.clock.start!
			controller.clock.pause!
			state.save(controller)
			
			restored = Presently::PresentationController.new(presentation)
			state.restore(restored)
			expect(restored.clock).to be(:paused?)
		end
		
		it "persists a running clock" do
			controller = Presently::PresentationController.new(presentation)
			controller.clock.start!
			controller.clock.reset!(60.0)
			state.save(controller)
			
			restored = Presently::PresentationController.new(presentation)
			state.restore(restored)
			expect(restored.clock).to be(:running?)
			expect(restored.clock.elapsed).to be >= 60.0
		end
		
		it "handles missing state file gracefully" do
			controller = Presently::PresentationController.new(presentation)
			state.restore(controller)
			expect(controller.current_index).to be == 0
		end
	end
	
	with "auto-save via controller" do
		it "saves state on slide changes" do
			controller = Presently::PresentationController.new(presentation, state: state)
			controller.go_to(2)
			
			expect(File.exist?(path)).to be == true
			
			data = JSON.parse(File.read(path), symbolize_names: true)
			expect(data[:current_index]).to be == 2
		end
		
		it "restores state on initialization" do
			controller = Presently::PresentationController.new(presentation, state: state)
			controller.go_to(4)
			
			restored = Presently::PresentationController.new(presentation, state: state)
			expect(restored.current_index).to be == 4
		end
	end
end
