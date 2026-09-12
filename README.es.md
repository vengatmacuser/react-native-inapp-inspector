# React Native In-App Inspector (Inspector de Depuración en la App)

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

El **conjunto de herramientas de depuración todo en uno y sin configuración para React Native y Expo**. Inspecciona el tráfico de red HTTP/HTTPS, flujos de WebSocket y Socket.IO en tiempo real, registros de consola con número de línea exacto mediante Metro, cambios de estado en Redux, almacenamiento en vivo de AsyncStorage y MMKV, notificaciones push, métricas de hardware del dispositivo y captura de pantalla/video directamente en el teléfono sin cables.

> 🚀 **La alternativa moderna y ligera a Flipper, Charles, Proxyman y Chucker** — funciona de forma autónoma en el dispositivo, en compilaciones de prueba (APK/TestFlight) y sin necesidad de conectar cables a la computadora.

<p align="center">
  <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/walkthrough.gif" alt="React Native In-App Inspector Walkthrough" width="360" style="border-radius: 20px; box-shadow: 0 12px 36px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  🎬 <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mp4">Ver Video de Demostración Completo (MP4)</a></b> | <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mov">MOV Original</a></b>
</p>

---

## ⚡ Comparación con Otras Herramientas

| Característica | **react-native-inapp-inspector** | Flipper | Charles / Proxyman | RN Debugger |
| :--- | :---: | :---: | :---: | :---: |
| **Funciona en el dispositivo (sin PC ni cables)** | ✅ | ❌ | ❌ | ❌ |
| **Cero consumo en reposo (0% CPU en segundo plano)** | ✅ | ❌ | ❌ | ❌ |
| **Inspección de red HTTP/HTTPS (Fetch / Axios / XHR)** | ✅ | ✅ | ✅ | ✅ |
| **Cascada de tiempos y percentil P95** | ✅ | ⚠️ | ⚠️ | ❌ |
| **Copia instantánea de snippets cURL y Fetch** | ✅ | ⚠️ | ⚠️ | ❌ |
| **Monitoreo de WebSocket y Socket.IO bidireccional** | ✅ | ❌ | ⚠️ | ⚠️ |
| **Editor de almacenamiento en vivo (AsyncStorage y MMKV)** | ✅ (CRUD) | ⚠️ (Solo lectura) | ❌ | ⚠️ |
| **Registro de notificaciones push (APNs, FCM, Salesforce)**| ✅ | ❌ | ❌ | ❌ |
| **Logs con resolución de líneas reales con Metro** | ✅ (Línea exacta) | ✅ | ❌ | ✅ |
| **Diferencias de Redux y línea de tiempo de acciones** | ✅ | ⚠️ | ❌ | ✅ |
| **Protección contra cierres y rastro de migas (Breadcrumbs)**| ✅ | ❌ | ❌ | ❌ |
| **Telemetría de hardware (RAM, heap, disco, batería)** | ✅ | ⚠️ | ❌ | ❌ |
| **Captura y grabación de video en el dispositivo (MP4/GIF)**| ✅ | ❌ | ❌ | ❌ |
| **25 idiomas con selector en hoja inferior (Bottom Sheet)**| ✅ | ❌ (Solo inglés) | ❌ | ❌ |

---

## 📦 Instalación

### Proyectos React Native
```bash
npm install --save-dev react-native-inapp-inspector react-native-svg
# o
yarn add -D react-native-inapp-inspector react-native-svg
```

#### Configuración de CocoaPods en iOS
```bash
cd ios && pod install && cd ..
```

### Proyectos Expo
```bash
npx expo install react-native-inapp-inspector react-native-svg
```

---

## 🚀 Inicio Rápido

En tu archivo principal (`App.tsx` o `index.js`):

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

// ⚡ Inicializa los registradores antes del renderizado de componentes
setupNetworkLogger();
setupConsoleLogger();
setupSocketLogger();

if (store) connectReduxStore(store);
connectAsyncStorage(AsyncStorage);

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YourAppRoot />

      {/* Activa el inspector flotante en desarrollo */}
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

## 🔎 Sintaxis de Búsqueda Estilo DevTools

```text
method:POST status:200         # Filtrar peticiones POST con respuesta 200 OK
url:api.miapp.com -analytics   # Buscar peticiones excluyendo analítica
header:authorization           # Buscar peticiones con tokens de autenticación
body:"orderId"                 # Búsqueda en el cuerpo JSON de petición o respuesta
page:CheckoutScreen            # Filtrar por pantalla activa en React Navigation
file:ProfileView.tsx           # Filtrar logs de consola por archivo fuente
```

## 🔍 Palabras Clave de Búsqueda (Keywords)

Optimizado para desarrolladores en España y toda Latinoamérica (México, Colombia, Argentina, Chile, Perú, etc.):

* **Términos de búsqueda**: Depurador React Native, captura de red móvil, registro de red, herramientas de desarrollo React Native, monitor de tráfico móvil, depuración en dispositivo, inspector en app.
* **Alternativas populares**: Alternativa a Flipper, alternativa a Charles Proxy, Chucker para React Native, alternativa a Proxyman, alternativa a Reactotron.
* **Características**: Captura de WebSocket, visor de MMKV, editor de AsyncStorage, logs con symbolication Metro, grabador de pantalla para reportar bugs.

---

## 📄 Licencia

MIT © [vengatmacuser](LICENSE)

