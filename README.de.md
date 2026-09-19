<p align="center">
  <a href="https://github.com/vengatmacuser/react-native-inapp-inspector">
    <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/inapp_inspector_icon.gif" alt="React Native In-App Inspector Icon" width="120" height="120" style="border-radius: 28px; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.45);" />
  </a>
</p>

# React Native In-App Inspector (In-App Debugging-Toolkit)

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
  <a href="https://www.npmjs.com/package/react-native-inapp-inspector"><img src="https://img.shields.io/npm/v/react-native-inapp-inspector?color=6366f1&label=npm&logo=npm" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/react-native-inapp-inspector"><img src="https://img.shields.io/npm/dm/react-native-inapp-inspector?color=3b82f6&label=downloads" alt="npm downloads" /></a>
  <a href="https://github.com/vengatmacuser/react-native-inapp-inspector"><img src="https://img.shields.io/github/stars/vengatmacuser/react-native-inapp-inspector?color=f59e0b&label=stars&logo=github" alt="GitHub stars" /></a>
  <a href="https://github.com/vengatmacuser/react-native-inapp-inspector/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="license" /></a>
  <a href="https://github.com/sponsors/vengatmacuser"><img src="https://img.shields.io/badge/sponsor-GitHub%20Sponsors-ea4aaa?logo=githubsponsors&logoColor=white" alt="sponsor" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Expo-0284c7?logo=apple&logoColor=white" alt="platform" />
  <img src="https://img.shields.io/badge/React%20Native-%E2%89%A50.60-61DAFB?logo=react&logoColor=white" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-SDK%2048%2B%20%7C%2050%2B%20%7C%2051%2B%20%7C%2052%2B-000020?logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-Strict%20Ready-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Engine-Hermes%20%7C%20JSC-9333ea" alt="Engine" />
</p>

Das **konfigurationsfreie All-in-One In-App-Debugging-Toolkit für React Native & Expo**. Überprüfen Sie HTTP/HTTPS-Netzwerkverkehr, WebSocket- & Socket.IO-Echtzeit-Streams, Konsolenprotokolle mit Metro-Dateizeilen, Redux-State-Diffs, AsyncStorage & MMKV-Speicher, Push-Benachrichtigungen, Hardware-Metriken und erstellen Sie Screenshots oder Videoaufnahmen mit integriertem Editor direkt auf dem Gerät ohne Kabel.

> 🚀 **Die moderne, leichtgewichtige Alternative zu Flipper, Charles, Proxyman und Chucker** — funktioniert eigenständig auf dem Gerät, in Test-Builds und ohne Desktop-App oder USB-Kabel.

<p align="center">
  <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/walkthrough.gif" alt="React Native In-App Inspector Walkthrough" width="360" style="border-radius: 20px; box-shadow: 0 12px 36px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  🎬 <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mp4">Vollständiges Demo-Video ansehen (MP4)</a></b> | <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mov">Original MOV</a></b>
</p>

---

<table align="center" width="100%">
  <tr>
    <td align="center" style="padding: 24px; background: linear-gradient(135deg, rgba(236,72,153,0.1), rgba(99,102,241,0.1)); border-radius: 16px; border: 1px solid rgba(236,72,153,0.35);">
      <h3 align="center">💖 Mit Liebe für jeden Entwickler geschaffen, der jemals um 2 Uhr nachts nach Phantom-Bugs gesucht hat</h3>
      <p align="center">
        <i>„Wir haben react-native-inapp-inspector entwickelt, weil wir den Frust über Kabelsalat, unterbrochene Debugger-Verbindungen und schwer reproduzierbare Fehler in Test-Builds nur zu gut kennen. Wir haben zahllose schlaflose Nächte und pure Leidenschaft investiert, damit jeder Mobile-Entwickler und QA-Tester weltweit mühelos und frei auf echten Geräten debuggen kann.“</i>
      </p>
      <p align="center">
        Wenn dieses Tool Ihnen Stunden an Fehlersuche erspart hat, geholfen hat, ein wichtiges Release pünktlich auszuliefern, oder Ihren Arbeitsalltag erleichtert hat — <b>erwägen Sie bitte, das Projekt zu sponsern</b>. Jeder noch so kleine Kaffee oder monatliche Beitrag bedeutet uns unglaublich viel und hält unabhängige Open-Source-Innovation am Leben. ☕✨
      </p>
      <p align="center">
        <a href="https://github.com/sponsors/vengatmacuser">
          <img src="https://img.shields.io/badge/Sponsor%20%40vengatmacuser-Auf%20GitHub%20Sponsors%20unterst%C3%BCtzen-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white" alt="Sponsor on GitHub Sponsors" />
        </a>
      </p>
    </td>
  </tr>
