<p align="center">
  <a href="https://github.com/vengatmacuser/react-native-inapp-inspector">
    <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/inapp_inspector_icon.gif" alt="React Native In-App Inspector Icon" width="120" height="120" style="border-radius: 28px; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.45);" />
  </a>
</p>

# React Native In-App Inspector (Инструмент Встроенной Отладки)

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

**Универсальный инструмент для внутрипрограммной отладки React Native и Expo без конфигурации**. Инспектируйте HTTP/HTTPS сетевой трафик, потоки WebSocket и Socket.IO в реальном времени, логи консоли с точными номерами строк через Metro, диффы состояния Redux, хранилища AsyncStorage и MMKV, push-уведомления, показатели железа и делайте скриншоты/видеозаписи со встроенным студийным редактором прямо на телефоне без проводов.

> 🚀 **Современная легковесная альтернатива Flipper, Charles, Proxyman и Chucker** — работает полностью автономно на устройстве, в тестовых сборках (APK/TestFlight) и не требует кабелей или настольных программ.

<p align="center">
  <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/walkthrough.gif" alt="React Native In-App Inspector Walkthrough" width="360" style="border-radius: 20px; box-shadow: 0 12px 36px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  🎬 <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mp4">Смотреть Полную Видео-Демонстрацию (MP4)</a></b> | <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mov">Оригинальный MOV</a></b>
</p>

---

<table align="center" width="100%">
  <tr>
    <td align="center" style="padding: 24px; background: linear-gradient(135deg, rgba(236,72,153,0.1), rgba(99,102,241,0.1)); border-radius: 16px; border: 1px solid rgba(236,72,153,0.35);">
      <h3 align="center">💖 Создано с Любовью для Каждого Разработчика, Ловившего Неуловимый Баг в 2 Часа Ночи</h3>
      <p align="center">
        <i>«Мы создали react-native-inapp-inspector, потому что на собственном опыте знаем боль запутанных проводов, отваливающихся портов отладчика и загадочных крашей в тестовых сборках. Мы вложили сотни бессонных ночей и всю душу, чтобы каждый мобильный инженер и тестировщик в мире мог отлаживать приложения на реальных устройствах легко, свободно и с удовольствием.»</i>
      </p>
      <p align="center">
        Если этот инструмент сэкономил вам часы нервов, помог вовремя выпустить критически важный релиз или сделал вашу работу приятнее — <b>пожалуйста, поддержите проект спонсорством</b>. Даже чашка кофе или ежемесячная поддержка значат для нас бесконечно много и помогают сохранять независимый open-source проект живым для всех. ☕✨
      </p>
      <p align="center">
        <a href="https://github.com/sponsors/vengatmacuser">
          <img src="https://img.shields.io/badge/Sponsor%20%40vengatmacuser-%D0%9F%D0%BE%D0%B4%D0%B4%D0%B5%D1%80%D0%B6%D0%B0%D1%82%D1%8C%20%D0%BD%D0%B0%20GitHub%20Sponsors-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white" alt="Sponsor on GitHub Sponsors" />
        </a>
      </p>
    </td>
  </tr>
</table>

---

## ⚡ Сравнение с Другими Инструментами

| Возможность | **react-native-inapp-inspector** | Flipper | Charles / Proxyman | RN Debugger |
| :--- | :---: | :---: | :---: | :---: |
| **Автономно на устройстве (Без ПК и проводов)** | ✅ | ❌ | ❌ | ❌ |
| **Нулевая нагрузка в простое (0% CPU в фоне)** | ✅ | ❌ | ❌ | ❌ |
| **Сетевой логгер HTTP/HTTPS (Fetch / Axios / XHR)** | ✅ | ✅ | ✅ | ✅ |
| **Водопад задержек и перцентиль P95** | ✅ | ⚠️ | ⚠️ | ❌ |
| **Мгновенный экспорт сниппетов cURL и Fetch** | ✅ | ⚠️ | ⚠️ | ❌ |
| **Двунаправленный мониторинг WebSocket и Socket.IO** | ✅ | ❌ | ⚠️ | ⚠️ |
| **Живой редактор хранилища (AsyncStorage и MMKV)** | ✅ (CRUD) | ⚠️ (Только чтение) | ❌ | ⚠️ |
| **Логгер Push-уведомлений (APNs, FCM, Salesforce)** | ✅ | ❌ | ❌ | ❌ |
| **Логи с реальными строками исходного кода через Metro** | ✅ (Точная строка) | ✅ | ❌ | ✅ |
| **Diffs состояния Redux и хронология экшенов** | ✅ | ⚠️ | ❌ | ✅ |
| **Трекер аналитических событий (Firebase, Mixpanel)** | ✅ | ❌ | ❌ | ❌ |
| **Защита от сбоев и цепочка действий (Breadcrumbs)** | ✅ | ❌ | ❌ | ❌ |
| **Телеметрия железа (RAM, куча, диск, батарея, FPS)** | ✅ | ⚠️ | ❌ | ❌ |
| **Захват медиа и студийный редактор (Crop, Trim, Badges)** | ✅ (Полная студия) | ❌ | ❌ | ❌ |
| **Перетаскиваемый FAB и режим прозрачности (Peek Mode)** | ✅ (0.05 - 1.0) | ❌ | ❌ | ❌ |
| **Удаленное управление модулями через Firebase Remote Config** | ✅ | ❌ | ❌ | ❌ |
| **25 языков с выбором в нижнем экране (Bottom Sheet)** | ✅ | ❌ (Только английский) | ❌ | ❌ |
| **Expo (Bare / Managed) и React Native CLI** | ✅ | ⚠️ | ⚠️ | ⚠️ |

