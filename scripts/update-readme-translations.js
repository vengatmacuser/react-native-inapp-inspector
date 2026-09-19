const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const translations = {
  'zh-CN': {
    title: 'React Native In-App Inspector (移动端应用内全功能调试器)',
    description: `专为 React Native 与 Expo 打造的**零配置、开箱即用的全功能应用内调试套件**。在手机端直接抓取 HTTP/HTTPS 网络请求、WebSocket/Socket.IO 实时通信，查看精准到源码行号的 Console 日志、Redux 状态变动差量，实时编辑 AsyncStorage 与 MMKV 存储，捕获推送通知与系统硬件指标，更内置了专业级图像/视频编辑工作台与高清屏幕录制，无需连接电脑，脱离数据线束缚。`,
    quote: `🚀 **Flipper、Charles、Proxyman 和 Chucker 的现代轻量化替代方案** — 完全独立运行于真机设备与测试构建包（TestFlight / APK），告别电脑数据线与繁琐代理配置。`,
    videoFull: '观看完整演示视频 (MP4)',
    videoOriginal: 'MOV 原片',
    whyTitle: '⚡ 核心优势与竞品对比',
    featuresTitle: '✨ 核心功能亮点',
    sponsorTitle: '💖 献给每一位曾在深夜两点与幽灵 Bug 苦战的开发者',
    sponsorQuote: `“开发 react-native-inapp-inspector 的初衷，是因为我们深知缠绕的手机数据线、时常断开的调试端口以及线上偶现 Bug 带来的无助与煎熬。我们倾注了无数个不眠之夜与满腔热忱，只为让全球每一位移动端工程师和测试同学，都能彻底告别束缚，享受纯粹、丝滑、优雅的真机调试体验。”`,
    sponsorBody: `如果这个开源工具曾为你节省过宝贵的排查时间、助你顺利按时交付版本，或者让团队的日常开发多了一份从容与舒心 —— <b>恳请您考虑赞助支持这个项目</b>。一杯暖心咖啡或一份月度赞助，都是我们持续迭代、打磨新功能并坚持完全开源的最大动力！☕✨`,
    sponsorButton: '💖 在 GitHub Sponsors 赞助支持本项目',
    tableHeaders: ['能力项', '**react-native-inapp-inspector**', 'Flipper', 'Charles / Proxyman', 'RN Debugger'],
    tableRows: [
      ['**真机独立运行（无需电脑与数据线）**', '✅', '❌', '❌', '❌'],
      ['**空闲零渲染消耗（0% 后台 CPU 占用）**', '✅', '❌', '❌', '❌'],
      ['**HTTP/HTTPS 网络抓包 (Fetch / Axios / XHR)**', '✅', '✅', '✅', '✅'],
      ['**耗时瀑布流与 P95 延迟统计**', '✅', '⚠️', '⚠️', '❌'],
      ['**cURL 与 Fetch 代码片段一键复制导出**', '✅', '⚠️', '⚠️', '❌'],
      ['**WebSocket & Socket.IO 双向实时抓包**', '✅', '❌', '⚠️', '⚠️'],
      ['**存储查看与实时编辑 (AsyncStorage & MMKV)**', '✅ (在线增删改查)', '⚠️ (仅只读)', '❌', '⚠️'],
      ['**推送通知日志记录 (APNs, FCM, 极光, 个推)**', '✅', '❌', '❌', '❌'],
      ['**Console 日志 + Metro 符号化源码定位**', '✅ (精准定位代码行号)', '✅', '❌', '✅'],
      ['**Redux State 树与 Action 差量对比**', '✅', '⚠️', '❌', '✅'],
      ['**业务埋点与事件追踪 (Firebase, Mixpanel)**', '✅', '❌', '❌', '❌'],
      ['**崩溃防护与多类型操作面包屑 (Breadcrumbs)**', '✅', '❌', '❌', '❌'],
      ['**原生硬件指标 (RAM、堆内存、存储空间、电池、FPS)**', '✅', '⚠️', '❌', '❌'],
      ['**媒体录屏与 In-App 编辑工坊 (裁剪, 剪辑, 标注)**', '✅ (全功能工作室)', '❌', '❌', '❌'],
      ['**可拖拽全局悬浮球与穿透半透明模式 (Peek)**', '✅ (0.05 - 1.0)', '❌', '❌', '❌'],
      ['**Firebase Remote Config 动态模块管理**', '✅', '❌', '❌', '❌'],
      ['**全球 25 种语言本地化支持（底部抽屉快捷切换）**', '✅', '❌ (仅英文)', '❌', '❌'],
      ['**Expo (Bare / Managed) & 纯原生 React Native**', '✅', '⚠️', '⚠️', '⚠️'],
    ],
    features: `### 🌐 1. 网络请求抓包与耗时瀑布流 (Network & APIs)
- **全面拦截**：自动捕获 \`fetch\`、Axios（包括默认实例与 \`axios.create()\`）、以及底层 \`XMLHttpRequest\`。
- **耗时瀑布流分析**：直观比例条展示 DNS、请求建立、响应下载耗时，智能评级（极速 \`<200ms\`、普通 \`200-800ms\`、缓慢 \`>800ms\`）。
- **实时统计指标**：顶部常驻展示 **成功率 %**、**平均耗时 (ms)** 以及 **P95 延迟 (ms)**。
- **载荷解析**：树状高亮 JSON、Raw 原始报文、请求/响应 Headers、Query 参数以及调用来源文件。
- **一键重放**：支持一键复制为标准 **cURL 命令行** 或 **Fetch 代码片段**，方便在终端或 Postman 中重现。

### ⚡ 2. WebSocket & Socket.IO 实时通信监控
- **全协议覆盖**：支持标准 \`ws://\`、加密 \`wss://\` 以及 \`Socket.IO v2 / v3 / v4\`。
- **双向帧捕获时间线**：精确标注 ⬆️ 上行发送 与 ⬇️ 下行接收 数据包，附带微秒级时间戳。
- **多样帧类型识别**：自动解析文本 JSON 载荷、二进制字节长度（ArrayBuffer/Blob）以及 Ping/Pong 心跳包。
- **握手与连接生命周期**：查看连接状态、握手 Query 参数、传输模式（websocket/polling）、重连事件与断开异常。

### 💾 3. 存储实时管理 (AsyncStorage & MMKV)
- **统一存储引擎**：同时支持 \`@react-native-async-storage/async-storage\` 与极速键值存储 \`react-native-mmkv\`。
- **真机在线 CRUD**：直接在手机屏幕上浏览、检索、修改、新建或删除存储键值对。
- **智能类型识别**：自动识别并格式化显示 JSON 对象、数组、布尔值、数字与字符串。

### 🔔 4. 推送通知拦截器 (Push Notification Logger)
- **多平台适配**：自动捕获 FCM (\`@react-native-firebase/messaging\`)、APNs、极光推送、个推、OneSignal 与 Notifee。
- **应用运行状态跟踪**：精确区分通知是在 **前台 (Foreground)**、**后台 (Background)** 接收，还是通过点击通知从 **完全退出 (Killed)** 状态唤醒启动。
- **完整 Payload 解析**：查看附加数据参数、跳转 DeepLink、标题、内容正文与通道 ID。

### 🪵 5. 控制台日志与 Metro 源码符号化 (Console & Metro Symbolication)
- **精准源码定位**：拦截 \`console.log\`、\`info\`、\`warn\`、\`error\`，通过 Metro 符号化实时定位到工程源文件与真实行号（如 \`HomeScreen.tsx:42:15\`）。
- **参数单独解构**：每个入参独立卡片展示，支持展开折叠复杂数据结构。
- **调用栈与 Error 栈分析**：清晰排版 Call Stack 帧卡片（函数名、文件、行列号），捕获 Error 对象内置堆栈。
- **去重聚合**：自动折叠重复输出并标记频次计数（\`×N\`），避免日志轰炸。

### 🔄 6. Redux 状态与 Action 变动差量 (Redux Inspector)
- **Redux Toolkit 完美集成**：无缝连接 Redux Store、RTK Query 与 \`redux-persist\`。
- **Action 时间线**：按触发顺序排布 Action，记录每次派发耗时与 Payload 载荷。
- **深度状态 Diff 对比**：清晰标明变动项（**绿色**代表新增，**黄色**代表更新，**红色**代表移除）。
- **Slice 状态树浏览**：按模块层级快速浏览全局状态树。

### 📊 7. 业务埋点与事件追踪 (Analytics Event Tracker)
- **Firebase Analytics 自动拦截**：深度集成 \`@react-native-firebase/analytics\`（\`logEvent\`、\`logScreenView\`、\`setUserProperties\`、\`setUserId\`）。
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
- **摇一摇唤出**：支持摇晃手机物理设备或按下 \`Ctrl+Cmd+Z\` / \`Cmd+M\` 切换调试器显隐。

### 📸 10. 原生媒体捕获与 In-App 图像/视频编辑工作台 (Media Studio Editor)
- **真机设备直接捕获**：一键生成无状态栏高保真全屏截图、流畅 MP4 录屏或轻量动态 GIF。
- **全功能媒体管理画廊**：浏览、筛选（图片/视频/GIF）、批量多选、一键删除与快捷复制文件 URI。
- **图片与视频专业编辑工作台**：
  - **裁剪与分辨率缩放 (Crop & Resize)**：支持自由裁剪与常用比例（1:1 正方形、4:3、16:9），支持降采样缩放减小体积以便快速上传提交。
  - **视频精确剪辑与音频控制 (Video Trimming & Audio)**：可视化滑动调整起止裁剪时间、调节播放倍速（0.5× – 2.0×）或一键消除音轨。
  - **视频帧截图 (PNG Frame Snapshot)**：播放视频时一键提取任意时间点的高清 PNG 关键帧。
- **QA 缺陷标记与批注系统**：
  - **Instagram 3×3 九宫格辅助线**：开启辅助对齐网格，协助排查像素级 UI 布局偏差。
  - **顺序步骤指示气泡 (Step Badges)**：点击或拖拽放置数字步骤徽章（\`1\`, \`2\`, \`3\`...），清晰标注复现步骤。
  - **缺陷与便签标签 (Bug / Note Tags)**：随手标记彩色 Bug 缺陷（\`🐛\`）、便签（\`📝\`）与警示标记。
  - **文字覆层与设备水印 (Text Overlay & QA Watermark)**：自由输入说明文字，支持附带动态设备型号与系统版本的测试水印。
- **系统相册导入器 (Camera Roll Importer)**：支持从手机相册中导入现有图片与视频进行二次编辑与排查。

### 🎛️ 11. 可拖拽悬浮球 (FAB) 与穿透半透明模式 (Peek Mode)
- **全局可拖拽悬浮气泡**：可拖动至屏幕任意位置，支持实时未读计数与动效微章提示。
- **底部拖拽销毁区 (Drag-to-Dismiss)**：向屏幕底部拖动触发高亮销毁底栏，松手即可优雅隐藏。
- **穿透半透明调试模式 (Peek-Through Opacity)**：支持通过滑块自定义调节 0.05 – 1.0 半透明度，在半透明状态下可一边操作底层 App 一边实时观察网络请求与 Redux 数据流。

### ☁️ 12. Firebase Remote Config 动态模块管理
- **云端功能开关 (Feature Flags)**：无需发版即可在生产或灰度构建中通过 Firebase Remote Config 远程开启或关闭特定调试模块（网络抓包、Redux、Crash 监控、存储等）。

### 🌍 13. 全球 25 种语言与底部抽屉交互
- **25 种语言本地化**：简体中文 (\`zh\`)、繁体中文 (\`zh-TW\`)、英语、日语、韩语、西班牙语、法语、德语、俄语、印地语、阿拉伯语、葡萄牙语等。
- **现代化底部抽屉**：点击顶部工具栏 \`[ 🌐 中文 ▾ ]\` 即可滑出抽屉，支持横向国旗徽章筛选与模糊搜索，点击即时生效并持久化记忆。`,
    installTitle: '📦 快速安装',
    quickstartTitle: '🚀 快速接入',
    searchTitle: '🔎 DevTools 高级搜索语法',
  },
  'es': {
    title: 'React Native In-App Inspector (Inspector de Depuración en la App)',
    description: `El **conjunto de herramientas de depuración todo en uno y sin configuración para React Native y Expo**. Inspecciona el tráfico de red HTTP/HTTPS, flujos de WebSocket y Socket.IO en tiempo real, registros de consola con número de línea exacto mediante Metro, cambios de estado en Redux, almacenamiento en vivo de AsyncStorage y MMKV, notificaciones push, métricas de hardware del dispositivo y captura de pantalla/video con estudio de edición integrado directamente en el teléfono sin cables.`,
    quote: `🚀 **La alternativa moderna y ligera a Flipper, Charles, Proxyman y Chucker** — funciona de forma autónoma en el dispositivo, en compilaciones de prueba (APK/TestFlight) y sin necesidad de conectar cables a la computadora.`,
    videoFull: 'Ver Video de Demostración Completo (MP4)',
    videoOriginal: 'MOV Original',
    whyTitle: '⚡ Comparación con Otras Herramientas',
    featuresTitle: '✨ Características y Módulos Principales',
    sponsorTitle: '💖 Hecho con Amor para Cada Desarrollador que Alguna Vez Persiguió un Bug a las 2 AM',
    sponsorQuote: `“Creamos react-native-inapp-inspector porque conocemos de primera mano el dolor de los cables enredados, los puertos de depuración caídos y los errores inexplicables en producción. Dedicamos innumerables noches de desvelo y pasión para que cada desarrollador móvil y tester del mundo pueda depurar con total libertad, fluidez y alegría.”`,
    sponsorBody: `Si esta herramienta te ahorró horas de frustración, te ayudó a lanzar una actualización a tiempo o hizo tu trabajo diario más ligero — <b>por favor considera patrocinar el proyecto</b>. Una pequeña taza de café o un patrocinio mensual marca una enorme diferencia y mantiene vivo el desarrollo de código abierto independiente. ☕✨`,
    sponsorButton: '💖 Patrocinar en GitHub Sponsors',
    tableHeaders: ['Característica', '**react-native-inapp-inspector**', 'Flipper', 'Charles / Proxyman', 'RN Debugger'],
    tableRows: [
      ['**Funciona en el dispositivo (sin PC ni cables)**', '✅', '❌', '❌', '❌'],
      ['**Cero consumo en reposo (0% CPU en segundo plano)**', '✅', '❌', '❌', '❌'],
      ['**Inspección de red HTTP/HTTPS (Fetch / Axios / XHR)**', '✅', '✅', '✅', '✅'],
      ['**Cascada de tiempos y percentil P95**', '✅', '⚠️', '⚠️', '❌'],
      ['**Copia instantánea de snippets cURL y Fetch**', '✅', '⚠️', '⚠️', '❌'],
      ['**Monitoreo de WebSocket y Socket.IO bidireccional**', '✅', '❌', '⚠️', '⚠️'],
      ['**Editor de almacenamiento en vivo (AsyncStorage y MMKV)**', '✅ (CRUD)', '⚠️ (Solo lectura)', '❌', '⚠️'],
      ['**Registro de notificaciones push (APNs, FCM, Salesforce)**', '✅', '❌', '❌', '❌'],
      ['**Logs con resolución de líneas reales con Metro**', '✅ (Línea exacta)', '✅', '❌', '✅'],
      ['**Diferencias de Redux y línea de tiempo de acciones**', '✅', '⚠️', '❌', '✅'],
      ['**Rastreador de eventos de analítica (Firebase, Mixpanel)**', '✅', '❌', '❌', '❌'],
      ['**Protección contra cierres y rastro de migas (Breadcrumbs)**', '✅', '❌', '❌', '❌'],
      ['**Telemetría de hardware (RAM, heap, disco, batería, FPS)**', '✅', '⚠️', '❌', '❌'],
      ['**Captura y edición de medios en la app (Crop, Video Trim, Badges)**', '✅ (Estudio completo)', '❌', '❌', '❌'],
      ['**Botón flotante arrastrable y modo transparente (Peek)**', '✅ (0.05 - 1.0)', '❌', '❌', '❌'],
      ['**Gestión de módulos remota vía Firebase Remote Config**', '✅', '❌', '❌', '❌'],
      ['**25 idiomas con selector en hoja inferior (Bottom Sheet)**', '✅', '❌ (Solo inglés)', '❌', '❌'],
      ['**Expo (Bare / Managed) & React Native CLI**', '✅', '⚠️', '⚠️', '⚠️'],
    ],
    features: `### 🌐 1. Inspector de Red y Cascada de Tiempos
- **Interceptación Universal HTTP/HTTPS**: Compatible automáticamente con \`fetch\`, instancias de Axios y \`XMLHttpRequest\`.
- **Desglose de Latencia**: Barras proporcionales de cascada, clasificación de velocidad (Rápido \`<200ms\`, Moderado \`200-800ms\`, Lento \`>800ms\`).
- **Barra de Telemetría**: Tasa de éxito en tiempo real (%), Latencia promedio (ms) y Latencia P95 (ms).
- **Visor de Carga Útil**: Árbol JSON formateado, vista sin formato (raw), encabezados, parámetros de consulta y origen del llamador.
- **Exportación Rápida**: Copia en un toque como comando **cURL**, fragmento **Fetch** o informe resumido.

### ⚡ 2. Inspector en Tiempo Real de WebSocket y Socket.IO
- **Cobertura Completa**: Compatible con WebSocket nativo (\`ws://\`, \`wss://\`) y Socket.IO (\`v2\`, \`v3\`, \`v4\`).
- **Línea de Tiempo Bidireccional**: Rastreo de paquetes (⬆️ Enviado, ⬇️ Recibido) con marcas de tiempo de alta precisión.
- **Detección de Tipos**: Texto, JSON, tamaño binario (ArrayBuffer) y latidos Ping/Pong.
- **Metadatos de Conexión**: Estado de conexión, parámetros de handshake, transporte (websocket/polling) y reconexiones.

### 💾 3. Gestor de Almacenamiento (AsyncStorage y MMKV)
- **Interfaz Unificada**: Visor interactivo para \`@react-native-async-storage/async-storage\` y \`react-native-mmkv\`.
- **Operaciones CRUD en Vivo**: Lee, busca, crea, edita y elimina claves de almacenamiento directamente en la pantalla.
- **Tipado Inteligente**: Distingue automáticamente objetos JSON, arreglos, booleanos, números y cadenas.

### 🔔 4. Registro de Notificaciones Push
- **Múltiples Proveedores**: Registra notificaciones de FCM, APNs, Salesforce Marketing Cloud, OneSignal y Notifee.
- **Estado de la App**: Identifica si se recibió en Primer Plano (**Foreground**), Segundo Plano (**Background**) o desde estado Cerrado (**Killed**).
- **Inspección de Payload**: Parámetros de datos, enlaces profundos (deep-links), títulos, cuerpos e IDs de canal.

### 🪵 5. Registrador de Consola y Simbolización Metro
- **Línea Exacta de Código**: Intercepta \`console.log\`, \`warn\` y \`error\`, resolviendo nombres de archivo y líneas reales mediante Metro (\`HomeScreen.tsx:42:15\`).
- **Desglose de Argumentos**: Inspecciona cada argumento de forma individual con identificación de tipo.
- **Pila de Llamadas y Errores**: Visualización estructurada de frames y trazas de error nativas.
- **Agrupación Inteligente**: Contador de repeticiones (\`×N\`) para evitar inundaciones de logs.

### 🔄 6. Diferencias de Estado y Acciones Redux
- **Integración con Redux Toolkit**: Compatible con Redux Store, RTK Query y \`redux-persist\`.
- **Línea de Tiempo de Acciones**: Registro cronológico de acciones despachadas con duración y payload.
- **Diff Visual de Estados**: Código de colores para cambios (**Verde** para adiciones, **Ámbar** para cambios, **Rojo** para eliminaciones).

### 📊 7. Rastreador de Eventos de Analítica
- **Integración con Firebase Analytics**: Intercepta automáticamente \`logEvent\`, \`logScreenView\`, \`setUserProperties\` y \`setUserId\`.
- **Arquitectura Extensible**: Compatible con Google Analytics 4, Mixpanel, Segment y Amplitude.
- **Inspección de Parámetros**: Revisa parámetros de eventos, propiedades de usuario y marcas de tiempo.

### 🛡️ 8. Protección contra Cierres y Límite de Errores Global
- **Micro-UI Aislada**: El inspector no afecta ni detiene la aplicación principal en caso de error.
- **Captura Global de Errores**: Maneja excepciones no controladas de React con opción de recuperación interactiva.
- **Rastro de Migas (Breadcrumbs)**: Rastrea navegación previa, llamadas de red y acciones Redux antes de un error.

### 📱 9. Telemetría de Hardware Nativo, RAM y Rendimiento
- **Métricas de Sistema**: Memoria RAM total y disponible, Heap nativo, espacio de disco, batería y arquitectura CPU.
- **Contador FPS en Tiempo Real**: Medición continua de fotogramas por segundo.
- **Auto-Limpieza por Advertencia de Memoria**: Libera memoria automáticamente si el sistema operativo envía alertas.
- **Gesto de Agitar**: Agita el dispositivo físico o pulsa \`Ctrl+Cmd+Z\` / \`Cmd+M\` para abrir el inspector.

### 📸 10. Captura de Medios Nativa y Estudio de Edición en la App
- **Captura en Dispositivo**: Captura capturas de pantalla en alta resolución, grabaciones de video MP4 y GIFs animados.
- **Galería de Medios Completa**: Explora, filtra (Fotos, Videos, GIFs), selecciona por lotes y copia rutas URI.
- **Estudio de Edición de Foto y Video**:
  - **Recorte y Redimensionado**: Recorta a proporciones estándar (Cuadrado 1:1, 4:3, 16:9) y reduce resolución para subidas ligeras.
  - **Edición de Video y Audio**: Ajusta puntos de inicio/fin, modifica velocidad de reproducción (0.5× – 2.0×) o silencia el audio.
  - **Extracción de Fotogramas**: Extrae imágenes PNG en alta definición desde cualquier video con un solo toque.
- **Marcadores de Control de Calidad (QA)**:
  - **Cuadrícula 3×3 de Instagram**: Activa líneas guía para verificar alineaciones con precisión de píxel.
  - **Insignias de Pasos Numerados**: Coloca números secuenciales (\`1\`, \`2\`, \`3\`...) para documentar pasos de reproducción de bugs.
  - **Etiquetas de Bugs y Notas**: Agrega sellos gráficos de errores (\`🐛\`), notas (\`📝\`) y advertencias.
  - **Texto y Marca de Agua QA**: Escribe anotaciones personalizadas y activa marcas de agua con modelo y SO del dispositivo.
- **Importador de Galería**: Importa fotos o videos de la fototeca del dispositivo para editarlos y reportarlos.

### 🎛️ 11. Botón Flotante Draggable (FAB) y Opacidad Transparente (Modo Peek)
- **Lanzador Flotante**: Burbuja deslizable a cualquier esquina con indicadores de actividad y contador.
- **Zona de Cierre Inferior**: Arrastra hacia la zona inferior brillante para ocultar el botón limpiamente.
- **Modo Peek Transparente**: Ajusta la opacidad de 0.05 a 1.0 para interactuar con la app mientras monitoreas datos y tráfico.

### ☁️ 12. Gestión de Módulos con Firebase Remote Config
- **Banderas de Funcionalidad Remota**: Habilita o deshabilita pestañas del inspector en producción/pruebas desde la nube sin necesidad de actualizar la app.

### 🌍 13. 25 Idiomas Globales y Selector Interactivo en Hoja Inferior
- **25 Idiomas Soportados**: Español, Inglés, Francés, Alemán, Italiano, Portugués, Ruso, Japonés, Coreano, Chino Simplificado, Árabe, Hindi, Turco, Holandés, Polaco, Indonesio, Vietnamita, Bengalí, Tamil, Telugu, Maratí, Guyaratí, Canarés, Malabar y Panyabí.
- **Selector Modal en Hoja Inferior**: Pulsa \`[ 🌐 ES ▾ ]\` para abrir la hoja interactiva con banderas y búsqueda instantánea.`,
    installTitle: '📦 Instalación',
    quickstartTitle: '🚀 Inicio Rápido',
    searchTitle: '🔎 Sintaxis de Búsqueda Estilo DevTools',
  },
  'hi': {
    title: 'React Native In-App Inspector (इन-ऐप डीबगिंग टूलकिट)',
    description: `React Native और Expo के लिए **ऑल-इन-वन और ज़ीरो-कॉन्फ़िग इन-ऐप डीबगिंग टूलकिट**। HTTP/HTTPS नेटवर्क ट्रैफ़िक, WebSocket और Socket.IO लाइव स्ट्रीम, Metro द्वारा सटीक लाइन नंबर कंसोल लॉग्स, Redux स्टेट डिफ्स, AsyncStorage और MMKV स्टोरेज, पुश नोटिफिकेशन्स, नेटिव हार्डवेयर मेट्रिक्स और फोटो/वीडियो एडिटिंग स्टूडियो सहित स्क्रीनशॉट/स्क्रीन रिकॉर्डिंग सीधे मोबाइल पर बिना किसी केबल के देखें।`,
    quote: `🚀 **Flipper, Charles, Proxyman और Chucker का आधुनिक और हल्का विकल्प** — सीधे डिवाइस पर, टेस्ट बिल्ड्स में और बिना पीसी कनेक्ट किए स्टैंडअलोन चलता है।`,
    videoFull: 'पूरा वीडियो वॉकथ्रू देखें (MP4)',
    videoOriginal: 'मूल MOV फ़ाइल',
    whyTitle: '⚡ विशेषताएं और अन्य टूल्स से तुलना',
    featuresTitle: '✨ मुख्य मॉड्यूल और क्षमताएं',
    sponsorTitle: '💖 हर उस डेवलपर के लिए दिल से बनाया गया, जिसने रात के 2 बजे किसी रहस्यमयी बग को खोजा है',
    sponsorQuote: `“हमने react-native-inapp-inspector इसलिए बनाया क्योंकि हम उलझी हुई USB केबल्स, टूटे हुए डीबगर पोर्ट्स और टेस्ट बिल्ड्स में आने वाले अनजान क्रैश के दर्द को बहुत अच्छी तरह समझते हैं। हमने अनगिनत रातों की कड़ी मेहनत और पूरा दिल इसमें लगाया है ताकि दुनिया का हर मोबाइल इंजीनियर और QA टेस्टर बिना किसी रुकावट के खुलकर और आसानी से डीबग कर सके।”`,
    sponsorBody: `यदि इस टूल ने आपका घंटों का समय और तनाव बचाया है, किसी महत्वपूर्ण रिलीज़ को समय पर पूरा करने में मदद की है — तो <b>कृपया इस ओपन-सोर्स यात्रा का समर्थन करने पर विचार करें</b>। आपकी एक छोटी सी कॉफ़ी या मासिक प्रायोजन (Sponsorship) हमारे लिए बहुत मायने रखती है और इस प्रोजेक्ट को हमेशा बेहतर बनाए रखने की ऊर्जा देती है। ☕✨`,
    sponsorButton: '💖 GitHub Sponsors पर स्पॉन्सर करें',
    tableHeaders: ['क्षमता', '**react-native-inapp-inspector**', 'Flipper', 'Charles / Proxyman', 'RN Debugger'],
    tableRows: [
      ['**डिवाइस पर स्टैंडअलोन (कंप्यूटर/केबल की जरूरत नहीं)**', '✅', '❌', '❌', '❌'],
      ['**जीरो-रेंडर निष्क्रिय मोड (0% बैकग्राउंड ओवरहेड)**', '✅', '❌', '❌', '❌'],
      ['**HTTP/HTTPS नेटवर्क मॉनिटर (Fetch / Axios / XHR)**', '✅', '✅', '✅', '✅'],
      ['**टाइमिंग वॉटरफॉल और P95 लेटेंसी**', '✅', '⚠️', '⚠️', '❌'],
      ['**cURL और Fetch कोड तुरंत कॉपी करें**', '✅', '⚠️', '⚠️', '❌'],
      ['**WebSocket और Socket.IO पैकेट इंस्पेक्टर**', '✅', '❌', '⚠️', '⚠️'],
      ['**स्टोरेज इंस्पेक्टर और लाइव एडिटर (AsyncStorage और MMKV)**', '✅ (CRUD)', '⚠️ (केवल पढ़ें)', '❌', '⚠️'],
      ['**पुश नोटिफिकेशन लॉगर (APNs, FCM, Salesforce)**', '✅', '❌', '❌', '❌'],
      ['**Metro द्वारा सटीक लाइन नंबर कंसोल लॉग्स**', '✅ (सटीक फ़ाइल:लाइन)', '✅', '❌', '✅'],
      ['**Redux स्टेट डिफ और एक्शन टाइमलाइन**', '✅', '⚠️', '❌', '✅'],
      ['**एनालिटिक्स इवेंट ट्रैकर (Firebase, Mixpanel)**', '✅', '❌', '❌', '❌'],
      ['**क्रैश गार्ड और मल्टी-टाइप ब्रेडक्रंब्स**', '✅', '❌', '❌', '❌'],
      ['**नेटिव हार्डवेयर (RAM, हीप, स्टोरेज, बैटरी, FPS)**', '✅', '⚠️', '❌', '❌'],
      ['**मीडिया कैप्चर और स्टूडियो एडिटर (क्रॉप, ट्रिम, बैज)**', '✅ (फुल स्टूडियो)', '❌', '❌', '❌'],
      ['**ड्रैग करने योग्य FAB और पीक-थ्रू ओपेसिटी मोड**', '✅ (0.05 - 1.0)', '❌', '❌', '❌'],
      ['**Firebase Remote Config द्वारा रिमोट मॉड्यूल टॉगल**', '✅', '❌', '❌', '❌'],
      ['**हिन्दी सहित 25 भाषाएं (बॉटम शीट पिकर के साथ)**', '✅', '❌ (केवल अंग्रेजी)', '❌', '❌'],
      ['**Expo (Bare / Managed) और React Native CLI**', '✅', '⚠️', '⚠️', '⚠️'],
    ],
    features: `### 🌐 1. नेटवर्क इंस्पेक्टर और टाइमिंग वॉटरफॉल
- **यूनिवर्सल HTTP/HTTPS इंटरसेप्शन**: \`fetch\`, Axios और \`XMLHttpRequest\` के साथ स्वचालित रूप से कार्य करता है।
- **लेटेंसी वॉटरफॉल**: आनुपातिक टाइमिंग बार, स्पीड ग्रेडिंग (तेज़ \`<200ms\`, मध्यम \`200-800ms\`, धीमा \`>800ms\`)।
- **टेलीमेट्री बार**: वास्तविक समय में सफलता दर (%), औसत लेटेंसी (ms) और P95 लेटेंसी (ms)।
- **पेलोड व्यूअर**: फॉर्मेट किया गया JSON ट्री, रॉ डेटा, हेडर, क्वेरी पैरामीटर और कॉलर फाइल।
- **त्वरित एक्सपोर्ट**: एक टैप में **cURL कमांड**, **Fetch स्निपेट** या सारांश रिपोर्ट कॉपी करें।

### ⚡ 2. WebSocket और Socket.IO रियल-टाइम स्ट्रीम इंस्पेक्टर
- **पूर्ण प्रोटोकॉल कवरेज**: नेटिव WebSocket (\`ws://\`, \`wss://\`) और Socket.IO (\`v2\`, \`v3\`, \`v4\`) को ट्रैक करता है।
- **लाइव फ्रेम टाइमलाइन**: दोनों दिशाओं के पैकेट (⬆️ भेजा गया, ⬇️ प्राप्त हुआ) सटीक समय के साथ।
- **फ्रेम प्रकार पहचान**: टेक्स्ट, JSON पेलोड, बाइनरी डेटा (ArrayBuffer) और Ping/Pong हार्टबीट।
- **हैंडशेक और मेटाडेटा**: कनेक्शन स्थिति, ट्रांसपोर्ट प्रकार (websocket/polling) और पुनः कनेक्शन घटनाएं।

### 💾 3. स्टोरेज मैनेजर (AsyncStorage और MMKV)
- **एकीकृत स्टोरेज इंटरफ़ेस**: \`@react-native-async-storage/async-storage\` और \`react-native-mmkv\` दोनों के लिए।
- **लाइव इन-ऐप CRUD**: सीधे फोन स्क्रीन से कीज़ पढ़ें, खोजें, नई बनाएं, एडिट करें या डिलीट करें।
- **स्मार्ट टाइप पार्सिंग**: JSON ऑब्जेक्ट्स, एरेज़, बूलियन, संख्या और स्ट्रिंग्स को पहचानता है।

### 🔔 4. पुश नोटिफिकेशन लॉगर
- **मल्टी-प्रोवाइडर सपोर्ट**: FCM, APNs, Salesforce Marketing Cloud, OneSignal और Notifee के नोटिफिकेशन्स।
- **ऐप स्थिति ट्रैकिंग**: पहचानता है कि नोटिफिकेशन फोरग्राउंड, बैकग्राउंड या किल्ड अवस्था में आया।
- **पेलोड विवरण**: डेटा पैरामीटर्स, डीप-लिंक, शीर्षक, संदेश और चैनल आईडी देखें।

### 🪵 5. कंसोल लॉगर और Metro सोर्स-मैप सिम्बॉलिकेशन
- **सटीक लाइन नंबर**: \`console.log\`, \`warn\` और \`error\` को इंटरसेप्ट करके Metro बंडलर के जरिए प्रोजेक्ट की वास्तविक फाइल और लाइन नंबर दिखाता है (\`HomeScreen.tsx:42:15\`)।
- **पैरामीटर ब्रेकडाउन**: प्रत्येक पास किए गए आर्गुमेंट को अलग-अलग प्रकार के साथ जांचें।
- **कॉल स्टैक और एरर स्टैक**: फंक्शन नाम, फाइल, लाइन और एरर ट्री का संरचित दृश्य।
- **डुप्लिकेट कोलाप्सिंग**: बार-बार आने वाले लॉग्स को एक साथ गिनकर (\`×N\`) दिखाता है।

### 🔄 6. Redux स्टेट डिफ्स और एक्शन टाइमलाइन
- **Redux Toolkit एकीकरण**: Redux Store, RTK Query और \`redux-persist\` के साथ सहज रूप से कार्य करता है।
- **एक्शन टाइमलाइन**: डिस्पैच किए गए एक्शन्स का क्रमानुसार विवरण और समय।
- **कलर-कोडेड स्टेट डिफ्स**: बदलावों को रंगों से पहचानें (**हरा** जोड़ने के लिए, **पीला** बदलने के लिए, **लाल** हटाने के लिए)।

### 📊 7. एनालिटिक्स इवेंट ट्रैकर
- **Firebase Analytics ऑटो-हुक**: \`logEvent\`, \`logScreenView\`, \`setUserProperties\` और \`setUserId\` को स्वचालित रूप से कैप्चर करता है।
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
- **शेक जेस्चर**: डिवाइस को हिलाकर या \`Ctrl+Cmd+Z\` / \`Cmd+M\` दबाकर इंस्पेक्टर खोलें या बंद करें।

### 📸 10. नेटिव मीडिया कैप्चर और इन-ऐप स्टूडियो एडिटर
- **डिवाइस पर कैप्चर**: हाई-रेज़ोल्यूशन स्क्रीनशॉट, स्मूथ MP4 वीडियो रिकॉर्डिंग या एनिमेटेड GIF बनाएं।
- **फुल मीडिया गैलरी**: मीडिया देखें, फ़िल्टर करें (फोटो/वीडियो/GIF), बैच सेलेक्ट करें और URI कॉपी करें।
- **फोटो और वीडियो एडिटिंग स्टूडियो**:
  - **क्रॉप और रीसाइज़**: स्टैंडर्ड रेशियो (1:1, 4:3, 16:9) में क्रॉप करें और अपलोड हल्का करने के लिए रीसाइज़ करें।
  - **वीडियो ट्रिमिंग और ऑडियो**: शुरू और अंत का समय सेट करें, प्लेबैक स्पीड बदलें (0.5× – 2.0×) या ऑडियो म्यूट करें।
  - **PNG फ्रेम स्नैपशॉट**: वीडियो चलाते समय किसी भी पल का हाई-रेज़ोल्यूशन PNG फ्रेम एक्सट्रैक्ट करें।
- **QA एनोटेशन और बग मार्किंग**:
  - **इंस्टाग्राम 3×3 ग्रिडलाइन्स**: पिक्सेल-परफेक्ट अलाइनमेंट के लिए ग्रिड ओवरले चालू करें।
  - **स्टेप नंबरिंग बैज**: रीप्रोडक्शन स्टेप्स दिखाने के लिए नंबर वाले बैज (\`1\`, \`2\`, \`3\`...) लगाएं।
  - **बग और नोट टैग्स**: स्क्रीनशॉट पर बग (\`🐛\`), नोट (\`📝\`) और चेतावनी टैग जोड़ें।
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
- **इंटरएक्टिव भाषा चयनकर्ता**: हेडर में \`[ 🌐 HI ▾ ]\` टैप करके झंडों और खोज बार के साथ बॉटम शीट खोलें।`,
    installTitle: '📦 इंस्टॉलेशन',
    quickstartTitle: '🚀 त्वरित सेटअप',
    searchTitle: '🔎 DevTools सर्च सिंटैक्स',
  },
  'ja': {
    title: 'React Native In-App Inspector (アプリ内デバッグツールキット)',
    description: `React Native および Expo のための**設定不要・オールインワンのアプリ内デバッグツールキット**。HTTP/HTTPS ネットワーク通信の傍受、WebSocket / Socket.IO のリアルタイムストリーム、Metro による正確な行番号付きコンソールログ、Redux 状態差分、AsyncStorage & MMKV ストレージ、プッシュ通知、端末ハードウェア統計、そしてスタジオ編集機能付きのスクリーンショット・動画録画を PC やケーブル接続なしでスマホ単体で実現します。`,
    quote: `🚀 **Flipper、Charles、Proxyman、Chucker に代わる軽量でモダンな選択肢** — 実機上、TestFlight/APK 内でデスクトップアプリやケーブルなしで動作します。`,
    videoFull: '動画ウォークスルーを見る (MP4)',
    videoOriginal: 'オリジナル MOV',
    whyTitle: '⚡ 特徴と他ツールとの比較',
    featuresTitle: '✨ 主な機能とモジュール',
    sponsorTitle: '💖 深夜2時に原因不明のバグと戦ったすべてのエンジニアへ愛を込めて',
    sponsorQuote: `「react-native-inapp-inspector を開発したのは、絡まるUSBケーブルや突然切断されるデバッガポート、実機ビルドだけで起きる謎のエラーに悩まされる辛さを誰よりも知っているからです。世界中のすべてのモバイル開発者とQAエンジニアが、PCに縛られず自由で快適にデバッグできるように、数え切れないほどの徹夜と情熱を注ぎ込みました。」`,
    sponsorBody: `もしこのツールがあなたのデバッグ時間を節約し、大切なリリースを成功に導き、日々の開発体験を少しでも豊かにしたなら —— <b>ぜひ本プロジェクトへのスポンサー支援をご検討ください</b>。一杯の温かいコーヒーや温かいご支援が、今後の継続的な開発と完全無料のオープンソースを支える大きな原動力になります。☕✨`,
    sponsorButton: '💖 GitHub Sponsors で支援する',
    tableHeaders: ['機能', '**react-native-inapp-inspector**', 'Flipper', 'Charles / Proxyman', 'RN Debugger'],
    tableRows: [
      ['**端末単体で動作 (PCやケーブル不要)**', '✅', '❌', '❌', '❌'],
      ['**非アクティブ時ゼロ負荷 (バックグラウンドCPU 0%)**', '✅', '❌', '❌', '❌'],
      ['**HTTP/HTTPS 通信インスペクター (Fetch / Axios / XHR)**', '✅', '✅', '✅', '✅'],
      ['**タイミングウォーターフォール & P95 レイテンシ**', '✅', '⚠️', '⚠️', '❌'],
      ['**cURL / Fetch コードのワンタップ即座コピー**', '✅', '⚠️', '⚠️', '❌'],
      ['**双方向 WebSocket & Socket.IO パケット監視**', '✅', '❌', '⚠️', '⚠️'],
      ['**ライブストレージ編集 (AsyncStorage & MMKV)**', '✅ (CRUD対応)', '⚠️ (読み取り専用)', '❌', '⚠️'],
      ['**プッシュ通知ロガー (APNs, FCM, Salesforce)**', '✅', '❌', '❌', '❌'],
      ['**Metro による正確なソースコード行番号シンボリケーション**', '✅ (正確な行番号)', '✅', '❌', '✅'],
      ['**Redux 状態 Diff & アクションタイムライン**', '✅', '⚠️', '❌', '✅'],
      ['**アナリティクスイベント追跡 (Firebase, Mixpanel)**', '✅', '❌', '❌', '❌'],
      ['**クラッシュ保護 & マルチタイプブレッドクラム**', '✅', '❌', '❌', '❌'],
      ['**端末ハードウェア情報 (RAM, ヒープ, ストレージ, バッテリー, FPS)**', '✅', '⚠️', '❌', '❌'],
      ['**メディアキャプチャ & スタジオエディター (トリミング, バッジ)**', '✅ (フルスタジオ)', '❌', '❌', '❌'],
      ['**ドラッグ可能なフローティングFAB & シースルー透過モード**', '✅ (0.05 - 1.0)', '❌', '❌', '❌'],
      ['**Firebase Remote Config によるクラウドモジュール管理**', '✅', '❌', '❌', '❌'],
      ['**ボトムシート選択付き 25 言語対応**', '✅', '❌ (英語のみ)', '❌', '❌'],
      ['**Expo (Bare / Managed) & React Native CLI**', '✅', '⚠️', '⚠️', '⚠️'],
    ],
    features: `### 🌐 1. ネットワークインスペクター & タイムライン・ウォーターフォール
- **万能な HTTP/HTTPS 傍受**: \`fetch\`、Axios（デフォルトおよび \`axios.create()\`）、\`XMLHttpRequest\` を自動追跡。
- **レイテンシの内訳**: 視覚的なウォーターフォールバーと速度判定（高速 \`<200ms\`、通常 \`200-800ms\`、低速 \`>800ms\`）。
- **リアルタイム統計**: 成功率 (%)、平均レイテンシ (ms)、P95 レイテンシ (ms) を常時表示。
- **ペイロード閲覧**: フォーマット済み JSON ツリー、Raw テキスト、ヘッダー、クエリパラメータ、呼び出し元ファイル。
- **ワンタップ出力**: **cURL コマンド**、**Fetch コードスニペット**、または要約レポートをワンタップでコピー。

### ⚡ 2. WebSocket & Socket.IO リアルタイムストリームインスペクター
- **全プロトコル対応**: 標準 WebSocket (\`ws://\`, \`wss://\`) および Socket.IO (\`v2\`, \`v3\`, \`v4\`) をサポート。
- **双方向フレーム監視**: 送信 (⬆️) と受信 (⬇️) パケットを高精度タイムスタンプ付きで記録。
- **多彩なフレームタイプ識別**: JSON テキスト、バイナリ長 (ArrayBuffer)、Ping/Pong ハートビートを識別。
- **接続詳細**: ハンドシェイクパラメータ、接続モード (websocket/polling)、再接続イベントを追跡。

### 💾 3. ストレージマネージャー (AsyncStorage & MMKV)
- **統一ストレージインターフェース**: \`@react-native-async-storage/async-storage\` および \`react-native-mmkv\` に対応。
- **アプリ内リアルタイム CRUD**: 端末上でキーの閲覧、検索、新規作成、編集、削除が可能。
- **スマート型解析**: JSON オブジェクト、配列、真偽値、数値、文字列を自動判別。

### 🔔 4. プッシュ通知ロガー
- **マルチプロバイダー対応**: FCM、APNs、Salesforce Marketing Cloud、OneSignal、Notifee の通知を捕捉。
- **アプリ状態トラッキング**: フォアグラウンド、バックグラウンド、または終了状態からの起動を判別。
- **ペイロードインスペクター**: データパラメータ、ディープリンク URL、タイトル、本文、チャンネル ID を表示。

### 🪵 5. コンソールロガー & Metro ソースマップシンボリケーション
- **正確な行番号**: \`console.log\`、\`warn\`、\`error\` を捕捉し、Metro バンドラーを通じてソースファイルの正確な行番号を表示 (\`HomeScreen.tsx:42:15\`)。
- **引数の個別展開**: 渡された各引数を個別のカードで型情報とともに表示。
- **コールスタック & エラースタック**: 関数名、ファイル名、エラーオブジェクトのスタックトレースを構造化表示。
- **重複ログの集約**: 同一ログの連続出力を \`×N\` で自動的に折りたたみ。

### 🔄 6. Redux 状態 Diff & アクションタイムライン
- **Redux Toolkit 対応**: Redux Store、RTK Query、\`redux-persist\` と完全連携。
- **アクション履歴**: ディスパッチされたアクションの時系列順表示と処理時間の計測。
- **カラーコード化 Diff**: 変更内容を視覚的にハイライト（**緑**: 追加、**黄**: 更新、**赤**: 削除）。

### 📊 7. アナリティクスイベントトラッカー
- **Firebase Analytics 自動連携**: \`logEvent\`、\`logScreenView\`、\`setUserProperties\`、\`setUserId\` を自動監視。
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
- **端末シェイク機能**: 端末を振るか、\`Ctrl+Cmd+Z\` / \`Cmd+M\` でインスペクターの表示を切り替え。

### 📸 10. ネイティブメディアキャプチャ & アプリ内スタジオエディター
- **実機で直接キャプチャ**: 高解像度スクリーンショット、スムーズな MP4 動画録画、アニメーション GIF を作成。
- **高機能メディアギャラリー**: 写真、動画、GIF を閲覧・絞り込み、一括削除や URI コピーが可能。
- **写真 & 動画スタジオ編集**:
  - **トリミング & リサイズ**: アスペクト比 (1:1 正方形, 4:3, 16:9) に切り抜き、軽量化のための解像度縮小。
  - **動画カット & 音声制御**: 開始/終了位置のスライダー調整、再生速度変更 (0.5× – 2.0×)、音声ミュート。
  - **PNG フレーム抽出**: 動画再生中の任意の瞬間を高精細 PNG 画像としてワンタップ保存。
- **QA 障害報告 & 注釈ツール**:
  - **Instagram 3×3 グリッド**: 正確な UI アライメント確認用のグリッド線を表示。
  - **ステップ番号バッジ**: 不具合の再現手順を示す番号バッジ (\`1\`, \`2\`, \`3\`...) をタップまたはドラッグで配置。
  - **バグ & メモタグ**: バグ (\`🐛\`)、メモ (\`📝\`)、警告スタンプを配置。
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
- **ボトムシート選択**: ヘッダーの \`[ 🌐 JA ▾ ]\` をタップして国旗付きの検索可能なシートから瞬時に切り替え。`,
    installTitle: '📦 インストール',
    quickstartTitle: '🚀 クイックスタート',
    searchTitle: '🔎 DevTools 検索構文',
  },
  'de': {
    title: 'React Native In-App Inspector (In-App Debugging-Toolkit)',
    description: `Das **konfigurationsfreie All-in-One In-App-Debugging-Toolkit für React Native & Expo**. Überprüfen Sie HTTP/HTTPS-Netzwerkverkehr, WebSocket- & Socket.IO-Echtzeit-Streams, Konsolenprotokolle mit Metro-Dateizeilen, Redux-State-Diffs, AsyncStorage & MMKV-Speicher, Push-Benachrichtigungen, Hardware-Metriken und erstellen Sie Screenshots oder Videoaufnahmen mit integriertem Editor direkt auf dem Gerät ohne Kabel.`,
    quote: `🚀 **Die moderne, leichtgewichtige Alternative zu Flipper, Charles, Proxyman und Chucker** — funktioniert eigenständig auf dem Gerät, in Test-Builds und ohne Desktop-App oder USB-Kabel.`,
    videoFull: 'Vollständiges Demo-Video ansehen (MP4)',
    videoOriginal: 'Original MOV',
    whyTitle: '⚡ Vergleich mit anderen Tools',
    featuresTitle: '✨ Hauptmodule & Funktionen',
    sponsorTitle: '💖 Mit Liebe für jeden Entwickler geschaffen, der jemals um 2 Uhr nachts nach Phantom-Bugs gesucht hat',
    sponsorQuote: `„Wir haben react-native-inapp-inspector entwickelt, weil wir den Frust über Kabelsalat, unterbrochene Debugger-Verbindungen und schwer reproduzierbare Fehler in Test-Builds nur zu gut kennen. Wir haben zahllose schlaflose Nächte und pure Leidenschaft investiert, damit jeder Mobile-Entwickler und QA-Tester weltweit mühelos und frei auf echten Geräten debuggen kann.“`,
    sponsorBody: `Wenn dieses Tool Ihnen Stunden an Fehlersuche erspart hat, geholfen hat, ein wichtiges Release pünktlich auszuliefern, oder Ihren Arbeitsalltag erleichtert hat — <b>erwägen Sie bitte, das Projekt zu sponsern</b>. Jeder noch so kleine Kaffee oder monatliche Beitrag bedeutet uns unglaublich viel und hält unabhängige Open-Source-Innovation am Leben. ☕✨`,
    sponsorButton: '💖 Auf GitHub Sponsors unterstützen',
    tableHeaders: ['Funktion', '**react-native-inapp-inspector**', 'Flipper', 'Charles / Proxyman', 'RN Debugger'],
    tableRows: [
      ['**Eigenständig auf dem Gerät (Kein PC/Kabel erforderlich)**', '✅', '❌', '❌', '❌'],
      ['**Null-Rendern im Leerlauf (0% Hintergrund-CPU)**', '✅', '❌', '❌', '❌'],
      ['**HTTP/HTTPS Netzwerk-Logger (Fetch / Axios / XHR)**', '✅', '✅', '✅', '✅'],
      ['**Timing-Wasserfall & P95-Latenz**', '✅', '⚠️', '⚠️', '❌'],
      ['**Sofortiger cURL- & Fetch-Code-Export**', '✅', '⚠️', '⚠️', '❌'],
      ['**Bidirektionaler WebSocket- & Socket.IO-Inspektor**', '✅', '❌', '⚠️', '⚠️'],
      ['**Live-Speicher-Editor (AsyncStorage & MMKV)**', '✅ (CRUD)', '⚠️ (Nur Lesen)', '❌', '⚠️'],
      ['**Push-Benachrichtigungs-Logger (APNs, FCM, Salesforce)**', '✅', '❌', '❌', '❌'],
      ['**Logs mit echten Dateizeilennummern via Metro**', '✅ (Exakte Zeile)', '✅', '❌', '✅'],
      ['**Redux-State-Diffs & Aktions-Zeitleiste**', '✅', '⚠️', '❌', '✅'],
      ['**Analytics-Ereignis-Tracker (Firebase, Mixpanel)**', '✅', '❌', '❌', '❌'],
      ['**Absturzschutz & Multi-Typ Breadcrumbs**', '✅', '❌', '❌', '❌'],
      ['**Hardware-Telemetrie (RAM, Heap, Speicher, Akku, FPS)**', '✅', '⚠️', '❌', '❌'],
      ['**Medienaufnahme & Studio-Editor (Crop, Video Trim, Badges)**', '✅ (Komplettes Studio)', '❌', '❌', '❌'],
      ['**Verschiebbarer FAB & Transparenz-Modus (Peek Mode)**', '✅ (0.05 - 1.0)', '❌', '❌', '❌'],
      ['**Remote-Modulverwaltung via Firebase Remote Config**', '✅', '❌', '❌', '❌'],
      ['**25 Sprachen mit Bottom-Sheet-Auswahl**', '✅', '❌ (Nur Englisch)', '❌', '❌'],
      ['**Expo (Bare / Managed) & React Native CLI**', '✅', '⚠️', '⚠️', '⚠️'],
    ],
    features: `### 🌐 1. Netzwerk-Inspektor & Timing-Wasserfall
- **Universelles HTTP/HTTPS-Abfangen**: Unterstützt automatisch \`fetch\`, Axios-Instanzen und \`XMLHttpRequest\`.
- **Latenz-Aufschlüsselung**: Proportionale Wasserfall-Balken, Geschwindigkeitseinstufung (Schnell \`<200ms\`, Moderat \`200-800ms\`, Langsam \`>800ms\`).
- **Telemetrie-Leiste**: Echtzeit-Erfolgsrate (%), Durchschnittliche Latenz (ms) und P95-Latenz (ms).
- **Payload-Viewer**: Formatierter JSON-Baum, Raw-Text, Header, Abfrageparameter und Aufruferquelle.
- **Schnell-Export**: Mit einem Fingertipp als **cURL-Befehl**, **Fetch-Snippet** oder Bericht kopieren.

### ⚡ 2. WebSocket & Socket.IO Echtzeit-Stream-Inspektor
- **Vollständige Protokollabdeckung**: Natives WebSocket (\`ws://\`, \`wss://\`) und Socket.IO (\`v2\`, \`v3\`, \`v4\`).
- **Bidirektionale Frame-Zeitleiste**: Verfolgen von Paketen (⬆️ Gesendet, ⬇️ Empfangen) mit hochauflösenden Zeitstempeln.
- **Typenerkennung**: Text, JSON-Nutzdaten, Binärgrößen (ArrayBuffer) und Ping/Pong-Heartbeats.
- **Verbindungsmetadaten**: Status, Handshake-Parameter, Transportmodus (websocket/polling) und Wiederverbindungen.

### 💾 3. Speicher-Manager (AsyncStorage & MMKV)
- **Einheitliche Speicher-Schnittstelle**: Für \`@react-native-async-storage/async-storage\` und \`react-native-mmkv\`.
- **Live In-App CRUD**: Schlüssel direkt auf dem Bildschirm anzeigen, suchen, erstellen, bearbeiten und löschen.
- **Intelligente Typerkennung**: Unterscheidet automatisch zwischen JSON-Objekten, Arrays, Booleans, Zahlen und Strings.

### 🔔 4. Push-Benachrichtigungs-Logger
- **Multi-Provider-Unterstützung**: FCM, APNs, Salesforce Marketing Cloud, OneSignal und Notifee.
- **App-Status-Erkennung**: Erkennt, ob Benachrichtigungen im Vordergrund, Hintergrund oder aus dem beendeten Zustand empfangen wurden.
- **Payload-Inspektion**: Vollständige Datenparameter, Deep-Links, Titel, Texte und Kanal-IDs.

### 🪵 5. Konsolen-Logger & Metro Source-Map-Symbolisierung
- **Exakte Zeilennummern**: Fängt \`console.log\`, \`warn\` und \`error\` ab und zeigt dank Metro Bundler die tatsächliche Quellcodedatei und Zeile an (\`HomeScreen.tsx:42:15\`).
- **Argument-Aufschlüsselung**: Jedes Argument einzeln mit Typangabe prüfen.
- **Call-Stack & Error-Stack**: Strukturierte Frames mit Funktionsnamen, Dateipfaden und Fehlertraces.
- **Duplikatzusammenfassung**: Wiederholte Ausgaben werden automatisch mit Zähler (\`×N\`) gebündelt.

### 🔄 6. Redux State-Diffs & Aktions-Zeitleiste
- **Redux Toolkit Integration**: Funktioniert nahtlos mit Redux Store, RTK Query und \`redux-persist\`.
- **Aktions-Zeitleiste**: Chronologischer Verlauf aller Aktionen mit Dauer und Payload.
- **Farbcodierte State-Diffs**: Änderungen sofort erkennen (**Grün** für Hinzufügungen, **Gelb** für Aktualisierungen, **Rot** für Entfernungen).

### 📊 7. Analytics-Ereignis-Tracker
- **Firebase Analytics Auto-Hook**: Fängt \`logEvent\`, \`logScreenView\`, \`setUserProperties\` und \`setUserId\` automatisch ab.
- **Plugin-Architektur**: Unterstützt Google Analytics 4, Mixpanel, Segment und Amplitude.
- **Parameter-Prüfung**: Ereignisparameter, Benutzereigenschaften und Zeitstempel analysieren.

### 🛡️ 8. Absturzschutz & Globale Error-Boundary
- **Isolierte Micro-UI**: Eigene Sandbox stellt sicher, dass der Inspektor niemals die Hauptanwendung zum Absturz bringt.
- **Globale ErrorBoundary**: Fängt nicht behandelte React-Render-Abstürze mit Wiederherstellungs-UI ab.
- **Breadcrumb-Historie**: Zeigt vorherige Navigationen, Netzwerkaufrufe und Redux-Aktionen vor einem Fehler.

### 📱 9. Native Hardware-, RAM- & Leistungs-Telemetrie
- **Systemmetriken**: Gesamter & freier RAM, Nativer Heap, Freier Speicherplatz, Akkustand & Ladestatus, CPU-Architektur.
- **Live-FPS-Zähler**: Kontinuierliche Überwachung der Bildschirm-Bildwiederholrate.
- **Automatische Speicherbereinigung**: Gibt bei OS-Speicherwarnungen automatisch Puffer frei.
- **Schüttel-Geste**: Gerät schütteln oder \`Ctrl+Cmd+Z\` / \`Cmd+M\` drücken, um den Inspektor zu öffnen.

### 📸 10. Native Medienaufnahme & In-App Studio-Editor
- **Aufnahme direkt auf dem Gerät**: Hochauflösende Screenshots, flüssige MP4-Videoaufnahmen oder animierte GIFs erstellen.
- **Vollständige Mediengalerie**: Durchsuchen, Filtern (Fotos, Videos, GIFs), Mehrfachauswahl und URI-Kopieren.
- **Foto- & Video-Studio-Editor**:
  - **Zuschneiden & Skalieren**: Feste Seitenverhältnisse (1:1 Quadrat, 4:3, 16:9) und Größenanpassung für schnelles Hochladen.
  - **Video-Trimming & Audio**: Start-/Endzeitpunkte anpassen, Wiedergabegeschwindigkeit (0.5× – 2.0×) ändern oder stummschalten.
  - **PNG-Frame-Snapshot**: Beliebige Frames aus Videos mit einem Fingertipp als PNG exportieren.
- **QA-Anmerkungen & Fehler-Markup**:
  - **Instagram 3×3 Raster**: Hilfslinien zur pixelgenauen Ausrichtungsprüfung einblenden.
  - **Nummerierte Schritt-Badges**: Schritt-für-Schritt-Badges (\`1\`, \`2\`, \`3\`...) für Reproduktionsschritte platzieren.
  - **Bug- & Notiz-Tags**: Farbige Fehler- (\`🐛\`), Notiz- (\`📝\`) und Warnsymbole platzieren.
  - **Text & QA-Wasserzeichen**: Eigene Hinweistexte schreiben und Gerätedaten-Wasserzeichen einblenden.
- **Galerie-Import**: Bestehende Fotos oder Videos aus der Fotomediathek zur Bearbeitung importieren.

### 🎛️ 11. Ziehbarer schwebender FAB & Durchsichtigkeits-Modus (Peek Mode)
- **Schwebender Launcher**: Frei verschiebbare Bubble mit Ungelesen-Zähler.
- **Ausblend-Zone unten**: Zum Schließen einfach auf das leuchtende Ziel am unteren Bildschirmrand ziehen.
- **Durchsichtigkeits-Modus**: Deckkraft von 0.05 bis 1.0 anpassen, um die App normal zu bedienen und gleichzeitig Datenströme zu beobachten.

### ☁️ 12. Firebase Remote Config Modulverwaltung
- **Remote Feature Flags**: Inspektor-Module in Produktions- oder Test-Builds über Firebase Remote Config aus der Cloud steuern.

### 🌍 13. 25 globale Sprachen & Interaktives Bottom Sheet
- **25 unterstützte Sprachen**: Deutsch, Englisch, Spanisch, Französisch, Italienisch, Portugiesisch, Russisch, Japanisch, Koreanisch, Chinesisch, Arabisch, Hindi u.v.m.
- **Interaktives Bottom Sheet**: Tippen Sie auf \`[ 🌐 DE ▾ ]\` in der Kopfzeile für sofortigen Sprachwechsel mit Ländersuche.`,
    installTitle: '📦 Installation',
    quickstartTitle: '🚀 Schnellstart',
    searchTitle: '🔎 DevTools-Suchsyntax',
  },
  'fr': {
    title: 'React Native In-App Inspector (Boîte à Outils de Débogage Intégrée)',
    description: `La **boîte à outils de débogage tout-en-un et sans configuration pour React Native & Expo**. Inspectez le trafic réseau HTTP/HTTPS, les flux temps réel WebSocket & Socket.IO, les logs de console avec numéros de lignes précis via Metro, les diffs d'état Redux, le stockage AsyncStorage & MMKV, les notifications push, les métriques matérielles et réalisez des captures ou enregistrements vidéo avec studio d'édition complet directement sur votre téléphone sans câble.`,
    quote: `🚀 **L'alternative moderne et légère à Flipper, Charles, Proxyman et Chucker** — fonctionne en totale autonomie sur l'appareil, en versions de test (APK/TestFlight) et sans câble USB.`,
    videoFull: 'Regarder la Démo Vidéo Complète (MP4)',
    videoOriginal: 'Fichier MOV Original',
    whyTitle: '⚡ Comparaison avec les Autres Outils',
    featuresTitle: '✨ Modules et Fonctionnalités Clés',
    sponsorTitle: '💖 Conçu avec Amour pour Tous les Développeurs qui ont déjà Traqué un Bug à 2h du Matin',
    sponsorQuote: `« Nous avons créé react-native-inapp-inspector parce que nous connaissons parfaitement la douleur des câbles emmêlés, des proxies déconnectés et des plantages inexplicables sur les builds de test. Nous y avons mis des nuits blanches et toute notre passion pour que chaque ingénieur mobile et testeur QA dans le monde puisse déboguer en toute liberté, fluidité et sérénité. »`,
    sponsorBody: `Si cet outil vous a fait gagner de précieuses heures, vous a aidé à livrer une mise en production cruciale à temps, ou a simplifié votre quotidien de développement — <b>pensez à sponsoriser le projet</b>. Un simple café ou un soutien mensuel fait toute la différence et permet de maintenir ce projet open source indépendant et gratuit pour tous. ☕✨`,
    sponsorButton: '💖 Soutenir sur GitHub Sponsors',
    tableHeaders: ['Fonctionnalité', '**react-native-inapp-inspector**', 'Flipper', 'Charles / Proxyman', 'RN Debugger'],
    tableRows: [
      ['**Autonome sur l’appareil (Pas de PC ni de câble)**', '✅', '❌', '❌', '❌'],
      ['**Zéro rendu en veille (0% CPU en arrière-plan)**', '✅', '❌', '❌', '❌'],
      ['**Inspecteur réseau HTTP/HTTPS (Fetch / Axios / XHR)**', '✅', '✅', '✅', '✅'],
      ['**Graphique en cascade & Latence P95**', '✅', '⚠️', '⚠️', '❌'],
      ['**Export instantané de snippets cURL et Fetch**', '✅', '⚠️', '⚠️', '❌'],
      ['**Moniteur bidirectionnel WebSocket & Socket.IO**', '✅', '❌', '⚠️', '⚠️'],
      ['**Éditeur de stockage en direct (AsyncStorage & MMKV)**', '✅ (CRUD)', '⚠️ (Lecture seule)', '❌', '⚠️'],
      ['**Enregistreur de notifications push (APNs, FCM, Salesforce)**', '✅', '❌', '❌', '❌'],
      ['**Logs avec vrais numéros de lignes via Metro**', '✅ (Ligne exacte)', '✅', '❌', '✅'],
      ['**Diffs d’état Redux & Chronologie des actions**', '✅', '⚠️', '❌', '✅'],
      ['**Suivi des événements analytiques (Firebase, Mixpanel)**', '✅', '❌', '❌', '❌'],
      ['**Protection anti-crash & Fil d’Ariane (Breadcrumbs)**', '✅', '❌', '❌', '❌'],
      ['**Télémétrie matérielle (RAM, tas natif, disque, batterie, FPS)**', '✅', '⚠️', '❌', '❌'],
      ['**Capture multimédia & Studio d’édition (Crop, Video Trim, Badges)**', '✅ (Studio complet)', '❌', '❌', '❌'],
      ['**Bouton flottant déplaçable & Mode transparence (Peek)**', '✅ (0.05 - 1.0)', '❌', '❌', '❌'],
      ['**Gestion à distance des modules via Firebase Remote Config**', '✅', '❌', '❌', '❌'],
      ['**25 langues avec sélecteur en feuille inférieure (Bottom Sheet)**', '✅', '❌ (Anglais uniquement)', '❌', '❌'],
      ['**Expo (Bare / Managed) & React Native CLI**', '✅', '⚠️', '⚠️', '⚠️'],
    ],
    features: `### 🌐 1. Inspecteur Réseau & Graphique en Cascade des Latences
- **Interception Universelle HTTP/HTTPS**: Prise en charge automatique de \`fetch\`, Axios et \`XMLHttpRequest\`.
- **Détail des Latences**: Barres en cascade proportionnelles, évaluation de la vitesse (Rapide \`<200ms\`, Modéré \`200-800ms\`, Lent \`>800ms\`).
- **Bandeau Télémetrique**: Taux de réussite (%), Latence moyenne (ms) et Latence P95 (ms) en direct.
- **Visualiseur de Données**: Arbre JSON stylisé, texte brut, en-têtes requête/réponse, paramètres et fichier appelant.
- **Export en Un Clic**: Copiez sous forme de commande **cURL**, snippet **Fetch** ou rapport synthétique.

### ⚡ 2. Inspecteur de Flux en Temps Réel WebSocket & Socket.IO
- **Couverture Protocoles Totale**: WebSocket natif (\`ws://\`, \`wss://\`) et Socket.IO (\`v2\`, \`v3\`, \`v4\`).
- **Chronologie Bidirectionnelle**: Suivi des trames (⬆️ Envoyées, ⬇️ Reçues) avec horodatage haute précision.
- **Détection des Types**: Texte, charges JSON, taille binaire (ArrayBuffer) et battements Ping/Pong.
- **Métadonnées de Connexion**: État de connexion, paramètres de handshake, transport (websocket/polling) et reconnexions.

### 💾 3. Gestionnaire de Stockage (AsyncStorage & MMKV)
- **Interface Unifiée**: Compatible avec \`@react-native-async-storage/async-storage\` et \`react-native-mmkv\`.
- **CRUD en Direct dans l'App**: Consultez, recherchez, créez, modifiez et supprimez des clés directement à l'écran.
- **Typage Intelligent**: Reconnaissance automatique des objets JSON, tableaux, booléens, nombres et chaînes.

### 🔔 4. Enregistreur de Notifications Push
- **Multi-Fournisseurs**: FCM, APNs, Salesforce Marketing Cloud, OneSignal et Notifee.
- **Suivi d'État de l'App**: Distingue les réceptions au Premier Plan (**Foreground**), en Arrière-Plan (**Background**) ou après Fermeture (**Killed**).
- **Inspection des Données**: Paramètres complets, liens profonds (deep-links), titres, corps et identifiants de canaux.

### 🪵 5. Enregistreur de Console & Symbolisation Metro Source-Map
- **Numéros de Ligne Exacts**: Intercepte \`console.log\`, \`warn\` et \`error\` en affichant le vrai fichier source et la ligne exacte via Metro (\`HomeScreen.tsx:42:15\`).
- **Décomposition des Arguments**: Chaque argument est inspecté individuellement avec son type.
- **Pile d'Appel & Pile d'Erreur**: Cartes structurées avec noms de fonctions, chemins de fichiers et piles d'exceptions.
- **Regroupement Intelligent**: Regroupe les logs identiques successifs avec un compteur (\`×N\`).

### 🔄 6. Diffs d'État Redux & Chronologie des Actions
- **Intégration Redux Toolkit**: Prise en charge fluide de Redux Store, RTK Query et \`redux-persist\`.
- **Chronologie des Actions**: Historique ordonné des actions avec temps d'exécution et données transmises.
- **Diffs Visuels Colorés**: Modifications mises en valeur (**Vert** pour ajouts, **Jaune** pour mises à jour, **Rouge** pour suppressions).

### 📊 7. Suivi des Événements Analytiques
- **Accroche Automatique Firebase**: Intercepte \`logEvent\`, \`logScreenView\`, \`setUserProperties\` et \`setUserId\`.
- **Architecture Modulaire**: Connexion facile à Google Analytics 4, Mixpanel, Segment et Amplitude.
- **Analyse des Paramètres**: Visualisez les paramètres d'événements, propriétés utilisateurs et horodatages.

### 🛡️ 8. Protection Anti-Crash & Limite Globale d'Erreurs
- **Micro-UI Isolée**: L'inspecteur fonctionne dans sa propre bulle et ne fera jamais planter l'application hôte.
- **Limite d'Erreurs React (ErrorBoundary)**: Capture les plantages de rendu React non gérés avec écran de récupération.
- **Fil d'Ariane (Breadcrumbs)**: Reconstitue les navigations, requêtes réseau et actions Redux précédant une erreur.

### 📱 9. Télémétrie Matérielle Native, RAM & Performances
- **Métriques Système**: RAM totale et disponible, Tas natif alloué, Espace disque libre, Batterie et architecture CPU.
- **Compteur FPS en Direct**: Mesure continue du taux de rafraîchissement de l'écran.
- **Purger sur Alerte Mémoire**: Libère automatiquement la mémoire tampon en cas d'avertissement système.
- **Geste de Secousse**: Secouez l'appareil ou appuyez sur \`Ctrl+Cmd+Z\` / \`Cmd+M\` pour ouvrir l'inspecteur.

### 📸 10. Capture Multimédia Native & Studio d'Édition Intégré
- **Capture sur l'Appareil**: Réalisez des captures d'écran haute résolution, des vidéos MP4 fluides ou des GIFs animés.
- **Galerie Multimédia Complète**: Parcourez, filtrez (Photos, Vidéos, GIFs), sélectionnez en lot et copiez les chemins d'accès.
- **Studio d'Édition Photo & Vidéo**:
  - **Recadrage & Redimensionnement**: Ratios prédéfinis (Carré 1:1, 4:3, 16:9) et réduction de taille pour des envois rapides.
  - **Découpage Vidéo & Audio**: Ajustez les points de début/fin, modifiez la vitesse de lecture (0.5× – 2.0×) ou coupez le son.
  - **Extraction d'Images PNG**: Extrayez instantanément une image PNG haute définition à n'importe quel moment de la vidéo.
- **Outils d'Annotation et de Rapport QA**:
  - **Grille 3×3 Style Instagram**: Affichez un quadrillage pour contrôler les alignements au pixel près.
  - **Badges d'Étapes Numérotées**: Placez des pastilles chiffrées (\`1\`, \`2\`, \`3\`...) pour documenter les étapes de reproduction.
  - **Tags Bug & Note**: Déposez des symboles visuels de bug (\`🐛\`), note (\`📝\`) ou alerte.
  - **Texte & Filigrane QA**: Rédigez des notes explicatives et activez un filigrane contenant le modèle et l'OS du téléphone.
- **Importateur de Galerie**: Importez des photos ou vidéos depuis la pellicule du téléphone pour les éditer.

### 🎛️ 11. Bouton Flottant Déplaçable (FAB) & Mode Transparence (Peek Mode)
- **Lanceur Flottant**: Bulle déplaçable dans tous les coins avec badge de notifications non lues.
- **Zone de Fermeture Inférieure**: Faites glisser vers la zone lumineuse en bas de l'écran pour fermer proprement.
- **Mode Transparence**: Réglez l'opacité de 0.05 à 1.0 pour continuer à utiliser l'application tout en observant les logs et le réseau.

### ☁️ 12. Gestion des Modules par Firebase Remote Config
- **Feature Flags à Distance**: Activez ou désactivez les onglets de l'inspecteur depuis la console Firebase sans déployer de mise à jour.

### 🌍 13. 25 Langues Mondiales & Sélecteur en Feuille Inférieure
- **25 Langues Supportées**: Français, Anglais, Espagnol, Allemand, Italien, Portugais, Russe, Japonais, Coréen, Chinois, Arabe, Hindi, etc.
- **Sélecteur Moderne**: Appuyez sur \`[ 🌐 FR ▾ ]\` dans l'en-tête pour afficher la feuille de choix avec drapeaux et recherche instantanée.`,
    installTitle: '📦 Installation',
    quickstartTitle: '🚀 Démarrage Rapide',
    searchTitle: '🔎 Syntaxe de Recherche DevTools',
  },
  'pt-BR': {
    title: 'React Native In-App Inspector (Kit de Ferramentas de Depuração no App)',
    description: `O **kit completo de ferramentas de depuração sem configuração para React Native e Expo**. Inspecione tráfego de rede HTTP/HTTPS, fluxos em tempo real de WebSocket e Socket.IO, registros de console com número de linha exato via Metro, diffs de estado no Redux, armazenamento ao vivo de AsyncStorage e MMKV, notificações push, métricas de hardware e faça capturas de tela/vídeo com estúdio de edição integrado diretamente no celular sem cabos.`,
    quote: `🚀 **A alternativa moderna e leve ao Flipper, Charles, Proxyman e Chucker** — funciona de forma autônoma no aparelho, em builds de teste (APK/TestFlight) e sem fios ou portas abertas.`,
    videoFull: 'Assistir ao Vídeo de Demonstração Completo (MP4)',
    videoOriginal: 'MOV Original',
    whyTitle: '⚡ Comparativo com Outras Ferramentas',
    featuresTitle: '✨ Principais Módulos e Recursos',
    sponsorTitle: '💖 Feito com Carinho para Cada Dev que já Perseguiu um Bug Misterioso às 2 da Madrugada',
    sponsorQuote: `“Criamos o react-native-inapp-inspector porque conhecemos de perto a dor dos cabos enrolados, portas de depuração caindo e crashes misteriosos em builds de teste. Dedicamos inúmeras noites em claro e todo o nosso coração para que cada desenvolvedor mobile e time de QA do mundo possa depurar direto no celular com liberdade, agilidade e paz de espírito.”`,
    sponsorBody: `Se esta ferramenta economizou horas de estresse na sua rotina, te ajudou a entregar uma versão crítica no prazo ou tornou seu dia a dia mais leve — <b>por favor, considere apoiar o projeto com um patrocínio</b>. Um cafezinho ou um apoio mensal significa muito e mantém o código aberto independente vivo para todos. ☕✨`,
    sponsorButton: '💖 Apoiar no GitHub Sponsors',
    tableHeaders: ['Recurso', '**react-native-inapp-inspector**', 'Flipper', 'Charles / Proxyman', 'RN Debugger'],
    tableRows: [
      ['**Funciona direto no aparelho (Sem PC ou cabos)**', '✅', '❌', '❌', '❌'],
      ['**Zero consumo em repouso (0% CPU em segundo plano)**', '✅', '❌', '❌', '❌'],
      ['**Inspetor de rede HTTP/HTTPS (Fetch / Axios / XHR)**', '✅', '✅', '✅', '✅'],
      ['**Cascata de latência & Percentil P95**', '✅', '⚠️', '⚠️', '❌'],
      ['**Cópia instantânea de snippets cURL e Fetch**', '✅', '⚠️', '⚠️', '❌'],
      ['**Monitoramento de WebSocket & Socket.IO bidirecional**', '✅', '❌', '⚠️', '⚠️'],
      ['**Editor de armazenamento ao vivo (AsyncStorage & MMKV)**', '✅ (CRUD)', '⚠️ (Somente leitura)', '❌', '⚠️'],
      ['**Registro de notificações push (APNs, FCM, Salesforce)**', '✅', '❌', '❌', '❌'],
      ['**Logs com numeração de linhas reais via Metro**', '✅ (Linha exata)', '✅', '❌', '✅'],
      ['**Diffs de estado Redux & Linha do tempo de ações**', '✅', '⚠️', '❌', '✅'],
      ['**Rastreador de eventos de analytics (Firebase, Mixpanel)**', '✅', '❌', '❌', '❌'],
      ['**Proteção contra falhas & Rastreador de passos (Breadcrumbs)**', '✅', '❌', '❌', '❌'],
      ['**Telemetria de hardware (RAM, heap, disco, bateria, FPS)**', '✅', '⚠️', '❌', '❌'],
      ['**Captura e estúdio de edição de mídia no app (Crop, Trim, Badges)**', '✅ (Estúdio completo)', '❌', '❌', '❌'],
      ['**Botão flutuante arrastável & Modo transparente (Peek)**', '✅ (0.05 - 1.0)', '❌', '❌', '❌'],
      ['**Gerenciamento remoto de módulos via Firebase Remote Config**', '✅', '❌', '❌', '❌'],
      ['**25 idiomas com seletor em folha inferior (Bottom Sheet)**', '✅', '❌ (Apenas inglês)', '❌', '❌'],
      ['**Expo (Bare / Managed) & React Native CLI**', '✅', '⚠️', '⚠️', '⚠️'],
    ],
    features: `### 🌐 1. Inspetor de Rede & Cascata de Latência
- **Interceptação Universal HTTP/HTTPS**: Suporta nativamente \`fetch\`, instâncias de Axios e \`XMLHttpRequest\`.
- **Detalhamento de Latência**: Barras de cascata proporcionais, classificação de velocidade (Rápido \`<200ms\`, Moderado \`200-800ms\`, Lento \`>800ms\`).
- **Painel de Telemetria**: Taxa de sucesso (%), Latência média (ms) e Latência P95 (ms) em tempo real.
- **Visualizador de Carga Útil**: Árvore JSON formatada, texto bruto, cabeçalhos, parâmetros de consulta e origem da chamada.
- **Exportação Rápida**: Copie com um toque como comando **cURL**, trecho **Fetch** ou relatório resumido.

### ⚡ 2. Inspetor em Tempo Real de WebSocket & Socket.IO
- **Cobertura Completa de Protocolos**: WebSocket nativo (\`ws://\`, \`wss://\`) e Socket.IO (\`v2\`, \`v3\`, \`v4\`).
- **Linha do Tempo Bidirecional**: Rastreamento de pacotes (⬆️ Enviados, ⬇️ Recebidos) com carimbo de data/hora de alta precisão.
- **Identificação de Tipos**: Texto, cargas JSON, tamanho binário (ArrayBuffer) e batimentos Ping/Pong.
- **Metadados da Conexão**: Estado da conexão, parâmetros de handshake, transporte (websocket/polling) e reconexões.

### 💾 3. Gerenciador de Armazenamento (AsyncStorage & MMKV)
- **Interface Unificada**: Compatível com \`@react-native-async-storage/async-storage\` e \`react-native-mmkv\`.
- **CRUD em Tempo Real no App**: Veja, pesquise, crie, edite e delete chaves direto na tela do celular.
- **Tipagem Inteligente**: Distingue automaticamente objetos JSON, arrays, booleanos, números e strings.

### 🔔 4. Registro de Notificações Push
- **Múltiplos Provedores**: FCM, APNs, Salesforce Marketing Cloud, OneSignal e Notifee.
- **Rastreamento de Estado do App**: Identifica se foi recebida em Primeiro Plano (**Foreground**), Segundo Plano (**Background**) ou Inicialização Fechada (**Killed**).
- **Inspeção de Payload**: Parâmetros de dados, deep-links, títulos, mensagens e IDs de canais.

### 🪵 5. Registrador de Console & Simbolização Metro Source-Map
- **Numeração de Linhas Exata**: Intercepta \`console.log\`, \`warn\` e \`error\` apontando o arquivo fonte e linha real através do Metro (\`HomeScreen.tsx:42:15\`).
- **Detalhamento de Argumentos**: Inspecione cada argumento individualmente com seu tipo.
- **Pilha de Chamadas e Erros**: Visualização estruturada com nomes de funções, arquivos e pilhas de exceção.
- **Agrupamento Inteligente**: Contador (\`×N\`) para logs duplicados consecutivos.

### 🔄 6. Diffs de Estado Redux & Linha do Tempo de Ações
- **Integração com Redux Toolkit**: Suporte completo a Redux Store, RTK Query e \`redux-persist\`.
- **Linha do Tempo de Ações**: Registro cronológico de ações despachadas com tempo e payload.
- **Diff Visual Colorido**: Alterações em destaque (**Verde** para adições, **Amarelo** para atualizações, **Vermelho** para remoções).

### 📊 7. Rastreador de Eventos de Analytics
- **Integração Automática Firebase**: Intercepta \`logEvent\`, \`logScreenView\`, \`setUserProperties\` e \`setUserId\`.
- **Arquitetura Aberta**: Conexão simples com Google Analytics 4, Mixpanel, Segment e Amplitude.
- **Inspeção de Parâmetros**: Veja parâmetros de eventos, propriedades de usuários e carimbos de tempo.

### 🛡️ 8. Proteção contra Falhas & Error Boundary Global
- **Micro-UI Isolada**: O inspetor roda em ambiente isolado e nunca derrubará o aplicativo principal.
- **ErrorBoundary Global**: Trata falhas de renderização não capturadas do React com tela de recuperação.
- **Rastreador de Passos (Breadcrumbs)**: Exibe telas navegadas, chamadas de rede e ações Redux antes da falha.

### 📱 9. Telemetria de Hardware Nativo, RAM & Desempenho
- **Métricas do Sistema**: RAM total e livre, Heap nativo, Espaço livre em disco, Bateria e arquitetura do processador.
- **Contador FPS em Tempo Real**: Medição contínua da taxa de quadros por segundo da tela.
- **Limpeza Automática de Memória**: Libera registros caso o sistema operacional envie avisos de memória baixa.
- **Gesto de Balançar**: Balance o aparelho ou pressione \`Ctrl+Cmd+Z\` / \`Cmd+M\` para abrir o inspetor.

### 📸 10. Captura de Mídia Nativa & Estúdio de Edição In-App
- **Captura no Dispositivo**: Crie capturas de tela em alta resolução, gravações em vídeo MP4 e GIFs animados.
- **Galeria de Mídia Completa**: Navegue, filtre (Fotos, Vídeos, GIFs), selecione em lote e copie URIs.
- **Estúdio de Edição de Foto e Vídeo**:
  - **Recorte e Redimensionamento**: Proporções padrão (Quadrado 1:1, 4:3, 16:9) e redução de resolução para uploads rápidos.
  - **Corte de Vídeo & Áudio**: Ajuste pontos de início/fim, altere a velocidade de reprodução (0.5× – 2.0×) ou silencie o áudio.
  - **Captura de Quadros PNG**: Extraia imagens PNG de alta resolução de qualquer momento do vídeo com um toque.
- **Anotações de QA & Marcadores de Bugs**:
  - **Grade 3×3 Estilo Instagram**: Ative guias de alinhamento para inspecionar layouts pixel por pixel.
  - **Emblemas de Passos Numerados**: Coloque marcadores numerados (\`1\`, \`2\`, \`3\`...) para ilustrar passos de reprodução.
  - **Etiquetas de Bugs e Notas**: Adicione selos de bugs (\`🐛\`), notas (\`📝\`) e alertas visuais.
  - **Texto & Marca d'Água de QA**: Escreva anotações e inclua marca d'água com modelo do celular e versão do SO.
- **Importador da Galeria**: Importe fotos ou vídeos da galeria do aparelho para edição e testes.

### 🎛️ 11. Botão Flutuante Arrastável (FAB) & Opacidade Transparente (Modo Peek)
- **Lançador Flutuante**: Bolha arrastável para qualquer canto com contador de não lidos.
- **Área de Fechamento Inferior**: Arraste até o alvo inferior iluminado para fechar o botão com facilidade.
- **Modo Peek Transparente**: Ajuste a opacidade de 0.05 a 1.0 para interagir com o app enquanto inspeciona o tráfego e os dados.

### ☁️ 12. Gerenciamento de Módulos via Firebase Remote Config
- **Feature Flags Remotas**: Habilite ou desabilite abas do inspetor em produção ou testes direto pela nuvem sem precisar lançar nova versão do app.

### 🌍 13. 25 Idiomas Globais & Seletor em Folha Inferior
- **25 Idiomas Suportados**: Português, Inglês, Espanhol, Francês, Alemão, Italiano, Russo, Japonês, Coreano, Chinês, Árabe, Hindi, etc.
- **Seletor em Folha Inferior**: Toque em \`[ 🌐 PT ▾ ]\` no cabeçalho para abrir a folha com bandeiras e busca instantânea.`,
    installTitle: '📦 Instalação',
    quickstartTitle: '🚀 Início Rápido',
    searchTitle: '🔎 Sintaxe de Busca DevTools',
  },
  'ko': {
    title: 'React Native In-App Inspector (인앱 디버깅 툴킷)',
    description: `React Native 및 Expo를 위한 **무설정 올인원 인앱 디버깅 툴킷**. HTTP/HTTPS 네트워크 트래픽 가로채기, WebSocket 및 Socket.IO 실시간 스트림, Metro 기반 소스 파일 및 정확한 라인 번호 콘솔 로그, Redux 상태 Diff, AsyncStorage 및 MMKV 스토리지, 푸시 알림, 하드웨어 성능 통계, 그리고 스튜디오 편집 기능을 갖춘 스크린샷 및 화면 녹화를 PC나 케이블 연결 없이 기기에서 직접 제공합니다.`,
    quote: `🚀 **Flipper, Charles, Proxyman, Chucker를 대체하는 가볍고 현대적인 도구** — PC 프로그램이나 케이블 없이 기기 단독 및 테스트 빌드(TestFlight/APK)에서 완벽하게 작동합니다.`,
    videoFull: '전체 데모 비디오 보기 (MP4)',
    videoOriginal: '원본 MOV',
    whyTitle: '⚡ 다른 도구와의 비교',
    featuresTitle: '✨ 핵심 기능 및 모듈',
    sponsorTitle: '💖 새벽 2시, 원인 모를 버그와 치열하게 싸워본 모든 개발자분들을 위해',
    sponsorQuote: `“react-native-inapp-inspector를 만든 이유는 엉킨 케이블, 끊어지는 디버거 포트, 테스트 빌드에서만 발생하는 유령 버그의 고통을 누구보다 깊이 이해하기 때문입니다. 전 세계의 모든 모바일 개발자와 QA 엔지니어가 번거로운 설정 없이 자유롭고 즐겁게 디버깅할 수 있도록 수많은 밤을 새우며 열정을 쏟아부었습니다.”`,
    sponsorBody: `이 도구가 수많은 디버깅 시간을 절약해 주었거나, 중요한 출시 일정을 맞추는 데 도움이 되었거나, 개발 일상을 조금 더 편안하게 만들어 주었다면 — <b>프로젝트 후원을 고려해 주세요</b>. 따뜻한 커피 한 잔이나 정기 후원은 독립적인 오픈 소스를 지속하고 발전시키는 데 가장 큰 힘이 됩니다. ☕✨`,
    sponsorButton: '💖 GitHub Sponsors에서 후원하기',
    tableHeaders: ['기능', '**react-native-inapp-inspector**', 'Flipper', 'Charles / Proxyman', 'RN Debugger'],
    tableRows: [
      ['**기기 단독 실행 (PC나 케이블 불필요)**', '✅', '❌', '❌', '❌'],
      ['**비활성 상태 제로 렌더링 (백그라운드 CPU 0%)**', '✅', '❌', '❌', '❌'],
      ['**HTTP/HTTPS 네트워크 인스펙터 (Fetch / Axios / XHR)**', '✅', '✅', '✅', '✅'],
      ['**타이밍 워터폴 및 P95 레이턴시**', '✅', '⚠️', '⚠️', '❌'],
      ['**cURL 및 Fetch 스니펫 원탭 즉시 복사**', '✅', '⚠️', '⚠️', '❌'],
      ['**양방향 WebSocket 및 Socket.IO 패킷 모니터링**', '✅', '❌', '⚠️', '⚠️'],
      ['**실시간 스토리지 편집기 (AsyncStorage & MMKV)**', '✅ (CRUD 지원)', '⚠️ (읽기 전용)', '❌', '⚠️'],
      ['**푸시 알림 로거 (APNs, FCM, Salesforce)**', '✅', '❌', '❌', '❌'],
      ['**Metro를 통한 실제 소스 코드 라인 번호 표시**', '✅ (정확한 라인)', '✅', '❌', '✅'],
      ['**Redux 상태 Diff 및 액션 타임라인**', '✅', '⚠️', '❌', '✅'],
      ['**애널리틱스 이벤트 추적 (Firebase, Mixpanel)**', '✅', '❌', '❌', '❌'],
      ['**크래시 방지 및 멀티 타입 브레드크럼 (Breadcrumbs)**', '✅', '❌', '❌', '❌'],
      ['**하드웨어 원격 측정 (RAM, 힙, 저장공간, 배터리, FPS)**', '✅', '⚠️', '❌', '❌'],
      ['**미디어 캡처 및 스튜디오 편집기 (자르기, 비디오 트리밍, 배지)**', '✅ (풀 스튜디오)', '❌', '❌', '❌'],
      ['**드래그 가능한 플로팅 FAB 및 반투명 모드 (Peek)**', '✅ (0.05 - 1.0)', '❌', '❌', '❌'],
      ['**Firebase Remote Config 기반 원격 모듈 제어**', '✅', '❌', '❌', '❌'],
      ['**바텀 시트 선택기가 포함된 25개 언어 지원**', '✅', '❌ (영어만 지원)', '❌', '❌'],
      ['**Expo (Bare / Managed) 및 React Native CLI**', '✅', '⚠️', '⚠️', '⚠️'],
    ],
    features: `### 🌐 1. 네트워크 인스펙터 및 타이밍 워터폴
- **범용 HTTP/HTTPS 인터셉트**: \`fetch\`, Axios 인스턴스, \`XMLHttpRequest\`를 자동으로 추적합니다.
- **지연 시간 분석**: 시각적 워터폴 바, 속도 등급 분류 (빠름 \`<200ms\`, 보통 \`200-800ms\`, 느림 \`>800ms\`).
- **실시간 텔레메트리 바**: 성공률 (%), 평균 지연 시간 (ms), P95 지연 시간 (ms)을 상시 표시합니다.
- **페이로드 뷰어**: 포맷된 JSON 트리, Raw 데이터, 요청/응답 헤더, 쿼리 파라미터, 호출자 파일 위치.
- **원터치 내보내기**: 원탭으로 **cURL 명령어**, **Fetch 코드 스니펫**, 요약 보고서로 복사합니다.

### ⚡ 2. WebSocket 및 Socket.IO 실시간 스트림 인스펙터
- **완벽한 프로토콜 지원**: 표준 WebSocket (\`ws://\`, \`wss://\`) 및 Socket.IO (\`v2\`, \`v3\`, \`v4\`).
- **양방향 프레임 타임라인**: 송신(⬆️) 및 수신(⬇️) 패킷을 정밀한 타임스탬프와 함께 기록합니다.
- **다양한 프레임 유형**: 텍스트, JSON, 바이너리 크기(ArrayBuffer), Ping/Pong 하트비트 식별.
- **연결 메타데이터**: 연결 상태, 핸드셰이크 파라미터, 전송 방식(websocket/polling), 재연결 이벤트.

### 💾 3. 스토리지 관리자 (AsyncStorage & MMKV)
- **통합 스토리지 인터페이스**: \`@react-native-async-storage/async-storage\` 및 \`react-native-mmkv\` 지원.
- **인앱 실시간 CRUD**: 폰 화면에서 직접 키 검색, 생성, 수정, 삭제가 가능합니다.
- **스마트 타입 분석**: JSON 객체, 배열, 불리언, 숫자, 문자열을 자동으로 구분하여 표시합니다.

### 🔔 4. 푸시 알림 로거
- **다양한 공급자 지원**: FCM, APNs, Salesforce Marketing Cloud, OneSignal, Notifee.
- **앱 상태 추적**: 포그라운드, 백그라운드 또는 앱 종료 상태에서의 수신 여부를 판별합니다.
- **페이로드 검사**: 데이터 파라미터, 딥링크 URL, 제목, 본문, 채널 ID를 상세히 검사합니다.

### 🪵 5. 콘솔 로거 및 Metro 소스맵 심볼리케이션
- **정확한 코드 라인 번호**: \`console.log\`, \`warn\`, \`error\`를 가로채 Metro 번들러를 통해 실제 소스 파일과 라인 번호를 표시합니다 (\`HomeScreen.tsx:42:15\`).
- **인자 개별 분석**: 전달된 각 인자를 타입 정보와 함께 개별 카드로 검사합니다.
- **콜 스택 및 에러 스택**: 함수 이름, 파일 경로, Error 객체의 스택 트레이스를 구조화하여 표시합니다.
- **중복 로그 집약**: 동일한 로그가 반복 출력될 경우 \`×N\` 카운터로 자동 축약합니다.

### 🔄 6. Redux 상태 Diff 및 액션 타임라인
- **Redux Toolkit 완벽 연동**: Redux Store, RTK Query, \`redux-persist\`와 원활하게 연동됩니다.
- **액션 타임라인**: 디스패치된 액션의 순차적 기록과 실행 시간 및 페이로드를 기록합니다.
- **색상별 상태 Diff**: 상태 변경 사항을 시각적으로 강조합니다 (**초록색**: 추가, **노란색**: 수정, **빨간색**: 삭제).

### 📊 7. 애널리틱스 이벤트 트래커
- **Firebase Analytics 자동 가로채기**: \`logEvent\`, \`logScreenView\`, \`setUserProperties\`, \`setUserId\`를 자동 기록합니다.
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
- **흔들기 제스처**: 기기를 흔들거나 \`Ctrl+Cmd+Z\` / \`Cmd+M\`을 눌러 인스펙터를 엽니다.

### 📸 10. 네이티브 미디어 캡처 및 인앱 스튜디오 에디터
- **기기에서 직접 캡처**: 고해상도 스크린샷, 부드러운 MP4 화면 녹화, 애니메이션 GIF를 손쉽게 생성합니다.
- **미디어 갤러리**: 사진, 비디오, GIF를 탐색 및 필터링하고 일괄 삭제 및 URI 복사를 지원합니다.
- **사진 및 비디오 스튜디오 에디터**:
  - **자르기 및 해상도 조절**: 표준 비율(1:1 정사각형, 4:3, 16:9)로 자르고 파일 용량을 줄이기 위한 해상도 축소를 지원합니다.
  - **비디오 트리밍 및 오디오 제어**: 시작/종료 지점 조절, 재생 속도 변경(0.5× – 2.0×), 오디오 음소거.
  - **PNG 프레임 스냅샷**: 비디오 재생 중 원하는 순간을 고해상도 PNG 이미지로 즉시 추출합니다.
- **QA 결함 마킹 및 주석 도구**:
  - **인스타그램 3×3 그리드**: 픽셀 단위 레이아웃 정렬을 확인하기 위한 가이드 라인을 제공합니다.
  - **순차적 단계 번호 배지**: 재현 단계를 명확히 표시하기 위해 번호 배지(\`1\`, \`2\`, \`3\`...)를 터치하거나 드래그하여 배치합니다.
  - **버그 및 메모 태그**: 버그(\`🐛\`), 메모(\`📝\`), 경고 스티커를 간편하게 부착합니다.
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
- **인터랙티브 바텀 시트**: 상단 헤더의 \`[ 🌐 KO ▾ ]\` 버튼을 눌러 국기 아이콘과 실시간 검색이 가능한 시트에서 바로 전환할 수 있습니다.`,
    installTitle: '📦 설치하기',
    quickstartTitle: '🚀 빠른 시작',
    searchTitle: '🔎 DevTools 검색 구문',
  },
  'ru': {
    title: 'React Native In-App Inspector (Инструмент Встроенной Отладки)',
    description: `**Универсальный инструмент для внутрипрограммной отладки React Native и Expo без конфигурации**. Инспектируйте HTTP/HTTPS сетевой трафик, потоки WebSocket и Socket.IO в реальном времени, логи консоли с точными номерами строк через Metro, диффы состояния Redux, хранилища AsyncStorage и MMKV, push-уведомления, показатели железа и делайте скриншоты/видеозаписи со встроенным студийным редактором прямо на телефоне без проводов.`,
    quote: `🚀 **Современная легковесная альтернатива Flipper, Charles, Proxyman и Chucker** — работает полностью автономно на устройстве, в тестовых сборках (APK/TestFlight) и не требует кабелей или настольных программ.`,
    videoFull: 'Смотреть Полную Видео-Демонстрацию (MP4)',
    videoOriginal: 'Оригинальный MOV',
    whyTitle: '⚡ Сравнение с Другими Инструментами',
    featuresTitle: '✨ Ключевые Модули и Возможности',
    sponsorTitle: '💖 Создано с Любовью для Каждого Разработчика, Ловившего Неуловимый Баг в 2 Часа Ночи',
    sponsorQuote: `«Мы создали react-native-inapp-inspector, потому что на собственном опыте знаем боль запутанных проводов, отваливающихся портов отладчика и загадочных крашей в тестовых сборках. Мы вложили сотни бессонных ночей и всю душу, чтобы каждый мобильный инженер и тестировщик в мире мог отлаживать приложения на реальных устройствах легко, свободно и с удовольствием.»`,
    sponsorBody: `Если этот инструмент сэкономил вам часы нервов, помог вовремя выпустить критически важный релиз или сделал вашу работу приятнее — <b>пожалуйста, поддержите проект спонсорством</b>. Даже чашка кофе или ежемесячная поддержка значат для нас бесконечно много и помогают сохранять независимый open-source проект живым для всех. ☕✨`,
    sponsorButton: '💖 Поддержать на GitHub Sponsors',
    tableHeaders: ['Возможность', '**react-native-inapp-inspector**', 'Flipper', 'Charles / Proxyman', 'RN Debugger'],
    tableRows: [
      ['**Автономно на устройстве (Без ПК и проводов)**', '✅', '❌', '❌', '❌'],
      ['**Нулевая нагрузка в простое (0% CPU в фоне)**', '✅', '❌', '❌', '❌'],
      ['**Сетевой логгер HTTP/HTTPS (Fetch / Axios / XHR)**', '✅', '✅', '✅', '✅'],
      ['**Водопад задержек и перцентиль P95**', '✅', '⚠️', '⚠️', '❌'],
      ['**Мгновенный экспорт сниппетов cURL и Fetch**', '✅', '⚠️', '⚠️', '❌'],
      ['**Двунаправленный мониторинг WebSocket и Socket.IO**', '✅', '❌', '⚠️', '⚠️'],
      ['**Живой редактор хранилища (AsyncStorage и MMKV)**', '✅ (CRUD)', '⚠️ (Только чтение)', '❌', '⚠️'],
      ['**Логгер Push-уведомлений (APNs, FCM, Salesforce)**', '✅', '❌', '❌', '❌'],
      ['**Логи с реальными строками исходного кода через Metro**', '✅ (Точная строка)', '✅', '❌', '✅'],
      ['**Diffs состояния Redux и хронология экшенов**', '✅', '⚠️', '❌', '✅'],
      ['**Трекер аналитических событий (Firebase, Mixpanel)**', '✅', '❌', '❌', '❌'],
      ['**Защита от сбоев и цепочка действий (Breadcrumbs)**', '✅', '❌', '❌', '❌'],
      ['**Телеметрия железа (RAM, куча, диск, батарея, FPS)**', '✅', '⚠️', '❌', '❌'],
      ['**Захват медиа и студийный редактор (Crop, Trim, Badges)**', '✅ (Полная студия)', '❌', '❌', '❌'],
      ['**Перетаскиваемый FAB и режим прозрачности (Peek Mode)**', '✅ (0.05 - 1.0)', '❌', '❌', '❌'],
      ['**Удаленное управление модулями через Firebase Remote Config**', '✅', '❌', '❌', '❌'],
      ['**25 языков с выбором в нижнем экране (Bottom Sheet)**', '✅', '❌ (Только английский)', '❌', '❌'],
      ['**Expo (Bare / Managed) и React Native CLI**', '✅', '⚠️', '⚠️', '⚠️'],
    ],
    features: `### 🌐 1. Инспектор Сети и Водопад Задержек
- **Универсальный перехват HTTP/HTTPS**: Автоматически поддерживает \`fetch\`, экземпляры Axios и \`XMLHttpRequest\`.
- **Анализ Задержек**: Пропорциональные полосы водопада, градация скорости (Быстро \`<200ms\`, Средне \`200-800ms\`, Медленно \`>800ms\`).
- **Панель Телеметрии**: Процент успешных запросов (%), Средняя задержка (мс) и задержка P95 (мс) в реальном времени.
- **Просмотр Полезной Нагрузки**: Форматированное дерево JSON, сырые данные, заголовки запроса/ответа, параметры и файл-источник.
- **Быстрый Экспорт**: Копирование в один клик как команда **cURL**, сниппет **Fetch** или краткий отчет.

### ⚡ 2. Инспектор Потоков WebSocket и Socket.IO в Реальном Времени
- **Полная Поддержка Протоколов**: Нативный WebSocket (\`ws://\`, \`wss://\`) и Socket.IO (\`v2\`, \`v3\`, \`v4\`).
- **Двунаправленная Хронология**: Отслеживание пакетов (⬆️ Отправлено, ⬇️ Получено) с миллисекундной точностью.
- **Определение Типов**: Текст, JSON-данные, размер бинарных данных (ArrayBuffer) и Ping/Pong сигналы.
- **Метаданные Соединения**: Статус, параметры рукопожатия (handshake), транспорт (websocket/polling) и переподключения.

### 💾 3. Менеджер Хранилища (AsyncStorage и MMKV)
- **Единый Интерфейс**: Поддержка \`@react-native-async-storage/async-storage\` и \`react-native-mmkv\`.
- **Живые CRUD-Операции**: Просматривайте, ищите, создавайте, редактируйте и удаляйте ключи прямо на экране телефона.
- **Умное Распознавание Типов**: Автоматически различает объекты JSON, массивы, логические значения, числа и строки.

### 🔔 4. Логгер Push-Уведомлений
- **Множество Провайдеров**: FCM, APNs, Salesforce Marketing Cloud, OneSignal и Notifee.
- **Отслеживание Состояния Приложения**: Определяет получение на переднем плане (**Foreground**), в фоне (**Background**) или запуск из закрытого состояния (**Killed**).
- **Инспекция Данных**: Параметры полезной нагрузки, диплинки, заголовки, текст и ID каналов.

### 🪵 5. Логгер Консоли и Символизация Metro Source-Map
- **Точные Номера Строк**: Перехватывает \`console.log\`, \`warn\` и \`error\`, сопоставляя их через Metro с файлами проекта и строками (\`HomeScreen.tsx:42:15\`).
- **Детализация Аргументов**: Индивидуальный просмотр каждого переданного аргумента с указанием типа.
- **Стек Вызовов и Ошибок**: Структурированные карточки с именами функций, файлами и трассировками исключений.
- **Группировка Повторов**: Автоматическое сворачивание одинаковых логов со счетчиком (\`×N\`).

### 🔄 6. Diffs Состояния Redux и Хронология Экшенов
- **Интеграция с Redux Toolkit**: Поддержка Redux Store, RTK Query и \`redux-persist\`.
- **Хронология Экшенов**: Последовательная запись отправленных действий с длительностью и полезной нагрузкой.
- **Цветные Diffs Состояния**: Наглядная подсветка (**Зеленый** — добавления, **Желтый** — изменения, **Красный** — удаления).

### 📊 7. Трекер Аналитических Событий
- **Авто-Перехват Firebase Analytics**: Автоматически отслеживает \`logEvent\`, \`logScreenView\`, \`setUserProperties\` и \`setUserId\`.
- **Модульная Архитектура**: Легко подключается к Google Analytics 4, Mixpanel, Segment и Amplitude.
- **Проверка Параметров**: Просматривайте параметры событий, свойства пользователей и временные метки.

### 🛡️ 8. Защита от Сбоев и Глобальный Error Boundary
- **Изолированный Micro-UI**: Инспектор работает в изолированной среде и не вызовет падение основного приложения.
- **Глобальный ErrorBoundary**: Перехватывает необработанные сбои рендеринга React с экраном восстановления.
- **Цепочка Действий (Breadcrumbs)**: Восстанавливает экраны навигации, сетевые запросы и экшены Redux перед падением.

### 📱 9. Нативная Телеметрия Оборудования, RAM и Производительности
- **Системные Метрики**: Общий и свободный объем RAM, Нативная куча, Свободное место на диске, Батарея и архитектура процессора.
- **Живой Счетчик FPS**: Непрерывный мониторинг частоты обновления экрана.
- **Авто-Очистка Памяти**: Автоматически освобождает кэш при получении системных предупреждений о нехватке памяти.
- **Жест Встряхивания**: Встряхните телефон или нажмите \`Ctrl+Cmd+Z\` / \`Cmd+M\`, чтобы открыть инспектор.

### 📸 10. Нативный Захват Медиа и Студийный Редактор в Приложении
- **Захват на Устройстве**: Создавайте снимки экрана высокого разрешения, плавные видеозаписи MP4 и анимированные GIF.
- **Полнофункциональная Галерея**: Просматривайте, фильтруйте (Фото, Видео, GIF), удаляйте пакетами и копируйте URI.
- **Студия Редактирования Фото и Видео**:
  - **Кадрирование и Масштабирование**: Стандартные пропорции (1:1 Квадрат, 4:3, 16:9) и уменьшение разрешения для быстрой отправки.
  - **Обрезка Видео и Аудио**: Настройка начальной/конечной точек, изменение скорости (0.5× – 2.0×) или отключение звука.
  - **Снимок Кадра PNG**: Мгновенное извлечение PNG-кадра высокого разрешения из любого видео в одно касание.
- **Инструменты QA и Разметки Ошибок**:
  - **Сетка 3×3 Instagram**: Включение направляющих линий для проверки выравнивания элементов интерфейса.
  - **Нумерованные Бейджи Шагов**: Размещение меток с номерами (\`1\`, \`2\`, \`3\`...) для иллюстрации шагов воспроизведения бага.
  - **Теги Ошибок и Заметок**: Добавление графических значков багов (\`🐛\`), заметок (\`📝\`) и предупреждений.
  - **Текст и Водяной Знак QA**: Добавление текстовых пояснений и водяного знака с моделью устройства и версией ОС.
- **Импорт из Галереи**: Импорт фото или видео из медиатеки устройства для редактирования и проверки.

### 🎛️ 11. Перетаскиваемый Плавающий FAB и Режим Прозрачности (Peek Mode)
- **Плавающий Лаунчер**: Перемещаемая в любой угол кнопка с бейджем непрочитанных уведомлений.
- **Нижняя Зона Закрытия**: Перетащите на светящуюся нижнюю цель для удобного скрытия кнопки.
- **Режим Прозрачности (Peek Mode)**: Настройка прозрачности от 0.05 до 1.0 для работы с приложением при одновременном мониторинге данных и сети.

### ☁️ 12. Управление Модулями через Firebase Remote Config
- **Удаленные Feature Flags**: Включение или отключение вкладок инспектора в релизных или тестовых сборках через облако без выпуска новой версии приложения.

### 🌍 13. 25 Мировых Языков и Интерактивный Нижний Экран
- **25 Поддерживаемых Языков**: Русский, Английский, Испанский, Немецкий, Французский, Итальянский, Португальский, Японский, Корейский, Китайский, Арабский, Хинди и др.
- **Интерактивный Bottom Sheet**: Нажмите на \`[ 🌐 RU ▾ ]\` в заголовке, чтобы открыть панель выбора с флагами стран и мгновенным поиском.`,
    installTitle: '📦 Установка',
    quickstartTitle: '🚀 Быстрый Старт',
    searchTitle: '🔎 Синтаксис Поиска DevTools',
  },
  'ar': {
    title: 'React Native In-App Inspector (أداة فحص وتصحيح الأخطاء داخل التطبيق)',
    description: `**مجموعة أدوات فحص وتصحيح الأخطاء الشاملة داخل التطبيق وبدون أي إعدادات مسبقة لتطبيقات React Native و Expo**. تتبع حركة مرور شبكة HTTP/HTTPS، وتدفقات WebSocket و Socket.IO اللحظية، وسجلات وحدة التحكم مع أرقام الأسطر الدقيقة عبر Metro، وفروقات حالة Redux، والتخزين الحي لـ AsyncStorage و MMKV، والإشعارات اللحظية، ومؤشرات أداء العتاد، والتقاط لقطات الشاشة أو تسجيلات الفيديو مع استوديو تحرير متكامل مباشرة على هاتفك وبدون أي كابلات.`,
    quote: `🚀 **البديل الحديث وخفيف الوزن لأدوات Flipper و Charles و Proxyman و Chucker** — يعمل بشكل مستقل تماماً على الجهاز، وفي إصدارات الاختبار (APK/TestFlight) وبدون الحاجة لربط الجهاز بالكمبيوتر عبر كابل.`,
    videoFull: 'مشاهدة فيديو العرض التوضيحي الكامل (MP4)',
    videoOriginal: 'ملف MOV الأصلي',
    whyTitle: '⚡ المقارنة مع الأدوات الأخرى',
    featuresTitle: '✨ أبرز الوحدات والمميزات',
    sponsorTitle: '💖 صُنع بحب لكل مبرمج سهر حتى الثانية صباحاً يطارد خطأً برمجياً غامضاً',
    sponsorQuote: `«قمنا بابتكار react-native-inapp-inspector لأننا ندرك تماماً معاناة الكابلات المتشابكة، والمنافذ المعطلة، والانهيارات المفاجئة في نسخ الاختبار. لقد سكبنا ليالي لا تحصى من العمل المتواصل وشغفاً لا ينتهي حتى يتمكن كل مهندس تطبيقات ومختبر جودة في العالم من تصحيح الأخطاء بحرية وسلاسة تامة.»`,
    sponsorBody: `إذا كانت هذه الأداة قد وفرت عليك ساعات من الإحباط والجهد، أو ساعدتك في إطلاق تطبيقك في الموعد المحدد — <b>فنرجو منك التكرم برعاية ودعم هذا المشروع</b>. فنجان قهوة بسيط أو رعاية شهرية يمثلان فارقاً هائلاً ويضمنان استمرار هذا العمل مفتوح المصدر ومتاحاً للجميع مجاناً. ☕✨`,
    sponsorButton: '💖 ادعم المشروع عبر GitHub Sponsors',
    tableHeaders: ['الميزة', '**react-native-inapp-inspector**', 'Flipper', 'Charles / Proxyman', 'RN Debugger'],
    tableRows: [
      ['**يعمل مستقلاً على الجهاز (بدون كمبيوتر أو كابلات)**', '✅', '❌', '❌', '❌'],
      ['**استهلاك صفري عند الخمول (0% معالج في الخلفية)**', '✅', '❌', '❌', '❌'],
      ['**فحص شبكة HTTP/HTTPS (Fetch / Axios / XHR)**', '✅', '✅', '✅', '✅'],
      ['**مخطط زمن الاستجابة والنسبة المئوية P95**', '✅', '⚠️', '⚠️', '❌'],
      ['**نسخ فوري لأوامر cURL وشفرات Fetch**', '✅', '⚠️', '⚠️', '❌'],
      ['**مراقبة ثنائية الاتجاه لـ WebSocket و Socket.IO**', '✅', '❌', '⚠️', '⚠️'],
      ['**محرر التخزين الحي (AsyncStorage و MMKV)**', '✅ (CRUD كامل)', '⚠️ (قراءة فقط)', '❌', '⚠️'],
      ['**مسجل الإشعارات اللحظية (APNs, FCM, Salesforce)**', '✅', '❌', '❌', '❌'],
      ['**سجلات مع أرقام الأسطر الحقيقية عبر Metro**', '✅ (السطر الدقيق)', '✅', '❌', '✅'],
      ['**فروقات حالة Redux والجدول الزمني للإجراءات**', '✅', '⚠️', '❌', '✅'],
      ['**متتبع أحداث التحليلات (Firebase, Mixpanel)**', '✅', '❌', '❌', '❌'],
      ['**الحماية من الانهيار ومسار التتبع (Breadcrumbs)**', '✅', '❌', '❌', '❌'],
      ['**القياس عن بُعد للعتاد (الذاكرة، القرص، البطارية، FPS)**', '✅', '⚠️', '❌', '❌'],
      ['**التقاط الوسائط واستوديو التحرير (قص، تقليم فيديو، شارات)**', '✅ (استوديو متكامل)', '❌', '❌', '❌'],
      ['**زر عائم قابل للسحب ووضع الشفافية (Peek Mode)**', '✅ (0.05 - 1.0)', '❌', '❌', '❌'],
      ['**إدارة الوحدات عن بعد عبر Firebase Remote Config**', '✅', '❌', '❌', '❌'],
      ['**25 لغة مع لوحة اختيار سفلية تفاعلية (Bottom Sheet)**', '✅', '❌ (الإنجليزية فقط)', '❌', '❌'],
      ['**Expo (Bare / Managed) و React Native CLI**', '✅', '⚠️', '⚠️', '⚠️'],
    ],
    features: `### 🌐 1. فاحص الشبكة ومخطط زمن الاستجابة التنازلي
- **اعتراض شامل لـ HTTP/HTTPS**: يدعم تلقائياً \`fetch\`، ومثيلات Axios، و \`XMLHttpRequest\`.
- **تفصيل زمن الاستجابة**: أشرطة شلالية متناسبة وتصنيف للسرعة (سريع \`<200ms\`، متوسط \`200-800ms\`، بطيء \`>800ms\`).
- **شريط القياس اللحظي**: نسبة النجاح (%)، متوسط زمن الاستجابة (ms)، وزمن الاستجابة P95 (ms).
- **عارض البيانات**: شجرة JSON منسقة، وعرض البيانات الخام، وترويسات الطلب والاستجابة، والمعلمات، ومصدر الاستدعاء.
- **تصدير بنقرة واحدة**: نسخ فوري كأمر **cURL**، أو شفرة **Fetch**، أو تقرير ملخص.

### ⚡ 2. فاحص تدفقات WebSocket و Socket.IO في الوقت الفعلي
- **تغطية كاملة للبروتوكولات**: دعم كامل لـ WebSocket الأصلي (\`ws://\`, \`wss://\`) و Socket.IO (\`v2\`, \`v3\`, \`v4\`).
- **جدول زمني ثنائي الاتجاه**: تتبع الحزم (⬆️ المرسلة، ⬇️ المستقبلة) مع طوابع زمنية عالية الدقة.
- **تحديد أنواع الحزم**: نصوص، بيانات JSON، أحجام البيانات الثنائية (ArrayBuffer)، ونبضات Ping/Pong.
- **بيانات الاتصال الوصفية**: حالة الاتصال، معلمات المصافحة، نوع النقل (websocket/polling)، وأحداث إعادة الاتصال.

### 💾 3. مدير التخزين المحلي (AsyncStorage و MMKV)
- **واجهة تخزين موحدة**: دعم \`@react-native-async-storage/async-storage\` و \`react-native-mmkv\`.
- **عمليات CRUD حية داخل التطبيق**: استعراض، والبحث، وإنشاء، وتعديل، وحذف المفاتيح مباشرة من شاشة الهاتف.
- **تحليل ذكي للأنواع**: التعرف التلقائي على كائنات JSON، والمصفوفات، والقيم المنطقية، والأرقام، والنصوص.

### 🔔 4. مسجل الإشعارات اللحظية (Push Notifications)
- **دعم موفرين متعددين**: FCM، و APNs، و Salesforce Marketing Cloud، و OneSignal، و Notifee.
- **تتبع حالة التطبيق**: يحدد ما إذا تم استلام الإشعار في الواجهة (**Foreground**)، أو الخلفية (**Background**)، أو عند فتح التطبيق من حالة الإغلاق (**Killed**).
- **فحص البيانات المرفقة**: فحص المعلمات، والروابط العميقة (Deep Links)، والعناوين، والنصوص، ومعرفات القنوات.

### 🪵 5. مسجل وحدة التحكم ومطابقة خرائط المصدر (Metro Symbolication)
- **أرقام أسطر دقيقة**: يعترض \`console.log\` و \`warn\` و \`error\` ويعرض الملف الحقيقي ورقم السطر عبر Metro (\`HomeScreen.tsx:42:15\`).
- **تفصيل المعاملات**: فحص كل معامل تم تمريره على حدة مع تحديد نوعه.
- **تتبع الاستدعاءات والأخطاء**: بطاقات هيكلية لأسماء الدوال والملفات ومسارات تتبع الأخطاء.
- **تجميع التكرارات**: طي المخرجات المكررة المتتالية مع عداد (\`×N\`).

### 🔄 6. تتبع تغييرات حالة Redux والجدول الزمني للإجراءات
- **تكامل تام مع Redux Toolkit**: دعم Redux Store، و RTK Query، و \`redux-persist\`.
- **الجدول الزمني للإجراءات**: سجل زمني للإجراءات المرسلة مع مدة التنفيذ والبيانات المرفقة.
- **مقارنة مرئية ملونة للحالات**: تمييز التغييرات بالألوان (**الأخضر** للإضافة، **الأصفر** للتعديل، **الأحمر** للحذف).

### 📊 7. متتبع أحداث التحليلات (Analytics Tracker)
- **تتبع تلقائي لـ Firebase Analytics**: اعتراض تلقائي لـ \`logEvent\`، و \`logScreenView\`، و \`setUserProperties\`، و \`setUserId\`.
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
- **إيماءة الهز**: هز الجهاز الفعلي أو الضغط على \`Ctrl+Cmd+Z\` / \`Cmd+M\` لفتح الفاحص.

### 📸 10. التقاط الوسائط الأصلي واستوديو التحرير داخل التطبيق
- **التقاط مباشر على الجهاز**: إنشاء لقطات شاشة عالية الدقة، وتسجيلات فيديو MP4 سلسة، وصور GIF متحركة.
- **معرض وسائط متكامل**: تصفح، وتصفية (صور، فيديو، GIF)، وحذف مجمع، ونسخ مسارات URI.
- **استوديو تحرير الصور والفيديو**:
  - **القص وتغيير الحجم**: أبعاد قياسية (مربع 1:1، 4:3، 16:9) وتصغير الدقة لتقليل الحجم قبل الرفع.
  - **تقليم الفيديو والصوت**: ضبط نقاط البداية/النهاية، وتعديل سرعة التشغيل (0.5× – 2.0×)، أو كتم الصوت.
  - **استخراج إطارات PNG**: استخراج لقطات PNG عالية الدقة من أي فيديو بنقرة واحدة.
- **أدوات فحص الجودة والتأشير على الأخطاء**:
  - **شبكة 3×3 لضبط المحاذاة**: شبكة إرشادية لفحص دقة التصميم بالبكسل.
  - **شارات خطوات مرقمة**: وضع شارات مرقمة (\`1\`، \`2\`، \`3\`...) لتوثيق خطوات تكرار الخطأ.
  - **وسوم للأخطاء والملاحظات**: إضافة علامات الأخطاء (\`🐛\`) والملاحظات (\`📝\`) والتنبيهات.
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
- **لوحة اختيار سفلية**: اضغط على \`[ 🌐 AR ▾ ]\` في شريط الأدوات لفتح لوحة الاختيار المزودة بالأعلام والبحث الفوري.`,
    installTitle: '📦 التثبيت',
    quickstartTitle: '🚀 البدء السريع',
    searchTitle: '🔎 صيغ البحث المتقدمة في DevTools',
  }
};

