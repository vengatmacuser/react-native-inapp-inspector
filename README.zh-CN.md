# React Native In-App Inspector (应用内全功能调试器)

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
  <a href="https://www.npmjs.com/package/react-native-inapp-inspector"><img src="https://img.shields.io/npm/unpacked-size/react-native-inapp-inspector?color=10b981&label=size" alt="unpacked size" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Expo-0284c7?logo=apple&logoColor=white" alt="platform" />
  <img src="https://img.shields.io/badge/React%20Native-%E2%89%A50.60-61DAFB?logo=react&logoColor=white" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-SDK%2048%2B%20%7C%2050%2B%20%7C%2051%2B%20%7C%2052%2B-000020?logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-Strict%20Ready-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Engine-Hermes%20%7C%20JSC-9333ea" alt="Engine" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/WebSockets-ws%20%7C%20wss%20%7C%20Socket.IO-06b6d4?logo=socketdotio&logoColor=white" alt="WebSockets" />
  <img src="https://img.shields.io/badge/Storage-AsyncStorage%20%7C%20MMKV-f59e0b?logo=databricks&logoColor=white" alt="Storage" />
  <img src="https://img.shields.io/badge/Push%20Logger-APNs%20%7C%20FCM-10b981?logo=firebase&logoColor=white" alt="Push" />
  <img src="https://img.shields.io/badge/Localization-25%20Languages-ec4899" alt="Localization" />
  <img src="https://img.shields.io/badge/Screen%20Capture-Video%20%7C%20GIF%20%7C%20Screenshot-8b5cf6" alt="Screen Capture" />
  <a href="https://github.com/vengatmacuser/react-native-inapp-inspector/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" /></a>
</p>

专为 **React Native & Expo** 打造的**零配置、开箱即用的应用内全功能调试器与抓包工具**。无需连接数据线、无需配置 Charles/Proxyman 证书，直接在真机或模拟器上实时监控 HTTP/HTTPS 网络流量、WebSocket 与 Socket.IO 双向数据包、Metro 符号化控制台日志、Redux 状态树差量变动、AsyncStorage 与 MMKV 实时存储、推送通知、原生硬件运行指标，以及真机屏幕录制与截图！

> 🚀 **替代 Flipper、Charles、Proxyman 与 Chucker 的现代化轻量级利器** —— 适用于日常开发、自动化测试以及独立打包测试（APK/IPA），完全摆脱电脑数据线和代理端口的束缚。

<p align="center">
  <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/walkthrough.gif" alt="React Native In-App Inspector 演示" width="360" style="border-radius: 20px; box-shadow: 0 12px 36px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  🎬 <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mp4">查看完整演示视频 (MP4)</a></b> | <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mov">原始 MOV 格式</a></b>
</p>

---

## ⚡ 核心优势与对比

| 功能特性 | **react-native-inapp-inspector** | Flipper | Charles / Proxyman | RN Debugger |
| :--- | :---: | :---: | :---: | :---: |
| **真机独立运行（脱离电脑与数据线）** | ✅ | ❌ | ❌ | ❌ |
| **零渲染性能开销（关闭时 0% 后台 CPU 占用）** | ✅ | ❌ | ❌ | ❌ |
| **HTTP/HTTPS 网络抓包 (Fetch / Axios / XHR)** | ✅ | ✅ | ✅ | ✅ |
| **请求耗时瀑布流与 P95 性能指标** | ✅ | ⚠️ | ⚠️ | ❌ |
| **一键复制 cURL 命令行与 Fetch 代码片段** | ✅ | ⚠️ | ⚠️ | ❌ |
| **WebSocket & Socket.IO 双向消息帧监听** | ✅ | ❌ | ⚠️ | ⚠️ |
| **存储查看与实时编辑 (AsyncStorage & MMKV)** | ✅ (在线增删改查) | ⚠️ (仅只读) | ❌ | ⚠️ |
| **推送通知日志记录 (APNs, FCM, 极光, 个推)** | ✅ | ❌ | ❌ | ❌ |
| **Console 日志 + Metro 符号化源码定位** | ✅ (精准定位代码行号) | ✅ | ❌ | ✅ |
| **Redux State 树与 Action 差量对比** | ✅ | ⚠️ | ❌ | ✅ |
| **崩溃防护与多类型操作面包屑 (Breadcrumbs)** | ✅ | ❌ | ❌ | ❌ |
| **原生硬件指标 (RAM、堆内存、存储空间、电池、FPS)**| ✅ | ⚠️ | ❌ | ❌ |
| **真机媒体录屏 (高清截图、MP4 录屏、动态 GIF)** | ✅ | ❌ | ❌ | ❌ |
| **全球 25 种语言本地化支持（底部抽屉快捷切换）** | ✅ | ❌ (仅英文) | ❌ | ❌ |
| **Expo (Bare / Managed) & 纯原生 React Native** | ✅ | ⚠️ | ⚠️ | ⚠️ |