</table>

---

## ⚡ Vergleich mit anderen Tools

| Funktion | **react-native-inapp-inspector** | Flipper | Charles / Proxyman | RN Debugger |
| :--- | :---: | :---: | :---: | :---: |
| **Eigenständig auf dem Gerät (Kein PC/Kabel erforderlich)** | ✅ | ❌ | ❌ | ❌ |
| **Null-Rendern im Leerlauf (0% Hintergrund-CPU)** | ✅ | ❌ | ❌ | ❌ |
| **HTTP/HTTPS Netzwerk-Logger (Fetch / Axios / XHR)** | ✅ | ✅ | ✅ | ✅ |
| **Timing-Wasserfall & P95-Latenz** | ✅ | ⚠️ | ⚠️ | ❌ |
| **Sofortiger cURL- & Fetch-Code-Export** | ✅ | ⚠️ | ⚠️ | ❌ |
| **Bidirektionaler WebSocket- & Socket.IO-Inspektor** | ✅ | ❌ | ⚠️ | ⚠️ |
| **Live-Speicher-Editor (AsyncStorage & MMKV)** | ✅ (CRUD) | ⚠️ (Nur Lesen) | ❌ | ⚠️ |
| **Push-Benachrichtigungs-Logger (APNs, FCM, Salesforce)** | ✅ | ❌ | ❌ | ❌ |
| **Logs mit echten Dateizeilennummern via Metro** | ✅ (Exakte Zeile) | ✅ | ❌ | ✅ |
| **Redux-State-Diffs & Aktions-Zeitleiste** | ✅ | ⚠️ | ❌ | ✅ |
| **Analytics-Ereignis-Tracker (Firebase, Mixpanel)** | ✅ | ❌ | ❌ | ❌ |
| **Absturzschutz & Multi-Typ Breadcrumbs** | ✅ | ❌ | ❌ | ❌ |
| **Hardware-Telemetrie (RAM, Heap, Speicher, Akku, FPS)** | ✅ | ⚠️ | ❌ | ❌ |
| **Medienaufnahme & Studio-Editor (Crop, Video Trim, Badges)** | ✅ (Komplettes Studio) | ❌ | ❌ | ❌ |
| **Verschiebbarer FAB & Transparenz-Modus (Peek Mode)** | ✅ (0.05 - 1.0) | ❌ | ❌ | ❌ |
| **Remote-Modulverwaltung via Firebase Remote Config** | ✅ | ❌ | ❌ | ❌ |
| **25 Sprachen mit Bottom-Sheet-Auswahl** | ✅ | ❌ (Nur Englisch) | ❌ | ❌ |
| **Expo (Bare / Managed) & React Native CLI** | ✅ | ⚠️ | ⚠️ | ⚠️ |

---

## ✨ Hauptmodule & Funktionen

### 🌐 1. Netzwerk-Inspektor & Timing-Wasserfall
- **Universelles HTTP/HTTPS-Abfangen**: Unterstützt automatisch `fetch`, Axios-Instanzen und `XMLHttpRequest`.
- **Latenz-Aufschlüsselung**: Proportionale Wasserfall-Balken, Geschwindigkeitseinstufung (Schnell `<200ms`, Moderat `200-800ms`, Langsam `>800ms`).
- **Telemetrie-Leiste**: Echtzeit-Erfolgsrate (%), Durchschnittliche Latenz (ms) und P95-Latenz (ms).
- **Payload-Viewer**: Formatierter JSON-Baum, Raw-Text, Header, Abfrageparameter und Aufruferquelle.
- **Schnell-Export**: Mit einem Fingertipp als **cURL-Befehl**, **Fetch-Snippet** oder Bericht kopieren.

