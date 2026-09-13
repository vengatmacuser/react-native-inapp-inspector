<p align="center">
  <a href="https://github.com/vengatmacuser/react-native-inapp-inspector">
    <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/inapp_inspector_icon.gif" alt="React Native In-App Inspector Icon" width="120" height="120" style="border-radius: 28px; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.45);" />
  </a>
</p>

# React Native In-App Inspector (Boîte à Outils de Débogage Intégrée)

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

La **boîte à outils de débogage tout-en-un et sans configuration pour React Native & Expo**. Inspectez le trafic réseau HTTP/HTTPS, les flux temps réel WebSocket & Socket.IO, les logs de console avec numéros de lignes précis via Metro, les diffs d'état Redux, le stockage AsyncStorage & MMKV, les notifications push, les métriques matérielles et réalisez des captures ou enregistrements vidéo avec studio d'édition complet directement sur votre téléphone sans câble.

> 🚀 **L'alternative moderne et légère à Flipper, Charles, Proxyman et Chucker** — fonctionne en totale autonomie sur l'appareil, en versions de test (APK/TestFlight) et sans câble USB.

<p align="center">
  <img src="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/assets/walkthrough.gif" alt="React Native In-App Inspector Walkthrough" width="360" style="border-radius: 20px; box-shadow: 0 12px 36px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  🎬 <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mp4">Regarder la Démo Vidéo Complète (MP4)</a></b> | <b><a href="https://raw.githubusercontent.com/vengatmacuser/react-native-inapp-inspector/main/docs/video_walkthrough.mov">Fichier MOV Original</a></b>
</p>

---

<table align="center" width="100%">
  <tr>
    <td align="center" style="padding: 24px; background: linear-gradient(135deg, rgba(236,72,153,0.1), rgba(99,102,241,0.1)); border-radius: 16px; border: 1px solid rgba(236,72,153,0.35);">
      <h3 align="center">💖 Conçu avec Amour pour Tous les Développeurs qui ont déjà Traqué un Bug à 2h du Matin</h3>
      <p align="center">
        <i>« Nous avons créé react-native-inapp-inspector parce que nous connaissons parfaitement la douleur des câbles emmêlés, des proxies déconnectés et des plantages inexplicables sur les builds de test. Nous y avons mis des nuits blanches et toute notre passion pour que chaque ingénieur mobile et testeur QA dans le monde puisse déboguer en toute liberté, fluidité et sérénité. »</i>
      </p>
      <p align="center">
        Si cet outil vous a fait gagner de précieuses heures, vous a aidé à livrer une mise en production cruciale à temps, ou a simplifié votre quotidien de développement — <b>pensez à sponsoriser le projet</b>. Un simple café ou un soutien mensuel fait toute la différence et permet de maintenir ce projet open source indépendant et gratuit pour tous. ☕✨
      </p>
      <p align="center">
        <a href="https://github.com/sponsors/vengatmacuser">
          <img src="https://img.shields.io/badge/Sponsor%20%40vengatmacuser-Soutenir%20sur%20GitHub%20Sponsors-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white" alt="Sponsor on GitHub Sponsors" />
        </a>
      </p>
    </td>
  </tr>
</table>

---

## ⚡ Comparaison avec les Autres Outils

| Fonctionnalité | **react-native-inapp-inspector** | Flipper | Charles / Proxyman | RN Debugger |
| :--- | :---: | :---: | :---: | :---: |
| **Autonome sur l’appareil (Pas de PC ni de câble)** | ✅ | ❌ | ❌ | ❌ |
| **Zéro rendu en veille (0% CPU en arrière-plan)** | ✅ | ❌ | ❌ | ❌ |
| **Inspecteur réseau HTTP/HTTPS (Fetch / Axios / XHR)** | ✅ | ✅ | ✅ | ✅ |
| **Graphique en cascade & Latence P95** | ✅ | ⚠️ | ⚠️ | ❌ |
| **Export instantané de snippets cURL et Fetch** | ✅ | ⚠️ | ⚠️ | ❌ |
| **Moniteur bidirectionnel WebSocket & Socket.IO** | ✅ | ❌ | ⚠️ | ⚠️ |
| **Éditeur de stockage en direct (AsyncStorage & MMKV)** | ✅ (CRUD) | ⚠️ (Lecture seule) | ❌ | ⚠️ |
| **Enregistreur de notifications push (APNs, FCM, Salesforce)** | ✅ | ❌ | ❌ | ❌ |
| **Logs avec vrais numéros de lignes via Metro** | ✅ (Ligne exacte) | ✅ | ❌ | ✅ |
| **Diffs d’état Redux & Chronologie des actions** | ✅ | ⚠️ | ❌ | ✅ |
| **Suivi des événements analytiques (Firebase, Mixpanel)** | ✅ | ❌ | ❌ | ❌ |
| **Protection anti-crash & Fil d’Ariane (Breadcrumbs)** | ✅ | ❌ | ❌ | ❌ |
| **Télémétrie matérielle (RAM, tas natif, disque, batterie, FPS)** | ✅ | ⚠️ | ❌ | ❌ |
| **Capture multimédia & Studio d’édition (Crop, Video Trim, Badges)** | ✅ (Studio complet) | ❌ | ❌ | ❌ |
| **Bouton flottant déplaçable & Mode transparence (Peek)** | ✅ (0.05 - 1.0) | ❌ | ❌ | ❌ |
| **Gestion à distance des modules via Firebase Remote Config** | ✅ | ❌ | ❌ | ❌ |
| **25 langues avec sélecteur en feuille inférieure (Bottom Sheet)** | ✅ | ❌ (Anglais uniquement) | ❌ | ❌ |
| **Expo (Bare / Managed) & React Native CLI** | ✅ | ⚠️ | ⚠️ | ⚠️ |

