'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (translations: Record<Language, string> | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const defaultLanguage: Language = 'fr';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, _setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const storedLanguage = localStorage.getItem('appLanguage') as Language | null;
      return storedLanguage && ['fr', 'en'].includes(storedLanguage) ? storedLanguage : defaultLanguage;
    }
    return defaultLanguage;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLanguage = localStorage.getItem('appLanguage') as Language | null;
      if (storedLanguage && ['fr', 'en'].includes(storedLanguage)) {
        _setLanguage(storedLanguage);
      }
      document.documentElement.lang = language; // Set lang attribute on HTML element
    }
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    _setLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('appLanguage', lang);
    }
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback(
    (translations: Record<Language, string> | string): string => {
      if (typeof translations === 'string') {
        // Simple key lookup (future enhancement: nested keys)
        // For now, if it's a string, assume it's a key that needs a more complex lookup system not yet implemented
        // or it's a pre-translated string. For this example, we'll assume pre-translated or direct use.
        // This part would need a proper i18n library for full functionality.
        console.warn(`Translation for string key "${translations}" not found in simple t-function. Using key as fallback.`);
        return translations; 
      }
      return translations[language] || translations[defaultLanguage] || 'Translation not found';
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};