---
template: code
duration: 60
focus: 2-10
title: Initialization
marker: Code Walkthrough
speaker: Samuel
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

*Highlighted lines 2–10 should be visible — check the display before speaking.*

This is the heart of Presently — the Presentation class. The constructor takes a slides directory, sets up the initial state, and then calls load_slides! to read all the Markdown files off disk. A Clock is created to track timing, and a listeners array is set up for the observer pattern we'll look at in a moment.
