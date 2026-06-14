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

A self-contained in-app debugging overlay for React Native. Inspect network traffic, console output, analytics events, Redux state, and WebView activity directly inside your app.

<p align="center">
  <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/walkthrough.gif" alt="React Native In-App Inspector Walkthrough" width="360" style="border-radius: 20px;" />
</p>

---

## Features

| Feature            | Description                                                                                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Network inspector  | Captures `fetch` and axios `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` calls with URL, method, status, headers, body, response, duration, caller, cURL, and fetch snippets. |
| Insights dashboard | Shows request totals, status breakdowns, latency, payload size, slow requests, and recent activity charts.                                                                  |
| Console logger     | Captures `console.log`, `console.info`, `console.warn`, and `console.error` with source method and caller details.                                                          |
| Analytics tracker  | Captures manual analytics events and patched `@react-native-firebase/analytics` calls including `logEvent`, `logScreenView`, user properties, and user id.                  |
| Redux inspector    | Connects to a Redux store, displays the live state tree, tracks dispatched actions, affected slices, and action history.                                                    |
| WebView inspector  | Provides an instrumented `WebView` with console capture, navigation history, HTML/CSS/JS snapshots, and optional loading overlay.                                           |
| Error boundary     | Exports an `ErrorBoundary` for catching React errors and wrapping the inspector safely.                                                                                     |

---

## Video Walkthrough

[Download or watch the Video Walkthrough](https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/example/guidance/Video-WalkThrough.mp4)

---

## Installation

```bash
npm install --save-dev react-native-inapp-inspector axios
```

```bash
yarn add -D react-native-inapp-inspector axios
```

The package has React and React Native as peer dependencies. It depends on `@react-navigation/native`, `react-native-linear-gradient`, and `react-native-svg`. The current network logger imports `axios` for axios interception, so install `axios` even if most of your requests use `fetch`.

Install optional integrations when you use WebView or Firebase Analytics capture:

```bash
npm install react-native-webview @react-native-firebase/analytics
```

For iOS, install pods after adding native dependencies:

```bash
cd ios && pod install
```

---

## Basic Setup

Mount the inspector once near the root of your app.

```tsx
import React from 'react';
import {SafeAreaView} from 'react-native';
import NetworkInspector from 'react-native-inapp-inspector';

const App = () => {
  return (
    <SafeAreaView style={{flex: 1}}>
      {/* Your app */}
      <NetworkInspector />
    </SafeAreaView>
  );
};

export default App;
```

When mounted, the inspector sets up network logging, clears previous network logs, patches console logging, and attempts Firebase Analytics auto-setup if `@react-native-firebase/analytics` is installed.

If you need to capture requests that happen before the component mounts, call `setupNetworkLogger()` at module level in your app entry file.

```tsx
import NetworkInspector, {
  setupNetworkLogger,
} from 'react-native-inapp-inspector';

setupNetworkLogger();
```

You can disable the overlay without removing it from your tree:

```tsx
<NetworkInspector enabled={false} />
```

---

## Settings Persistence

By default, the inspector preserves configuration preferences (such as dark mode, default landing tab, and module visibilities):
- **iOS:** Settings are persisted automatically using React Native's built-in `Settings` module (`NSUserDefaults`) with zero configuration or additional packages required.
- **Android / Custom:** To persist settings on Android (or to use a custom storage mechanism on both platforms), pass a storage instance such as `@react-native-async-storage/async-storage` or `react-native-mmkv` to the `storage` prop:

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

<NetworkInspector storage={AsyncStorage} />
```

If no `storage` prop is passed, Android will fall back to an in-memory store (settings reset when the app is restarted).

---

## Network Logging

`setupNetworkLogger()` patches global `fetch`, the default axios instance, and future axios instances created with `axios.create()`.

```tsx
import axios from 'axios';
import {setupNetworkLogger} from 'react-native-inapp-inspector';

setupNetworkLogger();

const api = axios.create({baseURL: 'https://api.example.com'});

await fetch('https://api.example.com/users');
await api.post('/login', {email, password});
```

If an axios instance was created before `setupNetworkLogger()` ran, attach interceptors manually:

```tsx
import {addAxiosInterceptors} from 'react-native-inapp-inspector';

addAxiosInterceptors(api);
```

Network logs are capped at 100 entries and ignore React Native symbolication requests.

---

## Console Logging

The inspector captures console output automatically when mounted. You can also set it up manually:

```tsx
import {setupConsoleLogger} from 'react-native-inapp-inspector';

setupConsoleLogger();
```

Captured levels are `log`, `info`, `warn`, and `error`.

---

## Analytics Logging

Manual events can be pushed into the Analytics tab:

```tsx
import {logAnalyticsEvent} from 'react-native-inapp-inspector';

logAnalyticsEvent('purchase_completed', {
  item_id: 'SKU-42',
  value: 29.99,
  currency: 'USD',
});
```

For Firebase Analytics, pass the result of `analytics()` to `setupAnalyticsLogger()` before analytics calls begin:

```tsx
import analytics from '@react-native-firebase/analytics';
import {setupAnalyticsLogger} from 'react-native-inapp-inspector';

setupAnalyticsLogger(analytics());
```

The logger patches `logEvent`, `logScreenView`, `setUserProperty`, `setUserProperties`, and `setUserId`. Analytics events are capped at 200 entries.

---

## Redux Inspection

Connect your Redux store once during app startup.

```tsx
import {connectReduxStore} from 'react-native-inapp-inspector';
import store from './store';

