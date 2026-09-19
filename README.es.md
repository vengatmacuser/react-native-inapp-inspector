<p align="center">
  <a href="https://github.com/vengatmacuser/react-native-inapp-inspector">
    <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/inapp_inspector_icon.gif" alt="React Native In-App Inspector Icon" width="120" height="120" style="border-radius: 28px; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.45);" />
  </a>
</p>

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

El **conjunto de herramientas de depuración todo en uno y sin configuración para React Native y Expo**. Inspecciona el tráfico de red HTTP/HTTPS, flujos de WebSocket y Socket.IO en tiempo real, registros de consola con número de línea exacto mediante Metro, cambios de estado en Redux, almacenamiento en vivo de AsyncStorage y MMKV, notificaciones push, métricas de hardware del dispositivo y captura de pantalla/video con estudio de edición integrado directamente en el teléfono sin cables.

> 🚀 **La alternativa moderna y ligera a Flipper, Charles, Proxyman y Chucker** — funciona de forma autónoma en el dispositivo, en compilaciones de prueba (APK/TestFlight) y sin necesidad de conectar cables a la computadora.

<p align="center">
  <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/walkthrough.gif" alt="React Native In-App Inspector Walkthrough" width="360" style="border-radius: 20px; box-shadow: 0 12px 36px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  🎬 <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mp4">Ver Video de Demostración Completo (MP4)</a></b> | <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mov">MOV Original</a></b>
</p>

---

<table align="center" width="100%">
  <tr>
    <td align="center" style="padding: 24px; background: linear-gradient(135deg, rgba(236,72,153,0.1), rgba(99,102,241,0.1)); border-radius: 16px; border: 1px solid rgba(236,72,153,0.35);">
      <h3 align="center">💖 Hecho con Amor para Cada Desarrollador que Alguna Vez Persiguió un Bug a las 2 AM</h3>
      <p align="center">
        <i>“Creamos react-native-inapp-inspector porque conocemos de primera mano el dolor de los cables enredados, los puertos de depuración caídos y los errores inexplicables en producción. Dedicamos innumerables noches de desvelo y pasión para que cada desarrollador móvil y tester del mundo pueda depurar con total libertad, fluidez y alegría.”</i>
      </p>
      <p align="center">
        Si esta herramienta te ahorró horas de frustración, te ayudó a lanzar una actualización a tiempo o hizo tu trabajo diario más ligero — <b>por favor considera patrocinar el proyecto</b>. Una pequeña taza de café o un patrocinio mensual marca una enorme diferencia y mantiene vivo el desarrollo de código abierto independiente. ☕✨
      </p>
      <p align="center">
        <a href="https://github.com/sponsors/vengatmacuser">
          <img src="https://img.shields.io/badge/Sponsor%20%40vengatmacuser-Patrocinar%20en%20GitHub%20Sponsors-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white" alt="Sponsor on GitHub Sponsors" />
        </a>
      </p>
    </td>
  </tr>
</table>

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
| **Registro de notificaciones push (APNs, FCM, Salesforce)** | ✅ | ❌ | ❌ | ❌ |
| **Logs con resolución de líneas reales con Metro** | ✅ (Línea exacta) | ✅ | ❌ | ✅ |
| **Diferencias de Redux y línea de tiempo de acciones** | ✅ | ⚠️ | ❌ | ✅ |
| **Rastreador de eventos de analítica (Firebase, Mixpanel)** | ✅ | ❌ | ❌ | ❌ |
| **Protección contra cierres y rastro de migas (Breadcrumbs)** | ✅ | ❌ | ❌ | ❌ |
| **Telemetría de hardware (RAM, heap, disco, batería, FPS)** | ✅ | ⚠️ | ❌ | ❌ |
| **Captura y edición de medios en la app (Crop, Video Trim, Badges)** | ✅ (Estudio completo) | ❌ | ❌ | ❌ |
| **Botón flotante arrastrable y modo transparente (Peek)** | ✅ (0.05 - 1.0) | ❌ | ❌ | ❌ |
| **Gestión de módulos remota vía Firebase Remote Config** | ✅ | ❌ | ❌ | ❌ |
| **25 idiomas con selector en hoja inferior (Bottom Sheet)** | ✅ | ❌ (Solo inglés) | ❌ | ❌ |
| **Expo (Bare / Managed) & React Native CLI** | ✅ | ⚠️ | ⚠️ | ⚠️ |

