import React from 'react';
import enLocale from './locales/en.json';
import esLocale from './locales/es.json';
import frLocale from './locales/fr.json';
import deLocale from './locales/de.json';
import zhLocale from './locales/zh.json';
import jaLocale from './locales/ja.json';
import koLocale from './locales/ko.json';
import ptLocale from './locales/pt.json';
import ruLocale from './locales/ru.json';
import hiLocale from './locales/hi.json';
import arLocale from './locales/ar.json';
import itLocale from './locales/it.json';
import idLocale from './locales/id.json';
import trLocale from './locales/tr.json';
import viLocale from './locales/vi.json';
import nlLocale from './locales/nl.json';
import plLocale from './locales/pl.json';
import taLocale from './locales/ta.json';
import teLocale from './locales/te.json';
import knLocale from './locales/kn.json';
import mlLocale from './locales/ml.json';
import bnLocale from './locales/bn.json';
import mrLocale from './locales/mr.json';
import guLocale from './locales/gu.json';
import paLocale from './locales/pa.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: '中文', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'pt', name: 'Português', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'ru', name: 'Русский', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'hi', name: 'हिन्दी', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'ar', name: 'العربية', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'it', name: 'Italiano', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'id', name: 'Bahasa Indonesia', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'tr', name: 'Türkçe', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'vi', name: 'Tiếng Việt', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'nl', name: 'Nederlands', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polski', nativeName: 'Polski', flag: '🇵🇱' },
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

type TranslationParams = Record<string, any>;

const localeRegistry: Record<string, Record<string, any>> = {
  en: enLocale,
  es: esLocale,
  fr: frLocale,
  de: deLocale,
  zh: zhLocale,
  ja: jaLocale,
  ko: koLocale,
  pt: ptLocale,
  ru: ruLocale,
  hi: hiLocale,
  ta: taLocale,
  te: teLocale,
  kn: knLocale,
  ml: mlLocale,
  bn: bnLocale,
  mr: mrLocale,
  gu: guLocale,
  pa: paLocale,
  ar: arLocale,
  it: itLocale,
  id: idLocale,
  tr: trLocale,
  vi: viLocale,
  nl: nlLocale,
  pl: plLocale,
};

let currentLanguage = 'en';
const listeners = new Set<() => void>();

/**
 * Lightweight nested lookup for translation keys (e.g. "network.headers")
 */
function lookupKey(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length; i++) {
    if (current == null) return undefined;
    current = current[parts[i]];
  }
  return current;
}

/**
 * Interpolates {{key}} placeholders in string templates
 */
function interpolate(template: string, params?: TranslationParams): string {
  if (!params || typeof template !== 'string') return template;
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : `{{${key}}}`;
  });
}

/**
 * Standalone zero-dependency translation function
 */
export function t(
  key: string,
  optionsOrFallback?: TranslationParams | string,
  fallbackStr?: string,
): string {
  const activeBundle = localeRegistry[currentLanguage] || localeRegistry.en;
  let raw = lookupKey(activeBundle, key);
  if (raw === undefined && currentLanguage !== 'en') {
    raw = lookupKey(localeRegistry.en, key);
  }

  if (typeof raw === 'string') {
    if (typeof optionsOrFallback === 'object' && optionsOrFallback !== null) {
      return interpolate(raw, optionsOrFallback);
    }
    return raw;
  }
  if (typeof optionsOrFallback === 'string') {
    return optionsOrFallback;
  }
  if (typeof fallbackStr === 'string') {
    if (typeof optionsOrFallback === 'object' && optionsOrFallback !== null) {
      return interpolate(fallbackStr, optionsOrFallback);
    }
    return fallbackStr;
  }
  return key;
}

export function getLanguage(): string {
  return currentLanguage;
}

export function setLanguage(lang: string): void {
  if (typeof lang === 'string' && lang.trim()) {
    currentLanguage = lang.trim();
    i18n.language = currentLanguage;
    listeners.forEach(fn => {
      try {
        fn();
      } catch (_) {}
    });
  }
}

export function addTranslations(lang: string, translations: Record<string, any>): void {
  if (!lang || !translations || typeof translations !== 'object') return;
  localeRegistry[lang] = {
    ...(localeRegistry[lang] || {}),
    ...translations,
  };
  listeners.forEach(fn => {
    try {
      fn();
    } catch (_) {}
  });
}

export function setTranslations(translations: Record<string, any>, lang: string = 'en'): void {
  addTranslations(lang, translations);
}

export const i18n = {
  t,
  language: currentLanguage,
  changeLanguage: setLanguage,
  addResourceBundle: (lng: string, _ns: string, resources: any) => addTranslations(lng, resources),
  getLanguage,
  setLanguage,
  addTranslations,
  setTranslations,
};

/**
 * React hook compatible with react-i18next useTranslation() with reactive re-rendering on language switch
 */
export function useTranslation() {
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    const handleUpdate = () => setTick(prev => prev + 1);
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  return {
    t,
    i18n,
    language: currentLanguage,
    currentLanguage,
    setLanguage,
  };
}

/**
 * Backward-compatible I18nextProvider component
 */
export const I18nextProvider = ({children}: {children?: React.ReactNode; i18n?: any}): any => {
  return React.createElement(React.Fragment, null, children);
};

export default i18n;