connectReduxStore(store);
```

**Recommended:** if you use thunks, sagas or RTK Query, also add the inspector middleware so actions dispatched from inside them are captured with full type/payload attribution (they bypass the wrapped outer dispatch otherwise):

```tsx
import {inspectorReduxMiddleware} from 'react-native-inapp-inspector';

const store = configureStore({
  reducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(inspectorReduxMiddleware),
});
```

Using both together is safe — they de-duplicate automatically.

The Redux tab shows the latest state tree, recent dispatches, payloads, and changed top-level state slices. Action history is capped at 50 entries.

---

## WebView Inspection

Use the exported `WebView` as a drop-in wrapper around `react-native-webview`.

```tsx
import {WebView} from 'react-native-inapp-inspector';

<WebView source={{uri: 'https://example.com'}} />;
```

The wrapper forwards your props and ref, preserves your `onMessage`, `onNavigationStateChange`, `onLoadStart`, and `onLoadEnd` handlers, and injects scripts for WebView console logs, navigation history, and source snapshots.

Disable the loading overlay with `showLoader={false}`:

```tsx
<WebView source={{uri: 'https://example.com'}} showLoader={false} />
```

---

## Error Boundary

```tsx
import {ErrorBoundary} from 'react-native-inapp-inspector';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>;
```

---

## Public API

| Export                                              | Type              | Description                                                                |
| --------------------------------------------------- | ----------------- | -------------------------------------------------------------------------- |
| `NetworkInspector`                                  | default component | Floating inspector overlay. Mount once near the root of the app.           |
| `setupNetworkLogger()`                              | function          | Patches `fetch`, default axios, and future `axios.create()` instances.     |
| `addAxiosInterceptors(instance)`                    | function          | Manually attaches axios interceptors to an existing instance.              |
| `clearNetworkLogs()`                                | function          | Clears captured network logs.                                              |
| `subscribeNetworkLogs(callback)`                    | function          | Subscribes to network log updates and returns an unsubscribe function.     |
| `setupConsoleLogger()`                              | function          | Patches console methods.                                                   |
| `clearConsoleLogs()`                                | function          | Clears captured console logs.                                              |
| `subscribeConsoleLogs(callback)`                    | function          | Subscribes to console log updates and returns an unsubscribe function.     |
| `setupAnalyticsLogger(instance)`                    | function          | Patches a Firebase Analytics instance.                                     |
| `logAnalyticsEvent(name, params?, userProperties?)` | function          | Adds a manual analytics event to the inspector.                            |
| `clearAnalyticsEvents()`                            | function          | Clears captured analytics events.                                          |
| `subscribeAnalyticsEvents(callback)`                | function          | Subscribes to analytics event updates and returns an unsubscribe function. |
| `connectReduxStore(store)`                          | function          | Connects a Redux store for live state and action inspection.               |
| `inspectorReduxMiddleware`                          | middleware        | Redux middleware to capture actions dispatched from thunks/sagas.          |
| `getReduxState()`                                   | function          | Returns the latest captured Redux state.                                   |
| `subscribeReduxState(callback)`                     | function          | Subscribes to Redux state updates and returns an unsubscribe function.     |
| `getActionHistory()`                                | function          | Returns the recent dispatched Redux actions.                               |
| `clearActionHistory()`                              | function          | Clears the Redux action history.                                           |
| `WebView`                                           | component         | Instrumented WebView wrapper.                                              |
| `getWebViewLogs()`                                  | function          | Returns captured WebView console logs.                                     |
| `getWebViewNavHistory()`                            | function          | Returns captured WebView navigation history.                               |
| `getWebViewHtml()`                                  | function          | Returns the latest captured WebView HTML.                                  |
| `getWebViewCss()`                                   | function          | Returns the latest captured WebView CSS.                                   |
| `getWebViewJs()`                                    | function          | Returns the latest captured WebView JavaScript.                            |
| `getWebViewHtmlUrl()`                               | function          | Returns the URL for the latest captured WebView source snapshot.           |
| `clearWebViewData()`                                | function          | Clears captured WebView logs, navigation, and source data.                 |
| `subscribeWebView(callback)`                        | function          | Subscribes to WebView data changes and returns an unsubscribe function.    |
| `ErrorBoundary`                                     | component         | React error boundary component.                                            |

---

## Example App

The `example` directory contains a React Native sample app and video walkthrough.

```bash
cd example
npm install
cd ios && pod install && cd ..
npm run ios
```

---

## Contributing 🤝

Contributions are welcome! Please check out our [Contributing Guidelines](CONTRIBUTING.md) to learn how to get started, set up the development environment, or request features.

---

## Support & Sponsoring 💖

This library is a completely free, open-source utility maintained in the author's spare time. If this tool has saved you or your team hours of debugging, please consider supporting its continuous development.

Sponsoring helps prioritize your bug fixes, maintain compatibility with new React Native versions, and support new features.

👉 **[Sponsor @vengatmacuser on GitHub Sponsors](https://github.com/sponsors/vengatmacuser)**

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-@vengatmacuser-ea4aaa?logo=githubsponsors&logoColor=white&style=for-the-badge)](https://github.com/sponsors/vengatmacuser)

---

## License

MIT - see the [LICENSE](LICENSE) file for details.
