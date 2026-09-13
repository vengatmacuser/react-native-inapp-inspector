<p align="center">
  <a href="https://github.com/vengatmacuser/react-native-inapp-inspector">
    <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/inapp_inspector_icon.gif" alt="React Native In-App Inspector Icon" width="120" height="120" style="border-radius: 28px; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.45);" />
  </a>
</p>

# React Native In-App Inspector (アプリ内デバッグツールキット)

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

React Native および Expo のための**設定不要・オールインワンのアプリ内デバッグツールキット**。HTTP/HTTPS ネットワーク通信の傍受、WebSocket / Socket.IO のリアルタイムストリーム、Metro による正確な行番号付きコンソールログ、Redux 状態差分、AsyncStorage & MMKV ストレージ、プッシュ通知、端末ハードウェア統計、そしてスタジオ編集機能付きのスクリーンショット・動画録画を PC やケーブル接続なしでスマホ単体で実現します。

> 🚀 **Flipper、Charles、Proxyman、Chucker に代わる軽量でモダンな選択肢** — 実機上、TestFlight/APK 内でデスクトップアプリやケーブルなしで動作します。

<p align="center">
  <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/walkthrough.gif" alt="React Native In-App Inspector Walkthrough" width="360" style="border-radius: 20px; box-shadow: 0 12px 36px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  🎬 <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mp4">動画ウォークスルーを見る (MP4)</a></b> | <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mov">オリジナル MOV</a></b>
</p>

---

<table align="center" width="100%">
  <tr>
    <td align="center" style="padding: 24px; background: linear-gradient(135deg, rgba(236,72,153,0.1), rgba(99,102,241,0.1)); border-radius: 16px; border: 1px solid rgba(236,72,153,0.35);">
      <h3 align="center">💖 深夜2時に原因不明のバグと戦ったすべてのエンジニアへ愛を込めて</h3>
      <p align="center">
        <i>「react-native-inapp-inspector を開発したのは、絡まるUSBケーブルや突然切断されるデバッガポート、実機ビルドだけで起きる謎のエラーに悩まされる辛さを誰よりも知っているからです。世界中のすべてのモバイル開発者とQAエンジニアが、PCに縛られず自由で快適にデバッグできるように、数え切れないほどの徹夜と情熱を注ぎ込みました。」</i>
      </p>
      <p align="center">
        もしこのツールがあなたのデバッグ時間を節約し、大切なリリースを成功に導き、日々の開発体験を少しでも豊かにしたなら —— <b>ぜひ本プロジェクトへのスポンサー支援をご検討ください</b>。一杯の温かいコーヒーや温かいご支援が、今後の継続的な開発と完全無料のオープンソースを支える大きな原動力になります。☕✨
      </p>
      <p align="center">
        <a href="https://github.com/sponsors/vengatmacuser">
          <img src="https://img.shields.io/badge/Sponsor%20%40vengatmacuser-GitHub%20Sponsors%20%E3%81%A7%E6%94%AF%E6%8F%B4%E3%81%99%E3%82%8B-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white" alt="Sponsor on GitHub Sponsors" />
        </a>
      </p>
    </td>
  </tr>
</table>

---

## ⚡ 特徴と他ツールとの比較

| 機能 | **react-native-inapp-inspector** | Flipper | Charles / Proxyman | RN Debugger |
| :--- | :---: | :---: | :---: | :---: |
| **端末単体で動作 (PCやケーブル不要)** | ✅ | ❌ | ❌ | ❌ |
| **非アクティブ時ゼロ負荷 (バックグラウンドCPU 0%)** | ✅ | ❌ | ❌ | ❌ |
| **HTTP/HTTPS 通信インスペクター (Fetch / Axios / XHR)** | ✅ | ✅ | ✅ | ✅ |
| **タイミングウォーターフォール & P95 レイテンシ** | ✅ | ⚠️ | ⚠️ | ❌ |
| **cURL / Fetch コードのワンタップ即座コピー** | ✅ | ⚠️ | ⚠️ | ❌ |
| **双方向 WebSocket & Socket.IO パケット監視** | ✅ | ❌ | ⚠️ | ⚠️ |
| **ライブストレージ編集 (AsyncStorage & MMKV)** | ✅ (CRUD対応) | ⚠️ (読み取り専用) | ❌ | ⚠️ |
| **プッシュ通知ロガー (APNs, FCM, Salesforce)** | ✅ | ❌ | ❌ | ❌ |
| **Metro による正確なソースコード行番号シンボリケーション** | ✅ (正確な行番号) | ✅ | ❌ | ✅ |
| **Redux 状態 Diff & アクションタイムライン** | ✅ | ⚠️ | ❌ | ✅ |
| **アナリティクスイベント追跡 (Firebase, Mixpanel)** | ✅ | ❌ | ❌ | ❌ |
| **クラッシュ保護 & マルチタイプブレッドクラム** | ✅ | ❌ | ❌ | ❌ |
| **端末ハードウェア情報 (RAM, ヒープ, ストレージ, バッテリー, FPS)** | ✅ | ⚠️ | ❌ | ❌ |
| **メディアキャプチャ & スタジオエディター (トリミング, バッジ)** | ✅ (フルスタジオ) | ❌ | ❌ | ❌ |
| **ドラッグ可能なフローティングFAB & シースルー透過モード** | ✅ (0.05 - 1.0) | ❌ | ❌ | ❌ |
| **Firebase Remote Config によるクラウドモジュール管理** | ✅ | ❌ | ❌ | ❌ |
| **ボトムシート選択付き 25 言語対応** | ✅ | ❌ (英語のみ) | ❌ | ❌ |
| **Expo (Bare / Managed) & React Native CLI** | ✅ | ⚠️ | ⚠️ | ⚠️ |

