# React Native In-App Inspector

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/banner_dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/banner_light.svg">
    <img alt="React Native In-App Inspector Banner" src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/banner_light.svg" width="100%">
  </picture>
</p>

A premium, self-contained, and interactive in-app debugger for React Native applications. Inspect network requests, console logs, analytics events, and WebView states directly from your device.

## Features

- **🌐 Network Inspector**: Intercept and view HTTP requests and responses, track latency, export as cURL or Fetch, search logs, and view differences between subsequent requests.
- **💻 Console Logger**: In-app terminal displaying your `console.log`, `console.warn`, and `console.error` logs with customizable filters.
- **📊 Analytics Event Tracker**: Real-time logging and analytics debugging (e.g. Firebase Analytics, GA events).
- **🕸️ WebView Inspector**: Live tracking of navigation history, console logs, and inspection of HTML, CSS, and JS inside your `WebView` components.
- **📈 Embedded Visualizations**: Built-in mini charts visualizing metrics like latency, payload size, and errors over time.
- **🎨 Modern Dark UI**: Sleek, glassmorphism-inspired dark design with smooth micro-animations.

---

## Installation

Install the package as a development dependency in your React Native project:

```bash
npm install --save-dev react-native-inapp-inspector
# OR
yarn add -D react-native-inapp-inspector
```

The package will automatically install its dependencies (`@react-navigation/native`, `react-native-linear-gradient`, and `react-native-svg`).

For iOS projects, don't forget to run pod install:
```bash
cd ios && pod install
```

### Dependency Isolation

This package is designed to operate in strict isolation. If the host application already uses `@react-navigation/native`, `react-native-linear-gradient`, or `react-native-svg`, the package's dependencies will not conflict with the application's runtime. The bundler (Metro/Webpack) and autolink systems automatically resolve duplicate native module links without affecting your main application environment.

---

## Integration

### 1. Embed the Inspector Component
Place the `<NetworkInspector />` component at the root level of your application (usually in `App.tsx` or your root navigation container):

```tsx
import React from 'react';
import { SafeAreaView } from 'react-native';
import NetworkInspector from 'react-native-inapp-inspector';

const App = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Your application components */}
      
      {/* Floating Inspector overlay */}
      <NetworkInspector />
    </SafeAreaView>
  );
};

export default App;
```

### 2. Auto-Intercept Network Requests (Axios / Fetch)
The library automatically intercepts standard `fetch` and `XMLHttpRequest` requests when loaded. If you are using `axios`, you can register it to intercept requests:

```typescript
import axios from 'axios';
import { addAxiosInterceptors } from 'react-native-inapp-inspector';

const api = axios.create({
  baseURL: 'https://api.example.com',
});

// Register the interceptor
addAxiosInterceptors(api);
```

### 3. Log Analytics Events
Subscribe to and log custom analytics events:

```typescript
import { subscribeAnalyticsEvents } from 'react-native-inapp-inspector';

// Log your custom events
subscribeAnalyticsEvents((events) => {
  // Access and analyze logged events
});
```

---

## Support

If you find this project useful, consider sponsoring its development on GitHub Sponsors:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-@vengatmacuser-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/vengatmacuser)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
