---
template: code
duration: 60
focus: 20-36
title: Navigation
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

Navigation is handled by advance! and retreat!, which both delegate to go_to. That method does the bounds checking — so you can't advance past the last slide or retreat before the first.

*Point to the go_to method on the display screen.*

The key line is at the end of go_to: notify_listeners!. Any object that has registered itself — the WebSocket connection, the timer, the presenter view — gets called immediately when the slide changes. That's what keeps everything in sync with no polling.
