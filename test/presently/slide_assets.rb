# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/slide_assets"
require "protocol/http/middleware"
require "tmpdir"
require "fileutils"

describe Presently::SlideAssets do
	let(:dir) {Dir.mktmpdir}
	let(:assets) do
		subject.new(
			Protocol::HTTP::Middleware::NotFound,
			root: dir,
			stylesheets: ->{[]},
		)
	end
	
	after do
		FileUtils.remove_entry(dir)
	end
	
	it "handles an invalid request path" do
		request = Struct.new(:path).new(Object.new)
		
		expect(assets.send(:request_path, request)).to be_nil
	end
end
