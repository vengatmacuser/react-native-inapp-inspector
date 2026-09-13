<p align="center">
  <a href="https://github.com/vengatmacuser/react-native-inapp-inspector">
    <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/inapp_inspector_icon.gif" alt="React Native In-App Inspector Icon" width="120" height="120" style="border-radius: 28px; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.45);" />
  </a>
</p>

# React Native In-App Inspector (Kit de Ferramentas de Depuração no App)

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

O **kit completo de ferramentas de depuração sem configuração para React Native e Expo**. Inspecione tráfego de rede HTTP/HTTPS, fluxos em tempo real de WebSocket e Socket.IO, registros de console com número de linha exato via Metro, diffs de estado no Redux, armazenamento ao vivo de AsyncStorage e MMKV, notificações push, métricas de hardware e faça capturas de tela/vídeo com estúdio de edição integrado diretamente no celular sem cabos.

> 🚀 **A alternativa moderna e leve ao Flipper, Charles, Proxyman e Chucker** — funciona de forma autônoma no aparelho, em builds de teste (APK/TestFlight) e sem fios ou portas abertas.

<p align="center">
  <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/walkthrough.gif" alt="React Native In-App Inspector Walkthrough" width="360" style="border-radius: 20px; box-shadow: 0 12px 36px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  🎬 <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mp4">Assistir ao Vídeo de Demonstração Completo (MP4)</a></b> | <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mov">MOV Original</a></b>
</p>

---

<table align="center" width="100%">
  <tr>
    <td align="center" style="padding: 24px; background: linear-gradient(135deg, rgba(236,72,153,0.1), rgba(99,102,241,0.1)); border-radius: 16px; border: 1px solid rgba(236,72,153,0.35);">
      <h3 align="center">💖 Feito com Carinho para Cada Dev que já Perseguiu um Bug Misterioso às 2 da Madrugada</h3>
      <p align="center">
        <i>“Criamos o react-native-inapp-inspector porque conhecemos de perto a dor dos cabos enrolados, portas de depuração caindo e crashes misteriosos em builds de teste. Dedicamos inúmeras noites em claro e todo o nosso coração para que cada desenvolvedor mobile e time de QA do mundo possa depurar direto no celular com liberdade, agilidade e paz de espírito.”</i>
      </p>
      <p align="center">
        Se esta ferramenta economizou horas de estresse na sua rotina, te ajudou a entregar uma versão crítica no prazo ou tornou seu dia a dia mais leve — <b>por favor, considere apoiar o projeto com um patrocínio</b>. Um cafezinho ou um apoio mensal significa muito e mantém o código aberto independente vivo para todos. ☕✨
      </p>
      <p align="center">
        <a href="https://github.com/sponsors/vengatmacuser">
          <img src="https://img.shields.io/badge/Sponsor%20%40vengatmacuser-Apoiar%20no%20GitHub%20Sponsors-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white" alt="Sponsor on GitHub Sponsors" />
        </a>
      </p>
    </td>
  </tr>
</table>

---

## ⚡ Comparativo com Outras Ferramentas

| Recurso | **react-native-inapp-inspector** | Flipper | Charles / Proxyman | RN Debugger |
| :--- | :---: | :---: | :---: | :---: |
| **Funciona direto no aparelho (Sem PC ou cabos)** | ✅ | ❌ | ❌ | ❌ |
| **Zero consumo em repouso (0% CPU em segundo plano)** | ✅ | ❌ | ❌ | ❌ |
| **Inspetor de rede HTTP/HTTPS (Fetch / Axios / XHR)** | ✅ | ✅ | ✅ | ✅ |
| **Cascata de latência & Percentil P95** | ✅ | ⚠️ | ⚠️ | ❌ |
| **Cópia instantânea de snippets cURL e Fetch** | ✅ | ⚠️ | ⚠️ | ❌ |
| **Monitoramento de WebSocket & Socket.IO bidirecional** | ✅ | ❌ | ⚠️ | ⚠️ |
| **Editor de armazenamento ao vivo (AsyncStorage & MMKV)** | ✅ (CRUD) | ⚠️ (Somente leitura) | ❌ | ⚠️ |
| **Registro de notificações push (APNs, FCM, Salesforce)** | ✅ | ❌ | ❌ | ❌ |
| **Logs com numeração de linhas reais via Metro** | ✅ (Linha exata) | ✅ | ❌ | ✅ |
| **Diffs de estado Redux & Linha do tempo de ações** | ✅ | ⚠️ | ❌ | ✅ |
| **Rastreador de eventos de analytics (Firebase, Mixpanel)** | ✅ | ❌ | ❌ | ❌ |
| **Proteção contra falhas & Rastreador de passos (Breadcrumbs)** | ✅ | ❌ | ❌ | ❌ |
| **Telemetria de hardware (RAM, heap, disco, bateria, FPS)** | ✅ | ⚠️ | ❌ | ❌ |
| **Captura e estúdio de edição de mídia no app (Crop, Trim, Badges)** | ✅ (Estúdio completo) | ❌ | ❌ | ❌ |
| **Botão flutuante arrastável & Modo transparente (Peek)** | ✅ (0.05 - 1.0) | ❌ | ❌ | ❌ |
| **Gerenciamento remoto de módulos via Firebase Remote Config** | ✅ | ❌ | ❌ | ❌ |
| **25 idiomas com seletor em folha inferior (Bottom Sheet)** | ✅ | ❌ (Apenas inglês) | ❌ | ❌ |
| **Expo (Bare / Managed) & React Native CLI** | ✅ | ⚠️ | ⚠️ | ⚠️ |

