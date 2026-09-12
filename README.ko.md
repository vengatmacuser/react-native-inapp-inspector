# React Native In-App Inspector (인앱 통합 디버거 & 네트워크 로거)

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

**React Native 및 Expo** 애플리케이션을 위한 **설정이 필요 없는 올인원 인앱 디버깅 도구**입니다. 컴퓨터 데이터 케이블이나 복잡한 프록시 인증서 없이도 기기 화면에서 직접 HTTP/HTTPS 네트워크 트래픽, WebSocket 및 Socket.IO 패킷, Metro 심볼 기반 콘솔 로그, Redux 상태 변화, AsyncStorage 및 MMKV 저장소, 푸시 알림, 네이티브 하드웨어 지표, 화면 녹화 및 캡처를 실시간으로 확인할 수 있습니다.

> 🚀 **Flipper, Charles, Proxyman, Chucker의 현대적인 대체제** — PC 연결 없이 단독 테스트 빌드(APK / TestFlight) 및 실기기에서 바로 작동합니다.

<p align="center">
  <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/walkthrough.gif" alt="React Native In-App Inspector Walkthrough" width="360" style="border-radius: 20px; box-shadow: 0 12px 36px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  🎬 <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mp4">전체 시연 영상 보기 (MP4)</a></b> | <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mov">원본 MOV 파일</a></b>
</p>

---

## ⚡ 주요 기능 비교

| 기능 | **react-native-inapp-inspector** | Flipper | Charles / Proxyman | RN Debugger |
| :--- | :---: | :---: | :---: | :---: |
| **기기 단독 실행 (PC 및 케이블 불필요)** | ✅ | ❌ | ❌ | ❌ |
| **백그라운드 제로 오버헤드 (비활성 시 CPU 0%)** | ✅ | ❌ | ❌ | ❌ |
| **HTTP/HTTPS 네트워크 트래픽 (Fetch / Axios / XHR)** | ✅ | ✅ | ✅ | ✅ |
| **워터폴 시간 분석 및 P95 지표** | ✅ | ⚠️ | ⚠️ | ❌ |
| **cURL 및 Fetch 스니펫 원클릭 복사** | ✅ | ⚠️ | ⚠️ | ❌ |
| **WebSocket 및 Socket.IO 패킷 실시간 검사** | ✅ | ❌ | ⚠️ | ⚠️ |
| **저장소 실시간 편집 (AsyncStorage & MMKV)** | ✅ (CRUD 지원) | ⚠️ (읽기 전용) | ❌ | ⚠️ |
| **푸시 알림 수신 로거 (APNs, FCM, Salesforce)** | ✅ | ❌ | ❌ | ❌ |
| **Metro 소스맵 연동 줄 번호 표시 콘솔 로그** | ✅ (정확한 줄 번호) | ✅ | ❌ | ✅ |
| **Redux State 차이 비교 및 액션 타임라인** | ✅ | ⚠️ | ❌ | ✅ |
| **비정상 종료 방지 및 이동 경로 추적 (Breadcrumbs)** | ✅ | ❌ | ❌ | ❌ |
| **하드웨어 텔레메트리 (RAM, 힙 메모리, 배터리, 저장소)**| ✅ | ⚠️ | ❌ | ❌ |
| **기기 화면 녹화 및 스크린샷 캡처 (MP4 / GIF)** | ✅ | ❌ | ❌ | ❌ |
| **한국어 포함 전 세계 25개 언어 바텀시트 전환** | ✅ | ❌ (영어 전용) | ❌ | ❌ |

---

## 📦 설치 방법

```bash
npm install --save-dev react-native-inapp-inspector react-native-svg
# 또는
yarn add -D react-native-inapp-inspector react-native-svg
```

#### iOS CocoaPods 설정
```bash
cd ios && pod install && cd ..
```

### Expo 프로젝트
```bash
npx expo install react-native-inapp-inspector react-native-svg
```

---

## 🚀 빠른 시작

앱의 최상단 진입 파일(`App.tsx` 또는 `index.js`)에 추가합니다:

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

// ⚡ 컴포넌트 렌더링 전에 초기화하여 초기 요청 누락 방지
setupNetworkLogger();
setupConsoleLogger();
setupSocketLogger();

if (store) connectReduxStore(store);
connectAsyncStorage(AsyncStorage);

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YourAppRoot />

      {/* 개발 환경에서 플로팅 인스펙터 오버레이 표시 */}
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

## 🔎 DevTools 검색 문법

```text
method:POST status:200         # POST 요청 및 200 상태코드 필터링
url:api.myapp.com -analytics   # 분석 도구 도메인을 제외하고 특정 API만 검색
header:authorization           # 인증 헤더를 포함하는 요청 검색
body:"orderId"                 # 요청/응답 JSON 바디 내용 검색
page:CheckoutScreen            # React Navigation 활성 화면 기준으로 필터링
file:ProfileView.tsx           # 특정 소스 파일에서 출력된 콘솔 로그 검색
```

## 🔍 개발자 검색 키워드 (Keywords)

한국 React Native 개발자분들이 검색하기 용이하도록 정리된 핵심 검색어입니다:

* **핵심 검색어**: 리액트 네이티브 디버거, 모바일 네트워크 로거, 패킷 캡처, 인앱 디버거, 실기기 통신 모니터링, 모바일 개발 도구, 단말기 디버거.
* **대체 도구**: 플리퍼 대체 (Flipper alternative), 찰스 프록시 대체 (Charles proxy alternative), 차커 리액트 네이티브 (Chucker), 프록시맨 대체, 리액토트론 대체.
* **기능별**: 웹소켓 실시간 로거, MMKV 뷰어 및 실시간 편집, AsyncStorage 검사기, 메트로 소스맵 심볼리케이션, 기기 화면 녹화.

---

## 📄 라이선스

MIT © [vengatmacuser](LICENSE)

