# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

module Presently
	# Maps editor names to URL schemes for opening files.
	#
	# Checks the `EDITOR` environment variable and generates clickable URLs
	# for known editors. Returns `nil` for unknown editors.
	module Editor
		EDITORS = {
			"code" => "vscode://file/%s:%d",
			"vscode" => "vscode://file/%s:%d",
			"cursor" => "cursor://file/%s:%d",
			"subl" => "subl://open?url=file://%s&line=%d",
			"sublime" => "subl://open?url=file://%s&line=%d",
			"atom" => "atom://core/open/file?filename=%s&line=%d",
			"idea" => "idea://open?file=%s&line=%d",
			"rubymine" => "x-mine://open?file=%s&line=%d",
			"zed" => "zed://file/%s:%d",
			"nova" => "nova://open?path=%s&line=%d",
			"mate" => "txmt://open?url=file://%s&line=%d",
			"textmate" => "txmt://open?url=file://%s&line=%d",
			"emacs" => "emacs://open?url=file://%s&line=%d",
			"mvim" => "mvim://open?url=file://%s&line=%d",
			"windsurf" => "windsurf://file/%s:%d",
			"vscodium" => "vscodium://file/%s:%d",
		}
		
		# Generate a URL for opening a file in the current editor.
		# @parameter path [String] The file path to open.
		# @parameter line [Integer] The line number (1-based).
		# @returns [String | Nil] The editor URL, or `nil` if the editor is unknown.
		def self.url_for(path, line = 1)
			editor = ENV["PRESENTLY_EDITOR"] || ENV["EDITOR"]
			return nil unless editor
			
			# Extract the editor name from the path (e.g. "/usr/bin/code" -> "code")
			name = File.basename(editor).split(/\s+/).first
			
			if pattern = EDITORS[name]
				sprintf(pattern, File.expand_path(path), line)
			end
		end
	end
end
