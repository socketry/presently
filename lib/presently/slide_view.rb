# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "live"
require "xrb/template"
require "xrb/markup"

module Presently
	# The default directory containing bundled slide templates.
	DEFAULT_TEMPLATES_ROOT = File.expand_path("../../templates", __dir__)
	
	# Renders a single slide using its XRB template.
	#
	# Loads templates from the configured templates root and renders slides
	# by passing their content sections to the template via {TemplateScope}.
	class SlideView < Live::View
		# Initialize a new slide view.
		# @parameter id [String] The unique element identifier.
		# @parameter data [Hash] The element data attributes.
		# @parameter css_class [String] The CSS class for the slide container.
		# @parameter controller [PresentationController | Nil] The controller to get the templates root from.
		def initialize(id = Live::Element.unique_id, data = {}, css_class: "slide", controller: nil)
			super(id, data)
			@css_class = css_class
			@templates_root = controller&.templates_root || DEFAULT_TEMPLATES_ROOT
			@templates = {}
		end
		
		# Load and cache a template by name.
		# @parameter name [String] The template name (without extension).
		# @returns [XRB::Template] The loaded template.
		def template_for(name)
			@templates[name] ||= begin
				path = File.join(@templates_root, "#{name}.xrb")
				XRB::Template.load_file(path)
			end
		end
		
		# Render a slide using its template into the builder.
		# @parameter builder [XRB::Builder] The HTML builder.
		# @parameter slide [Slide] The slide to render.
		# @parameter extra_class [String | Nil] An additional CSS class for the container.
		def render_slide(builder, slide, extra_class: nil)
			return unless slide
			
			template = template_for(slide.template)
			scope = TemplateScope.new(slide)
			html = template.to_string(scope)
			
			classes = [@css_class, extra_class].compact.join(" ")
			builder.tag(:div, class: classes, data: {template: slide.template}) do
				builder.raw(html)
			end
		end
		
		# Render the current slide.
		# @parameter builder [XRB::Builder] The HTML builder.
		def render(builder)
			slide = nil
			render_slide(builder, slide)
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
		
		# Get a named content section as raw HTML markup.
		# @parameter name [String] The section name (derived from the Markdown heading).
		# @returns [XRB::MarkupString] The rendered HTML content, safe for embedding.
		def section(name)
			XRB::MarkupString.raw(@slide.content[name] || "")
		end
	end
end
