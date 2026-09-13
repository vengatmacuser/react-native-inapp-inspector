<p align="center">
  <a href="https://github.com/vengatmacuser/react-native-inapp-inspector">
    <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/inapp_inspector_icon.gif" alt="React Native In-App Inspector Icon" width="120" height="120" style="border-radius: 28px; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.45);" />
  </a>
</p>

# React Native In-App Inspector (أداة فحص وتصحيح الأخطاء داخل التطبيق)

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
  <a href="https://github.com/sponsors/vengatmacuser"><img src="https://img.shields.io/badge/sponsor-GitHub%20Sponsors-ea4aaa?logo=githubsponsors&logoColor=white" alt="sponsor" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Expo-0284c7?logo=apple&logoColor=white" alt="platform" />
  <img src="https://img.shields.io/badge/React%20Native-%E2%89%A50.60-61DAFB?logo=react&logoColor=white" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-SDK%2048%2B%20%7C%2050%2B%20%7C%2051%2B%20%7C%2052%2B-000020?logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-Strict%20Ready-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Engine-Hermes%20%7C%20JSC-9333ea" alt="Engine" />
</p>

**مجموعة أدوات فحص وتصحيح الأخطاء الشاملة داخل التطبيق وبدون أي إعدادات مسبقة لتطبيقات React Native و Expo**. تتبع حركة مرور شبكة HTTP/HTTPS، وتدفقات WebSocket و Socket.IO اللحظية، وسجلات وحدة التحكم مع أرقام الأسطر الدقيقة عبر Metro، وفروقات حالة Redux، والتخزين الحي لـ AsyncStorage و MMKV، والإشعارات اللحظية، ومؤشرات أداء العتاد، والتقاط لقطات الشاشة أو تسجيلات الفيديو مع استوديو تحرير متكامل مباشرة على هاتفك وبدون أي كابلات.

> 🚀 **البديل الحديث وخفيف الوزن لأدوات Flipper و Charles و Proxyman و Chucker** — يعمل بشكل مستقل تماماً على الجهاز، وفي إصدارات الاختبار (APK/TestFlight) وبدون الحاجة لربط الجهاز بالكمبيوتر عبر كابل.

<p align="center">
  <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/walkthrough.gif" alt="React Native In-App Inspector Walkthrough" width="360" style="border-radius: 20px; box-shadow: 0 12px 36px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  🎬 <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mp4">مشاهدة فيديو العرض التوضيحي الكامل (MP4)</a></b> | <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mov">ملف MOV الأصلي</a></b>
</p>

---

<table align="center" width="100%">
  <tr>
    <td align="center" style="padding: 24px; background: linear-gradient(135deg, rgba(236,72,153,0.1), rgba(99,102,241,0.1)); border-radius: 16px; border: 1px solid rgba(236,72,153,0.35);">
      <h3 align="center">💖 صُنع بحب لكل مبرمج سهر حتى الثانية صباحاً يطارد خطأً برمجياً غامضاً</h3>
      <p align="center">
        <i>«قمنا بابتكار react-native-inapp-inspector لأننا ندرك تماماً معاناة الكابلات المتشابكة، والمنافذ المعطلة، والانهيارات المفاجئة في نسخ الاختبار. لقد سكبنا ليالي لا تحصى من العمل المتواصل وشغفاً لا ينتهي حتى يتمكن كل مهندس تطبيقات ومختبر جودة في العالم من تصحيح الأخطاء بحرية وسلاسة تامة.»</i>
      </p>
      <p align="center">
        إذا كانت هذه الأداة قد وفرت عليك ساعات من الإحباط والجهد، أو ساعدتك في إطلاق تطبيقك في الموعد المحدد — <b>فنرجو منك التكرم برعاية ودعم هذا المشروع</b>. فنجان قهوة بسيط أو رعاية شهرية يمثلان فارقاً هائلاً ويضمنان استمرار هذا العمل مفتوح المصدر ومتاحاً للجميع مجاناً. ☕✨
      </p>
      <p align="center">
        <a href="https://github.com/sponsors/vengatmacuser">
          <img src="https://img.shields.io/badge/Sponsor%20%40vengatmacuser-%D8%A7%D8%AF%D8%B9%D9%85%20%D8%A7%D9%84%D9%85%D8%B4%D8%B1%D9%88%D8%B9%20%D8%B9%D8%A8%D8%B1%20GitHub%20Sponsors-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white" alt="Sponsor on GitHub Sponsors" />
        </a>
      </p>
    </td>
  </tr>