---

## ✨ Características y Módulos Principales

### 🌐 1. Inspector de Red y Cascada de Tiempos
- **Interceptación Universal HTTP/HTTPS**: Compatible automáticamente con `fetch`, instancias de Axios y `XMLHttpRequest`.
- **Desglose de Latencia**: Barras proporcionales de cascada, clasificación de velocidad (Rápido `<200ms`, Moderado `200-800ms`, Lento `>800ms`).
- **Barra de Telemetría**: Tasa de éxito en tiempo real (%), Latencia promedio (ms) y Latencia P95 (ms).
- **Visor de Carga Útil**: Árbol JSON formateado, vista sin formato (raw), encabezados, parámetros de consulta y origen del llamador.
- **Exportación Rápida**: Copia en un toque como comando **cURL**, fragmento **Fetch** o informe resumido.

### ⚡ 2. Inspector en Tiempo Real de WebSocket y Socket.IO
- **Cobertura Completa**: Compatible con WebSocket nativo (`ws://`, `wss://`) y Socket.IO (`v2`, `v3`, `v4`).
- **Línea de Tiempo Bidireccional**: Rastreo de paquetes (⬆️ Enviado, ⬇️ Recibido) con marcas de tiempo de alta precisión.
- **Detección de Tipos**: Texto, JSON, tamaño binario (ArrayBuffer) y latidos Ping/Pong.
- **Metadatos de Conexión**: Estado de conexión, parámetros de handshake, transporte (websocket/polling) y reconexiones.

### 💾 3. Gestor de Almacenamiento (AsyncStorage y MMKV)
- **Interfaz Unificada**: Visor interactivo para `@react-native-async-storage/async-storage` y `react-native-mmkv`.
- **Operaciones CRUD en Vivo**: Lee, busca, crea, edita y elimina claves de almacenamiento directamente en la pantalla.
- **Tipado Inteligente**: Distingue automáticamente objetos JSON, arreglos, booleanos, números y cadenas.

### 🔔 4. Registro de Notificaciones Push
- **Múltiples Proveedores**: Registra notificaciones de FCM, APNs, Salesforce Marketing Cloud, OneSignal y Notifee.
- **Estado de la App**: Identifica si se recibió en Primer Plano (**Foreground**), Segundo Plano (**Background**) o desde estado Cerrado (**Killed**).
- **Inspección de Payload**: Parámetros de datos, enlaces profundos (deep-links), títulos, cuerpos e IDs de canal.

### 🪵 5. Registrador de Consola y Simbolización Metro
- **Línea Exacta de Código**: Intercepta `console.log`, `warn` y `error`, resolviendo nombres de archivo y líneas reales mediante Metro (`HomeScreen.tsx:42:15`).
- **Desglose de Argumentos**: Inspecciona cada argumento de forma individual con identificación de tipo.
- **Pila de Llamadas y Errores**: Visualización estructurada de frames y trazas de error nativas.
- **Agrupación Inteligente**: Contador de repeticiones (`×N`) para evitar inundaciones de logs.

### 🔄 6. Diferencias de Estado y Acciones Redux
- **Integración con Redux Toolkit**: Compatible con Redux Store, RTK Query y `redux-persist`.
- **Línea de Tiempo de Acciones**: Registro cronológico de acciones despachadas con duración y payload.
- **Diff Visual de Estados**: Código de colores para cambios (**Verde** para adiciones, **Ámbar** para cambios, **Rojo** para eliminaciones).

### 📊 7. Rastreador de Eventos de Analítica
- **Integración con Firebase Analytics**: Intercepta automáticamente `logEvent`, `logScreenView`, `setUserProperties` y `setUserId`.
- **Arquitectura Extensible**: Compatible con Google Analytics 4, Mixpanel, Segment y Amplitude.
- **Inspección de Parámetros**: Revisa parámetros de eventos, propiedades de usuario y marcas de tiempo.

