# frozen_string_literal: true

# Released under the MIT License.
# Copyright, 2026, by Samuel Williams.

# Update the public/_components directory from node_modules.
#
# Copies production npm dependencies into `public/_components/` so they
# can be served as static assets without needing a runtime `node_modules` path.
#
# Run after `pnpm install` or when dependencies change:
#
#     bake presently:node:update
#
def update
	require "fileutils"
	require "json"
	
	root = Pathname.new(context.root)
	package_root = root + "node_modules"
	install_root = root + "public/_components"
	
	unless package_root.directory?
		raise "node_modules not found. Run `pnpm install` first."
	end
	
	# Read the package.json to get direct dependencies:
	package_json = JSON.parse(File.read(root + "package.json"))
	dependencies = (package_json["dependencies"] || {}).keys
	
	dependencies.each do |name|
		package_path = package_root + name
		next unless package_path.directory?
		
		install_path = install_root + name
		
		FileUtils::Verbose.rm_rf(install_path)
		FileUtils::Verbose.mkpath(install_path.dirname)
		
		# If the package has a dist directory, copy only that.
		# Otherwise copy the whole package.
		dist_path = package_path + "dist"
		source_path = dist_path.exist? ? dist_path : package_path
		
		FileUtils::Verbose.cp_r(source_path.to_s, install_path.to_s)
	end
end
