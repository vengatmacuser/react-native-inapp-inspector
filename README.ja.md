# React Native In-App Inspector (アプリ内総合デバッガー)

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

**React Native & Expo** のための**設定不要・完全自立型のアプリ内デバッグツールキット**。ケーブル接続やプロキシ設定不要で、HTTP/HTTPS通信、WebSocket・Socket.IO通信、Metroシンボル化されたコンソールログ、Reduxステート差分、AsyncStorage & MMKVストレージ、プッシュ通知、ネイティブハードウェア指標、画面録画・スクリーンショットを端末上で直接リアルタイム監視できます。

> 🚀 **Flipper、Charles、Proxyman、Chuckerのモダンな代替ツール** — スタンドアロン端末、テスト配信（TestFlight/APK）、実機デバッグでPCやデバッグポートなしで動作します。

<p align="center">
  <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/walkthrough.gif" alt="React Native In-App Inspector Walkthrough" width="360" style="border-radius: 20px; box-shadow: 0 12px 36px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  🎬 <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mp4">動画ウォークスルーを見る (MP4)</a></b> | <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mov">オリジナル MOV</a></b>
</p>

---

## ⚡ 主な特徴と他ツール比較

| 機能 | **react-native-inapp-inspector** | Flipper | Charles / Proxyman | RN Debugger |
| :--- | :---: | :---: | :---: | :---: |
| **端末単体で動作（PC・ケーブル不要）** | ✅ | ❌ | ❌ | ❌ |
| **非表示時ゼロ負荷（バックグラウンドCPU 0%）** | ✅ | ❌ | ❌ | ❌ |
| **HTTP/HTTPS ネットワーク監視 (Fetch / Axios / XHR)** | ✅ | ✅ | ✅ | ✅ |
| **ウォーターフォール表示 & P95 レイテンシ分析** | ✅ | ⚠️ | ⚠️ | ❌ |
| **cURL & Fetch コード即時コピー** | ✅ | ⚠️ | ⚠️ | ❌ |
| **WebSocket & Socket.IO 双方向パケット監視** | ✅ | ❌ | ⚠️ | ⚠️ |
| **ストレージ確認・リアルタイム編集 (AsyncStorage & MMKV)** | ✅ (CRUD操作) | ⚠️ (参照のみ) | ❌ | ⚠️ |
| **プッシュ通知ログ (APNs, FCM, Salesforce)** | ✅ | ❌ | ❌ | ❌ |
| **Metroソースマップによる行番号特定ログ** | ✅ (正確な行番表示) | ✅ | ❌ | ✅ |
| **Redux State差分 & Actionタイムライン** | ✅ | ⚠️ | ❌ | ✅ |
| **クラッシュ防止 & パンくずリスト (Breadcrumbs)** | ✅ | ❌ | ❌ | ❌ |
| **端末ハードウェア情報 (RAM・ヒープ・空き容量・バッテリー)** | ✅ | ⚠️ | ❌ | ❌ |
| **端末内画面録画・スクリーンショット (MP4・GIF)** | ✅ | ❌ | ❌ | ❌ |
| **日本語を含む世界25言語対応（ボトムシート切替）** | ✅ | ❌ (英語のみ) | ❌ | ❌ |

---

## 📦 インストール

### Bare React Native
```bash
npm install --save-dev react-native-inapp-inspector react-native-svg
# または
yarn add -D react-native-inapp-inspector react-native-svg
```

#### iOS CocoaPods
```bash
cd ios && pod install && cd ..
```

### Expo プロジェクト
```bash
npx expo install react-native-inapp-inspector react-native-svg
```

---

## 🚀 クイックスタート

エントリーファイル（`App.tsx` または `index.js`）で初期化します：

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

// ⚡ コンポーネント描画前に初期化（起動時リクエストも漏れなくキャプチャ）
setupNetworkLogger();
setupConsoleLogger();
setupSocketLogger();

if (store) connectReduxStore(store);
connectAsyncStorage(AsyncStorage);

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YourAppRoot />

      {/* 開発環境のみインスペクターを表示 */}
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

## 🔎 DevTools 検索構文

Chrome DevToolsスタイルの検索フィルターに対応：

```text
method:POST status:200         # POSTリクエストかつ200 OKのみ表示
url:api.myapp.com -analytics   # analyticsを除外して対象APIのみ検索
header:authorization           # 認証ヘッダー付きリクエストを検索
body:"orderId"                 # リクエスト/レスポンスJSON内を深掘り検索
page:CheckoutScreen            # 画面名（Route）でフィルタリング
file:ProfileView.tsx           # 特定のTSXファイルから出力されたログを検索
```

---

## 📱 モジュール別インポート

```typescript
import { setupNetworkLogger } from 'react-native-inapp-inspector/network';
import { setupSocketLogger } from 'react-native-inapp-inspector/socket';
import { connectAsyncStorage, connectMMKV } from 'react-native-inapp-inspector/storage';
import { autoSetupPushLogger } from 'react-native-inapp-inspector/push';
import { connectReduxStore } from 'react-native-inapp-inspector/redux';
import { ScreenCapture } from 'react-native-inapp-inspector/capture';
```

## 🔍 開発者向け検索キーワード (Search Keywords)

日本のReact Nativeエンジニアが検索しやすい関連キーワード一覧：

* **主な検索ワード**: リアクトネイティブ デバッガー, ネットワークロガー, アプリ内パケットキャプチャ, モバイル通信ログ監視, 実機通信デバッグ, 開発ツール, 端末内DevTools.
* **代替ツール**: Flipper 代替 (Flipper alternative), Charles プロキシ代替, Chucker React Native, Proxyman 代替, Reactotron 代替.
* **機能別**: WebSocket リアルタイム監視, Socket.io パケット監視, MMKV エディタ, AsyncStorage ビューアー, Redux 状態監視, プッシュ通知ログ.
* **日本市場**: 日本国内のモバイルアプリ開発、Expo / Bare React Native プロジェクトに最適化。

---

## 📄 ライセンス

MIT © [vengatmacuser](LICENSE)