</table>

---

## ⚡ المقارنة مع الأدوات الأخرى

| الميزة | **react-native-inapp-inspector** | Flipper | Charles / Proxyman | RN Debugger |
| :--- | :---: | :---: | :---: | :---: |
| **يعمل مستقلاً على الجهاز (بدون كمبيوتر أو كابلات)** | ✅ | ❌ | ❌ | ❌ |
| **استهلاك صفري عند الخمول (0% معالج في الخلفية)** | ✅ | ❌ | ❌ | ❌ |
| **فحص شبكة HTTP/HTTPS (Fetch / Axios / XHR)** | ✅ | ✅ | ✅ | ✅ |
| **مخطط زمن الاستجابة والنسبة المئوية P95** | ✅ | ⚠️ | ⚠️ | ❌ |
| **نسخ فوري لأوامر cURL وشفرات Fetch** | ✅ | ⚠️ | ⚠️ | ❌ |
| **مراقبة ثنائية الاتجاه لـ WebSocket و Socket.IO** | ✅ | ❌ | ⚠️ | ⚠️ |
| **محرر التخزين الحي (AsyncStorage و MMKV)** | ✅ (CRUD كامل) | ⚠️ (قراءة فقط) | ❌ | ⚠️ |
| **مسجل الإشعارات اللحظية (APNs, FCM, Salesforce)** | ✅ | ❌ | ❌ | ❌ |
| **سجلات مع أرقام الأسطر الحقيقية عبر Metro** | ✅ (السطر الدقيق) | ✅ | ❌ | ✅ |
| **فروقات حالة Redux والجدول الزمني للإجراءات** | ✅ | ⚠️ | ❌ | ✅ |
| **متتبع أحداث التحليلات (Firebase, Mixpanel)** | ✅ | ❌ | ❌ | ❌ |
| **الحماية من الانهيار ومسار التتبع (Breadcrumbs)** | ✅ | ❌ | ❌ | ❌ |
| **القياس عن بُعد للعتاد (الذاكرة، القرص، البطارية، FPS)** | ✅ | ⚠️ | ❌ | ❌ |
| **التقاط الوسائط واستوديو التحرير (قص، تقليم فيديو، شارات)** | ✅ (استوديو متكامل) | ❌ | ❌ | ❌ |
| **زر عائم قابل للسحب ووضع الشفافية (Peek Mode)** | ✅ (0.05 - 1.0) | ❌ | ❌ | ❌ |
| **إدارة الوحدات عن بعد عبر Firebase Remote Config** | ✅ | ❌ | ❌ | ❌ |
| **25 لغة مع لوحة اختيار سفلية تفاعلية (Bottom Sheet)** | ✅ | ❌ (الإنجليزية فقط) | ❌ | ❌ |
| **Expo (Bare / Managed) و React Native CLI** | ✅ | ⚠️ | ⚠️ | ⚠️ |

---

## ✨ أبرز الوحدات والمميزات

### 🌐 1. فاحص الشبكة ومخطط زمن الاستجابة التنازلي
- **اعتراض شامل لـ HTTP/HTTPS**: يدعم تلقائياً `fetch`، ومثيلات Axios، و `XMLHttpRequest`.
- **تفصيل زمن الاستجابة**: أشرطة شلالية متناسبة وتصنيف للسرعة (سريع `<200ms`، متوسط `200-800ms`، بطيء `>800ms`).
- **شريط القياس اللحظي**: نسبة النجاح (%)، متوسط زمن الاستجابة (ms)، وزمن الاستجابة P95 (ms).
- **عارض البيانات**: شجرة JSON منسقة، وعرض البيانات الخام، وترويسات الطلب والاستجابة، والمعلمات، ومصدر الاستدعاء.
- **تصدير بنقرة واحدة**: نسخ فوري كأمر **cURL**، أو شفرة **Fetch**، أو تقرير ملخص.

