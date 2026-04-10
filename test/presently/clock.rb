# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/clock"

describe Presently::Clock do
	let(:clock) {subject.new}
	
	with "#started?" do
		it "is not started initially" do
			expect(clock).not.to be(:started?)
		end
		
		it "is started after start!" do
			clock.start!
			expect(clock).to be(:started?)
		end
	end
	
	with "#running?" do
		it "is not running initially" do
			expect(clock).not.to be(:running?)
		end
		
		it "is running after start!" do
			clock.start!
			expect(clock).to be(:running?)
		end
		
		it "is not running after pause!" do
			clock.start!
			clock.pause!
			expect(clock).not.to be(:running?)
		end
		
		it "is running after resume!" do
			clock.start!
			clock.pause!
			clock.resume!
			expect(clock).to be(:running?)
		end
	end
	
	with "#paused?" do
		it "is not paused initially" do
			expect(clock).not.to be(:paused?)
		end
		
		it "is not paused when running" do
			clock.start!
			expect(clock).not.to be(:paused?)
		end
		
		it "is paused after start then pause" do
			clock.start!
			clock.pause!
			expect(clock).to be(:paused?)
		end
	end
	
	with "#elapsed" do
		it "is zero initially" do
			expect(clock.elapsed).to be == 0
		end
		
		it "accumulates time while running" do
			clock.start!
			sleep 0.05
			expect(clock.elapsed).to be > 0
		end
		
		it "stops accumulating when paused" do
			clock.start!
			sleep 0.05
			clock.pause!
			elapsed = clock.elapsed
			sleep 0.05
			expect(clock.elapsed).to be == elapsed
		end
		
		it "resumes accumulating after resume" do
			clock.start!
			sleep 0.05
			clock.pause!
			elapsed_at_pause = clock.elapsed
			clock.resume!
			sleep 0.05
			expect(clock.elapsed).to be > elapsed_at_pause
		end
	end
	
	with "#pause!" do
		it "does nothing if not running" do
			clock.pause!
			expect(clock).not.to be(:started?)
		end
	end
	
	with "#resume!" do
		it "does nothing if already running" do
			clock.start!
			sleep 0.05
			elapsed_before = clock.elapsed
			clock.resume!
			# Should not reset the tick, so elapsed should be continuous
			expect(clock.elapsed).to be >= elapsed_before
		end
	end
	
	with "#reset!" do
		it "resets elapsed to the given value" do
			clock.start!
			sleep 0.05
			clock.reset!(42)
			expect(clock.elapsed).to be_within(0.1).of(42)
		end
		
		it "resets elapsed to zero by default" do
			clock.start!
			sleep 0.05
			clock.reset!
			expect(clock.elapsed).to be_within(0.1).of(0)
		end
		
		it "works when paused" do
			clock.start!
			clock.pause!
			clock.reset!(10)
			expect(clock.elapsed).to be == 10
		end
	end
end
