# React Native In-App Inspector (مصحح الأخطاء وفاحص الشبكة داخل التطبيق)

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

مجموعة أدوات فحص وتصحيح أخطاء متكاملة لتطبيقات **React Native و Expo** بدون الحاجة لأي إعدادات مسبقة. تتيح لك مراقبة حركة شبكة HTTP/HTTPS، وتدفقات WebSocket و Socket.IO في الوقت الفعلي، وسجلات وحدة التحكم مع مطابقة أسطر الكود الحقيقية عبر Metro، وتغييرات حالة Redux، وتعديل تخزين AsyncStorage و MMKV المباشر، وتتبع الإشعارات، وقياس استهلاك الذاكرة والبطارية، وتسجيل الشاشة فيديو من هاتفك مباشرة ودون الحاجة لأي كابلات.

> 🚀 **البديل العصري والأخف لأدوات Flipper و Charles و Proxyman و Chucker** — يعمل بشكل مستقل على الأجهزة الحقيقية ونسخ الاختبار (APK / TestFlight) بدون برامج كمبيوتر مساعدة.

<p align="center">
  <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/walkthrough.gif" alt="React Native In-App Inspector Walkthrough" width="360" style="border-radius: 20px; box-shadow: 0 12px 36px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  🎬 <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mp4">مشاهدة الفيديو التوضيحي الكامل (MP4)</a></b> | <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mov">الملف الأصلي MOV</a></b>
</p>

---

## ⚡ مقارنة الميزات

| الميزة | **react-native-inapp-inspector** | Flipper | Charles / Proxyman | RN Debugger |
| :--- | :---: | :---: | :---: | :---: |
| **يعمل على الجهاز ذاتياً (دون كمبيوتر أو كابلات)** | ✅ | ❌ | ❌ | ❌ |
| **صفر استهلاك للخلفية (0% CPU عند الإغلاق)** | ✅ | ❌ | ❌ | ❌ |
| **فحص شبكة HTTP/HTTPS (Fetch / Axios / XHR)** | ✅ | ✅ | ✅ | ✅ |
| **مخطط الشلال الزمني وقياسات P95** | ✅ | ⚠️ | ⚠️ | ❌ |
| **نسخ فوري لأوامر cURL وأكواد Fetch** | ✅ | ⚠️ | ⚠️ | ❌ |
| **مراقبة حزم WebSocket و Socket.IO الحية** | ✅ | ❌ | ⚠️ | ⚠️ |
| **فحص وتعديل التخزين مباشرة (AsyncStorage & MMKV)** | ✅ (CRUD كامل) | ⚠️ (قراءة فقط) | ❌ | ⚠️ |
| **سجل إشعارات الدفع (APNs, FCM, Salesforce)** | ✅ | ❌ | ❌ | ❌ |
| **سجلات برقم السطر الدقيق عبر Metro** | ✅ (رقم السطر الفعلي) | ✅ | ❌ | ✅ |
| **فروقات حالة Redux وسجل الأفعال الزمني** | ✅ | ⚠️ | ❌ | ✅ |
| **حماية من الانهيار ومسار الأحداث (Breadcrumbs)** | ✅ | ❌ | ❌ | ❌ |
| **قياسات العتاد والذاكرة (RAM والبطارية والمساحة)**| ✅ | ⚠️ | ❌ | ❌ |
| **تسجيل فيديو للشاشة والتقاط صور (MP4 / GIF)** | ✅ | ❌ | ❌ | ❌ |
| **يدعم 25 لغة عالمية مع قائمة سفلية لاختيار الدولة** | ✅ | ❌ (إنجليزية فقط) | ❌ | ❌ |

---

## 📦 التثبيت

```bash
npm install --save-dev react-native-inapp-inspector react-native-svg
# أو
yarn add -D react-native-inapp-inspector react-native-svg
```

#### تثبيت مكتبات iOS عبر CocoaPods
```bash
cd ios && pod install && cd ..
```

### مشاريع Expo
```bash
npx expo install react-native-inapp-inspector react-native-svg
```

---

## 🚀 البدء السريع

في الملف الرئيسي لتطبيقك (`App.tsx` أو `index.js`):

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

// ⚡ التهيئة قبل تحميل التطبيق لتسجيل كافة الطلبات الأولية
setupNetworkLogger();
setupConsoleLogger();
setupSocketLogger();

if (store) connectReduxStore(store);
connectAsyncStorage(AsyncStorage);

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YourAppRoot />

      {/* إظهار الفاحص العائم أثناء التطوير فقط */}
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

## 🔎 صيغة البحث المتقدمة (DevTools)

```text
method:POST status:200         # تصفية طلبات POST الناجحة برمز 200
url:api.myapp.com -analytics   # البحث في واجهة التطبيق واستبعاد التتبع
header:authorization           # تصفية الطلبات المحتوية على توكن
body:"orderId"                 # البحث داخل حزم JSON
page:CheckoutScreen            # التصفية بحسب الشاشة النشطة
file:ProfileView.tsx           # البحث عن سجلات قادمة من ملف معين
```

## 🔍 كلمات البحث لمطوري الشرق الأوسط (Keywords)

مُحسّن وموجّه للمطورين في العالم العربي (الإمارات، السعودية، مصر، قطر، المغرب، وباقي الدول العربية):

* **كلمات البحث الشائعة**: فاحص الشبكة رياكت نيتف، مصحح أخطاء الموبايل، مراقب الشبكة، أدوات مطور رياكت نيتف، فاحص الشبكة المحمول، تسجيل حزم البيانات.
* **البدائل الشهيرة**: بديل فليبر (Flipper alternative)، بديل تشارلز بروكسي (Charles Proxy alternative)، شوكر رياكت نيتف (Chucker)، بديل بروكسي مان، بديل رياكتوترون.
* **المميزات الرئيسية**: فحص WebSocket مباشر، محرر MMKV و AsyncStorage، تصحيح الأخطاء عبر Metro، تصوير وتسجيل شاشة الهاتف مباشرة.

---

## 📄 الترخيص

MIT © [vengatmacuser](LICENSE)

