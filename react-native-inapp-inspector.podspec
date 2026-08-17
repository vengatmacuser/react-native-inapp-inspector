require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = "react-native-inapp-inspector"
  s.version      = package['version']
  s.summary      = package['description']
  s.license      = package['license']
  s.authors      = package['author']
  s.homepage     = package['homepage']
  s.platform     = :ios, "11.0"
  s.source       = { :git => "https://github.com/vengatmacuser/react-native-inapp-inspector.git", :tag => "v#{s.version}" }
  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.requires_arc = true

  s.dependency "React-Core"
end
