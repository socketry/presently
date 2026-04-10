# frozen_string_literal: true

require "xrb/template"

module Presently
	class Page
		TEMPLATE = XRB::Template.load_file(File.expand_path("page.xrb", __dir__))
		
		def initialize(title: "Presently", body: nil)
			@title = title
			@body = body
		end
		
		attr :title
		attr :body
		
		def call
			TEMPLATE.to_string(self)
		end
	end
end
