import React from 'react';
import en from './locales/en.json';

type TranslationParams = Record<string, any>;

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
export function t(key: string, optionsOrFallback?: TranslationParams | string): string {
  const raw = lookupKey(en, key);
  if (typeof raw === 'string') {
    if (typeof optionsOrFallback === 'object' && optionsOrFallback !== null) {
      return interpolate(raw, optionsOrFallback);
    }
    return raw;
  }
  if (typeof optionsOrFallback === 'string') {
    return optionsOrFallback;
  }
  return key;
}

export const i18n = {
  t,
  language: 'en',
};

/**
 * React hook compatible with react-i18next useTranslation()
 */
export function useTranslation() {
  return {
    t,
    i18n,
  };
}

/**
 * Backward-compatible I18nextProvider component
 */
export const I18nextProvider = ({children}: {children?: React.ReactNode; i18n?: any}): any => {
  return React.createElement(React.Fragment, null, children);
};

export default i18n;