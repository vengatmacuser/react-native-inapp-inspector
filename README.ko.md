<p align="center">
  <a href="https://github.com/vengatmacuser/react-native-inapp-inspector">
    <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/inapp_inspector_icon.gif" alt="React Native In-App Inspector Icon" width="120" height="120" style="border-radius: 28px; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.45);" />
  </a>
</p>

# React Native In-App Inspector (인앱 디버깅 툴킷)

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

React Native 및 Expo를 위한 **무설정 올인원 인앱 디버깅 툴킷**. HTTP/HTTPS 네트워크 트래픽 가로채기, WebSocket 및 Socket.IO 실시간 스트림, Metro 기반 소스 파일 및 정확한 라인 번호 콘솔 로그, Redux 상태 Diff, AsyncStorage 및 MMKV 스토리지, 푸시 알림, 하드웨어 성능 통계, 그리고 스튜디오 편집 기능을 갖춘 스크린샷 및 화면 녹화를 PC나 케이블 연결 없이 기기에서 직접 제공합니다.

> 🚀 **Flipper, Charles, Proxyman, Chucker를 대체하는 가볍고 현대적인 도구** — PC 프로그램이나 케이블 없이 기기 단독 및 테스트 빌드(TestFlight/APK)에서 완벽하게 작동합니다.

<p align="center">
  <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/walkthrough.gif" alt="React Native In-App Inspector Walkthrough" width="360" style="border-radius: 20px; box-shadow: 0 12px 36px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  🎬 <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mp4">전체 데모 비디오 보기 (MP4)</a></b> | <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mov">원본 MOV</a></b>
</p>

---

<table align="center" width="100%">
  <tr>
    <td align="center" style="padding: 24px; background: linear-gradient(135deg, rgba(236,72,153,0.1), rgba(99,102,241,0.1)); border-radius: 16px; border: 1px solid rgba(236,72,153,0.35);">
      <h3 align="center">💖 새벽 2시, 원인 모를 버그와 치열하게 싸워본 모든 개발자분들을 위해</h3>
      <p align="center">
        <i>“react-native-inapp-inspector를 만든 이유는 엉킨 케이블, 끊어지는 디버거 포트, 테스트 빌드에서만 발생하는 유령 버그의 고통을 누구보다 깊이 이해하기 때문입니다. 전 세계의 모든 모바일 개발자와 QA 엔지니어가 번거로운 설정 없이 자유롭고 즐겁게 디버깅할 수 있도록 수많은 밤을 새우며 열정을 쏟아부었습니다.”</i>
      </p>
      <p align="center">
        이 도구가 수많은 디버깅 시간을 절약해 주었거나, 중요한 출시 일정을 맞추는 데 도움이 되었거나, 개발 일상을 조금 더 편안하게 만들어 주었다면 — <b>프로젝트 후원을 고려해 주세요</b>. 따뜻한 커피 한 잔이나 정기 후원은 독립적인 오픈 소스를 지속하고 발전시키는 데 가장 큰 힘이 됩니다. ☕✨
      </p>
      <p align="center">
        <a href="https://github.com/sponsors/vengatmacuser">
          <img src="https://img.shields.io/badge/Sponsor%20%40vengatmacuser-GitHub%20Sponsors%EC%97%90%EC%84%9C%20%ED%9B%84%EC%9B%90%ED%95%98%EA%B8%B0-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white" alt="Sponsor on GitHub Sponsors" />
        </a>
      </p>
    </td>
  </tr>
</table>

---

## ⚡ 다른 도구와의 비교

| 기능 | **react-native-inapp-inspector** | Flipper | Charles / Proxyman | RN Debugger |
| :--- | :---: | :---: | :---: | :---: |
| **기기 단독 실행 (PC나 케이블 불필요)** | ✅ | ❌ | ❌ | ❌ |
| **비활성 상태 제로 렌더링 (백그라운드 CPU 0%)** | ✅ | ❌ | ❌ | ❌ |
| **HTTP/HTTPS 네트워크 인스펙터 (Fetch / Axios / XHR)** | ✅ | ✅ | ✅ | ✅ |
| **타이밍 워터폴 및 P95 레이턴시** | ✅ | ⚠️ | ⚠️ | ❌ |
| **cURL 및 Fetch 스니펫 원탭 즉시 복사** | ✅ | ⚠️ | ⚠️ | ❌ |
| **양방향 WebSocket 및 Socket.IO 패킷 모니터링** | ✅ | ❌ | ⚠️ | ⚠️ |
| **실시간 스토리지 편집기 (AsyncStorage & MMKV)** | ✅ (CRUD 지원) | ⚠️ (읽기 전용) | ❌ | ⚠️ |
| **푸시 알림 로거 (APNs, FCM, Salesforce)** | ✅ | ❌ | ❌ | ❌ |
| **Metro를 통한 실제 소스 코드 라인 번호 표시** | ✅ (정확한 라인) | ✅ | ❌ | ✅ |
| **Redux 상태 Diff 및 액션 타임라인** | ✅ | ⚠️ | ❌ | ✅ |
| **애널리틱스 이벤트 추적 (Firebase, Mixpanel)** | ✅ | ❌ | ❌ | ❌ |
| **크래시 방지 및 멀티 타입 브레드크럼 (Breadcrumbs)** | ✅ | ❌ | ❌ | ❌ |
| **하드웨어 원격 측정 (RAM, 힙, 저장공간, 배터리, FPS)** | ✅ | ⚠️ | ❌ | ❌ |
| **미디어 캡처 및 스튜디오 편집기 (자르기, 비디오 트리밍, 배지)** | ✅ (풀 스튜디오) | ❌ | ❌ | ❌ |
| **드래그 가능한 플로팅 FAB 및 반투명 모드 (Peek)** | ✅ (0.05 - 1.0) | ❌ | ❌ | ❌ |
| **Firebase Remote Config 기반 원격 모듈 제어** | ✅ | ❌ | ❌ | ❌ |
| **바텀 시트 선택기가 포함된 25개 언어 지원** | ✅ | ❌ (영어만 지원) | ❌ | ❌ |
| **Expo (Bare / Managed) 및 React Native CLI** | ✅ | ⚠️ | ⚠️ | ⚠️ |

