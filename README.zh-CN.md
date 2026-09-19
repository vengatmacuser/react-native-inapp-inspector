<p align="center">
  <a href="https://github.com/vengatmacuser/react-native-inapp-inspector">
    <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/inapp_inspector_icon.gif" alt="React Native In-App Inspector Icon" width="120" height="120" style="border-radius: 28px; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.45);" />
  </a>
</p>

# React Native In-App Inspector (移动端应用内全功能调试器)

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

专为 React Native 与 Expo 打造的**零配置、开箱即用的全功能应用内调试套件**。在手机端直接抓取 HTTP/HTTPS 网络请求、WebSocket/Socket.IO 实时通信，查看精准到源码行号的 Console 日志、Redux 状态变动差量，实时编辑 AsyncStorage 与 MMKV 存储，捕获推送通知与系统硬件指标，更内置了专业级图像/视频编辑工作台与高清屏幕录制，无需连接电脑，脱离数据线束缚。

> 🚀 **Flipper、Charles、Proxyman 和 Chucker 的现代轻量化替代方案** — 完全独立运行于真机设备与测试构建包（TestFlight / APK），告别电脑数据线与繁琐代理配置。

<p align="center">
  <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/walkthrough.gif" alt="React Native In-App Inspector Walkthrough" width="360" style="border-radius: 20px; box-shadow: 0 12px 36px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  🎬 <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mp4">观看完整演示视频 (MP4)</a></b> | <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mov">MOV 原片</a></b>
</p>

---

<table align="center" width="100%">
  <tr>
    <td align="center" style="padding: 24px; background: linear-gradient(135deg, rgba(236,72,153,0.1), rgba(99,102,241,0.1)); border-radius: 16px; border: 1px solid rgba(236,72,153,0.35);">
      <h3 align="center">💖 献给每一位曾在深夜两点与幽灵 Bug 苦战的开发者</h3>
      <p align="center">
        <i>“开发 react-native-inapp-inspector 的初衷，是因为我们深知缠绕的手机数据线、时常断开的调试端口以及线上偶现 Bug 带来的无助与煎熬。我们倾注了无数个不眠之夜与满腔热忱，只为让全球每一位移动端工程师和测试同学，都能彻底告别束缚，享受纯粹、丝滑、优雅的真机调试体验。”</i>
      </p>
      <p align="center">
        如果这个开源工具曾为你节省过宝贵的排查时间、助你顺利按时交付版本，或者让团队的日常开发多了一份从容与舒心 —— <b>恳请您考虑赞助支持这个项目</b>。一杯暖心咖啡或一份月度赞助，都是我们持续迭代、打磨新功能并坚持完全开源的最大动力！☕✨
      </p>
      <p align="center">
        <a href="https://github.com/sponsors/vengatmacuser">
          <img src="https://img.shields.io/badge/Sponsor%20%40vengatmacuser-%E5%9C%A8%20GitHub%20Sponsors%20%E8%B5%9E%E5%8A%A9%E6%94%AF%E6%8C%81%E6%9C%AC%E9%A1%B9%E7%9B%AE-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white" alt="Sponsor on GitHub Sponsors" />
        </a>
      </p>
    </td>
  </tr>
</table>

---

## ⚡ 核心优势与竞品对比

| 能力项 | **react-native-inapp-inspector** | Flipper | Charles / Proxyman | RN Debugger |
| :--- | :---: | :---: | :---: | :---: |
| **真机独立运行（无需电脑与数据线）** | ✅ | ❌ | ❌ | ❌ |
| **空闲零渲染消耗（0% 后台 CPU 占用）** | ✅ | ❌ | ❌ | ❌ |
| **HTTP/HTTPS 网络抓包 (Fetch / Axios / XHR)** | ✅ | ✅ | ✅ | ✅ |
| **耗时瀑布流与 P95 延迟统计** | ✅ | ⚠️ | ⚠️ | ❌ |
| **cURL 与 Fetch 代码片段一键复制导出** | ✅ | ⚠️ | ⚠️ | ❌ |
| **WebSocket & Socket.IO 双向实时抓包** | ✅ | ❌ | ⚠️ | ⚠️ |
| **存储查看与实时编辑 (AsyncStorage & MMKV)** | ✅ (在线增删改查) | ⚠️ (仅只读) | ❌ | ⚠️ |
| **推送通知日志记录 (APNs, FCM, 极光, 个推)** | ✅ | ❌ | ❌ | ❌ |
| **Console 日志 + Metro 符号化源码定位** | ✅ (精准定位代码行号) | ✅ | ❌ | ✅ |
| **Redux State 树与 Action 差量对比** | ✅ | ⚠️ | ❌ | ✅ |
| **业务埋点与事件追踪 (Firebase, Mixpanel)** | ✅ | ❌ | ❌ | ❌ |
| **崩溃防护与多类型操作面包屑 (Breadcrumbs)** | ✅ | ❌ | ❌ | ❌ |
| **原生硬件指标 (RAM、堆内存、存储空间、电池、FPS)** | ✅ | ⚠️ | ❌ | ❌ |
| **媒体录屏与 In-App 编辑工坊 (裁剪, 剪辑, 标注)** | ✅ (全功能工作室) | ❌ | ❌ | ❌ |
| **可拖拽全局悬浮球与穿透半透明模式 (Peek)** | ✅ (0.05 - 1.0) | ❌ | ❌ | ❌ |
| **Firebase Remote Config 动态模块管理** | ✅ | ❌ | ❌ | ❌ |
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
- **Slice 状态树浏览**：按模块层级快速浏览全局状态树。

