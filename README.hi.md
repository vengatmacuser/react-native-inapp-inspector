<p align="center">
  <a href="https://github.com/vengatmacuser/react-native-inapp-inspector">
    <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/inapp_inspector_icon.gif" alt="React Native In-App Inspector Icon" width="120" height="120" style="border-radius: 28px; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.45);" />
  </a>
</p>

# React Native In-App Inspector (इन-ऐप डीबगिंग टूलकिट)

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

React Native और Expo के लिए **ऑल-इन-वन और ज़ीरो-कॉन्फ़िग इन-ऐप डीबगिंग टूलकिट**। HTTP/HTTPS नेटवर्क ट्रैफ़िक, WebSocket और Socket.IO लाइव स्ट्रीम, Metro द्वारा सटीक लाइन नंबर कंसोल लॉग्स, Redux स्टेट डिफ्स, AsyncStorage और MMKV स्टोरेज, पुश नोटिफिकेशन्स, नेटिव हार्डवेयर मेट्रिक्स और फोटो/वीडियो एडिटिंग स्टूडियो सहित स्क्रीनशॉट/स्क्रीन रिकॉर्डिंग सीधे मोबाइल पर बिना किसी केबल के देखें।

> 🚀 **Flipper, Charles, Proxyman और Chucker का आधुनिक और हल्का विकल्प** — सीधे डिवाइस पर, टेस्ट बिल्ड्स में और बिना पीसी कनेक्ट किए स्टैंडअलोन चलता है।

<p align="center">
  <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/walkthrough.gif" alt="React Native In-App Inspector Walkthrough" width="360" style="border-radius: 20px; box-shadow: 0 12px 36px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  🎬 <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mp4">पूरा वीडियो वॉकथ्रू देखें (MP4)</a></b> | <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mov">मूल MOV फ़ाइल</a></b>
</p>

---

<table align="center" width="100%">
  <tr>
    <td align="center" style="padding: 24px; background: linear-gradient(135deg, rgba(236,72,153,0.1), rgba(99,102,241,0.1)); border-radius: 16px; border: 1px solid rgba(236,72,153,0.35);">
      <h3 align="center">💖 हर उस डेवलपर के लिए दिल से बनाया गया, जिसने रात के 2 बजे किसी रहस्यमयी बग को खोजा है</h3>
      <p align="center">
        <i>“हमने react-native-inapp-inspector इसलिए बनाया क्योंकि हम उलझी हुई USB केबल्स, टूटे हुए डीबगर पोर्ट्स और टेस्ट बिल्ड्स में आने वाले अनजान क्रैश के दर्द को बहुत अच्छी तरह समझते हैं। हमने अनगिनत रातों की कड़ी मेहनत और पूरा दिल इसमें लगाया है ताकि दुनिया का हर मोबाइल इंजीनियर और QA टेस्टर बिना किसी रुकावट के खुलकर और आसानी से डीबग कर सके।”</i>
      </p>
      <p align="center">
        यदि इस टूल ने आपका घंटों का समय और तनाव बचाया है, किसी महत्वपूर्ण रिलीज़ को समय पर पूरा करने में मदद की है — तो <b>कृपया इस ओपन-सोर्स यात्रा का समर्थन करने पर विचार करें</b>। आपकी एक छोटी सी कॉफ़ी या मासिक प्रायोजन (Sponsorship) हमारे लिए बहुत मायने रखती है और इस प्रोजेक्ट को हमेशा बेहतर बनाए रखने की ऊर्जा देती है। ☕✨
      </p>
      <p align="center">
        <a href="https://github.com/sponsors/vengatmacuser">
          <img src="https://img.shields.io/badge/Sponsor%20%40vengatmacuser-GitHub%20Sponsors%20%E0%A4%AA%E0%A4%B0%20%E0%A4%B8%E0%A5%8D%E0%A4%AA%E0%A5%89%E0%A4%A8%E0%A5%8D%E0%A4%B8%E0%A4%B0%20%E0%A4%95%E0%A4%B0%E0%A5%87%E0%A4%82-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white" alt="Sponsor on GitHub Sponsors" />
        </a>
      </p>
    </td>
  </tr>
</table>

---

## ⚡ विशेषताएं और अन्य टूल्स से तुलना

