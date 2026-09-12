# React Native In-App Inspector (Inspetor e Depurador no App)

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

O **conjunto completo de ferramentas de depuração in-app para React Native & Expo sem necessidade de configuração**. Inspecione tráfego de rede HTTP/HTTPS, conexões WebSocket & Socket.IO em tempo real, logs do console com número exato de linha via Metro, diferenças de estado do Redux, armazenamento ao vivo de AsyncStorage e MMKV, notificações push, métricas de hardware nativo e gravação de tela diretamente no seu celular sem cabos.

> 🚀 **A alternativa moderna e leve ao Flipper, Charles e Chucker** — funciona de forma independente no aparelho, em builds de teste (APK / TestFlight) e sem portas de depuração abertas.

<p align="center">
  <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/walkthrough.gif" alt="React Native In-App Inspector Walkthrough" width="360" style="border-radius: 20px; box-shadow: 0 12px 36px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  🎬 <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mp4">Assistir ao Vídeo de Demonstração (MP4)</a></b> | <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mov">MOV Original</a></b>
</p>

---

## ⚡ Comparativo de Recursos

| Recurso | **react-native-inapp-inspector** | Flipper | Charles / Proxyman | RN Debugger |
| :--- | :---: | :---: | :---: | :---: |
| **Executa no dispositivo (sem PC ou cabos)** | ✅ | ❌ | ❌ | ❌ |
| **0% de uso de CPU em segundo plano** | ✅ | ❌ | ❌ | ❌ |
| **Inspetor de rede HTTP/HTTPS (Fetch / Axios / XHR)** | ✅ | ✅ | ✅ | ✅ |
| **Gráfico cascata de tempo e métricas P95** | ✅ | ⚠️ | ⚠️ | ❌ |
| **Cópia instantânea de cURL e Fetch** | ✅ | ⚠️ | ⚠️ | ❌ |
| **Monitor de pacotes WebSocket & Socket.IO** | ✅ | ❌ | ⚠️ | ⚠️ |
| **Editor de armazenamento ao vivo (AsyncStorage & MMKV)** | ✅ (CRUD) | ⚠️ (Apenas leitura)| ❌ | ⚠️ |
| **Histórico de notificações push (APNs, FCM)** | ✅ | ❌ | ❌ | ❌ |
| **Logs com linha e arquivo reais via Metro** | ✅ (Linha exata) | ✅ | ❌ | ✅ |
| **Diferenças de estado Redux e linha do tempo** | ✅ | ⚠️ | ❌ | ✅ |
| **Proteção contra crash e rastreamento (Breadcrumbs)**| ✅ | ❌ | ❌ | ❌ |
| **Telemetria de hardware (RAM, heap, disco, bateria)**| ✅ | ⚠️ | ❌ | ❌ |
| **Gravação de tela e captura de tela (MP4 / GIF)** | ✅ | ❌ | ❌ | ❌ |
| **25 idiomas globais com seletor Bottom Sheet** | ✅ | ❌ (Apenas inglês)| ❌ | ❌ |

---

## 📦 Instalação

```bash
npm install --save-dev react-native-inapp-inspector react-native-svg
# ou
yarn add -D react-native-inapp-inspector react-native-svg
```

#### Instalação iOS CocoaPods
```bash
cd ios && pod install && cd ..
```

### Projetos Expo
```bash
npx expo install react-native-inapp-inspector react-native-svg
```

---

## 🚀 Como Usar

No arquivo inicial da sua aplicação (`App.tsx` ou `index.js`):

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

// ⚡ Inicialize os registradores antes da renderização da interface
setupNetworkLogger();
setupConsoleLogger();
setupSocketLogger();

if (store) connectReduxStore(store);
connectAsyncStorage(AsyncStorage);

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YourAppRoot />

      {/* Exibe o inspetor flutuante apenas em desenvolvimento */}
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

## 🔎 Sintaxe de Busca DevTools

```text
method:POST status:200         # Filtra requisições POST com status 200 OK
url:api.minhaapp.com -analytics# Busca sua API e descarta analytics
header:authorization           # Filtra requisições com tokens de autorização
body:"orderId"                 # Busca em profundidade no JSON
page:CheckoutScreen            # Filtra por tela ativa do React Navigation
file:ProfileView.tsx           # Filtra logs pelo arquivo de origem
```

## 🔍 Palavras-Chave de Busca (Keywords)

Otimizado para desenvolvedores no Brasil, Portugal e países de língua portuguesa:

* **Termos de busca comuns**: Depurador React Native, inspetor de rede móvel, ferramentas dev, depurador React Native Brasil, captura de pacotes, monitor de rede mobile, depuração no celular.
* **Alternativas populares**: Alternativa ao Flipper, alternativa ao Charles Proxy, Chucker para React Native, alternativa ao Proxyman, alternativa ao Reactotron.
* **Recursos essenciais**: Leitor e editor de MMKV e AsyncStorage, interceptador WebSocket, symbolication de Metro sourcemaps, gravação de tela integrada.

---

## 📄 Licença

MIT © [vengatmacuser](LICENSE)