---

## ✨ 핵심 기능 및 모듈

### 🌐 1. 네트워크 인스펙터 및 타이밍 워터폴
- **범용 HTTP/HTTPS 인터셉트**: `fetch`, Axios 인스턴스, `XMLHttpRequest`를 자동으로 추적합니다.
- **지연 시간 분석**: 시각적 워터폴 바, 속도 등급 분류 (빠름 `<200ms`, 보통 `200-800ms`, 느림 `>800ms`).
- **실시간 텔레메트리 바**: 성공률 (%), 평균 지연 시간 (ms), P95 지연 시간 (ms)을 상시 표시합니다.
- **페이로드 뷰어**: 포맷된 JSON 트리, Raw 데이터, 요청/응답 헤더, 쿼리 파라미터, 호출자 파일 위치.
- **원터치 내보내기**: 원탭으로 **cURL 명령어**, **Fetch 코드 스니펫**, 요약 보고서로 복사합니다.

### ⚡ 2. WebSocket 및 Socket.IO 실시간 스트림 인스펙터
- **완벽한 프로토콜 지원**: 표준 WebSocket (`ws://`, `wss://`) 및 Socket.IO (`v2`, `v3`, `v4`).
- **양방향 프레임 타임라인**: 송신(⬆️) 및 수신(⬇️) 패킷을 정밀한 타임스탬프와 함께 기록합니다.
- **다양한 프레임 유형**: 텍스트, JSON, 바이너리 크기(ArrayBuffer), Ping/Pong 하트비트 식별.
- **연결 메타데이터**: 연결 상태, 핸드셰이크 파라미터, 전송 방식(websocket/polling), 재연결 이벤트.

### 💾 3. 스토리지 관리자 (AsyncStorage & MMKV)
- **통합 스토리지 인터페이스**: `@react-native-async-storage/async-storage` 및 `react-native-mmkv` 지원.
- **인앱 실시간 CRUD**: 폰 화면에서 직접 키 검색, 생성, 수정, 삭제가 가능합니다.
- **스마트 타입 분석**: JSON 객체, 배열, 불리언, 숫자, 문자열을 자동으로 구분하여 표시합니다.

### 🔔 4. 푸시 알림 로거
- **다양한 공급자 지원**: FCM, APNs, Salesforce Marketing Cloud, OneSignal, Notifee.
- **앱 상태 추적**: 포그라운드, 백그라운드 또는 앱 종료 상태에서의 수신 여부를 판별합니다.
- **페이로드 검사**: 데이터 파라미터, 딥링크 URL, 제목, 본문, 채널 ID를 상세히 검사합니다.

### 🪵 5. 콘솔 로거 및 Metro 소스맵 심볼리케이션
- **정확한 코드 라인 번호**: `console.log`, `warn`, `error`를 가로채 Metro 번들러를 통해 실제 소스 파일과 라인 번호를 표시합니다 (`HomeScreen.tsx:42:15`).
- **인자 개별 분석**: 전달된 각 인자를 타입 정보와 함께 개별 카드로 검사합니다.
- **콜 스택 및 에러 스택**: 함수 이름, 파일 경로, Error 객체의 스택 트레이스를 구조화하여 표시합니다.
- **중복 로그 집약**: 동일한 로그가 반복 출력될 경우 `×N` 카운터로 자동 축약합니다.

### 🔄 6. Redux 상태 Diff 및 액션 타임라인
- **Redux Toolkit 완벽 연동**: Redux Store, RTK Query, `redux-persist`와 원활하게 연동됩니다.
- **액션 타임라인**: 디스패치된 액션의 순차적 기록과 실행 시간 및 페이로드를 기록합니다.
- **색상별 상태 Diff**: 상태 변경 사항을 시각적으로 강조합니다 (**초록색**: 추가, **노란색**: 수정, **빨간색**: 삭제).