### ⚡ 2. فاحص تدفقات WebSocket و Socket.IO في الوقت الفعلي
- **تغطية كاملة للبروتوكولات**: دعم كامل لـ WebSocket الأصلي (`ws://`, `wss://`) و Socket.IO (`v2`, `v3`, `v4`).
- **جدول زمني ثنائي الاتجاه**: تتبع الحزم (⬆️ المرسلة، ⬇️ المستقبلة) مع طوابع زمنية عالية الدقة.
- **تحديد أنواع الحزم**: نصوص، بيانات JSON، أحجام البيانات الثنائية (ArrayBuffer)، ونبضات Ping/Pong.
- **بيانات الاتصال الوصفية**: حالة الاتصال، معلمات المصافحة، نوع النقل (websocket/polling)، وأحداث إعادة الاتصال.

### 💾 3. مدير التخزين المحلي (AsyncStorage و MMKV)
- **واجهة تخزين موحدة**: دعم `@react-native-async-storage/async-storage` و `react-native-mmkv`.
- **عمليات CRUD حية داخل التطبيق**: استعراض، والبحث، وإنشاء، وتعديل، وحذف المفاتيح مباشرة من شاشة الهاتف.
- **تحليل ذكي للأنواع**: التعرف التلقائي على كائنات JSON، والمصفوفات، والقيم المنطقية، والأرقام، والنصوص.

### 🔔 4. مسجل الإشعارات اللحظية (Push Notifications)
- **دعم موفرين متعددين**: FCM، و APNs، و Salesforce Marketing Cloud، و OneSignal، و Notifee.
- **تتبع حالة التطبيق**: يحدد ما إذا تم استلام الإشعار في الواجهة (**Foreground**)، أو الخلفية (**Background**)، أو عند فتح التطبيق من حالة الإغلاق (**Killed**).
- **فحص البيانات المرفقة**: فحص المعلمات، والروابط العميقة (Deep Links)، والعناوين، والنصوص، ومعرفات القنوات.

### 🪵 5. مسجل وحدة التحكم ومطابقة خرائط المصدر (Metro Symbolication)
- **أرقام أسطر دقيقة**: يعترض `console.log` و `warn` و `error` ويعرض الملف الحقيقي ورقم السطر عبر Metro (`HomeScreen.tsx:42:15`).
- **تفصيل المعاملات**: فحص كل معامل تم تمريره على حدة مع تحديد نوعه.
- **تتبع الاستدعاءات والأخطاء**: بطاقات هيكلية لأسماء الدوال والملفات ومسارات تتبع الأخطاء.
- **تجميع التكرارات**: طي المخرجات المكررة المتتالية مع عداد (`×N`).

### 🔄 6. تتبع تغييرات حالة Redux والجدول الزمني للإجراءات
- **تكامل تام مع Redux Toolkit**: دعم Redux Store، و RTK Query، و `redux-persist`.
- **الجدول الزمني للإجراءات**: سجل زمني للإجراءات المرسلة مع مدة التنفيذ والبيانات المرفقة.
- **مقارنة مرئية ملونة للحالات**: تمييز التغييرات بالألوان (**الأخضر** للإضافة، **الأصفر** للتعديل، **الأحمر** للحذف).

### 📊 7. متتبع أحداث التحليلات (Analytics Tracker)
- **تتبع تلقائي لـ Firebase Analytics**: اعتراض تلقائي لـ `logEvent`، و `logScreenView`، و `setUserProperties`، و `setUserId`.
- **بنية معمارية قابلة للتوسع**: دعم سهل لـ Google Analytics 4 و Mixpanel و Segment و Amplitude.
- **فحص المعلمات**: استعراض معلمات الأحداث، وخصائص المستخدم، والطوابع الزمنية.

### 🛡️ 8. الحماية من الانهيار وحاجز الأخطاء الشامل (Error Boundary)
- **بيئة معزولة بالكامل**: يعمل الفاحص في بيئة معزولة تضمن عدم التسبب في انهيار التطبيق المضيف أبداً.
- **حاجز أخطاء شامل**: التقاط أخطاء العرض غير المعالجة في React مع شاشة استرداد تفاعلية.
- **مسار التتبع (Breadcrumbs)**: استعراض التنقلات السابقة وطلبات الشبكة وإجراءات Redux التي سبقت حدوث الخطأ.

