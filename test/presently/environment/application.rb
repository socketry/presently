# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/environment/application"
require "async/service/environment"
require "async/http/endpoint"

describe Presently::Environment::Application do
	let(:environment) do
		Async::Service::Environment.build(
			Presently::Environment::Application,
			root: Dir.pwd,
			slides_root: "slides",
			endpoint: Async::HTTP::Endpoint.parse("http://localhost:0")
		)
	end

	it "exposes the presently application" do
		expect(environment.evaluator.application).to be == Presently::Application
	end

	# `make_server` comes from `Falcon::Environment::Server`, which this module
	# does not include directly. Anything wanting to run a server (e.g. the
	# `presently:export:pdf` task) has to compose the transport first.
	it "does not expose make_server before the transport is composed" do
		expect(environment.evaluator.respond_to?(:make_server)).to be == false
	end

	it "exposes make_server once the transport environment is composed" do
		evaluator = environment.evaluator
		transport = environment.with(evaluator.transport_environment)

		expect(transport.evaluator.respond_to?(:make_server)).to be == true
	end

	it "can build a server from the composed transport environment" do
		transport = environment.with(environment.evaluator.transport_environment)
		evaluator = transport.evaluator

		expect(evaluator.make_server(evaluator.endpoint)).not.to be_nil
	end
end