---

## ✨ 主な機能とモジュール

### 🌐 1. ネットワークインスペクター & タイムライン・ウォーターフォール
- **万能な HTTP/HTTPS 傍受**: `fetch`、Axios（デフォルトおよび `axios.create()`）、`XMLHttpRequest` を自動追跡。
- **レイテンシの内訳**: 視覚的なウォーターフォールバーと速度判定（高速 `<200ms`、通常 `200-800ms`、低速 `>800ms`）。
- **リアルタイム統計**: 成功率 (%)、平均レイテンシ (ms)、P95 レイテンシ (ms) を常時表示。
- **ペイロード閲覧**: フォーマット済み JSON ツリー、Raw テキスト、ヘッダー、クエリパラメータ、呼び出し元ファイル。
- **ワンタップ出力**: **cURL コマンド**、**Fetch コードスニペット**、または要約レポートをワンタップでコピー。

### ⚡ 2. WebSocket & Socket.IO リアルタイムストリームインスペクター
- **全プロトコル対応**: 標準 WebSocket (`ws://`, `wss://`) および Socket.IO (`v2`, `v3`, `v4`) をサポート。
- **双方向フレーム監視**: 送信 (⬆️) と受信 (⬇️) パケットを高精度タイムスタンプ付きで記録。
- **多彩なフレームタイプ識別**: JSON テキスト、バイナリ長 (ArrayBuffer)、Ping/Pong ハートビートを識別。
- **接続詳細**: ハンドシェイクパラメータ、接続モード (websocket/polling)、再接続イベントを追跡。

### 💾 3. ストレージマネージャー (AsyncStorage & MMKV)
- **統一ストレージインターフェース**: `@react-native-async-storage/async-storage` および `react-native-mmkv` に対応。
- **アプリ内リアルタイム CRUD**: 端末上でキーの閲覧、検索、新規作成、編集、削除が可能。
- **スマート型解析**: JSON オブジェクト、配列、真偽値、数値、文字列を自動判別。

### 🔔 4. プッシュ通知ロガー
- **マルチプロバイダー対応**: FCM、APNs、Salesforce Marketing Cloud、OneSignal、Notifee の通知を捕捉。
- **アプリ状態トラッキング**: フォアグラウンド、バックグラウンド、または終了状態からの起動を判別。
- **ペイロードインスペクター**: データパラメータ、ディープリンク URL、タイトル、本文、チャンネル ID を表示。

### 🪵 5. コンソールロガー & Metro ソースマップシンボリケーション
- **正確な行番号**: `console.log`、`warn`、`error` を捕捉し、Metro バンドラーを通じてソースファイルの正確な行番号を表示 (`HomeScreen.tsx:42:15`)。
- **引数の個別展開**: 渡された各引数を個別のカードで型情報とともに表示。
- **コールスタック & エラースタック**: 関数名、ファイル名、エラーオブジェクトのスタックトレースを構造化表示。
- **重複ログの集約**: 同一ログの連続出力を `×N` で自動的に折りたたみ。

### 🔄 6. Redux 状態 Diff & アクションタイムライン
- **Redux Toolkit 対応**: Redux Store、RTK Query、`redux-persist` と完全連携。
- **アクション履歴**: ディスパッチされたアクションの時系列順表示と処理時間の計測。
- **カラーコード化 Diff**: 変更内容を視覚的にハイライト（**緑**: 追加、**黄**: 更新、**赤**: 削除）。

