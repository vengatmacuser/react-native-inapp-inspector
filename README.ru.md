# React Native In-App Inspector (Встроенный отладчик и сниффер)

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

Универсальный **инструмент для отладки приложений React Native & Expo с нулевой конфигурацией**. Инспектируйте HTTP/HTTPS запросы, трафик WebSocket & Socket.IO, логи консоли с точным указанием строк через Metro, различия в состоянии Redux, хранилища AsyncStorage и MMKV, push-уведомления и параметры железа прямо на мобильном устройстве без проводов.

> 🚀 **Современная альтернатива Flipper, Charles и Chucker** — работает прямо на устройстве в тестовых сборках (APK / TestFlight) без необходимости подключать кабель к ПК.

<p align="center">
  <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/walkthrough.gif" alt="React Native In-App Inspector Walkthrough" width="360" style="border-radius: 20px; box-shadow: 0 12px 36px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  🎬 <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mp4">Смотреть видео демонстрации (MP4)</a></b> | <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mov">Оригинальный MOV</a></b>
</p>

---

## ⚡ Сравнение возможностей

| Возможность | **react-native-inapp-inspector** | Flipper | Charles / Proxyman | RN Debugger |
| :--- | :---: | :---: | :---: | :---: |
| **Автономно на устройстве (без ПК и кабелей)** | ✅ | ❌ | ❌ | ❌ |
| **0% нагрузки на CPU в фоновом режиме** | ✅ | ❌ | ❌ | ❌ |
| **Сниффер сети HTTP/HTTPS (Fetch / Axios / XHR)** | ✅ | ✅ | ✅ | ✅ |
| **Водопад задержек и P95 метрики** | ✅ | ⚠️ | ⚠️ | ❌ |
| **Быстрое копирование cURL и Fetch сниппетов** | ✅ | ⚠️ | ⚠️ | ❌ |
| **Пакетный монитор WebSocket & Socket.IO** | ✅ | ❌ | ⚠️ | ⚠️ |
| **Редактор хранилища на лету (AsyncStorage & MMKV)** | ✅ (CRUD) | ⚠️ (Только чтение)| ❌ | ⚠️ |
| **Логгер push-уведомлений (APNs, FCM, Salesforce)** | ✅ | ❌ | ❌ | ❌ |
| **Логи с реальными номерами строк через Metro** | ✅ (Точная строка)| ✅ | ❌ | ✅ |
| **Redux State Diff и временная шкала экшенов** | ✅ | ⚠️ | ❌ | ✅ |
| **Защита от сбоев и хлебные крошки (Breadcrumbs)** | ✅ | ❌ | ❌ | ❌ |
| **Телеметрия железа (RAM, heap, диск, батарея)** | ✅ | ⚠️ | ❌ | ❌ |
| **Запись видео экрана и скриншоты (MP4 / GIF)** | ✅ | ❌ | ❌ | ❌ |
| **25 мировых языков с выбором в Bottom Sheet** | ✅ | ❌ (Только англ.)| ❌ | ❌ |

---

## 📦 Установка

```bash
npm install --save-dev react-native-inapp-inspector react-native-svg
# или
yarn add -D react-native-inapp-inspector react-native-svg
```

#### Настройка iOS CocoaPods
```bash
cd ios && pod install && cd ..
```

### Проекты Expo
```bash
npx expo install react-native-inapp-inspector react-native-svg
```

---

## 🚀 Быстрый старт

В корневом файле (`App.tsx` или `index.js`):

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

// ⚡ Инициализация перед рендером для фиксации стартовых запросов
setupNetworkLogger();
setupConsoleLogger();
setupSocketLogger();

if (store) connectReduxStore(store);
connectAsyncStorage(AsyncStorage);

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YourAppRoot />

      {/* Оверлей инспектора только в DEV режиме */}
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

## 🔎 Синтаксис поиска DevTools

```text
method:POST status:200         # Фильтр POST запросов с кодом 200 OK
url:api.myapp.com -analytics   # Поиск по API без лишнего трекинга
header:authorization           # Запросы с токенами авторизации
body:"orderId"                 # Поиск внутри JSON тела
page:CheckoutScreen            # Фильтрация по текущему экрану
file:ProfileView.tsx           # Поиск логов из конкретного файла
```

## 🔍 Ключевые слова для поиска (Keywords)

Оптимизировано для разработчиков в России, Беларуси, Казахстане, Украине и странах СНГ:

* **Основные поисковые запросы**: Отладчик React Native, сниффер сети, логирование сети, перехватчик трафика, мобильная отладка, инспектор сети, мобильные инструменты разработчика.
* **Популярные альтернативы**: Альтернатива Flipper, альтернатива Charles Proxy, Chucker для React Native, альтернатива Proxyman, альтернатива Reactotron.
* **Ключевые возможности**: Перехват WebSocket, просмотрщик и редактор MMKV и AsyncStorage, симболикация Metro, захват видео экрана с устройства.

---

## 📄 Лицензия

MIT © [vengatmacuser](LICENSE)