---

## ✨ 核心功能亮点

### 🌐 1. 网络请求抓包与耗时瀑布流 (Network & APIs)
- **全面拦截**：自动捕获 `fetch`、Axios（包括默认实例与 `axios.create()`）、以及底层 `XMLHttpRequest`。
- **耗时瀑布流分析**：直观比例条展示 DNS、请求建立、响应下载耗时，智能评级（极速 `<200ms`、普通 `200-800ms`、缓慢 `>800ms`）。
- **实时统计指标**：顶部常驻展示 **成功率 %**、**平均耗时 (ms)** 以及 **P95 延迟 (ms)**。
- **载荷解析**：树状高亮 JSON、Raw 原始报文、请求/响应 Headers、Query 参数以及调用来源文件。
- **一键重放**：支持一键复制为标准 **cURL 命令行** 或 **Fetch 代码片段**，方便在终端或 Postman 中重现。

### ⚡ 2. WebSocket & Socket.IO 实时通信监控
- **全协议覆盖**：支持标准 `ws://`、加密 `wss://` 以及 `Socket.IO v2 / v3 / v4`。
- **双向帧捕获时间线**：精确标注 ⬆️ 上行发送 与 ⬇️ 下行接收 数据包，附带微秒级时间戳。
- **多样帧类型识别**：自动解析文本 JSON 载荷、二进制字节长度（ArrayBuffer/Blob）以及 Ping/Pong 心跳包。
- **握手与连接生命周期**：查看连接状态、握手 Query 参数、传输模式（websocket/polling）、重连事件与断开异常。

### 💾 3. 存储实时管理 (AsyncStorage & MMKV)
- **统一存储引擎**：同时支持 `@react-native-async-storage/async-storage` 与极速键值存储 `react-native-mmkv`。
- **真机在线 CRUD**：直接在手机屏幕上浏览、检索、修改、新建或删除存储键值对。
- **智能类型识别**：自动识别并格式化显示 JSON 对象、数组、布尔值、数字与字符串。

### 🔔 4. 推送通知拦截器 (Push Notification Logger)
- **多平台适配**：自动捕获 FCM (`@react-native-firebase/messaging`)、APNs、极光推送、个推、OneSignal 与 Notifee。
- **应用运行状态跟踪**：精确区分通知是在 **前台 (Foreground)**、**后台 (Background)** 接收，还是通过点击通知从 **完全退出 (Killed)** 状态唤醒启动。
- **完整 Payload 解析**：查看附加数据参数、跳转 DeepLink、标题、内容正文与通道 ID。

### 🪵 5. 控制台日志与 Metro 源码符号化 (Console & Metro Symbolication)
- **精准源码定位**：拦截 `console.log`、`info`、`warn`、`error`，通过 Metro 符号化实时定位到工程源文件与真实行号（如 `HomeScreen.tsx:42:15`）。
- **参数单独解构**：每个入参独立卡片展示，支持展开折叠复杂数据结构。
- **调用栈与 Error 栈分析**：清晰排版 Call Stack 帧卡片（函数名、文件、行列号），捕获 Error 对象内置堆栈。
- **去重聚合**：自动折叠重复输出并标记频次计数（`×N`），避免日志轰炸。

### 🔄 6. Redux 状态与 Action 变动差量 (Redux Inspector)
- **Redux Toolkit 完美集成**：无缝连接 Redux Store、RTK Query 与 `redux-persist`。
- **Action 时间线**：按触发顺序排布 Action，记录每次派发耗时与 Payload 载荷。
- **深度状态 Diff 对比**：清晰标明变动项（**绿色**代表新增，**黄色**代表更新，**红色**代表移除）。

### 🛡️ 7. 全局异常捕获与微架构防崩 (Crash Protection)
- **微 UI 容错隔离**：调试器运行在完全隔离的环境中，即便调试器内部发生意外也绝对不会影响宿主应用。
- **全局 ErrorBoundary**：优雅捕获未处理的 React 渲染崩溃并提供一键恢复交互。
- **操作面包屑追溯**：记录崩溃发生前用户的页面跳转、最近网络请求与 Redux Action，助力秒级排查线上 Bug。

### 📱 8. 原生硬件、内存与 FPS 监控 (Hardware Telemetry)
- **低层原生指标**：手机总运行内存、可用空闲内存、原生堆分配、存储剩余空间、电池电量与充电状态、CPU 架构。
- **实时刷新率监控**：真实测量屏幕渲染 FPS。
- **内存警告自适应清理**：接收系统低内存广播时自动释放缓存记录，确保宿主应用平稳运行。
- **摇一摇唤出**：支持摇晃手机物理设备或按下 `Ctrl+Cmd+Z` / `Cmd+M` 切换调试器显隐。