### 📊 7. アナリティクスイベントトラッカー
- **Firebase Analytics 自動連携**: `logEvent`、`logScreenView`、`setUserProperties`、`setUserId` を自動監視。
- **プラグイン構造**: Google Analytics 4、Mixpanel、Segment、Amplitude に容易に対応可能。
- **パラメータ検証**: イベント属性、ユーザープロパティ、タイムスタンプを即座に確認。

### 🛡️ 8. クラッシュ保護 & グローバルエラーバウンダリ
- **完全分離 Micro-UI**: インスペクター内部のエラーがホストアプリをクラッシュさせることはありません。
- **グローバル ErrorBoundary**: React の未処理レンダリングクラッシュを捕捉し、復帰ボタン付きの UI を表示。
- **ブレッドクラム追跡**: クラッシュ直前の画面遷移、通信、Redux アクションを時系列で追跡。

### 📱 9. ネイティブハードウェア、RAM & パフォーマンステレメトリ
- **低レイヤーシステム指標**: 総 RAM、空き RAM、ネイティブヒープ、空きストレージ容量、バッテリー残量・充電状態、CPU アーキテクチャ。
- **リアルタイム FPS 計測**: 画面描画の FPS をリアルタイム監視。
- **メモリ警告時の自動パージ**: OS の低メモリ警告を受け取った際に自動的に内部ログを解放。
- **端末シェイク機能**: 端末を振るか、`Ctrl+Cmd+Z` / `Cmd+M` でインスペクターの表示を切り替え。

### 📸 10. ネイティブメディアキャプチャ & アプリ内スタジオエディター
- **実機で直接キャプチャ**: 高解像度スクリーンショット、スムーズな MP4 動画録画、アニメーション GIF を作成。
- **高機能メディアギャラリー**: 写真、動画、GIF を閲覧・絞り込み、一括削除や URI コピーが可能。
- **写真 & 動画スタジオ編集**:
  - **トリミング & リサイズ**: アスペクト比 (1:1 正方形, 4:3, 16:9) に切り抜き、軽量化のための解像度縮小。
  - **動画カット & 音声制御**: 開始/終了位置のスライダー調整、再生速度変更 (0.5× – 2.0×)、音声ミュート。
  - **PNG フレーム抽出**: 動画再生中の任意の瞬間を高精細 PNG 画像としてワンタップ保存。
- **QA 障害報告 & 注釈ツール**:
  - **Instagram 3×3 グリッド**: 正確な UI アライメント確認用のグリッド線を表示。
  - **ステップ番号バッジ**: 不具合の再現手順を示す番号バッジ (`1`, `2`, `3`...) をタップまたはドラッグで配置。
  - **バグ & メモタグ**: バグ (`🐛`)、メモ (`📝`)、警告スタンプを配置。
  - **テキスト追加 & QA 透かし**: 自由な説明テキストの記入や端末型番・OS 情報付きの QA 透かし。
- **写真ライブラリ読み込み**: デバイス内の既存の写真や動画をインポートして編集・検証が可能。

### 🎛️ 11. ドラッグ可能なフローティングFAB & シースルー透過モード (Peek Mode)
- **フローティングランチャー**: 画面の隅に移動可能なアイコン。未読件数バッジ付き。
- **画面下部ドラッグ非表示**: 画面下の光るターゲットにドラッグしてスマートに非表示。
- **シースルー透過モード**: 透過度を 0.05 〜 1.0 のスライダーで調整可能。背面のアプリを操作しながらリアルタイムに通信や Redux を確認。

### ☁️ 12. Firebase Remote Config 動的モジュール管理
- **クラウド機能フラグ**: アプリを再リリースすることなく、Firebase Remote Config を使ってインスペクターの各モジュールを遠隔で ON/OFF 切替。

### 🌍 13. 25言語対応 & インタラクティブボトムシート
- **25の対応言語**: 日本語、英語、中国語（簡体字/繁体字）、韓国語、スペイン語、フランス語、ドイツ語、ロシア語、ヒンディー語、アラビア語、ポルトガル語など。
- **ボトムシート選択**: ヘッダーの `[ 🌐 JA ▾ ]` をタップして国旗付きの検索可能なシートから瞬時に切り替え。

---

## 🔎 DevTools 検索構文

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

## 📦 インストール

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

## 🚀 クイックスタート

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
