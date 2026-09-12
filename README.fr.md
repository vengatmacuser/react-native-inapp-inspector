# React Native In-App Inspector (Inspecteur et Débogueur Intégré)

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

La **suite d'outils de débogage intégrée tout-en-un et sans configuration pour React Native & Expo**. Inspectez le trafic réseau HTTP/HTTPS, les flux WebSocket & Socket.IO, les journaux de console avec résolution précise des lignes source via Metro, les différences d'état Redux, le stockage AsyncStorage & MMKV en direct, les notifications push et la télémétrie matérielle directement sur votre appareil, sans aucun câble.

> 🚀 **L'alternative moderne et autonome à Flipper, Charles et Chucker** — fonctionne directement sur simulateurs et appareils réels, sans logiciel compagnon sur PC ni configuration de proxy.

<p align="center">
  <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/walkthrough.gif" alt="React Native In-App Inspector Walkthrough" width="360" style="border-radius: 20px; box-shadow: 0 12px 36px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  🎬 <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mp4">Regarder la vidéo de démonstration complète (MP4)</a></b> | <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mov">Fichier MOV Original</a></b>
</p>

---

## ⚡ Comparatif des Fonctionnalités

| Fonctionnalité | **react-native-inapp-inspector** | Flipper | Charles / Proxyman | RN Debugger |
| :--- | :---: | :---: | :---: | :---: |
| **Autonome sur l'appareil (Sans PC ni câble)** | ✅ | ❌ | ❌ | ❌ |
| **0% d'impact CPU en arrière-plan** | ✅ | ❌ | ❌ | ❌ |
| **Inspecteur réseau HTTP/HTTPS (Fetch / Axios / XHR)** | ✅ | ✅ | ✅ | ✅ |
| **Cascade de temps et télémétrie P95** | ✅ | ⚠️ | ⚠️ | ❌ |
| **Copie instantanée cURL et Fetch** | ✅ | ⚠️ | ⚠️ | ❌ |
| **Inspecteur de paquets WebSocket & Socket.IO** | ✅ | ❌ | ⚠️ | ⚠️ |
| **Édition du stockage en direct (AsyncStorage & MMKV)** | ✅ (CRUD) | ⚠️ (Lecture seule) | ❌ | ⚠️ |
| **Historique des notifications push (APNs, FCM)** | ✅ | ❌ | ❌ | ❌ |
| **Logs symbolisés Metro avec fichier et ligne exacts** | ✅ (Ligne exacte) | ✅ | ❌ | ✅ |
| **Diffs d'état Redux & chronologie des actions** | ✅ | ⚠️ | ❌ | ✅ |
| **Protection anti-crash & fil d'Ariane (Breadcrumbs)** | ✅ | ❌ | ❌ | ❌ |
| **Télémétrie matérielle (RAM, heap, stockage, batterie)**| ✅ | ⚠️ | ❌ | ❌ |
| **Enregistrement vidéo & capture d'écran (MP4 / GIF)** | ✅ | ❌ | ❌ | ❌ |
| **25 langues disponibles avec sélecteur Bottom Sheet** | ✅ | ❌ (Anglais seul) | ❌ | ❌ |

---

## 📦 Installation

```bash
npm install --save-dev react-native-inapp-inspector react-native-svg
# ou
yarn add -D react-native-inapp-inspector react-native-svg
```

#### Configuration iOS CocoaPods
```bash
cd ios && pod install && cd ..
```

### Projets Expo
```bash
npx expo install react-native-inapp-inspector react-native-svg
```

---

## 🚀 Démarrage Rapide

Dans votre fichier d'entrée (`App.tsx` ou `index.js`) :

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

// ⚡ Initialisation avant le montage de l'interface
setupNetworkLogger();
setupConsoleLogger();
setupSocketLogger();

if (store) connectReduxStore(store);
connectAsyncStorage(AsyncStorage);

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YourAppRoot />

      {/* Affichage de la bulle flottante en environnement de dev */}
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

## 🔎 Syntaxe de Recherche Avancée (DevTools)

```text
method:POST status:200         # Filtrer les requêtes POST avec réponse 200 OK
url:api.myapp.com -analytics   # Cibler votre API en excluant les trackers
header:authorization           # Filtrer les requêtes contenant un token
body:"orderId"                 # Rechercher dans le corps JSON
page:CheckoutScreen            # Filtrer par écran actif React Navigation
file:ProfileView.tsx           # Filtrer les logs par fichier source
```

## 🔍 Mots-Clés de Recherche (Keywords)

Optimisé pour les développeurs en France, au Canada (Québec), en Belgique et en Suisse :

* **Termes recherchés**: Débogueur React Native, inspecteur réseau mobile, outils de développement, capture paquets mobile, journal réseau, analyseur réseau mobile, dépannage mobile React Native.
* **Alternatives populaires**: Alternative à Flipper, alternative à Charles Proxy, Chucker pour React Native, alternative à Proxyman, alternative à Reactotron.
* **Fonctionnalités clés**: Analyseur WebSocket, éditeur MMKV, inspecteur AsyncStorage, journalisation des notifications push, capture d'écran vidéo sur appareil.

---

## 📄 Licence

MIT © [vengatmacuser](LICENSE)