function renderSponsorCard(t) {
  return `<table align="center" width="100%">
  <tr>
    <td align="center" style="padding: 24px; background: linear-gradient(135deg, rgba(236,72,153,0.1), rgba(99,102,241,0.1)); border-radius: 16px; border: 1px solid rgba(236,72,153,0.35);">
      <h3 align="center">${t.sponsorTitle}</h3>
      <p align="center">
        <i>${t.sponsorQuote}</i>
      </p>
      <p align="center">
        ${t.sponsorBody}
      </p>
      <p align="center">
        <a href="https://github.com/sponsors/vengatmacuser">
          <img src="https://img.shields.io/badge/Sponsor%20%40vengatmacuser-${encodeURIComponent(t.sponsorButton.replace('💖 ', ''))}-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white" alt="Sponsor on GitHub Sponsors" />
        </a>
      </p>
    </td>
  </tr>
</table>`;
}

function generateReadmeContent(langKey) {
  const t = translations[langKey];
  if (!t) return;

  const tableHeaderStr = `| ${t.tableHeaders.join(' | ')} |\n| ${t.tableHeaders.map((_, i) => i === 0 ? ':---' : ':---:').join(' | ')} |`;
  const tableRowsStr = t.tableRows.map(row => `| ${row.join(' | ')} |`).join('\n');

  return `<p align="center">
  <a href="https://github.com/vengatmacuser/react-native-inapp-inspector">
    <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/inapp_inspector_icon.gif" alt="React Native In-App Inspector Icon" width="120" height="120" style="border-radius: 28px; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.45);" />
  </a>
</p>

# ${t.title}

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

${t.description}

> ${t.quote}

<p align="center">
  <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/walkthrough.gif" alt="React Native In-App Inspector Walkthrough" width="360" style="border-radius: 20px; box-shadow: 0 12px 36px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  🎬 <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mp4">${t.videoFull}</a></b> | <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mov">${t.videoOriginal}</a></b>
</p>

---

${renderSponsorCard(t)}

---

## ${t.whyTitle}

${tableHeaderStr}
${tableRowsStr}

---

## ${t.featuresTitle}

${t.features}

---

## ${t.searchTitle}

\`\`\`text
method:POST status:200         # Filter POST requests with 200 OK
url:api.myapp.com -analytics   # Filter domain and exclude analytics
header:authorization           # Filter requests containing auth header
body:"orderId"                 # Search in request/response JSON body
page:CheckoutScreen            # Filter logs by screen/route name
file:ProfileView.tsx           # Filter console logs by source file
-healthcheck -socket.io        # Exclude unwanted logs
\`\`\`

---

## ${t.installTitle}

\`\`\`bash
npm install --save-dev react-native-inapp-inspector react-native-svg
# or
yarn add -D react-native-inapp-inspector react-native-svg
# or
pnpm add -D react-native-inapp-inspector react-native-svg
\`\`\`

#### iOS CocoaPods
\`\`\`bash
cd ios && pod install && cd ..
\`\`\`

### Expo
\`\`\`bash
npx expo install react-native-inapp-inspector react-native-svg
\`\`\`

---

## ${t.quickstartTitle}

\`\`\`tsx
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
\`\`\`
`;
}

// Write to all target files
for (const langKey of Object.keys(translations)) {
  const fileName = `README.${langKey}.md`;
  const filePath = path.join(rootDir, fileName);
  const content = generateReadmeContent(langKey);
  if (content) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated ${fileName}`);
  }
}
