# React Native In-App Inspector Example App 🚀

This directory contains a complete, interactive sample application demonstrating all the capabilities of **`react-native-inapp-inspector`**.

---

## 📱 Features Demonstrated

- 🌐 **Network Interception**: Test Axios (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) and `fetch` requests with response inspector, headers, and cURL generation.
- 🪵 **Console Logger & Call Stacks**: Test log levels (`log`, `warn`, `error`), multi-argument object logging, error exception stack traces, and Metro source map symbolication.
- ⏸️ **Live Stream Pause / Resume**: Test pausing and resuming real-time traffic across API and console streams.
- 🔄 **Redux State Inspection**: Test Redux state tree, live action dispatches, and diff tracking.
- 📊 **Analytics Tracking**: Test custom analytics events and e-commerce purchase payloads.
- 🛡️ **Error Boundary**: Test simulated JavaScript and native error catches.

---

## 🏃 Quick Start

### 1. Install Dependencies

```bash
cd example
npm install
```

### 2. iOS Setup

```bash
cd ios
bundle install
bundle exec pod install
cd ..
npm run ios
```

### 3. Android Setup

```bash
npm run android
```

---

## 🧪 Interactive Test Controls

The example screen provides one-tap triggers for:
- **Network Requests**: `Fetch User`, `Failing Request`, `Axios GET`, `Axios POST`, `Axios PUT`, `Axios PATCH`, `Axios DELETE`.
- **Console Events**: `Trigger Log / Warn / Error`, `Multi-Arg Log`, `Error Stack Log`.
- **Analytics Events**: `Log Custom Event`, `Log Purchase`.
- **Redux Actions**: `Toggle Sidebar`, `Toggle Theme`.
- **Simulate Batch (Flood)**: `Fire Sample All` triggers a simultaneous barrage of requests, logs, analytics events, and state dispatches.
- **Error Boundary**: `Crash JS Component` triggers a safe Error Boundary catch.
