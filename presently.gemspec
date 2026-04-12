# frozen_string_literal: true

require_relative "lib/presently/version"

Gem::Specification.new do |spec|
	spec.name = "presently"
	spec.version = Presently::VERSION
	
	spec.summary = "A web-based presentation tool built with Lively."
	spec.authors = ["Samuel Williams"]
	spec.license = "MIT"
	
	spec.homepage = "https://github.com/socketry/presently"
	
	spec.metadata = {
		"source_code_uri" => "https://github.com/socketry/presently.git",
	}
	
	spec.files = Dir["{bake,bin,lib,public,templates}/**/*", "*.md", base: __dir__]
	
	spec.executables = ["presently"]
	
	spec.required_ruby_version = ">= 3.3"
	
	spec.add_dependency "lively", "~> 0.16"
	spec.add_dependency "markly", "~> 0.15"
end
