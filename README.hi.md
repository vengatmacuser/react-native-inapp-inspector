# React Native In-App Inspector (ऐप-इन डिबगर और नेटवर्क लॉगर)

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

**React Native और Expo** के लिए एक **शून्य-कॉन्फ़िगरेशन, स्टैंडअलोन इन-ऐप डिबगिंग टूलकिट**। बिना किसी कंप्यूटर केबल या प्रॉक्सी सेटअप के सीधे अपने मोबाइल डिवाइस पर HTTP/HTTPS नेटवर्क अनुरोध, WebSocket और Socket.IO पैकेट, Metro सिम्बॉलिकेटेड कंसोल लॉग्स, Redux स्टेट बदलाव, AsyncStorage और MMKV स्टोरेज, पुश नोटिफिकेशन और हार्डवेयर मेट्रिक्स का लाइव निरीक्षण करें।

> 🚀 **Flipper, Charles, और Chucker का आधुनिक विकल्प** — बिना डेस्कटॉप ऐप या केबल के स्टैंडअलोन टेस्ट बिल्ड (APK / TestFlight) और डिवाइस पर काम करता है।

<p align="center">
  <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/walkthrough.gif" alt="React Native In-App Inspector Walkthrough" width="360" style="border-radius: 20px; box-shadow: 0 12px 36px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  🎬 <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mp4">पूरा वीडियो वॉकथ्रू देखें (MP4)</a></b> | <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mov">मूल MOV</a></b>
</p>

---

## ⚡ प्रमुख विशेषताएं और तुलना

| क्षमता | **react-native-inapp-inspector** | Flipper | Charles / Proxyman | RN Debugger |
| :--- | :---: | :---: | :---: | :---: |
| **डिवाइस पर स्टैंडअलोन (कंप्यूटर की आवश्यकता नहीं)** | ✅ | ❌ | ❌ | ❌ |
| **जीरो-रेंडर निष्क्रिय मोड (0% बैकग्राउंड ओवरहेड)** | ✅ | ❌ | ❌ | ❌ |
| **HTTP/HTTPS नेटवर्क मॉनिटर (Fetch / Axios / XHR)** | ✅ | ✅ | ✅ | ✅ |
| **टाइमिंग वॉटरफॉल और P95 लेटेंसी** | ✅ | ⚠️ | ⚠️ | ❌ |
| **cURL और Fetch कोड तुरंत कॉपी करें** | ✅ | ⚠️ | ⚠️ | ❌ |
| **WebSocket और Socket.IO पैकेट इंस्पेक्टर** | ✅ | ❌ | ⚠️ | ⚠️ |
| **स्टोरेज इंस्पेक्टर और एडिटर (AsyncStorage और MMKV)** | ✅ (CRUD) | ⚠️ (केवल पढ़ें) | ❌ | ⚠️ |
| **पुश नोटिफिकेशन लॉगर (APNs, FCM, Salesforce)** | ✅ | ❌ | ❌ | ❌ |
| **Metro द्वारा सटीक लाइन नंबर कंसोल लॉग्स** | ✅ (सटीक फ़ाइल:लाइन) | ✅ | ❌ | ✅ |
| **Redux स्टेट डिफ और एक्शन टाइमलाइन** | ✅ | ⚠️ | ❌ | ✅ |
| **क्रैश गार्ड और मल्टी-टाइप ब्रेडक्रंब्स** | ✅ | ❌ | ❌ | ❌ |
| **नेटिव हार्डवेयर (RAM, हीप, स्टोरेज, बैटरी, FPS)** | ✅ | ⚠️ | ❌ | ❌ |
| **स्क्रीन रिकॉर्डिंग और स्क्रीनशॉट (MP4 / GIF)** | ✅ | ❌ | ❌ | ❌ |
| **हिन्दी और भारतीय भाषाओं सहित 25 भाषाएं** | ✅ | ❌ (केवल अंग्रेजी) | ❌ | ❌ |

---

## 📦 इंस्टॉलेशन

```bash
npm install --save-dev react-native-inapp-inspector react-native-svg
# या
yarn add -D react-native-inapp-inspector react-native-svg
```

#### iOS CocoaPods
```bash
cd ios && pod install && cd ..
```

### Expo प्रोजेक्ट्स
```bash
npx expo install react-native-inapp-inspector react-native-svg
```

---

## 🚀 त्वरित सेटअप

अपनी ऐप के मुख्य घटक (`App.tsx` या `index.js`) में जोड़ें:

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

// ⚡ ऐप माउंट होने से पहले लॉगर प्रारंभ करें
setupNetworkLogger();
setupConsoleLogger();
setupSocketLogger();

if (store) connectReduxStore(store);
connectAsyncStorage(AsyncStorage);

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YourAppRoot />

      {/* केवल डेवलपमेंट में इंस्पेक्टर ओवरले दिखाएं */}
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

## 🔎 DevTools सर्च सिंटैक्स

```text
method:POST status:200         # POST और 200 OK अनुरोध फ़िल्टर करें
url:api.myapp.com -analytics   # analytics को छोड़कर केवल myapp API खोजें
header:authorization           # ऑथराइजेशन टोकन वाले अनुरोध खोजें
body:"orderId"                 # JSON बॉडी के अंदर गहराई से खोजें
page:CheckoutScreen            # React Navigation स्क्रीन नाम से फ़िल्टर करें
file:ProfileView.tsx           # विशिष्ट TSX फ़ाइल से लॉग खोजें
```

## 🔍 भारतीय डेवलपर्स और क्षेत्रीय भाषाओं के लिए कीवर्ड (Keywords)

भारत और दक्षिण एशिया के डेवलपर्स के लिए सर्च अनुकूलित:

* **हिंदी एवं क्षेत्रीय भाषाएँ**: नेटवर्क-लॉगर, मोबाइल डिबगिंग टूल, इन-ऐप इंस्पेक्टर, வலைப்பின்னல் பதிவர் (Tamil), நெட்வொர்க் இன்ஸ்பெக்டர், నెట్‌వర్క్ లాగర్ (Telugu), ನೆಟ್‌ವರ್ಕ್ ಲಾಗರ್ (Kannada), നെറ്റ്‌വർക്ക് ലോഗർ (Malayalam), নেটওয়ার্ক লগার (Bengali), नेटवर्क लॉगर मराठी (Marathi).
* **प्रमुख टेक हब**: React Native Bengaluru, Hyderabad, Pune, Delhi NCR, Chennai, Mumbai developers.
* **वैकल्पिक टूल्स**: Flipper alternative India, Charles proxy alternative, Chucker for React Native, Proxyman alternative, Reactotron alternative.

---

## 📄 लाइसेंस

MIT © [vengatmacuser](LICENSE)

