---
template: code
duration: 60
focus: 2-8
title: Initialization
---

```ruby
class Presentation
	def initialize(slides_directory = "slides")
		@slides_directory = slides_directory
		@slides = []
		@current_index = 0
		@clock = Clock.new
		@listeners = []
		
		load_slides!
	end
	
	def current_slide
		@slides[@current_index]
	end
	
	def next_slide
		@slides[@current_index + 1]
	end
	
	def advance!
		go_to(@current_index + 1)
	end
	
	def retreat!
		go_to(@current_index - 1)
	end
	
	def go_to(index)
		return if index < 0 || index >= @slides.length
		@current_index = index
		notify_listeners!
	end
	
	def add_listener(listener)
		@listeners << listener
	end
	
	def remove_listener(listener)
		@listeners.delete(listener)
	end
	
	private
	
	def load_slides!
		pattern = File.join(@slides_directory, "*.md")
		@slides = Dir.glob(pattern).sort.map do |path|
			Slide.new(path)
		end
	end
	
	def notify_listeners!
		@listeners.each do |listener|
			listener.slide_changed! rescue nil
		end
	end
end
```

---

Walk through the constructor. Note how it takes a slides directory, initialises the state, and loads slides from disk on startup.