### 📊 7. 애널리틱스 이벤트 트래커
- **Firebase Analytics 자동 가로채기**: `logEvent`, `logScreenView`, `setUserProperties`, `setUserId`를 자동 기록합니다.
- **플러그인 구조**: Google Analytics 4, Mixpanel, Segment, Amplitude를 쉽게 연결할 수 있습니다.
- **파라미터 검증**: 이벤트 파라미터, 사용자 속성, 타임스탬프를 실시간으로 확인합니다.

### 🛡️ 8. 크래시 방지 및 전역 오류 경계 (Error Boundary)
- **완전 격리 Micro-UI**: 인스펙터 내부의 오류가 메인 호스트 앱을 절대 다운시키지 않습니다.
- **전역 ErrorBoundary**: 처리되지 않은 React 렌더링 크래시를 포착하고 복구 인터페이스를 제공합니다.
- **브레드크럼 추적**: 오류 발생 직전의 화면 이동, 네트워크 호출, Redux 액션을 순서대로 보여줍니다.

### 📱 9. 네이티브 하드웨어, RAM 및 성능 텔레메트리
- **시스템 지표**: 전체 및 가용 RAM, 네이티브 힙 메모리, 저장공간 여유 용량, 배터리 상태, CPU 아키텍처.
- **실시간 FPS 카운터**: 디스플레이 주사율에 따른 초당 프레임 수 모니터링.
- **메모리 경고 시 자동 정리**: OS의 저메모리 경고를 수신하면 내부 로그 캐시를 자동으로 정리합니다.
- **흔들기 제스처**: 기기를 흔들거나 `Ctrl+Cmd+Z` / `Cmd+M`을 눌러 인스펙터를 엽니다.

### 📸 10. 네이티브 미디어 캡처 및 인앱 스튜디오 에디터
- **기기에서 직접 캡처**: 고해상도 스크린샷, 부드러운 MP4 화면 녹화, 애니메이션 GIF를 손쉽게 생성합니다.
- **미디어 갤러리**: 사진, 비디오, GIF를 탐색 및 필터링하고 일괄 삭제 및 URI 복사를 지원합니다.
- **사진 및 비디오 스튜디오 에디터**:
  - **자르기 및 해상도 조절**: 표준 비율(1:1 정사각형, 4:3, 16:9)로 자르고 파일 용량을 줄이기 위한 해상도 축소를 지원합니다.
  - **비디오 트리밍 및 오디오 제어**: 시작/종료 지점 조절, 재생 속도 변경(0.5× – 2.0×), 오디오 음소거.
  - **PNG 프레임 스냅샷**: 비디오 재생 중 원하는 순간을 고해상도 PNG 이미지로 즉시 추출합니다.
- **QA 결함 마킹 및 주석 도구**:
  - **인스타그램 3×3 그리드**: 픽셀 단위 레이아웃 정렬을 확인하기 위한 가이드 라인을 제공합니다.
  - **순차적 단계 번호 배지**: 재현 단계를 명확히 표시하기 위해 번호 배지(`1`, `2`, `3`...)를 터치하거나 드래그하여 배치합니다.
  - **버그 및 메모 태그**: 버그(`🐛`), 메모(`📝`), 경고 스티커를 간편하게 부착합니다.
  - **텍스트 입력 및 QA 워터마크**: 설명 텍스트를 입력하고 기기 모델과 OS 정보가 포함된 QA 워터마크를 추가합니다.
- **앨범 불러오기**: 기기 사진첩에서 기존 사진이나 동영상을 가져와 편집 및 분석을 진행할 수 있습니다.

### 🎛️ 11. 드래그 가능한 플로팅 FAB 및 반투명 모드 (Peek Mode)
- **플로팅 런처**: 화면 어디든 이동 가능한 원형 버튼으로 읽지 않은 알림 카운터를 표시합니다.
- **하단 드래그 닫기 영역**: 화면 하단의 빛나는 영역으로 드래그하여 깔끔하게 닫을 수 있습니다.
- **반투명 Peek 모드**: 투명도를 0.05부터 1.0까지 조절하여 하단 앱을 그대로 조작하면서 실시간 네트워크와 상태를 모니터링할 수 있습니다.

### ☁️ 12. Firebase Remote Config 동적 모듈 관리
- **원격 기능 플래그**: 앱을 재배포할 필요 없이 Firebase Remote Config를 통해 프로덕션이나 테스트 빌드에서 인스펙터 탭을 원격으로 켜고 끌 수 있습니다.

### 🌍 13. 25개 글로벌 언어 및 인터랙티브 바텀 시트
- **25개 지원 언어**: 한국어, 영어, 일본어, 중국어(간체/번체), 스페인어, 프랑스어, 독일어, 러시아어, 아랍어, 힌디어, 포르투갈어 등.
- **인터랙티브 바텀 시트**: 상단 헤더의 `[ 🌐 KO ▾ ]` 버튼을 눌러 국기 아이콘과 실시간 검색이 가능한 시트에서 바로 전환할 수 있습니다.

---

## 🔎 DevTools 검색 구문

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

## 📦 설치하기

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

## 🚀 빠른 시작

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