### 📊 7. 业务埋点与事件追踪 (Analytics Event Tracker)
- **Firebase Analytics 自动拦截**：深度集成 `@react-native-firebase/analytics`（`logEvent`、`logScreenView`、`setUserProperties`、`setUserId`）。
- **开放插件式架构**：可轻松适配自定义埋点上报 SDK（Google Analytics 4、Mixpanel、Segment、神策分析、友盟等）。
- **参数与时间线分析**：实时查看触发事件名、附带参数、用户属性与触发时间戳。

### 🛡️ 8. 全局异常捕获与微架构防崩 (Crash Protection)
- **微 UI 容错隔离**：调试器运行在完全隔离的环境中，即便调试器内部发生意外也绝对不会影响宿主应用。
- **全局 ErrorBoundary**：优雅捕获未处理的 React 渲染崩溃并提供一键恢复交互。
- **操作面包屑追溯**：记录崩溃发生前用户的页面跳转、最近网络请求与 Redux Action，助力秒级排查线上 Bug。
- **原生异常捕获**：捕获 iOS 与 Android 原生未捕获信号与异常。

### 📱 9. 原生硬件、内存与 FPS 监控 (Hardware Telemetry)
- **低层原生指标**：手机总运行内存、可用空闲内存、原生堆分配、存储剩余空间、电池电量与充电状态、CPU 架构。
- **实时刷新率监控**：真实测量屏幕渲染 FPS。
- **内存警告自适应清理**：接收系统低内存广播时自动释放缓存记录，确保宿主应用平稳运行。
- **摇一摇唤出**：支持摇晃手机物理设备或按下 `Ctrl+Cmd+Z` / `Cmd+M` 切换调试器显隐。

### 📸 10. 原生媒体捕获与 In-App 图像/视频编辑工作台 (Media Studio Editor)
- **真机设备直接捕获**：一键生成无状态栏高保真全屏截图、流畅 MP4 录屏或轻量动态 GIF。
- **全功能媒体管理画廊**：浏览、筛选（图片/视频/GIF）、批量多选、一键删除与快捷复制文件 URI。
- **图片与视频专业编辑工作台**：
  - **裁剪与分辨率缩放 (Crop & Resize)**：支持自由裁剪与常用比例（1:1 正方形、4:3、16:9），支持降采样缩放减小体积以便快速上传提交。
  - **视频精确剪辑与音频控制 (Video Trimming & Audio)**：可视化滑动调整起止裁剪时间、调节播放倍速（0.5× – 2.0×）或一键消除音轨。
  - **视频帧截图 (PNG Frame Snapshot)**：播放视频时一键提取任意时间点的高清 PNG 关键帧。
- **QA 缺陷标记与批注系统**：
  - **Instagram 3×3 九宫格辅助线**：开启辅助对齐网格，协助排查像素级 UI 布局偏差。
  - **顺序步骤指示气泡 (Step Badges)**：点击或拖拽放置数字步骤徽章（`1`, `2`, `3`...），清晰标注复现步骤。
  - **缺陷与便签标签 (Bug / Note Tags)**：随手标记彩色 Bug 缺陷（`🐛`）、便签（`📝`）与警示标记。
  - **文字覆层与设备水印 (Text Overlay & QA Watermark)**：自由输入说明文字，支持附带动态设备型号与系统版本的测试水印。
- **系统相册导入器 (Camera Roll Importer)**：支持从手机相册中导入现有图片与视频进行二次编辑与排查。

### 🎛️ 11. 可拖拽悬浮球 (FAB) 与穿透半透明模式 (Peek Mode)
- **全局可拖拽悬浮气泡**：可拖动至屏幕任意位置，支持实时未读计数与动效微章提示。
- **底部拖拽销毁区 (Drag-to-Dismiss)**：向屏幕底部拖动触发高亮销毁底栏，松手即可优雅隐藏。
- **穿透半透明调试模式 (Peek-Through Opacity)**：支持通过滑块自定义调节 0.05 – 1.0 半透明度，在半透明状态下可一边操作底层 App 一边实时观察网络请求与 Redux 数据流。

### ☁️ 12. Firebase Remote Config 动态模块管理
- **云端功能开关 (Feature Flags)**：无需发版即可在生产或灰度构建中通过 Firebase Remote Config 远程开启或关闭特定调试模块（网络抓包、Redux、Crash 监控、存储等）。

### 🌍 13. 全球 25 种语言与底部抽屉交互
- **25 种语言本地化**：简体中文 (`zh`)、繁体中文 (`zh-TW`)、英语、日语、韩语、西班牙语、法语、德语、俄语、印地语、阿拉伯语、葡萄牙语等。
- **现代化底部抽屉**：点击顶部工具栏 `[ 🌐 中文 ▾ ]` 即可滑出抽屉，支持横向国旗徽章筛选与模糊搜索，点击即时生效并持久化记忆。

---

## 🔎 DevTools 高级搜索语法

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

## 📦 快速安装

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

## 🚀 快速接入

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
