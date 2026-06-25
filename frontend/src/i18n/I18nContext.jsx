import { createContext, useContext, useEffect, useState } from 'react';
import { translations } from './translations';
import { useAuth } from '../auth/AuthContext';

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const { user } = useAuth();
  const [locale, setLocale] = useState(localStorage.getItem('mp_locale') || 'en');

  useEffect(() => {
    if (user?.locale && !localStorage.getItem('mp_locale')) setLocale(user.locale);
  }, [user]);

  function changeLocale(code) {
    setLocale(code);
    localStorage.setItem('mp_locale', code);
  }

  function t(key) {
    return translations[locale]?.[key] || translations.en[key] || key;
  }

  return <I18nContext.Provider value={{ locale, setLocale: changeLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
