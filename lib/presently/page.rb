# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "xrb/template"

module Presently
	# The HTML page shell for a Presently view.
	#
	# Renders the initial HTML page with the import map, stylesheets, and the
	# embedded Live view component. Uses a custom XRB template that includes
	# Presently's assets (syntax highlighting, etc.).
	class Page
		# The compiled XRB template for the page shell.
		TEMPLATE = XRB::Template.load_file(File.expand_path("page.xrb", __dir__))
		
		# Initialize a new page.
		# @parameter title [String] The page title.
		# @parameter body [Live::View | Nil] The Live view to embed in the page.
		def initialize(title: "Presently", body: nil)
			@title = title
			@body = body
		end
		
		# @attribute [String] The page title.
		attr :title
		
		# @attribute [Live::View | Nil] The Live view to embed.
		attr :body
		
		# Render the page to an HTML string.
		# @returns [String] The rendered HTML.
		def call
			TEMPLATE.to_string(self)
		end
	end
end
