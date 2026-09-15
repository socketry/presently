# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "xrb/builder"
require "xrb/template"
require "xrb/markup"

require_relative "templates"
require_relative "stylesheet"

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
		
		# Render a slide to an HTML string.
		# @parameter slide [Slide] The slide to render.
		# @parameter extra_class [String | Nil] An additional CSS class for the container.
		# @returns [XRB::MarkupString] The rendered HTML, safe for embedding.
		def render_to_html(slide, extra_class: nil)
			builder = XRB::Builder.new
			render(builder, slide, extra_class: extra_class)
			XRB::MarkupString.raw(builder.to_s)
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
			path = Stylesheet.encode_path(slide.path)
			
			builder.tag(:div, class: "slide-surface", data: {template: slide.template}) do
				builder.tag(:div, class: classes, data: {template: slide.template}, "data-slide-path": path) do
					builder.raw(html)
					
					slide.scripts.each do |script|
						builder.tag(:script, type: "text/slide-script") do
							builder.raw(script)
						end
					end
				end
			end
		end
	end
	
	# Provides the scope for XRB template rendering.
	#
	# Templates selectively extract placeholders with `self.extract(name)` and render the remainder
	# with `self.document`.
	class TemplateScope
		# Initialize a new template scope for the given slide.
		# @parameter slide [Slide] The slide being rendered.
		def initialize(slide)
			@slide = slide
			@document = slide.document.dup
			@heading = @document.extract_heading(1)
			@extracted = {}
		end
		
		# @attribute [Slide] The slide being rendered.
		attr :slide
		
		# Render the slide body after title and placeholder extraction.
		# @returns [XRB::MarkupString] The remaining document as HTML.
		def document
			markup(@document)
		end
		
		# Extract and render a named H2 placeholder from this render's document.
		#
		# Extraction is cached so a template can reference a placeholder more than
		# once without mutating the document repeatedly.
		# @parameter name [String] The heading name to extract.
		# @returns [XRB::MarkupString | Nil] The extracted HTML, or `nil` when absent.
		def extract(name)
			fragment = extract_fragment(name)
			return unless fragment && !fragment.empty?
			
			markup(fragment)
		end
		
		# Render the slide header using semantic markup.
		# @returns [XRB::MarkupString] The rendered header, or an empty string when no metadata is present.
		def slide_header
			section = @slide.section
			
			return XRB::MarkupString.raw("") unless present?(section) || @heading
			
			builder = XRB::Builder.new
			builder.tag(:header, class: "slide-header") do
				if present?(section)
					builder.tag(:div, class: "slide-section-heading") do
						builder.text(section.to_s)
					end
				end
				
				builder.raw(@heading.to_html) if @heading
			end
			
			XRB::MarkupString.raw(builder.to_s)
		end
		
		private
		
		def extract_fragment(name)
			return @extracted[name] if @extracted.key?(name)
			
			@extracted[name] = @document.extract(name)
		end
		
		def markup(fragment)
			XRB::MarkupString.raw(fragment&.to_html || "")
		end
		
		def present?(value)
			value && !value.to_s.empty?
		end
	end
end
