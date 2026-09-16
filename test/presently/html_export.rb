# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

require "presently/html_export"
require "presently/presentation"
require "tmpdir"
require "fileutils"

describe Presently::HTMLExport do
	let(:root) {Dir.mktmpdir}
	let(:slides_root) {File.join(root, "slides")}
	let(:recordings_root) {File.join(root, "audio")}
	let(:playback_recordings_root) {File.join(root, "audio-normalized")}
	let(:bundled_public_root) {File.join(root, "bundled-public")}
	let(:presentation_public_root) {File.join(root, "public")}
	let(:output) {File.join(root, "presentation")}
	
	after do
		FileUtils.remove_entry(root)
	end
	
	before do
		FileUtils.mkdir_p(slides_root)
		FileUtils.mkdir_p(recordings_root)
		FileUtils.mkdir_p(playback_recordings_root)
		FileUtils.mkdir_p(File.join(bundled_public_root, "_static"))
		FileUtils.mkdir_p(File.join(presentation_public_root, "_static"))
		
		File.write(File.join(slides_root, "010-first.md"), "# First\n\n![Diagram](diagram.svg)\n")
		File.write(File.join(slides_root, "020-second.md"), "# Second\n")
		File.write(File.join(slides_root, "010-first.css"), ".slide-body { color: blue; }\n")
		File.write(File.join(slides_root, "diagram.svg"), "<svg>diagram</svg>\n")
		File.write(File.join(recordings_root, "010-first.webm"), "source-first")
		File.write(File.join(recordings_root, "020-second.webm"), "source-second")
		File.write(File.join(playback_recordings_root, "010-first.webm"), "normalized-first")
		
		File.write(File.join(bundled_public_root, "playback.js"), "// playback\n")
		File.write(File.join(bundled_public_root, "_static", "custom.css"), "/* bundled */\n")
		File.write(File.join(presentation_public_root, "_static", "custom.css"), "/* presentation */\n")
		File.write(File.join(presentation_public_root, "logo.svg"), "<svg>logo</svg>\n")
	end
	
	let(:presentation) {Presently::Presentation.load(slides_root)}
	let(:export) do
		subject.new(
			presentation: presentation,
			recordings_root: recordings_root,
			playback_recordings_root: playback_recordings_root,
			public_roots: [bundled_public_root, presentation_public_root],
		)
	end
	
	with ".public_roots" do
		it "orders Lively, Presently, and presentation assets by precedence" do
			roots = subject.public_roots(presentation_public_root)
			
			expect(roots.first).to be == File.join(Gem.loaded_specs.fetch("lively").full_gem_path, "public")
			expect(roots[-2]).to be == subject::PUBLIC_ROOT
			expect(roots.last).to be == File.expand_path(presentation_public_root)
		end
	end
	
	with "#write" do
		it "writes portable playback HTML, assets, and narration" do
			path = export.write(output)
			html = File.read(File.join(path, "index.html"))
			
			expect(path).to be == File.expand_path(output)
			expect(html).to be(:include?, 'src="./playback.js"')
			expect(html).to be(:include?, 'href="./_static/playback.css"')
			expect(html).to be(:include?, 'src="./_slides/diagram.svg"')
			expect(html).to be(:include?, 'src="./audio/010-first.webm"')
			expect(html).to be(:include?, 'src="./audio/020-second.webm"')
			
			expect(File.read(File.join(path, "audio", "010-first.webm"))).to be == "normalized-first"
			expect(File.read(File.join(path, "audio", "020-second.webm"))).to be == "source-second"
			expect(File.read(File.join(path, "_static", "custom.css"))).to be == "/* presentation */\n"
			expect(File.read(File.join(path, "logo.svg"))).to be == "<svg>logo</svg>\n"
			expect(File.read(File.join(path, "_slides", "diagram.svg"))).to be == "<svg>diagram</svg>\n"
			expect(File.read(File.join(path, "_slides", "010-first.css"))).to be(:include?, '@scope (.slide[data-slide-path="010-first.md"])')
			expect(File).not.to be(:file?, File.join(path, "_slides", "010-first.md"))
		end
		
		it "requires narration for every slide" do
			FileUtils.rm(File.join(recordings_root, "020-second.webm"))
			
			expect do
				export.write(output)
			end.to raise_exception(subject::MissingRecordings, message: be(:include?, "020-second.md"))
			expect(File).not.to be(:exist?, output)
		end
		
		it "does not replace an existing output by default" do
			FileUtils.mkdir_p(output)
			File.write(File.join(output, "keep.txt"), "keep")
			
			expect do
				export.write(output)
			end.to raise_exception(ArgumentError, message: be(:include?, "pass force: true"))
			expect(File.read(File.join(output, "keep.txt"))).to be == "keep"
		end
		
		it "replaces an existing output when forced" do
			FileUtils.mkdir_p(output)
			File.write(File.join(output, "stale.txt"), "stale")
			
			export.write(output, force: true)
			
			expect(File).not.to be(:exist?, File.join(output, "stale.txt"))
			expect(File).to be(:file?, File.join(output, "index.html"))
		end
		
		it "refuses destinations which overlap source directories" do
			expect do
				export.write(File.join(slides_root, "export"))
			end.to raise_exception(ArgumentError, message: be(:include?, "must not overlap"))
		end
	end
end
