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
	# Templates selectively extract placeholders with `self.extract(name)`, render the remainder
	# with `self.document`, and can access legacy sections with `self.section(name)`.
	class TemplateScope
		# Initialize a new template scope for the given slide.
		# @parameter slide [Slide] The slide being rendered.
		def initialize(slide)
			@slide = slide
			@document = slide.document.dup
			@extracted = {}
		end
		
		# @attribute [Slide] The slide being rendered.
		attr :slide
		
		# The content sections of the slide.
		# @returns [Hash(String, String)] Sections keyed by heading name.
		def content
			@slide.content
		end
		
		# Render the remaining slide document after placeholder extraction.
		# @returns [XRB::MarkupString] The remaining document as HTML.
		def document
			markup(@document)
		end
		
		# Extract and render a named heading section from this render's document.
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
		
		# Render the slide's metadata header using semantic markup.
		# @parameter title [String | Nil] An explicit heading override.
		# @parameter fallback [String | Nil] A legacy named section to use as the heading.
		# @returns [XRB::MarkupString] The rendered header, or an empty string when no metadata is present.
		def slide_header(title: @slide.heading, fallback: "title")
			section_heading = @slide.section_heading
			heading = nil
			
			if present?(title)
				# Avoid rendering a Markdown H1 twice when metadata overrides it.
				@document.extract_heading(1)
			elsif fallback && (fragment = extract_fragment(fallback)) && !fragment.empty?
				title = fragment.to_plaintext.strip
			else
				heading = @document.extract_heading(1)
			end
			
			return XRB::MarkupString.raw("") unless present?(section_heading) || present?(title) || heading
			
			builder = XRB::Builder.new
			builder.tag(:header, class: "slide-header") do
				if present?(section_heading)
					builder.tag(:div, class: "slide-section-heading") do
						builder.text(section_heading.to_s)
					end
				end
				
				if heading
					builder.raw(heading.to_html)
				elsif present?(title)
					builder.tag(:h1, class: "slide-heading") do
						builder.text(title.to_s)
					end
				end
			end
			
			XRB::MarkupString.raw(builder.to_s)
		end
		
		private
		
		def extract_fragment(name)
			key = name.to_s.strip.downcase.gsub(/\s+/, "_")
			return @extracted[key] if @extracted.key?(key)
			
			@extracted[key] = @document.extract(key)
		end
		
		def markup(fragment)
			XRB::MarkupString.raw(fragment&.to_html || "")
		end
		
		def present?(value)
			value && !value.to_s.empty?
		end
	end
end