| क्षमता | **react-native-inapp-inspector** | Flipper | Charles / Proxyman | RN Debugger |
| :--- | :---: | :---: | :---: | :---: |
| **डिवाइस पर स्टैंडअलोन (कंप्यूटर/केबल की जरूरत नहीं)** | ✅ | ❌ | ❌ | ❌ |
| **जीरो-रेंडर निष्क्रिय मोड (0% बैकग्राउंड ओवरहेड)** | ✅ | ❌ | ❌ | ❌ |
| **HTTP/HTTPS नेटवर्क मॉनिटर (Fetch / Axios / XHR)** | ✅ | ✅ | ✅ | ✅ |
| **टाइमिंग वॉटरफॉल और P95 लेटेंसी** | ✅ | ⚠️ | ⚠️ | ❌ |
| **cURL और Fetch कोड तुरंत कॉपी करें** | ✅ | ⚠️ | ⚠️ | ❌ |
| **WebSocket और Socket.IO पैकेट इंस्पेक्टर** | ✅ | ❌ | ⚠️ | ⚠️ |
| **स्टोरेज इंस्पेक्टर और लाइव एडिटर (AsyncStorage और MMKV)** | ✅ (CRUD) | ⚠️ (केवल पढ़ें) | ❌ | ⚠️ |
| **पुश नोटिफिकेशन लॉगर (APNs, FCM, Salesforce)** | ✅ | ❌ | ❌ | ❌ |
| **Metro द्वारा सटीक लाइन नंबर कंसोल लॉग्स** | ✅ (सटीक फ़ाइल:लाइन) | ✅ | ❌ | ✅ |
| **Redux स्टेट डिफ और एक्शन टाइमलाइन** | ✅ | ⚠️ | ❌ | ✅ |
| **एनालिटिक्स इवेंट ट्रैकर (Firebase, Mixpanel)** | ✅ | ❌ | ❌ | ❌ |
| **क्रैश गार्ड और मल्टी-टाइप ब्रेडक्रंब्स** | ✅ | ❌ | ❌ | ❌ |
| **नेटिव हार्डवेयर (RAM, हीप, स्टोरेज, बैटरी, FPS)** | ✅ | ⚠️ | ❌ | ❌ |
| **मीडिया कैप्चर और स्टूडियो एडिटर (क्रॉप, ट्रिम, बैज)** | ✅ (फुल स्टूडियो) | ❌ | ❌ | ❌ |
| **ड्रैग करने योग्य FAB और पीक-थ्रू ओपेसिटी मोड** | ✅ (0.05 - 1.0) | ❌ | ❌ | ❌ |
| **Firebase Remote Config द्वारा रिमोट मॉड्यूल टॉगल** | ✅ | ❌ | ❌ | ❌ |
| **हिन्दी सहित 25 भाषाएं (बॉटम शीट पिकर के साथ)** | ✅ | ❌ (केवल अंग्रेजी) | ❌ | ❌ |
| **Expo (Bare / Managed) और React Native CLI** | ✅ | ⚠️ | ⚠️ | ⚠️ |

---

## ✨ मुख्य मॉड्यूल और क्षमताएं

### 🌐 1. नेटवर्क इंस्पेक्टर और टाइमिंग वॉटरफॉल
- **यूनिवर्सल HTTP/HTTPS इंटरसेप्शन**: `fetch`, Axios और `XMLHttpRequest` के साथ स्वचालित रूप से कार्य करता है।
- **लेटेंसी वॉटरफॉल**: आनुपातिक टाइमिंग बार, स्पीड ग्रेडिंग (तेज़ `<200ms`, मध्यम `200-800ms`, धीमा `>800ms`)।
- **टेलीमेट्री बार**: वास्तविक समय में सफलता दर (%), औसत लेटेंसी (ms) और P95 लेटेंसी (ms)।
- **पेलोड व्यूअर**: फॉर्मेट किया गया JSON ट्री, रॉ डेटा, हेडर, क्वेरी पैरामीटर और कॉलर फाइल।
- **त्वरित एक्सपोर्ट**: एक टैप में **cURL कमांड**, **Fetch स्निपेट** या सारांश रिपोर्ट कॉपी करें।

### ⚡ 2. WebSocket और Socket.IO रियल-टाइम स्ट्रीम इंस्पेक्टर
- **पूर्ण प्रोटोकॉल कवरेज**: नेटिव WebSocket (`ws://`, `wss://`) और Socket.IO (`v2`, `v3`, `v4`) को ट्रैक करता है।
- **लाइव फ्रेम टाइमलाइन**: दोनों दिशाओं के पैकेट (⬆️ भेजा गया, ⬇️ प्राप्त हुआ) सटीक समय के साथ।
- **फ्रेम प्रकार पहचान**: टेक्स्ट, JSON पेलोड, बाइनरी डेटा (ArrayBuffer) और Ping/Pong हार्टबीट।
- **हैंडशेक और मेटाडेटा**: कनेक्शन स्थिति, ट्रांसपोर्ट प्रकार (websocket/polling) और पुनः कनेक्शन घटनाएं।