---

## ✨ Principais Módulos e Recursos

### 🌐 1. Inspetor de Rede & Cascata de Latência
- **Interceptação Universal HTTP/HTTPS**: Suporta nativamente `fetch`, instâncias de Axios e `XMLHttpRequest`.
- **Detalhamento de Latência**: Barras de cascata proporcionais, classificação de velocidade (Rápido `<200ms`, Moderado `200-800ms`, Lento `>800ms`).
- **Painel de Telemetria**: Taxa de sucesso (%), Latência média (ms) e Latência P95 (ms) em tempo real.
- **Visualizador de Carga Útil**: Árvore JSON formatada, texto bruto, cabeçalhos, parâmetros de consulta e origem da chamada.
- **Exportação Rápida**: Copie com um toque como comando **cURL**, trecho **Fetch** ou relatório resumido.

### ⚡ 2. Inspetor em Tempo Real de WebSocket & Socket.IO
- **Cobertura Completa de Protocolos**: WebSocket nativo (`ws://`, `wss://`) e Socket.IO (`v2`, `v3`, `v4`).
- **Linha do Tempo Bidirecional**: Rastreamento de pacotes (⬆️ Enviados, ⬇️ Recebidos) com carimbo de data/hora de alta precisão.
- **Identificação de Tipos**: Texto, cargas JSON, tamanho binário (ArrayBuffer) e batimentos Ping/Pong.
- **Metadados da Conexão**: Estado da conexão, parâmetros de handshake, transporte (websocket/polling) e reconexões.

### 💾 3. Gerenciador de Armazenamento (AsyncStorage & MMKV)
- **Interface Unificada**: Compatível com `@react-native-async-storage/async-storage` e `react-native-mmkv`.
- **CRUD em Tempo Real no App**: Veja, pesquise, crie, edite e delete chaves direto na tela do celular.
- **Tipagem Inteligente**: Distingue automaticamente objetos JSON, arrays, booleanos, números e strings.

### 🔔 4. Registro de Notificações Push
- **Múltiplos Provedores**: FCM, APNs, Salesforce Marketing Cloud, OneSignal e Notifee.
- **Rastreamento de Estado do App**: Identifica se foi recebida em Primeiro Plano (**Foreground**), Segundo Plano (**Background**) ou Inicialização Fechada (**Killed**).
- **Inspeção de Payload**: Parâmetros de dados, deep-links, títulos, mensagens e IDs de canais.

### 🪵 5. Registrador de Console & Simbolização Metro Source-Map
- **Numeração de Linhas Exata**: Intercepta `console.log`, `warn` e `error` apontando o arquivo fonte e linha real através do Metro (`HomeScreen.tsx:42:15`).
- **Detalhamento de Argumentos**: Inspecione cada argumento individualmente com seu tipo.
- **Pilha de Chamadas e Erros**: Visualização estruturada com nomes de funções, arquivos e pilhas de exceção.
- **Agrupamento Inteligente**: Contador (`×N`) para logs duplicados consecutivos.

### 🔄 6. Diffs de Estado Redux & Linha do Tempo de Ações
- **Integração com Redux Toolkit**: Suporte completo a Redux Store, RTK Query e `redux-persist`.
- **Linha do Tempo de Ações**: Registro cronológico de ações despachadas com tempo e payload.
- **Diff Visual Colorido**: Alterações em destaque (**Verde** para adições, **Amarelo** para atualizações, **Vermelho** para remoções).

### 📊 7. Rastreador de Eventos de Analytics
- **Integração Automática Firebase**: Intercepta `logEvent`, `logScreenView`, `setUserProperties` e `setUserId`.
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
- **Gesto de Balançar**: Balance o aparelho ou pressione `Ctrl+Cmd+Z` / `Cmd+M` para abrir o inspetor.

### 📸 10. Captura de Mídia Nativa & Estúdio de Edição In-App
- **Captura no Dispositivo**: Crie capturas de tela em alta resolução, gravações em vídeo MP4 e GIFs animados.
- **Galeria de Mídia Completa**: Navegue, filtre (Fotos, Vídeos, GIFs), selecione em lote e copie URIs.
- **Estúdio de Edição de Foto e Vídeo**:
  - **Recorte e Redimensionamento**: Proporções padrão (Quadrado 1:1, 4:3, 16:9) e redução de resolução para uploads rápidos.
  - **Corte de Vídeo & Áudio**: Ajuste pontos de início/fim, altere a velocidade de reprodução (0.5× – 2.0×) ou silencie o áudio.
  - **Captura de Quadros PNG**: Extraia imagens PNG de alta resolução de qualquer momento do vídeo com um toque.
- **Anotações de QA & Marcadores de Bugs**:
  - **Grade 3×3 Estilo Instagram**: Ative guias de alinhamento para inspecionar layouts pixel por pixel.
  - **Emblemas de Passos Numerados**: Coloque marcadores numerados (`1`, `2`, `3`...) para ilustrar passos de reprodução.
  - **Etiquetas de Bugs e Notas**: Adicione selos de bugs (`🐛`), notas (`📝`) e alertas visuais.
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
- **Seletor em Folha Inferior**: Toque em `[ 🌐 PT ▾ ]` no cabeçalho para abrir a folha com bandeiras e busca instantânea.

---

## 🔎 Sintaxe de Busca DevTools

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

## 📦 Instalação

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

## 🚀 Início Rápido

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