### 📸 9. 原生媒体捕获套件 (截图 / 录屏 / GIF)
- **无状态栏裁剪高清截图**：一键生成当前界面的高保真全屏截图。
- **手机端屏幕录制**：直接录制操作视频（MP4），支持带麦克风语音讲解。
- **动态 GIF 生成**：将操作复现步骤录制并导出为轻量动图，方便粘贴到 Issue 或需求评审单中。

### 🌍 10. 全球 25 种语言与底部抽屉交互
- **25 种语言本地化**：简体中文 (`zh`)、繁体中文 (`zh-TW`)、英语、日语、韩语、西班牙语、法语、德语、俄语、印地语等。
- **现代化底部抽屉**：点击顶部工具栏 `[ 🌐 中文 ▾ ]` 即可滑出抽屉，支持横向国家徽章筛选与模糊搜索，点击即时生效并持久化记忆。

---

## 🔎 DevTools 高级搜索语法

顶部搜索框支持类似 Chrome DevTools 的复合多维过滤：

```text
# 筛选 POST 请求且状态码为 200
method:POST status:200

# 仅查看 myapp.com 接口，过滤掉埋点与三方请求
url:api.myapp.com -analytics -facebook

# 按 Header 请求头筛选
header:authorization

# 在请求体或响应体 JSON 中搜索关键字段
body:"orderId"

# 按当前所在页面路由名称筛选
page:CheckoutScreen

# 搜索特定 TSX 文件中打印的日志
file:ProfileView.tsx

# 使用负向减号排除干扰项
-healthcheck -socket.io
```

---

## 📦 快速安装

### 纯原生 React Native 工程
```bash
npm install --save-dev react-native-inapp-inspector react-native-svg
# 或使用 yarn
yarn add -D react-native-inapp-inspector react-native-svg
# 或使用 pnpm
pnpm add -D react-native-inapp-inspector react-native-svg
```

#### iOS CocoaPods 安装
```bash
cd ios && pod install && cd ..
```

### Expo 工程
```bash
npx expo install react-native-inapp-inspector react-native-svg
```
*(完全适配 Expo SDK 48 至 52+ 的 Expo Go 与 Prebuild 原生模式)*

---

## 🚀 极简集成（1分钟上手）

在应用入口根组件（如 `App.tsx` 或 `index.js`）中引入：

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
import { store } from './src/store'; // 你的 Redux Store

// ⚡ 建议在根组件挂载前初始化，确保初始化阶段的请求与日志也能完整捕获
setupNetworkLogger();
setupConsoleLogger();
setupSocketLogger();

if (store) {
  connectReduxStore(store);
}
connectAsyncStorage(AsyncStorage);

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* 你的业务组件与页面 */}
      <YourAppRoot />

      {/* 仅在开发环境显示悬浮调试器 */}
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

## 💡 典型场景与进阶用法

### 1. 拦截 WebSocket / Socket.IO 通信
```typescript
import { setupSocketLogger, recordSocketFrame } from 'react-native-inapp-inspector/socket';

// 开启全局 WebSocket 自动拦截
setupSocketLogger();

// 手动录入自定义消息帧：
recordSocketFrame(connectionId, {
  direction: 'in', // 'in' | 'out'
  type: 'json',
  data: { event: 'PAYMENT_SUCCESS', orderId: '20260912' },
});
```

### 2. 调试 AsyncStorage 与 MMKV 本地存储
```typescript
// 连接 AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectAsyncStorage } from 'react-native-inapp-inspector/storage';

connectAsyncStorage(AsyncStorage);

// 连接 MMKV
import { MMKV } from 'react-native-mmkv';
import { connectMMKV } from 'react-native-inapp-inspector/storage';

export const storage = new MMKV();
connectMMKV(storage, 'default');
```

### 3. 拦截与测试推送通知
```typescript
import { autoSetupPushLogger, recordPushNotification } from 'react-native-inapp-inspector/push';

// 自动连接支持的推送 SDK
autoSetupPushLogger();

// 手动记录推送通知
recordPushNotification({
  title: '双十一特惠提醒',
  body: '您关注的商品降价啦，速来抢购！',
  source: 'fcm',
  appState: 'foreground',
  data: { skuId: '10086', deepLink: 'myapp://product/10086' },
});
```