---

## ✨ Ключевые Модули и Возможности

### 🌐 1. Инспектор Сети и Водопад Задержек
- **Универсальный перехват HTTP/HTTPS**: Автоматически поддерживает `fetch`, экземпляры Axios и `XMLHttpRequest`.
- **Анализ Задержек**: Пропорциональные полосы водопада, градация скорости (Быстро `<200ms`, Средне `200-800ms`, Медленно `>800ms`).
- **Панель Телеметрии**: Процент успешных запросов (%), Средняя задержка (мс) и задержка P95 (мс) в реальном времени.
- **Просмотр Полезной Нагрузки**: Форматированное дерево JSON, сырые данные, заголовки запроса/ответа, параметры и файл-источник.
- **Быстрый Экспорт**: Копирование в один клик как команда **cURL**, сниппет **Fetch** или краткий отчет.

### ⚡ 2. Инспектор Потоков WebSocket и Socket.IO в Реальном Времени
- **Полная Поддержка Протоколов**: Нативный WebSocket (`ws://`, `wss://`) и Socket.IO (`v2`, `v3`, `v4`).
- **Двунаправленная Хронология**: Отслеживание пакетов (⬆️ Отправлено, ⬇️ Получено) с миллисекундной точностью.
- **Определение Типов**: Текст, JSON-данные, размер бинарных данных (ArrayBuffer) и Ping/Pong сигналы.
- **Метаданные Соединения**: Статус, параметры рукопожатия (handshake), транспорт (websocket/polling) и переподключения.

### 💾 3. Менеджер Хранилища (AsyncStorage и MMKV)
- **Единый Интерфейс**: Поддержка `@react-native-async-storage/async-storage` и `react-native-mmkv`.
- **Живые CRUD-Операции**: Просматривайте, ищите, создавайте, редактируйте и удаляйте ключи прямо на экране телефона.
- **Умное Распознавание Типов**: Автоматически различает объекты JSON, массивы, логические значения, числа и строки.

### 🔔 4. Логгер Push-Уведомлений
- **Множество Провайдеров**: FCM, APNs, Salesforce Marketing Cloud, OneSignal и Notifee.
- **Отслеживание Состояния Приложения**: Определяет получение на переднем плане (**Foreground**), в фоне (**Background**) или запуск из закрытого состояния (**Killed**).
- **Инспекция Данных**: Параметры полезной нагрузки, диплинки, заголовки, текст и ID каналов.

### 🪵 5. Логгер Консоли и Символизация Metro Source-Map
- **Точные Номера Строк**: Перехватывает `console.log`, `warn` и `error`, сопоставляя их через Metro с файлами проекта и строками (`HomeScreen.tsx:42:15`).
- **Детализация Аргументов**: Индивидуальный просмотр каждого переданного аргумента с указанием типа.
- **Стек Вызовов и Ошибок**: Структурированные карточки с именами функций, файлами и трассировками исключений.
- **Группировка Повторов**: Автоматическое сворачивание одинаковых логов со счетчиком (`×N`).

### 🔄 6. Diffs Состояния Redux и Хронология Экшенов
- **Интеграция с Redux Toolkit**: Поддержка Redux Store, RTK Query и `redux-persist`.
- **Хронология Экшенов**: Последовательная запись отправленных действий с длительностью и полезной нагрузкой.
- **Цветные Diffs Состояния**: Наглядная подсветка (**Зеленый** — добавления, **Желтый** — изменения, **Красный** — удаления).

### 📊 7. Трекер Аналитических Событий
- **Авто-Перехват Firebase Analytics**: Автоматически отслеживает `logEvent`, `logScreenView`, `setUserProperties` и `setUserId`.
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
- **Жест Встряхивания**: Встряхните телефон или нажмите `Ctrl+Cmd+Z` / `Cmd+M`, чтобы открыть инспектор.

### 📸 10. Нативный Захват Медиа и Студийный Редактор в Приложении
- **Захват на Устройстве**: Создавайте снимки экрана высокого разрешения, плавные видеозаписи MP4 и анимированные GIF.
- **Полнофункциональная Галерея**: Просматривайте, фильтруйте (Фото, Видео, GIF), удаляйте пакетами и копируйте URI.
- **Студия Редактирования Фото и Видео**:
  - **Кадрирование и Масштабирование**: Стандартные пропорции (1:1 Квадрат, 4:3, 16:9) и уменьшение разрешения для быстрой отправки.
  - **Обрезка Видео и Аудио**: Настройка начальной/конечной точек, изменение скорости (0.5× – 2.0×) или отключение звука.
  - **Снимок Кадра PNG**: Мгновенное извлечение PNG-кадра высокого разрешения из любого видео в одно касание.
- **Инструменты QA и Разметки Ошибок**:
  - **Сетка 3×3 Instagram**: Включение направляющих линий для проверки выравнивания элементов интерфейса.
  - **Нумерованные Бейджи Шагов**: Размещение меток с номерами (`1`, `2`, `3`...) для иллюстрации шагов воспроизведения бага.
  - **Теги Ошибок и Заметок**: Добавление графических значков багов (`🐛`), заметок (`📝`) и предупреждений.
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
- **Интерактивный Bottom Sheet**: Нажмите на `[ 🌐 RU ▾ ]` в заголовке, чтобы открыть панель выбора с флагами стран и мгновенным поиском.

---

## 🔎 Синтаксис Поиска DevTools

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

## 📦 Установка

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

## 🚀 Быстрый Старт

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
