import i18next from 'i18next';
import {initReactI18next} from 'react-i18next';
import en from './locales/en.json';

// Dedicated instance so the inspector never collides with the host app's own
// i18next setup (or with i18next instances created by other libraries).
const i18n = i18next.createInstance();

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      translation: en,
    },
  },
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;