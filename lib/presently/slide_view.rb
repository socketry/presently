# frozen_string_literal: true

require "live"
require "xrb/template"
require "xrb/markup"

module Presently
	# Renders a single slide using its template.
	DEFAULT_TEMPLATES_DIRECTORY = File.expand_path("../../templates", __dir__)
	
	class SlideView < Live::View
		def initialize(id = Live::Element.unique_id, data = {}, css_class: "slide", templates_directory: nil)
			super(id, data)
			@css_class = css_class
			@templates_directory = templates_directory || DEFAULT_TEMPLATES_DIRECTORY
			@templates = {}
		end
		
		def template_for(name)
			@templates[name] ||= begin
				path = File.join(@templates_directory, "#{name}.xrb")
				XRB::Template.load_file(path)
			end
		end
		
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
		
		def render(builder)
			# SlideView.render is only used standalone; normally render_slide is called directly.
			slide = nil
			render_slide(builder, slide)
		end
	end
	
	# Provides the scope for template rendering.
	class TemplateScope
		def initialize(slide)
			@slide = slide
		end
		
		attr :slide
		
		def content
			@slide.content
		end
		
		def section(name)
			XRB::MarkupString.raw(@slide.content[name] || "")
		end
	end
end