### 💾 3. स्टोरेज मैनेजर (AsyncStorage और MMKV)
- **एकीकृत स्टोरेज इंटरफ़ेस**: `@react-native-async-storage/async-storage` और `react-native-mmkv` दोनों के लिए।
- **लाइव इन-ऐप CRUD**: सीधे फोन स्क्रीन से कीज़ पढ़ें, खोजें, नई बनाएं, एडिट करें या डिलीट करें।
- **स्मार्ट टाइप पार्सिंग**: JSON ऑब्जेक्ट्स, एरेज़, बूलियन, संख्या और स्ट्रिंग्स को पहचानता है।

### 🔔 4. पुश नोटिफिकेशन लॉगर
- **मल्टी-प्रोवाइडर सपोर्ट**: FCM, APNs, Salesforce Marketing Cloud, OneSignal और Notifee के नोटिफिकेशन्स।
- **ऐप स्थिति ट्रैकिंग**: पहचानता है कि नोटिफिकेशन फोरग्राउंड, बैकग्राउंड या किल्ड अवस्था में आया।
- **पेलोड विवरण**: डेटा पैरामीटर्स, डीप-लिंक, शीर्षक, संदेश और चैनल आईडी देखें।

### 🪵 5. कंसोल लॉगर और Metro सोर्स-मैप सिम्बॉलिकेशन
- **सटीक लाइन नंबर**: `console.log`, `warn` और `error` को इंटरसेप्ट करके Metro बंडलर के जरिए प्रोजेक्ट की वास्तविक फाइल और लाइन नंबर दिखाता है (`HomeScreen.tsx:42:15`)।
- **पैरामीटर ब्रेकडाउन**: प्रत्येक पास किए गए आर्गुमेंट को अलग-अलग प्रकार के साथ जांचें।
- **कॉल स्टैक और एरर स्टैक**: फंक्शन नाम, फाइल, लाइन और एरर ट्री का संरचित दृश्य।
- **डुप्लिकेट कोलाप्सिंग**: बार-बार आने वाले लॉग्स को एक साथ गिनकर (`×N`) दिखाता है।

### 🔄 6. Redux स्टेट डिफ्स और एक्शन टाइमलाइन
- **Redux Toolkit एकीकरण**: Redux Store, RTK Query और `redux-persist` के साथ सहज रूप से कार्य करता है।
- **एक्शन टाइमलाइन**: डिस्पैच किए गए एक्शन्स का क्रमानुसार विवरण और समय।
- **कलर-कोडेड स्टेट डिफ्स**: बदलावों को रंगों से पहचानें (**हरा** जोड़ने के लिए, **पीला** बदलने के लिए, **लाल** हटाने के लिए)।

### 📊 7. एनालिटिक्स इवेंट ट्रैकर
- **Firebase Analytics ऑटो-हुक**: `logEvent`, `logScreenView`, `setUserProperties` और `setUserId` को स्वचालित रूप से कैप्चर करता है।
- **प्लगइन आर्किटेक्चर**: Google Analytics 4, Mixpanel, Segment और Amplitude को आसानी से जोड़ें।
- **पैरामीटर और टाइमलाइन**: इवेंट पैरामीटर्स, यूजर प्रॉपर्टीज और टाइमस्टैम्प्स की समीक्षा करें।

### 🛡️ 8. क्रैश प्रोटेक्शन और ग्लोबल एरर बाउंड्री
- **सुरक्षित माइक्रो-UI**: इंस्पेक्टर का अपना वातावरण पूरी तरह अलग है, यह होस्ट ऐप को क्रैश नहीं होने देता।
- **ग्लोबल एरर बाउंड्री**: अनहैंडल्ड जावास्क्रिप्ट रेंडरिंग क्रैश को पकड़कर रिकवरी स्क्रीन दिखाता है।
- **ब्रेडक्रंब्स टाइमलाइन**: क्रैश होने से ठीक पहले के यूजर नेविगेशन, नेटवर्क कॉल्स और Redux एक्शन्स दिखाता है।

### 📱 9. नेटिव हार्डवेयर, RAM और परफॉर्मेंस टेलीमेट्री
- **सिस्टम मेट्रिक्स**: कुल RAM, उपलब्ध फ्री RAM, नेटिव हीप, फ्री स्टोरेज, बैटरी % और CPU आर्किटेक्चर।
- **लाइव FPS काउंटर**: स्क्रीन रिफ्रेश रेट की निरंतर निगरानी।
- **मेमोरी वार्निंग ऑटो-प्रूनिंग**: कम मेमोरी का अलर्ट मिलने पर स्वतः इन-मेमोरी लॉग्स साफ़ करता है।
- **शेक जेस्चर**: डिवाइस को हिलाकर या `Ctrl+Cmd+Z` / `Cmd+M` दबाकर इंस्पेक्टर खोलें या बंद करें।

