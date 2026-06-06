# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.5] - 2026-06-07

### Added
- Search functionality in CodeSnippet component
- ErrorBoundary wrapper for crash resilience in inspector views

### Fixed
- Syntax highlighting edge cases in code viewer
- Build error: duplicate ternary branch causing TypeScript compilation failure
- Build error: missing `TouchableOpacity` import from react-native

## [1.0.4] - 2026-06-06

### Fixed
- Metro config `exclusionList` path export error that prevented the example app from bundling correctly

## [1.0.3] - 2026-06-06

### Added
- Navigation context integration — fixed render crash when `@react-navigation/native` context is available
- Example app configured with React Navigation for testing

### Fixed
- `tsconfig.json` `ignoreDeprecations` value compatibility for TypeScript 5.0+ environments
- `tsconfig.json` build error on older TypeScript versions
- Node 18 compatibility issues in Metro config
- Duplicate `react-native` bundle resolution in monorepo-style example setup
- Metro config `blockList` to properly exclude parent `node_modules`

### Changed
- Example app Metro config improved for monorepo-style development
- Added `node_modules_backup`, `.eslintcache`, `coverage`, and `.npmrc` to `.gitignore`

## [1.0.2] - 2026-06-06

### Changed
- Associated npm package with GitHub repository metadata (`repository`, `bugs`, `homepage` fields)

## [1.0.1] - 2026-06-06

### Added
- Reference React Native example app demonstrating full inspector integration
- Example app included in npm package `files` for users to reference

### Changed
- Updated `files` field in `package.json` to include example folder

## [1.0.0] - 2026-06-06

### Added
- 🌐 **Network Inspector** — Intercept and view HTTP requests/responses, track latency, export as cURL or Fetch, search logs, and view diffs between subsequent requests
- 💻 **Console Logger** — In-app terminal displaying `console.log`, `console.warn`, and `console.error` with customizable filters
- 📊 **Analytics Event Tracker** — Real-time logging and analytics debugging (Firebase Analytics, GA events)
- 🕸️ **WebView Inspector** — Live tracking of navigation history, console logs, and inspection of HTML, CSS, and JS inside WebView components
- 📈 **Embedded Visualizations** — Built-in mini charts for latency, payload size, and error metrics over time
- 🎨 **Modern Dark UI** — Glassmorphism-inspired dark design with smooth micro-animations
- Axios interceptor support via `addAxiosInterceptors()`
- Analytics event subscription via `subscribeAnalyticsEvents()`
- GitHub Actions CI/CD workflow for automated builds and npm publishing
- TypeScript support with full type exports (CommonJS + ESM dual output)
- Inter font family bundled for consistent typography

[1.0.5]: https://github.com/vengatmacuser/react-native-inapp-inspector/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/vengatmacuser/react-native-inapp-inspector/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/vengatmacuser/react-native-inapp-inspector/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/vengatmacuser/react-native-inapp-inspector/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/vengatmacuser/react-native-inapp-inspector/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/vengatmacuser/react-native-inapp-inspector/releases/tag/v1.0.0
