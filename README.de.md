# React Native In-App Inspector (In-App-Debugger für React Native & Expo)

<p align="center">
  <b><a href="./README.md">English</a></b> |
  <b><a href="./README.zh-CN.md">简体中文</a></b> |
  <b><a href="./README.hi.md">हिन्दी</a></b> |
  <b><a href="./README.ja.md">日本語</a></b> |
  <b><a href="./README.es.md">Español</a></b> |
  <b><a href="./README.de.md">Deutsch</a></b> |
  <b><a href="./README.fr.md">Français</a></b> |
  <b><a href="./README.pt-BR.md">Português</a></b> |
  <b><a href="./README.ko.md">한국어</a></b> |
  <b><a href="./README.ru.md">Русский</a></b> |
  <b><a href="./README.ar.md">العربية</a></b>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/banner_light.svg">
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/banner_dark.svg">
    <img alt="React Native In-App Inspector Banner" src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/banner_dark.svg" width="100%">
  </picture>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/react-native-inapp-inspector"><img src="https://img.shields.io/npm/v/react-native-inapp-inspector?color=6366f1&label=npm&logo=npm" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/react-native-inapp-inspector"><img src="https://img.shields.io/npm/dm/react-native-inapp-inspector?color=3b82f6&label=downloads" alt="npm downloads" /></a>
  <a href="https://github.com/vengatmacuser/react-native-inapp-inspector"><img src="https://img.shields.io/github/stars/vengatmacuser/react-native-inapp-inspector?color=f59e0b&label=stars&logo=github" alt="GitHub stars" /></a>
  <a href="https://github.com/vengatmacuser/react-native-inapp-inspector/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="license" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Expo-0284c7?logo=apple&logoColor=white" alt="platform" />
  <img src="https://img.shields.io/badge/React%20Native-%E2%89%A50.60-61DAFB?logo=react&logoColor=white" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-SDK%2048%2B%20%7C%2050%2B%20%7C%2051%2B%20%7C%2052%2B-000020?logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-Strict%20Ready-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Engine-Hermes%20%7C%20JSC-9333ea" alt="Engine" />
</p>

Das **konfigurationsfreie All-in-One-In-App-Debugging-Toolkit für React Native & Expo**. Überwachen Sie HTTP/HTTPS-Netzwerkanfragen, WebSocket- & Socket.IO-Verbindungen, Konsolenprotokolle mit Metro-Source-Map-Zeilennummern, Redux-Statusänderungen, AsyncStorage- & MMKV-Speicher, Push-Benachrichtigungen und Hardware-Telemetrie direkt auf Ihrem Mobilgerät – ohne Kabel oder externe Desktop-Tools.

> 🚀 **Die moderne Alternative zu Flipper, Charles und Chucker** — funktioniert eigenständig auf Geräten, in Test-Builds (APK / TestFlight) und ohne offene Debugger-Ports.

<p align="center">
  <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/walkthrough.gif" alt="React Native In-App Inspector Walkthrough" width="360" style="border-radius: 20px; box-shadow: 0 12px 36px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  🎬 <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mp4">Vollständiges Demo-Video ansehen (MP4)</a></b> | <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mov">Originales MOV</a></b>
</p>

---

## ⚡ Vergleich mit anderen Tools