### 🛡️ 8. Protección contra Cierres y Límite de Errores Global
- **Micro-UI Aislada**: El inspector no afecta ni detiene la aplicación principal en caso de error.
- **Captura Global de Errores**: Maneja excepciones no controladas de React con opción de recuperación interactiva.
- **Rastro de Migas (Breadcrumbs)**: Rastrea navegación previa, llamadas de red y acciones Redux antes de un error.

### 📱 9. Telemetría de Hardware Nativo, RAM y Rendimiento
- **Métricas de Sistema**: Memoria RAM total y disponible, Heap nativo, espacio de disco, batería y arquitectura CPU.
- **Contador FPS en Tiempo Real**: Medición continua de fotogramas por segundo.
- **Auto-Limpieza por Advertencia de Memoria**: Libera memoria automáticamente si el sistema operativo envía alertas.
- **Gesto de Agitar**: Agita el dispositivo físico o pulsa `Ctrl+Cmd+Z` / `Cmd+M` para abrir el inspector.

### 📸 10. Captura de Medios Nativa y Estudio de Edición en la App
- **Captura en Dispositivo**: Captura capturas de pantalla en alta resolución, grabaciones de video MP4 y GIFs animados.
- **Galería de Medios Completa**: Explora, filtra (Fotos, Videos, GIFs), selecciona por lotes y copia rutas URI.
- **Estudio de Edición de Foto y Video**:
  - **Recorte y Redimensionado**: Recorta a proporciones estándar (Cuadrado 1:1, 4:3, 16:9) y reduce resolución para subidas ligeras.
  - **Edición de Video y Audio**: Ajusta puntos de inicio/fin, modifica velocidad de reproducción (0.5× – 2.0×) o silencia el audio.
  - **Extracción de Fotogramas**: Extrae imágenes PNG en alta definición desde cualquier video con un solo toque.
- **Marcadores de Control de Calidad (QA)**:
  - **Cuadrícula 3×3 de Instagram**: Activa líneas guía para verificar alineaciones con precisión de píxel.
  - **Insignias de Pasos Numerados**: Coloca números secuenciales (`1`, `2`, `3`...) para documentar pasos de reproducción de bugs.
  - **Etiquetas de Bugs y Notas**: Agrega sellos gráficos de errores (`🐛`), notas (`📝`) y advertencias.
  - **Texto y Marca de Agua QA**: Escribe anotaciones personalizadas y activa marcas de agua con modelo y SO del dispositivo.
- **Importador de Galería**: Importa fotos o videos de la fototeca del dispositivo para editarlos y reportarlos.

### 🎛️ 11. Botón Flotante Draggable (FAB) y Opacidad Transparente (Modo Peek)
- **Lanzador Flotante**: Burbuja deslizable a cualquier esquina con indicadores de actividad y contador.
- **Zona de Cierre Inferior**: Arrastra hacia la zona inferior brillante para ocultar el botón limpiamente.
- **Modo Peek Transparente**: Ajusta la opacidad de 0.05 a 1.0 para interactuar con la app mientras monitoreas datos y tráfico.

### ☁️ 12. Gestión de Módulos con Firebase Remote Config
- **Banderas de Funcionalidad Remota**: Habilita o deshabilita pestañas del inspector en producción/pruebas desde la nube sin necesidad de actualizar la app.

### 🌍 13. 25 Idiomas Globales y Selector Interactivo en Hoja Inferior
- **25 Idiomas Soportados**: Español, Inglés, Francés, Alemán, Italiano, Portugués, Ruso, Japonés, Coreano, Chino Simplificado, Árabe, Hindi, Turco, Holandés, Polaco, Indonesio, Vietnamita, Bengalí, Tamil, Telugu, Maratí, Guyaratí, Canarés, Malabar y Panyabí.
- **Selector Modal en Hoja Inferior**: Pulsa `[ 🌐 ES ▾ ]` para abrir la hoja interactiva con banderas y búsqueda instantánea.

---

## 🔎 Sintaxis de Búsqueda Estilo DevTools

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

## 📦 Instalación

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

## 🚀 Inicio Rápido

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