### ⚡ 2. WebSocket & Socket.IO Echtzeit-Stream-Inspektor
- **Vollständige Protokollabdeckung**: Natives WebSocket (`ws://`, `wss://`) und Socket.IO (`v2`, `v3`, `v4`).
- **Bidirektionale Frame-Zeitleiste**: Verfolgen von Paketen (⬆️ Gesendet, ⬇️ Empfangen) mit hochauflösenden Zeitstempeln.
- **Typenerkennung**: Text, JSON-Nutzdaten, Binärgrößen (ArrayBuffer) und Ping/Pong-Heartbeats.
- **Verbindungsmetadaten**: Status, Handshake-Parameter, Transportmodus (websocket/polling) und Wiederverbindungen.

### 💾 3. Speicher-Manager (AsyncStorage & MMKV)
- **Einheitliche Speicher-Schnittstelle**: Für `@react-native-async-storage/async-storage` und `react-native-mmkv`.
- **Live In-App CRUD**: Schlüssel direkt auf dem Bildschirm anzeigen, suchen, erstellen, bearbeiten und löschen.
- **Intelligente Typerkennung**: Unterscheidet automatisch zwischen JSON-Objekten, Arrays, Booleans, Zahlen und Strings.

### 🔔 4. Push-Benachrichtigungs-Logger
- **Multi-Provider-Unterstützung**: FCM, APNs, Salesforce Marketing Cloud, OneSignal und Notifee.
- **App-Status-Erkennung**: Erkennt, ob Benachrichtigungen im Vordergrund, Hintergrund oder aus dem beendeten Zustand empfangen wurden.
- **Payload-Inspektion**: Vollständige Datenparameter, Deep-Links, Titel, Texte und Kanal-IDs.

### 🪵 5. Konsolen-Logger & Metro Source-Map-Symbolisierung
- **Exakte Zeilennummern**: Fängt `console.log`, `warn` und `error` ab und zeigt dank Metro Bundler die tatsächliche Quellcodedatei und Zeile an (`HomeScreen.tsx:42:15`).
- **Argument-Aufschlüsselung**: Jedes Argument einzeln mit Typangabe prüfen.
- **Call-Stack & Error-Stack**: Strukturierte Frames mit Funktionsnamen, Dateipfaden und Fehlertraces.
- **Duplikatzusammenfassung**: Wiederholte Ausgaben werden automatisch mit Zähler (`×N`) gebündelt.

### 🔄 6. Redux State-Diffs & Aktions-Zeitleiste
- **Redux Toolkit Integration**: Funktioniert nahtlos mit Redux Store, RTK Query und `redux-persist`.
- **Aktions-Zeitleiste**: Chronologischer Verlauf aller Aktionen mit Dauer und Payload.
- **Farbcodierte State-Diffs**: Änderungen sofort erkennen (**Grün** für Hinzufügungen, **Gelb** für Aktualisierungen, **Rot** für Entfernungen).

### 📊 7. Analytics-Ereignis-Tracker
- **Firebase Analytics Auto-Hook**: Fängt `logEvent`, `logScreenView`, `setUserProperties` und `setUserId` automatisch ab.
- **Plugin-Architektur**: Unterstützt Google Analytics 4, Mixpanel, Segment und Amplitude.
- **Parameter-Prüfung**: Ereignisparameter, Benutzereigenschaften und Zeitstempel analysieren.

### 🛡️ 8. Absturzschutz & Globale Error-Boundary
- **Isolierte Micro-UI**: Eigene Sandbox stellt sicher, dass der Inspektor niemals die Hauptanwendung zum Absturz bringt.
- **Globale ErrorBoundary**: Fängt nicht behandelte React-Render-Abstürze mit Wiederherstellungs-UI ab.
- **Breadcrumb-Historie**: Zeigt vorherige Navigationen, Netzwerkaufrufe und Redux-Aktionen vor einem Fehler.

### 📱 9. Native Hardware-, RAM- & Leistungs-Telemetrie
- **Systemmetriken**: Gesamter & freier RAM, Nativer Heap, Freier Speicherplatz, Akkustand & Ladestatus, CPU-Architektur.
- **Live-FPS-Zähler**: Kontinuierliche Überwachung der Bildschirm-Bildwiederholrate.
- **Automatische Speicherbereinigung**: Gibt bei OS-Speicherwarnungen automatisch Puffer frei.
- **Schüttel-Geste**: Gerät schütteln oder `Ctrl+Cmd+Z` / `Cmd+M` drücken, um den Inspektor zu öffnen.

