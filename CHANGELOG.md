# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- NPM update indicator: an animated pulsing dot appears in the header next to the npm chip when a newer version is published; tapping it links to the package page.
- Shining sweep animation on the floating launcher (FAB), layered on top of the existing pulse ring.
- Settings persistence: theme, modal height, module visibility, default tab, log limits, log levels, Redux preferences and other selections now survive app restarts (via `@react-native-async-storage/async-storage` when the host app ships it; in-memory fallback otherwise — no new required native dependency).
- Default Tab setting: choose which tab the inspector opens on; the chosen module shows a `DEFAULT` badge after its label in the Settings module list.
- Icons on inner tabs: All, User Log, Info, Warning, Error and Analytics filter chips in the Logs tab, plus GA Events and Top Events sub-tabs in Analytics.
- Duplicate collapsing in the APIs and Logs lists: consecutive identical entries collapse into a single row with a `×N` counter. A new "Show Duplicate Logs" setting (default **off**) restores the old behavior.
- `inspectorReduxMiddleware` export — a standard Redux middleware that captures every dispatched action, including ones from thunks, sagas and RTK Query.

### Changed
- The header clear-everything button now uses a wipe (broom) icon instead of the delete/trash icon.
- The scroll-to-top button is now always visible, anchored at the bottom right of the APIs list (bottom: 10, right: 10).
- `connectReduxStore` is now idempotent (safe to call twice), de-duplicates with the middleware, and diffs state on `store.subscribe` so changes dispatched outside the wrapped dispatch (thunk/saga internals) no longer desync the state tree and timeline.

### Fixed
- TypeScript build errors from spreading `StyleSheet.absoluteFill` (now `absoluteFillObject`).

## [1.0.13] - 2026-06-07

### Added
- Version bump to 1.0.13 after publishing fix.

## [1.0.12] - 2026-06-07

### Added
- Video walkthrough guide demonstrating core capabilities including network interception, Redux timeline/tree inspection, console logs, settings preferences, and WebView state tracker.
- Reference links and download option for the guidance video in `README.md`.

## [1.0.11] - 2026-06-07

### Added
- Chronological Action Timeline view inside the Redux module. Features custom vertical timeline layout, action type badges, timestamps, collapsible payload inspectors, and direct tags indicating which state slices were modified.
- Clear action history button inside the Action Timeline tab.

### Changed
- Switched Redux tab view to a segment-controlled dual interface: Action Timeline vs Store Tree.

## [1.0.10] - 2026-06-07

### Changed
- Moved theme toggles (Light/Dark mode) from the top-right header overlay into the main settings menu under a new "Preferences" section.
- Modernized the API details view, grouping method/status/latency badges on the left, copy actions on the right, and displaying a compact, parsed URL container.
- Aligned the Console Log Card collapse/expand chevron down into its own right-aligned column of the card, completely preventing it from wrapping with caller details or text.
- Changed `@react-navigation/native`, `react-native-linear-gradient`, and `react-native-svg` dependencies to direct dependencies inside `package.json` to enable automated installation, documenting isolation behavior in the `README.md`.

## [1.0.9] - 2026-06-07

## [1.0.8] - 2026-06-07

### Changed
- README.md: Removed the circular logo, utilizing only the responsive banner image.

## [1.0.7] - 2026-06-07

### Added
- Brand assets directory (`assets/`) with `icon_circle.svg`, `icon_square.svg`, and light/dark theme banners.
- Theme-aware, responsive branding banner and circular logo in `README.md` using raw GitHub URLs.
- Included the `assets/` folder in package publishing list (`files` field in `package.json`).

## [1.0.6] - 2026-06-07

### Changed
- README: add Support section with GitHub Sponsors link

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

[1.0.12]: https://github.com/vengatmacuser/react-native-inapp-inspector/compare/v1.0.11...v1.0.12
[1.0.11]: https://github.com/vengatmacuser/react-native-inapp-inspector/compare/v1.0.10...v1.0.11
[1.0.10]: https://github.com/vengatmacuser/react-native-inapp-inspector/compare/v1.0.9...v1.0.10
[1.0.9]: https://github.com/vengatmacuser/react-native-inapp-inspector/compare/v1.0.8...v1.0.9
[1.0.8]: https://github.com/vengatmacuser/react-native-inapp-inspector/compare/v1.0.7...v1.0.8
[1.0.7]: https://github.com/vengatmacuser/react-native-inapp-inspector/compare/v1.0.6...v1.0.7
[1.0.6]: https://github.com/vengatmacuser/react-native-inapp-inspector/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/vengatmacuser/react-native-inapp-inspector/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/vengatmacuser/react-native-inapp-inspector/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/vengatmacuser/react-native-inapp-inspector/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/vengatmacuser/react-native-inapp-inspector/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/vengatmacuser/react-native-inapp-inspector/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/vengatmacuser/react-native-inapp-inspector/releases/tag/v1.0.0
