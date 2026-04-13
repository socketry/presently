# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "xrb/template"
require "xrb/markup"

require_relative "templates"

module Presently
	# Renders a single slide using its XRB template.
	#
	# A plain Ruby object (not a Live view) that resolves templates via a
	# {Templates} instance and produces HTML for a given {Slide}.
	class SlideRenderer
		# Initialize a new slide renderer.
		# @parameter css_class [String] The CSS class for the slide container element.
		# @parameter templates [Templates] The template resolver to use.
		def initialize(css_class: "slide", templates: Templates.for)
			@css_class = css_class
			@templates = templates
		end
		
		# Render a slide into the given builder.
		# @parameter builder [XRB::Builder] The HTML builder.
		# @parameter slide [Slide] The slide to render.
		# @parameter extra_class [String | Nil] An additional CSS class for the container.
		def render(builder, slide, extra_class: nil)
			return unless slide
			
			template = @templates.resolve(slide.template)
			scope = TemplateScope.new(slide)
			html = template.to_string(scope)
			
			classes = [@css_class, extra_class].compact.join(" ")
			builder.tag(:div, class: classes, data: {template: slide.template}) do
				builder.raw(html)
				if slide.script
					builder.tag(:script, type: "text/slide-script") do
						builder.raw(slide.script)
					end
				end
			end
		end
	end
	
	# Provides the scope for XRB template rendering.
	#
	# Templates access slide content via `self.section(name)` and slide metadata via `self.slide`.
	class TemplateScope
		# Initialize a new template scope for the given slide.
		# @parameter slide [Slide] The slide being rendered.
		def initialize(slide)
			@slide = slide
		end
		
		# @attribute [Slide] The slide being rendered.
		attr :slide
		
		# The content sections of the slide.
		# @returns [Hash(String, String)] Sections keyed by heading name.
		def content
			@slide.content
		end
		
		# Whether the named content section exists and has content.
		# @parameter name [String] The section name (derived from the Markdown heading).
		# @returns [Boolean]
		def section?(name)
			fragment = @slide.content[name]
			fragment && !fragment.empty?
		end
		
		# Get a named content section as raw HTML markup.
		# @parameter name [String] The section name (derived from the Markdown heading).
		# @returns [XRB::MarkupString] The rendered HTML content, safe for embedding.
		def section(name)
			XRB::MarkupString.raw(@slide.content[name]&.to_html || "")
		end
	end
end