| Funktion | **react-native-inapp-inspector** | Flipper | Charles / Proxyman | RN Debugger |
| :--- | :---: | :---: | :---: | :---: |
| **Standalone auf dem Gerät (Kein PC/Kabel nötig)** | ✅ | ❌ | ❌ | ❌ |
| **Null CPU-Overhead im Hintergrund (0% Aktivität)** | ✅ | ❌ | ❌ | ❌ |
| **HTTP/HTTPS Netzwerk-Logger (Fetch / Axios / XHR)** | ✅ | ✅ | ✅ | ✅ |
| **Timing-Wasserfall & P95-Telemetrie** | ✅ | ⚠️ | ⚠️ | ❌ |
| **Sofortiges Kopieren von cURL- & Fetch-Snippets** | ✅ | ⚠️ | ⚠️ | ❌ |
| **WebSocket & Socket.IO Paket-Inspektor** | ✅ | ❌ | ⚠️ | ⚠️ |
| **Speicher-Editor (AsyncStorage & MMKV)** | ✅ (CRUD) | ⚠️ (Nur Lesen) | ❌ | ⚠️ |
| **Push-Benachrichtigungs-Logger (APNs, FCM)** | ✅ | ❌ | ❌ | ❌ |
| **Metro-Symbolisierung mit genauen Zeilennummern** | ✅ (Genaue Zeile) | ✅ | ❌ | ✅ |
| **Redux State Diffs & Action-Timeline** | ✅ | ⚠️ | ❌ | ✅ |
| **Absturzschutz & Breadcrumb-Verlauf** | ✅ | ❌ | ❌ | ❌ |
| **Hardware-Telemetrie (RAM, Heap, Speicher, Akku)** | ✅ | ⚠️ | ❌ | ❌ |
| **Bildschirmaufzeichnung & Screenshots (MP4 / GIF)** | ✅ | ❌ | ❌ | ❌ |
| **25 Sprachen inkl. Deutsch (Bottom-Sheet-Auswahl)** | ✅ | ❌ (Nur Englisch) | ❌ | ❌ |

---

## 📦 Installation

```bash
npm install --save-dev react-native-inapp-inspector react-native-svg
# oder
yarn add -D react-native-inapp-inspector react-native-svg
```

#### iOS CocoaPods
```bash
cd ios && pod install && cd ..
```

### Expo Projekte
```bash
npx expo install react-native-inapp-inspector react-native-svg
```

---

## 🚀 Schnelleinbindung

In der Einstiegsdatei (`App.tsx` oder `index.js`):

```tsx
import React from 'react';
import { SafeAreaView } from 'react-native';
import NetworkInspector, {
  setupNetworkLogger,
  setupConsoleLogger,
  setupSocketLogger,
  connectReduxStore,
  connectAsyncStorage,
} from 'react-native-inapp-inspector';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from './src/store';

// ⚡ Vor dem Rendern der App initialisieren
setupNetworkLogger();
setupConsoleLogger();
setupSocketLogger();

if (store) connectReduxStore(store);
connectAsyncStorage(AsyncStorage);

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YourAppRoot />

      {/* Floating Overlay in der Entwicklungsumgebung */}
      {__DEV__ && (
        <NetworkInspector
          enabled={true}
          environment="DEV"
        />
      )}
    </SafeAreaView>
  );
}
```

---

## 🔎 DevTools Suchsyntax

```text
method:POST status:200         # POST-Anfragen mit 200 OK filtern
url:api.myapp.com -analytics   # Ziel-API suchen und Tracking ausschließen
header:authorization           # Anfragen mit Authentifizierungs-Headern
body:"orderId"                 # JSON-Body tiefgehend durchsuchen
page:CheckoutScreen            # Nach React Navigation-Bildschirm filtern
file:ProfileView.tsx           # Konsolen-Logs nach Quelldatei filtern
```

## 🔍 Suchbegriffe für Entwickler (Keywords)

Optimiert für Entwickler in Deutschland, Österreich und der Schweiz (DACH-Region):

* **Häufige Suchbegriffe**: Netzwerk-Logger, In-App-Debugger Deutschland, Entwicklertools React Native, Paketmitschnitt Mobil, Netzwerk-Mitschnitt, Fehlersuche Mobil, App-Inspektor.
* **Beliebte Alternativen**: Flipper-Alternative, Charles Proxy Alternative, Chucker für React Native, Proxyman Alternative, Reactotron Alternative.
* **Kernfunktionen**: WebSocket-Mitschnitt, MMKV-Editor, AsyncStorage-Viewer, Metro-Symbolisierung für Stacktraces, On-Device Bildschirmaufnahme.

---

## 📄 Lizenz

MIT © [vengatmacuser](LICENSE)

