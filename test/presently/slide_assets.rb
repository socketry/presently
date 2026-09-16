# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/slide_assets"
require "protocol/http/middleware"
require "sus/fixtures/temporary_directory_context"

describe Presently::SlideAssets do
	include Sus::Fixtures::TemporaryDirectoryContext
	
	let(:assets) do
		subject.new(
			Protocol::HTTP::Middleware::NotFound,
			root: root,
			stylesheets: ->{[]},
		)
	end
	
	it "handles an invalid request path" do
		request = Struct.new(:path).new(Object.new)
		
		expect(assets.send(:request_path, request)).to be_nil
	end
end
