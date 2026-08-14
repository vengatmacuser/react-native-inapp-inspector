# React Native In-App Inspector

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/banner_light.svg">
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/banner_dark.svg">
    <img alt="React Native In-App Inspector Banner" src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/banner_dark.svg" width="100%">
  </picture>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/react-native-inapp-inspector"><img src="https://img.shields.io/npm/v/react-native-inapp-inspector?color=6366f1&label=npm" alt="npm version" /></a>
  <a href="https://github.com/vengatmacuser/react-native-inapp-inspector/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="license" /></a>
  <a href="https://github.com/vengatmacuser/react-native-inapp-inspector"><img src="https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue" alt="platform" /></a>
</p>

A self-contained, developer-first in-app debugging overlay for React Native. Inspect network traffic, console logs, stack traces, analytics events, and Redux state directly on your device or simulator with zero external dependencies.

<p align="center">
  <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/walkthrough.gif" alt="React Native In-App Inspector Walkthrough" width="360" style="border-radius: 20px;" />
</p>

---

## ✨ Features

| Feature | Description |
| --- | --- |
| 🌐 **Network Inspector** | Intercepts `fetch` and Axios (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`). Inspect status codes, request/response headers, body JSON, duration, caller origin, and instant cURL / fetch export snippets. |
| 🪵 **Console Logger & Stack Trace** | Captures `console.log`, `info`, `warn`, and `error`. Displays trigger file (`TSX`, `JSX`, `TS`, `JS`) & line numbers via **Metro Symbolication**, call stack frames, individual arguments inspection, and duplicate collapsing (`×N`). |
| ⏸️ **Live Stream Pause / Resume** | Freeze incoming network requests, console logs, and analytics streams on the fly to inspect active traffic without list jumping. |
| 📊 **Analytics Tracker** | Tracks manual events and auto-patches `@react-native-firebase/analytics` calls (`logEvent`, `logScreenView`, `setUserProperties`, and `setUserId`). |
| 🔄 **Redux State & Actions** | Connects to Redux / Redux Toolkit. Inspect dispatched actions with deep state diffs, payload breakdown, slice state trees, and `redux-persist` metadata. |
| 🪟 **Rich JSON Viewer** | Explore data in **Pretty**, **Raw**, and **Table** modes with full-text search highlighting and uniform typography. |
| 🛡️ **Error Boundary** | Built-in `ErrorBoundary` to gracefully catch and inspect React render crashes. |

---

## 🎬 Video Walkthrough

[Download or watch the Video Walkthrough](https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/example/guidance/Video-WalkThrough.mp4)

---

## 📦 Installation

```bash
npm install --save-dev react-native-inapp-inspector axios
```

```bash
yarn add -D react-native-inapp-inspector axios
```

### Peer & Native Dependencies

The package has React and React Native as peer dependencies. It depends on `@react-navigation/native`, `react-native-linear-gradient`, and `react-native-svg`.

*(Optional)* If you use `@react-native-clipboard/clipboard` in your project, the inspector automatically detects and utilizes native clipboard bridges for seamless emulator-to-host copying.

```bash
# iOS Pods installation
cd ios && pod install
```

---

## 🚀 Basic Setup

Mount `<NetworkInspector />` near the root of your application:

```tsx
import React from 'react';
import {SafeAreaView} from 'react-native';
import NetworkInspector from 'react-native-inapp-inspector';

const App = () => {
  return (
    <SafeAreaView style={{flex: 1}}>
      {/* Your application components */}
      <NetworkInspector />
    </SafeAreaView>
  );
};

export default App;
```

When mounted, the inspector automatically sets up network logging, intercepts console methods, and attaches Firebase Analytics if available.

### Early Startup Network Logging

If your application makes API calls before the root component finishes mounting, initialize the logger at the module level in your entry file (`index.js` or `App.tsx`):

```tsx
import NetworkInspector, {
  setupNetworkLogger,
  setupConsoleLogger,
} from 'react-native-inapp-inspector';

setupNetworkLogger();
setupConsoleLogger();
```

### Toggling Visibility

You can disable or hide the floating launcher overlay conditionally:

```tsx
// Fully disable the overlay and interception
<NetworkInspector enabled={__DEV__} />

// Hide the floating trigger button while keeping background interception active
<NetworkInspector isEnabled={false} />
```

---

## 🪵 Console Logger & Stack Trace

The console logger provides deep insight into every `console.log`, `info`, `warn`, and `error` call:

- **Metro Source Map Symbolication**: In development mode, stack traces are automatically symbolicated against Metro to point directly to your exact project source files (`HomeScreen.tsx:42:15`, `App.tsx:20`).
- **File Type Badges**: Distinct visual chips identifying `.tsx`, `.jsx`, `.ts`, and `.js` callers.
- **Detailed Sub-Tabs**:
  - **Output / Message**: Full message with JSON Viewer (Pretty, Raw, Table modes) and link detection.
  - **Args (N)**: Inspect each passed argument individually with type detection (`Array[5]`, `Object{4}`).
  - **Call Stack Trace**: Structured frame cards (with Frame `#`, Function, File, and `L:C` pills) and Raw Trace view.
  - **Error Stack**: Automatically captures the thrown Error stack trace when logging Error objects.
  - **Metadata**: Structured table of log properties, timestamp, character count, and duplicate counter.

```tsx
console.log('[API] User authenticated successfully', {userId: 42, role: 'admin'});
console.error(new Error('Payment gateway timeout'));
```

---

## 🌐 Network Logging

`setupNetworkLogger()` intercepts global `fetch`, the default Axios instance, and instances created with `axios.create()`.

```tsx
import axios from 'axios';
import {setupNetworkLogger} from 'react-native-inapp-inspector';

setupNetworkLogger();

const api = axios.create({baseURL: 'https://api.example.com'});

await fetch('https://api.example.com/users');
await api.post('/login', {email, password});
```

If an Axios instance was instantiated before `setupNetworkLogger()` ran, attach interceptors manually:

```tsx
import {addAxiosInterceptors} from 'react-native-inapp-inspector';

addAxiosInterceptors(api);
```

---

## 🔄 Redux State & Action Inspection

Connect your Redux store once during application startup:

```tsx
import {connectReduxStore} from 'react-native-inapp-inspector';
import store from './store';

connectReduxStore(store);
```

### RTK Query, Thunks & Sagas (Recommended)

To capture actions dispatched from inside async thunks, sagas, or RTK Query, add `inspectorReduxMiddleware`:

```tsx
import {configureStore} from '@reduxjs/toolkit';
import {inspectorReduxMiddleware, connectReduxStore} from 'react-native-inapp-inspector';
import rootReducer from './slices';

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(inspectorReduxMiddleware),
});

connectReduxStore(store);
```

The Redux tab provides:
- **Action History**: Action type badge, timestamp, payload size, affected slices, deep state diffs, and snapshot viewer.
- **Slice Tree**: Live state tree per slice, persisted slice detection (`_persist`), search filtering, and JSON table exploration.

---

## 📊 Analytics Logging

Log manual analytics events or connect Firebase Analytics:

```tsx
import {logAnalyticsEvent} from 'react-native-inapp-inspector';

logAnalyticsEvent('purchase_completed', {
  item_id: 'SKU-42',
  value: 29.99,
  currency: 'USD',
});
```

### Firebase Analytics Integration

```tsx
import analytics from '@react-native-firebase/analytics';
import {setupAnalyticsLogger} from 'react-native-inapp-inspector';

setupAnalyticsLogger(analytics());
```

---

## 🧭 Navigation & Screen Tracking

To group network requests, logs, and analytics by the active screen, pass your navigation container ref:

```tsx
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import NetworkInspector from 'react-native-inapp-inspector';

const navigationRef = createNavigationContainerRef();

const App = () => {
  return (
    <>
      <NavigationContainer ref={navigationRef}>
        {/* Your screens */}
      </NavigationContainer>
      <NetworkInspector navigationRef={navigationRef} />
    </>
  );
};
```

---

## ⚙️ Settings Persistence

Inspector preferences (dark mode, active modules, default landing tab) persist across app launches:
- **iOS**: Uses React Native's built-in `Settings` module (`NSUserDefaults`) with zero extra configuration.
- **Android / Custom Storage**: Pass `@react-native-async-storage/async-storage` or `react-native-mmkv` to the `storage` prop:

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

<NetworkInspector storage={AsyncStorage} />
```

---

## 🛡️ Error Boundary

Catch and inspect unhandled React component render crashes:

```tsx
import {ErrorBoundary} from 'react-native-inapp-inspector';

<ErrorBoundary>
  <YourApp />
</ErrorBoundary>
```

---

## 📚 Public API Reference

| Export | Type | Description |
| --- | --- | --- |
| `NetworkInspector` | Component | Floating inspector overlay. Mount near app root. |
| `setupNetworkLogger()` | Function | Patches `fetch`, default Axios, and future `axios.create()` instances. |
| `addAxiosInterceptors(instance)` | Function | Manually attaches Axios interceptors to an existing instance. |
| `clearNetworkLogs()` | Function | Clears captured network requests. |
| `subscribeNetworkLogs(cb)` | Function | Subscribes to network log updates. |
| `setupConsoleLogger()` | Function | Intercepts `console.log`, `info`, `warn`, and `error`. |
| `clearConsoleLogs()` | Function | Clears captured console logs. |
| `subscribeConsoleLogs(cb)` | Function | Subscribes to console log updates. |
| `connectReduxStore(store)` | Function | Connects a Redux store for state and action inspection. |
| `inspectorReduxMiddleware` | Middleware | Redux middleware for capturing thunks, sagas, and RTK Query actions. |
| `getReduxState()` | Function | Returns the current captured Redux state snapshot. |
| `subscribeReduxState(cb)` | Function | Subscribes to Redux state changes. |
| `getActionHistory()` | Function | Returns the history of dispatched Redux actions. |
| `clearActionHistory()` | Function | Clears Redux action history. |
| `setupAnalyticsLogger(instance)` | Function | Patches a Firebase Analytics instance. |
| `logAnalyticsEvent(name, params?, userProps?)` | Function | Logs a manual analytics event. |
| `clearAnalyticsEvents()` | Function | Clears captured analytics events. |
| `subscribeAnalyticsEvents(cb)` | Function | Subscribes to analytics event updates. |
| `ErrorBoundary` | Component | React error boundary component. |

---

## 📱 Example App

Check out the `example` directory for a complete demo application:

```bash
cd example
npm install
cd ios && pod install && cd ..
npm run ios
```

---

## 🤝 Contributing

Contributions are welcome! Please check out our [Contributing Guidelines](CONTRIBUTING.md) to get started.

---

## 💖 Support & Sponsoring

This library is a free, open-source utility maintained in spare time. If it saved you or your team time debugging, please consider supporting its continuous development.

👉 **[Sponsor @vengatmacuser on GitHub Sponsors](https://github.com/sponsors/vengatmacuser)**

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-@vengatmacuser-ea4aaa?logo=githubsponsors&logoColor=white&style=for-the-badge)](https://github.com/sponsors/vengatmacuser)

---

## 📄 License

MIT © [vengatmacuser](LICENSE)