### 4. 屏幕截图与录屏 API
```typescript
import { ScreenCapture } from 'react-native-inapp-inspector/capture';

// 真机截图
const screenshot = await ScreenCapture.takeScreenshot({ format: 'png' });
console.log('截图文件路径:', screenshot.uri);

// 开始录制视频
await ScreenCapture.startRecording({
  audioSource: 'mic', // 'mic' | 'app' | 'none'
  format: 'mp4',
});

// 结束录制
const video = await ScreenCapture.stopRecording();
console.log('录屏文件生成:', video.uri, video.duration);
```

### 5. 多语言编程控制接口
```typescript
import { setLanguage, getLanguage } from 'react-native-inapp-inspector';

// 切换为简体中文
setLanguage('zh');

console.log('当前语言:', getLanguage());
```

---

## 📱 模块化轻量导入 (Tree-shaking)

若你的应用仅需要部分功能，可按需导入子模块以最小化包体积：

```typescript
import { setupNetworkLogger } from 'react-native-inapp-inspector/network';
import { setupSocketLogger } from 'react-native-inapp-inspector/socket';
import { connectAsyncStorage, connectMMKV } from 'react-native-inapp-inspector/storage';
import { autoSetupPushLogger } from 'react-native-inapp-inspector/push';
import { connectReduxStore, inspectorReduxMiddleware } from 'react-native-inapp-inspector/redux';
import { setupConsoleLogger } from 'react-native-inapp-inspector/console';
import { ScreenCapture } from 'react-native-inapp-inspector/capture';
```

---

## 📚 常用 API 清单

| API 名称 | 类型 | 功能说明 |
| :--- | :--- | :--- |
| `<NetworkInspector />` | 组件 | 应用内悬浮调试球及主交互弹窗。 |
| `setupNetworkLogger()` | 方法 | 拦截全局 `fetch`、Axios 及 XMLHttpRequest。 |
| `setupConsoleLogger()` | 方法 | 拦截 `console.log/warn/error` 并通过 Metro 自动解析源码行列号。 |
| `setupSocketLogger()` | 方法 | 自动拦截 WebSocket 及 Socket.IO 双向消息流。 |
| `connectReduxStore(store)` | 方法 | 连接 Redux Store，开启 Action 时间线与 State 树差量对比。 |
| `connectAsyncStorage(storage)` | 方法 | 连接 AsyncStorage 并在 Storage 选项卡中开启实时编辑。 |
| `connectMMKV(instance, id?)` | 方法 | 连接 MMKV 并在 Storage 选项卡中开启实时编辑。 |
| `autoSetupPushLogger()` | 方法 | 自动监听并记录接收到的推送通知。 |
| `ScreenCapture` | 对象 | 提供真机截图、视频录屏及 GIF 导出的完整原生 API。 |
| `getNativeDeviceMetrics()` | 方法 | 获取手机运行内存、堆分配、磁盘剩余、电池状态等低层指标。 |
| `setupGlobalCrashHandler()` | 方法 | 捕获全局未处理的 JS 异常并串联前序用户操作面包屑。 |
| `setLanguage(code)` | 方法 | 动态设置调试器语种（支持全球 25 种主流语言）。 |

---

## 🤝 参与贡献

欢迎社区贡献！如有 Bug 反馈或新功能想法，欢迎查阅 [CONTRIBUTING.md](CONTRIBUTING.md) 并提交 Issue 或 Pull Request。

---

## 💖 支持与赞助

`react-native-inapp-inspector` 是由作者在业余时间维护的开源免费项目。如果它为您和团队节省了宝贵的排查时间，欢迎在 GitHub 上点亮一个小星星 ⭐️，或通过 GitHub Sponsors 给予赞助支持！

👉 **[在 GitHub Sponsors 上赞助作者 @vengatmacuser](https://github.com/sponsors/vengatmacuser)**

---

## 🔍 中文与全球搜索关键词 (Keywords)

为了方便中文开发者在百度、Google、GitHub 及 npm 快速检索到本工具，本项目针对常见开发痛点整理了高频搜索词：

* **核心痛点检索**：React Native 抓包工具、移动端免电脑抓包、真机抓包、APP 请求监听、网络监控面板、移动端控制台、React Native 调试器、前端移动端 DevTools、接口报错定位。
* **替代工具检索**：Flipper 替代方案 (Flipper alternative)、Charles 替代、Chucker React Native 版、Proxyman 替代、Whistle 替代、Reactotron 替代。
* **协议与存储**：WebSocket 实时抓包、Socket.io 帧监听、MMKV 可视化编辑器、AsyncStorage 数据查看、Redux 状态时间旅行、Firebase 埋点事件追踪。
* **地区生态**：中国大陆 (China)、台湾 (Taiwan)、香港 (Hong Kong)、新加坡 (Singapore) 开发者常用移动端联调利器。

---

## 📄 开源协议

本项目基于 [MIT License](./LICENSE) 协议开源。
