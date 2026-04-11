# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "markly"
require "markly/renderer/html"

module Presently
	# Extends the standard Markly HTML renderer to support mermaid diagrams.
	#
	# Fenced code blocks with the `mermaid` language are rendered as
	# `<div class="mermaid">` elements instead of `<pre><code>`, allowing
	# the mermaid.js library to pick them up and render diagrams client-side.
	class Renderer < Markly::Renderer::HTML
		# Render a code block, converting mermaid blocks to diagram containers.
		# @parameter node [Markly::Node] The code block node.
		def code_block(node)
			language, _ = node.fence_info.split(/\s+/, 2)
			
			if language == "mermaid"
				block do
					out(
						"<mermaid-diagram#{source_position(node)}>",
						escape_html(node.string_content),
						"</mermaid-diagram>"
					)
				end
			else
				super
			end
		end
	end
end
