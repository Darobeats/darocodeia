import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import esTranslations from "./locales/es.json";
import enTranslations from "./locales/en.json";

export type Locale = "es" | "en";

type TranslationValue = string | { [key: string]: TranslationValue };
type Translations = { [key: string]: TranslationValue };

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  detectedFromBrowser: boolean;
}

const translations: Record<Locale, Translations> = {
  es: esTranslations,
  en: enTranslations,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "darocode-locale";

function detectBrowserLocale(): Locale {
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("en")) {
    return "en";
  }
  return "es";
}

function getNestedValue(obj: Translations, path: string): string {
  const keys = path.split(".");
  let current: TranslationValue = obj;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return path; // Return key if not found
    }
  }

  return typeof current === "string" ? current : path;
}

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>("es");
  const [detectedFromBrowser, setDetectedFromBrowser] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && (stored === "es" || stored === "en")) {
      setLocaleState(stored);
      setDetectedFromBrowser(false);
    } else {
      const detected = detectBrowserLocale();
      setLocaleState(detected);
      setDetectedFromBrowser(true);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
    setDetectedFromBrowser(false);
  }, []);

  const t = useCallback(
    (key: string): string => {
      // Try current locale first
      const value = getNestedValue(translations[locale], key);
      if (value !== key) {
        return value;
      }
      // Fallback to Spanish if key not found in current locale
      if (locale !== "es") {
        return getNestedValue(translations.es, key);
      }
      return key;
    },
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, detectedFromBrowser }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
