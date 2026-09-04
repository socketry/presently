# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/presentation"
require "tmpdir"
require "fileutils"

describe Presently::Stylesheet do
	around do |&block|
		Dir.mktmpdir do |root|
			@root = root
			FileUtils.mkdir_p(File.join(root, "020-scheduling", "030-details"))
			
			File.write(File.join(root, "010-introduction.md"), "Introduction\n")
			File.write(File.join(root, "020-scheduling", "010-overview.md"), "Overview\n")
			File.write(File.join(root, "020-scheduling", "030-details", "010-queue.md"), "Queue\n")
			
			File.write(File.join(root, "style.css"), ":root { --accent: blue; }\n")
			File.write(File.join(root, "010-introduction.css"), ".title { color: blue; }\n")
			File.write(File.join(root, "020-scheduling", "style.css"), ".diagram { color: orange; }\n")
			File.write(File.join(root, "020-scheduling", "010-overview.css"), ".overview { display: grid; }\n")
			File.write(File.join(root, "020-scheduling", "030-details", "style.css"), ".detail { color: green; }\n")
			
			block.call
		end
	end
	
	let(:presentation) {Presently::Presentation.load(@root)}
	let(:stylesheets) {presentation.stylesheets}
	
	it "discovers global, directory, and slide styles in cascade order" do
		expect(stylesheets.map(&:path)).to be == [
			"style.css",
			"010-introduction.css",
			File.join("020-scheduling", "style.css"),
			File.join("020-scheduling", "010-overview.css"),
			File.join("020-scheduling", "030-details", "style.css"),
		]
	end
	
	it "leaves the root stylesheet global" do
		expect(stylesheets.first.scope).to be_nil
		expect(stylesheets.first.read).to be == ":root { --accent: blue; }\n"
	end
	
	it "scopes a directory stylesheet to every slide below it" do
		stylesheet = stylesheets.find{|stylesheet| stylesheet.path == File.join("020-scheduling", "style.css")}
		
		expect(stylesheet.scope).to be == '.slide[data-slide-path^="020-scheduling/"]'
		expect(stylesheet.read).to be(:start_with?, '@scope (.slide[data-slide-path^="020-scheduling/"]) {')
	end
	
	it "scopes a sidecar stylesheet to its matching slide" do
		stylesheet = stylesheets.find{|stylesheet| stylesheet.path == File.join("020-scheduling", "010-overview.css")}
		
		expect(stylesheet.scope).to be == '.slide[data-slide-path="020-scheduling/010-overview.md"]'
		expect(stylesheet.read).to be(:include?, ".overview { display: grid; }")
	end
	
	it "serves stylesheets from paths matching their source directories" do
		stylesheet = stylesheets.find{|stylesheet| stylesheet.path == File.join("020-scheduling", "010-overview.css")}
		
		expect(stylesheet.url).to be == "/_slides/020-scheduling/010-overview.css"
	end
	
	it "URL-encodes path components" do
		expect(subject.encode_path(File.join("020-a section", '010-"quote".md'))).to be == "020-a%20section/010-%22quote%22.md"
	end
end