### 📱 9. القياس عن بعد للأجهزة والذاكرة (RAM) ومعدل الإطارات (FPS)
- **مؤشرات النظام**: إجمالي والذاكرة المتاحة، وذاكرة التخزين المؤقت، والمساحة التخزينية الخالية، والبطارية، ومعمارية المعالج.
- **عداد FPS في الوقت الفعلي**: مراقبة مستمرة لمعدل تحديث الشاشة.
- **تنظيف تلقائي عند انخفاض الذاكرة**: تحرير السجلات المحفوظة تلقائياً عند تلقي تحذيرات النظام.
- **إيماءة الهز**: هز الجهاز الفعلي أو الضغط على `Ctrl+Cmd+Z` / `Cmd+M` لفتح الفاحص.

### 📸 10. التقاط الوسائط الأصلي واستوديو التحرير داخل التطبيق
- **التقاط مباشر على الجهاز**: إنشاء لقطات شاشة عالية الدقة، وتسجيلات فيديو MP4 سلسة، وصور GIF متحركة.
- **معرض وسائط متكامل**: تصفح، وتصفية (صور، فيديو، GIF)، وحذف مجمع، ونسخ مسارات URI.
- **استوديو تحرير الصور والفيديو**:
  - **القص وتغيير الحجم**: أبعاد قياسية (مربع 1:1، 4:3، 16:9) وتصغير الدقة لتقليل الحجم قبل الرفع.
  - **تقليم الفيديو والصوت**: ضبط نقاط البداية/النهاية، وتعديل سرعة التشغيل (0.5× – 2.0×)، أو كتم الصوت.
  - **استخراج إطارات PNG**: استخراج لقطات PNG عالية الدقة من أي فيديو بنقرة واحدة.
- **أدوات فحص الجودة والتأشير على الأخطاء**:
  - **شبكة 3×3 لضبط المحاذاة**: شبكة إرشادية لفحص دقة التصميم بالبكسل.
  - **شارات خطوات مرقمة**: وضع شارات مرقمة (`1`، `2`، `3`...) لتوثيق خطوات تكرار الخطأ.
  - **وسوم للأخطاء والملاحظات**: إضافة علامات الأخطاء (`🐛`) والملاحظات (`📝`) والتنبيهات.
  - **نصوص وعلامة مائية لـ QA**: كتابة ملاحظات توضيحية وإضافة علامة مائية بموديل الجهاز وإصدار النظام.
- **استيراد من ألبوم الصور**: استيراد صور أو مقاطع فيديو من مكتبة صور الجهاز للتحرير والفحص.

### 🎛️ 11. زر عائم قابل للسحب (FAB) ووضع الشفافية التفاعلي (Peek Mode)
- **زر تشغيل عائم**: فقاعة قابلة للسحب لأي زاوية مع مؤشر وعداد للإشعارات غير المقروءة.
- **منطقة إخفاء سفلية**: اسحب الزر نحو المنطقة المضيئة أسفل الشاشة لإخفائه بسلاسة.
- **وضع الشفافية (Peek Mode)**: تعديل الشفافية من 0.05 إلى 1.0 للتفاعل مع التطبيق أثناء مراقبة تدفق البيانات والشبكة.

### ☁️ 12. إدارة الوحدات عبر Firebase Remote Config
- **أعلام الميزات عن بُعد**: تفعيل أو تعطيل تبويبات الفاحص في بيئات الإنتاج أو الاختبار سحابياً بدون إعادة إصدار التطبيق.

### 🌍 13. دعم 25 لغة عالمية مع لوحة اختيار سفلية تفاعلية
- **25 لغة مدعومة**: العربية، الإنجليزية، الإسبانية، الفرنسية، الألمانية، الإيطالية، البرتغالية، الروسية، اليابانية، الكورية، الصينية، الهندية وغيرها.
- **لوحة اختيار سفلية**: اضغط على `[ 🌐 AR ▾ ]` في شريط الأدوات لفتح لوحة الاختيار المزودة بالأعلام والبحث الفوري.

---

## 🔎 صيغ البحث المتقدمة في DevTools

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

## 📦 التثبيت

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

## 🚀 البدء السريع

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