---

## ✨ Modules et Fonctionnalités Clés

### 🌐 1. Inspecteur Réseau & Graphique en Cascade des Latences
- **Interception Universelle HTTP/HTTPS**: Prise en charge automatique de `fetch`, Axios et `XMLHttpRequest`.
- **Détail des Latences**: Barres en cascade proportionnelles, évaluation de la vitesse (Rapide `<200ms`, Modéré `200-800ms`, Lent `>800ms`).
- **Bandeau Télémetrique**: Taux de réussite (%), Latence moyenne (ms) et Latence P95 (ms) en direct.
- **Visualiseur de Données**: Arbre JSON stylisé, texte brut, en-têtes requête/réponse, paramètres et fichier appelant.
- **Export en Un Clic**: Copiez sous forme de commande **cURL**, snippet **Fetch** ou rapport synthétique.

### ⚡ 2. Inspecteur de Flux en Temps Réel WebSocket & Socket.IO
- **Couverture Protocoles Totale**: WebSocket natif (`ws://`, `wss://`) et Socket.IO (`v2`, `v3`, `v4`).
- **Chronologie Bidirectionnelle**: Suivi des trames (⬆️ Envoyées, ⬇️ Reçues) avec horodatage haute précision.
- **Détection des Types**: Texte, charges JSON, taille binaire (ArrayBuffer) et battements Ping/Pong.
- **Métadonnées de Connexion**: État de connexion, paramètres de handshake, transport (websocket/polling) et reconnexions.

### 💾 3. Gestionnaire de Stockage (AsyncStorage & MMKV)
- **Interface Unifiée**: Compatible avec `@react-native-async-storage/async-storage` et `react-native-mmkv`.
- **CRUD en Direct dans l'App**: Consultez, recherchez, créez, modifiez et supprimez des clés directement à l'écran.
- **Typage Intelligent**: Reconnaissance automatique des objets JSON, tableaux, booléens, nombres et chaînes.

### 🔔 4. Enregistreur de Notifications Push
- **Multi-Fournisseurs**: FCM, APNs, Salesforce Marketing Cloud, OneSignal et Notifee.
- **Suivi d'État de l'App**: Distingue les réceptions au Premier Plan (**Foreground**), en Arrière-Plan (**Background**) ou après Fermeture (**Killed**).
- **Inspection des Données**: Paramètres complets, liens profonds (deep-links), titres, corps et identifiants de canaux.

### 🪵 5. Enregistreur de Console & Symbolisation Metro Source-Map
- **Numéros de Ligne Exacts**: Intercepte `console.log`, `warn` et `error` en affichant le vrai fichier source et la ligne exacte via Metro (`HomeScreen.tsx:42:15`).
- **Décomposition des Arguments**: Chaque argument est inspecté individuellement avec son type.
- **Pile d'Appel & Pile d'Erreur**: Cartes structurées avec noms de fonctions, chemins de fichiers et piles d'exceptions.
- **Regroupement Intelligent**: Regroupe les logs identiques successifs avec un compteur (`×N`).

### 🔄 6. Diffs d'État Redux & Chronologie des Actions
- **Intégration Redux Toolkit**: Prise en charge fluide de Redux Store, RTK Query et `redux-persist`.
- **Chronologie des Actions**: Historique ordonné des actions avec temps d'exécution et données transmises.
- **Diffs Visuels Colorés**: Modifications mises en valeur (**Vert** pour ajouts, **Jaune** pour mises à jour, **Rouge** pour suppressions).

### 📊 7. Suivi des Événements Analytiques
- **Accroche Automatique Firebase**: Intercepte `logEvent`, `logScreenView`, `setUserProperties` et `setUserId`.
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
- **Geste de Secousse**: Secouez l'appareil ou appuyez sur `Ctrl+Cmd+Z` / `Cmd+M` pour ouvrir l'inspecteur.

### 📸 10. Capture Multimédia Native & Studio d'Édition Intégré
- **Capture sur l'Appareil**: Réalisez des captures d'écran haute résolution, des vidéos MP4 fluides ou des GIFs animés.
- **Galerie Multimédia Complète**: Parcourez, filtrez (Photos, Vidéos, GIFs), sélectionnez en lot et copiez les chemins d'accès.
- **Studio d'Édition Photo & Vidéo**:
  - **Recadrage & Redimensionnement**: Ratios prédéfinis (Carré 1:1, 4:3, 16:9) et réduction de taille pour des envois rapides.
  - **Découpage Vidéo & Audio**: Ajustez les points de début/fin, modifiez la vitesse de lecture (0.5× – 2.0×) ou coupez le son.
  - **Extraction d'Images PNG**: Extrayez instantanément une image PNG haute définition à n'importe quel moment de la vidéo.
- **Outils d'Annotation et de Rapport QA**:
  - **Grille 3×3 Style Instagram**: Affichez un quadrillage pour contrôler les alignements au pixel près.
  - **Badges d'Étapes Numérotées**: Placez des pastilles chiffrées (`1`, `2`, `3`...) pour documenter les étapes de reproduction.
  - **Tags Bug & Note**: Déposez des symboles visuels de bug (`🐛`), note (`📝`) ou alerte.
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
- **Sélecteur Moderne**: Appuyez sur `[ 🌐 FR ▾ ]` dans l'en-tête pour afficher la feuille de choix avec drapeaux et recherche instantanée.

---

## 🔎 Syntaxe de Recherche DevTools

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

## 📦 Installation

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

## 🚀 Démarrage Rapide

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
