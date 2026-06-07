# React Native In-App Inspector

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/banner_dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/banner_light.svg">
    <img alt="React Native In-App Inspector Banner" src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/banner_light.svg" width="100%">
  </picture>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/react-native-inapp-inspector"><img src="https://img.shields.io/npm/v/react-native-inapp-inspector?color=6366f1&label=npm" alt="npm version" /></a>
  <a href="https://github.com/vengatmacuser/react-native-inapp-inspector/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="license" /></a>
  <a href="https://github.com/vengatmacuser/react-native-inapp-inspector"><img src="https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue" alt="platform" /></a>
</p>

A premium, self-contained in-app debugger for React Native. Inspect **network requests**, **console logs**, **analytics events**, **Redux state**, and **WebView** activity — directly on your device, without leaving the app.

---

## Features

| Feature | Description |
|---|---|
| 🌐 **Network Inspector** | Intercepts `fetch` and `axios` — view requests, responses, headers, latency, and diffs. Export as cURL or Fetch snippet. |
| 💻 **Console Logger** | In-app terminal displaying `console.log`, `console.warn`, and `console.error` with level filters. |
| 📊 **Analytics Tracker** | Real-time event logging for Firebase Analytics, GA, or any custom analytics. |
| 🕸️ **WebView Inspector** | Live HTML/CSS/JS viewer, navigation history, and console log capture from WebViews. |
| 🗄️ **Redux Inspector** | Live Redux state tree viewer with action timeline and auto-refresh. |
| 📈 **Insights Dashboard** | Mini charts for latency, payload size, error rates, and slow request detection. |
| 🎨 **Dark UI** | Glassmorphism-inspired dark design with smooth micro-animations. |

---

## Video Walkthrough

Watch the library in action — network inspection, Redux state tree, WebView debugging, and console logging:

[🎬 Download or watch the Video Walkthrough](https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/example/guidance/Video-WalkThrough.mp4)

---

## Installation

```bash
npm install --save-dev react-native-inapp-inspector
# OR
yarn add -D react-native-inapp-inspector
```

For iOS, install native pods:

```bash
cd ios && pod install
```

> **Dependencies:** `@react-navigation/native`, `react-native-linear-gradient`, `react-native-svg`, and `axios` are bundled as dependencies and will not conflict with versions already installed in your host app.

---

## Setup

### Step 1 — Call `setupNetworkLogger()` at app entry

Call this **before any component renders** (at module level in your root file, e.g. `App.tsx`). This ensures `fetch` is patched and `axios.create()` is intercepted from the very first call.

```tsx
// App.tsx
import axios from 'axios';
import NetworkInspector, { setupNetworkLogger } from 'react-native-inapp-inspector';

// ⚡ Must be called at module level — before any component renders
setupNetworkLogger();
```

### Step 2 — Mount the Inspector component

Place `<NetworkInspector />` at the root of your app tree (inside `SafeAreaView` or your navigation container):

```tsx
const App = () => {
  return (
    <NavigationContainer>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Your app screens / navigation */}
        <Stack.Navigator>...</Stack.Navigator>

        {/* Floating inspector overlay — drag & open anywhere */}
        <NetworkInspector />
      </SafeAreaView>
    </NavigationContainer>
  );
};

export default App;
```

---

## Network Interception

### Fetch (automatic)

`fetch` is automatically intercepted by `setupNetworkLogger()`. No extra setup required.

### Axios (automatic)

Import `axios` before calling `setupNetworkLogger()`. Both the **default instance** and **any custom instances** created via `axios.create()` are automatically intercepted:

```tsx
import axios from 'axios';
import { setupNetworkLogger } from 'react-native-inapp-inspector';

setupNetworkLogger(); // patches axios + fetch

// Custom instances are automatically captured too
const api = axios.create({ baseURL: 'https://api.example.com' });

// All of these will appear in the APIs tab
api.get('/users');
api.post('/login', { email, password });
axios.get('https://other-api.com/data');
```

### Axios (manual — for pre-existing instances)

If you create an axios instance **before** calling `setupNetworkLogger()`, use `addAxiosInterceptors` to patch it manually:

```tsx
import axios from 'axios';
import { addAxiosInterceptors } from 'react-native-inapp-inspector';

const api = axios.create({ baseURL: 'https://api.example.com' });

// Manually register this existing instance
addAxiosInterceptors(api);
```

---

## Analytics Tracking

Log custom analytics events to view them in the **Analytics** tab:

```tsx
import { logAnalyticsEvent } from 'react-native-inapp-inspector';

// Log any event with a name and optional params
logAnalyticsEvent('purchase_completed', {
  item_id: 'SKU-42',
  value: 29.99,
  currency: 'USD',
});
```

---

## Redux State Inspection

Connect your Redux store to view live state and action history in the **Redux** tab:

```tsx
import { connectReduxStore } from 'react-native-inapp-inspector';
import store from './store'; // your Redux store

// Call once at app startup
connectReduxStore(store);
```

---

## WebView Inspection

Replace your `react-native-webview` import with the instrumented `WebView` from this library:

```tsx
import { WebView } from 'react-native-inapp-inspector';

// Use exactly like react-native-webview
<WebView source={{ uri: 'https://example.com' }} />
```

The inspector will capture HTML, CSS, JS snapshots, navigation history, and console logs from the WebView.

---

## Error Boundary

Wrap components to catch and display JavaScript crashes in the inspector:

```tsx
import { ErrorBoundary } from 'react-native-inapp-inspector';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

---

## Full Example

```tsx
// App.tsx
import React from 'react';
import { SafeAreaView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import axios from 'axios';
import NetworkInspector, {
  setupNetworkLogger,
  connectReduxStore,
  logAnalyticsEvent,
  WebView,
} from 'react-native-inapp-inspector';
import store from './store';

// ⚡ Must be at module level — before any render
setupNetworkLogger();
connectReduxStore(store);

const App = () => {
  return (
    <NavigationContainer>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Your app */}

        {/* Inspector — tap the floating icon to open */}
        <NetworkInspector />
      </SafeAreaView>
    </NavigationContainer>
  );
};

export default App;
```

---

## Public API

| Export | Type | Description |
|---|---|---|
| `NetworkInspector` | Component | Floating inspector overlay. Mount once at root. |
| `setupNetworkLogger()` | Function | Patches `fetch` and `axios`. Call at module level before render. |
| `addAxiosInterceptors(instance)` | Function | Manually attach interceptors to an existing axios instance. |
| `clearNetworkLogs()` | Function | Clear all captured network logs. |
| `subscribeNetworkLogs(cb)` | Function | Subscribe to network log updates. Returns unsubscribe function. |
| `logAnalyticsEvent(name, params)` | Function | Log a custom analytics event. |
| `subscribeAnalyticsEvents(cb)` | Function | Subscribe to analytics event updates. |
| `setupConsoleLogger()` | Function | Called internally — patches `console.log/warn/error`. |
| `clearConsoleLogs()` | Function | Clear all captured console logs. |
| `subscribeConsoleLogs(cb)` | Function | Subscribe to console log updates. |
| `connectReduxStore(store)` | Function | Connect a Redux store for live state inspection. |
| `WebView` | Component | Instrumented drop-in replacement for `react-native-webview`. |
| `ErrorBoundary` | Component | React error boundary that surfaces crashes in the inspector. |

---

## Support

If you find this project useful, consider sponsoring its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-@vengatmacuser-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/vengatmacuser)

---

## License

MIT — see the [LICENSE](LICENSE) file for details.