### 📸 10. नेटिव मीडिया कैप्चर और इन-ऐप स्टूडियो एडिटर
- **डिवाइस पर कैप्चर**: हाई-रेज़ोल्यूशन स्क्रीनशॉट, स्मूथ MP4 वीडियो रिकॉर्डिंग या एनिमेटेड GIF बनाएं।
- **फुल मीडिया गैलरी**: मीडिया देखें, फ़िल्टर करें (फोटो/वीडियो/GIF), बैच सेलेक्ट करें और URI कॉपी करें।
- **फोटो और वीडियो एडिटिंग स्टूडियो**:
  - **क्रॉप और रीसाइज़**: स्टैंडर्ड रेशियो (1:1, 4:3, 16:9) में क्रॉप करें और अपलोड हल्का करने के लिए रीसाइज़ करें।
  - **वीडियो ट्रिमिंग और ऑडियो**: शुरू और अंत का समय सेट करें, प्लेबैक स्पीड बदलें (0.5× – 2.0×) या ऑडियो म्यूट करें।
  - **PNG फ्रेम स्नैपशॉट**: वीडियो चलाते समय किसी भी पल का हाई-रेज़ोल्यूशन PNG फ्रेम एक्सट्रैक्ट करें।
- **QA एनोटेशन और बग मार्किंग**:
  - **इंस्टाग्राम 3×3 ग्रिडलाइन्स**: पिक्सेल-परफेक्ट अलाइनमेंट के लिए ग्रिड ओवरले चालू करें।
  - **स्टेप नंबरिंग बैज**: रीप्रोडक्शन स्टेप्स दिखाने के लिए नंबर वाले बैज (`1`, `2`, `3`...) लगाएं।
  - **बग और नोट टैग्स**: स्क्रीनशॉट पर बग (`🐛`), नोट (`📝`) और चेतावनी टैग जोड़ें।
  - **टेक्स्ट ओवरले और QA वॉटरमार्क**: कस्टम टेक्स्ट लिखें और डिवाइस मॉडल व OS का वॉटरमार्क जोड़ें।
- **कैमरा रोल इंपोर्टर**: डिवाइस की फोटो लाइब्रेरी से सीधे फोटो या वीडियो इंपोर्ट करके एडिट करें।

### 🎛️ 11. ड्रैग करने योग्य फ्लोटिंग FAB और पीक-थ्रू ओपेसिटी (पीक मोड)
- **फ्लोटिंग एक्शन लॉन्चर**: स्क्रीन के किसी भी कोने में ड्रैग करने योग्य बबल जिसमें अनरीड इंडिकेटर और बैज काउंटर है।
- **ड्रैग-टू-डिसमिस ज़ोन**: नीचे दिए गए डिस्मिस टारगेट पर खींचकर बटन को आसानी से छिपाएं।
- **पीक-थ्रू ट्रांसपेरेंट मोड**: 0.05 से 1.0 तक पारदर्शिता सेट करें ताकि आप नीचे की ऐप चलाते हुए भी नेटवर्क और स्टेट देख सकें।

### ☁️ 12. Firebase Remote Config मॉड्यूल प्रबंधन
- **रिमोट फीचर फ्लैग्स**: बिना नया ऐप वर्जन रिलीज़ किए Firebase Remote Config से क्लाउड द्वारा इंस्पेक्टर के टैब्स चालू या बंद करें।

### 🌍 13. 25 वैश्विक भाषाएं और इंटरएक्टिव बॉटम शीट
- **25 समर्थित भाषाएं**: हिन्दी, अंग्रेज़ी, स्पैनिश, फ़्रेंच, जर्मन, जापानी, कोरियन, चीनी, अरबी, रूसी, पुर्तगाली, तमिल, तेलुगु, मराठी, गुजराती, कन्नड़, मलयालम, पंजाबी, बंगाली आदि।
- **इंटरएक्टिव भाषा चयनकर्ता**: हेडर में `[ 🌐 HI ▾ ]` टैप करके झंडों और खोज बार के साथ बॉटम शीट खोलें।

---

## 🔎 DevTools सर्च सिंटैक्स

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

## 📦 इंस्टॉलेशन

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

## 🚀 त्वरित सेटअप

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
