# 🧪 Detox E2E Simulation Testing & Code Coverage Guide

This project includes a **world-class, gray-box E2E simulation testing suite** powered by **Detox**, **Page Object Model (POM)**, **Visual Regression (Pixel Diff)**, **Network Chaos Testing**, and **Istanbul Code Coverage**.

---

## 🚀 Quick Start Commands

From the root directory:

```bash
# 1. Build iOS Debug Simulator Binary
npm run e2e:build:ios

# 2. Run All 15 E2E Simulation Suites on iOS Simulator
npm run e2e:test:ios

# 3. Build & Run Android Debug Emulator Binary
npm run e2e:build:android
npm run e2e:test:android

# 4. Run with Full Istanbul Code Coverage
npm run e2e:coverage

# 5. Open Interactive Visual Test Report Dashboard
npm run e2e:report
```

---

## 🏛️ Modern Architecture

### 1. Page Object Model (Screen Objects)
All UI selectors (`testID`) and actions are decoupled from test specifications under `example/e2e/screens/`:
- `InspectorModalScreen.ts`: Inspector shell, search bar, and dismiss actions.
- `NetworkTabScreen.ts`: HTTP/GraphQL list, detail inspect, and cURL copy.
- `StorageTabScreen.ts`: AsyncStorage / MMKV CRUD operations.
- `ConsoleTabScreen.ts`, `ReduxTabScreen.ts`, `CrashTabScreen.ts`, `MediaStudioScreen.ts`.

### 2. In-App Live Progress HUD
During simulation runs in connected debug mode, a glassmorphic HUD overlay renders at the top of the simulator displaying:
- Real-time animated progress bar (`%`).
- Current suite & step index (e.g., `Suite 8/15: WebSockets Inspector`).
- Active user action description (e.g., `⚡ Transmitting JSON frame & inspecting frame tree...`).
- Snapshot flash indicator (`📸 Snapshot saved`).

### 3. Visual Regression (Pixel Diff)
Captures high-resolution screenshots at key milestones in `example/e2e/artifacts/screenshots/` and compares them against golden baselines using `pixelmatch`. Any unexpected layout shifts or clipped text generate visual heatmap diffs (`diff.png`).

### 4. Network Chaos & Stress Testing
Programmatically injects 1500ms 3G latencies, simulated 500 error drops, and 10MB+ massive JSON payloads to verify 60 FPS list virtualization and memory stability.

### 5. Istanbul Code Coverage
Measures statement, branch, function, and line coverage across `src/` during live mobile simulation and outputs to `coverage/lcov-report/index.html`.

---

## 📂 Directory Structure

```
example/
├── .detoxrc.js                 # Detox iOS & Android configurations
├── e2e/
│   ├── config.json             # Jest Circus test runner configuration
│   ├── setup.ts                # Global lifecycle & debug guard
│   ├── screens/                # Screen Objects (Page Object Model)
│   ├── hud/                    # Live In-App Progress HUD overlay
│   ├── coverage/               # Istanbul coverage bridge
│   ├── visual/                 # Visual regression pixel-diff comparator
│   ├── chaos/                  # Network latency & stress generators
│   ├── helpers/                # Locators, gestures, and screenshot utilities
│   ├── reporters/              # Interactive HTML report generator
│   ├── suites/                 # 15 Complete feature test specifications
│   └── artifacts/
│       ├── screenshots/        # Captured milestone screenshots
│       ├── diffs/              # Pixel diff heatmaps
│       └── report.html         # Visual test dashboard
coverage/
└── lcov-report/index.html      # Interactive code coverage report
```