### 📸 10. Native Medienaufnahme & In-App Studio-Editor
- **Aufnahme direkt auf dem Gerät**: Hochauflösende Screenshots, flüssige MP4-Videoaufnahmen oder animierte GIFs erstellen.
- **Vollständige Mediengalerie**: Durchsuchen, Filtern (Fotos, Videos, GIFs), Mehrfachauswahl und URI-Kopieren.
- **Foto- & Video-Studio-Editor**:
  - **Zuschneiden & Skalieren**: Feste Seitenverhältnisse (1:1 Quadrat, 4:3, 16:9) und Größenanpassung für schnelles Hochladen.
  - **Video-Trimming & Audio**: Start-/Endzeitpunkte anpassen, Wiedergabegeschwindigkeit (0.5× – 2.0×) ändern oder stummschalten.
  - **PNG-Frame-Snapshot**: Beliebige Frames aus Videos mit einem Fingertipp als PNG exportieren.
- **QA-Anmerkungen & Fehler-Markup**:
  - **Instagram 3×3 Raster**: Hilfslinien zur pixelgenauen Ausrichtungsprüfung einblenden.
  - **Nummerierte Schritt-Badges**: Schritt-für-Schritt-Badges (`1`, `2`, `3`...) für Reproduktionsschritte platzieren.
  - **Bug- & Notiz-Tags**: Farbige Fehler- (`🐛`), Notiz- (`📝`) und Warnsymbole platzieren.
  - **Text & QA-Wasserzeichen**: Eigene Hinweistexte schreiben und Gerätedaten-Wasserzeichen einblenden.
- **Galerie-Import**: Bestehende Fotos oder Videos aus der Fotomediathek zur Bearbeitung importieren.

### 🎛️ 11. Ziehbarer schwebender FAB & Durchsichtigkeits-Modus (Peek Mode)
- **Schwebender Launcher**: Frei verschiebbare Bubble mit Ungelesen-Zähler.
- **Ausblend-Zone unten**: Zum Schließen einfach auf das leuchtende Ziel am unteren Bildschirmrand ziehen.
- **Durchsichtigkeits-Modus**: Deckkraft von 0.05 bis 1.0 anpassen, um die App normal zu bedienen und gleichzeitig Datenströme zu beobachten.

### ☁️ 12. Firebase Remote Config Modulverwaltung
- **Remote Feature Flags**: Inspektor-Module in Produktions- oder Test-Builds über Firebase Remote Config aus der Cloud steuern.

### 🌍 13. 25 globale Sprachen & Interaktives Bottom Sheet
- **25 unterstützte Sprachen**: Deutsch, Englisch, Spanisch, Französisch, Italienisch, Portugiesisch, Russisch, Japanisch, Koreanisch, Chinesisch, Arabisch, Hindi u.v.m.
- **Interaktives Bottom Sheet**: Tippen Sie auf `[ 🌐 DE ▾ ]` in der Kopfzeile für sofortigen Sprachwechsel mit Ländersuche.

---

## 🔎 DevTools-Suchsyntax

```text
method:POST status:200         # Filter POST requests with 200 OK
url:api.myapp.com -analytics   # Filter domain and exclude analytics
header:authorization           # Filter requests containing auth header
body:"orderId"                 # Search in request/response JSON body
page:CheckoutScreen            # Filter logs by screen/route name
file:ProfileView.tsx           # Filter console logs by source file
-healthcheck -socket.io        # Exclude unwanted logs
```

---

## 📦 Installation

```bash
npm install --save-dev react-native-inapp-inspector react-native-svg
# or
yarn add -D react-native-inapp-inspector react-native-svg
# or
pnpm add -D react-native-inapp-inspector react-native-svg
```

#### iOS CocoaPods
```bash
cd ios && pod install && cd ..
```

### Expo
```bash
npx expo install react-native-inapp-inspector react-native-svg
```

---

## 🚀 Schnellstart

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

// ⚡ Initialize interceptors before app mount
setupNetworkLogger();
setupConsoleLogger();
setupSocketLogger();

if (store) connectReduxStore(store);
connectAsyncStorage(AsyncStorage);

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YourAppRoot />

      {/* Mount In-App Inspector in DEV builds */}
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
