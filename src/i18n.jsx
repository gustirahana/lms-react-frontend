import { createContext, useContext, useEffect, useState } from 'react';
import indonesian from './locales/id.json';

const LocaleContext = createContext(null);
const supported = new Set(['en', 'id']);

function translate(key, locale, values = {}) {
  if (typeof key !== 'string') return key;
  let result = locale === 'id' ? (indonesian[key] || key) : key;
  if (locale === 'id' && result === key) {
    for (const [pattern, replacement] of [
      [/^Welcome, (.+)$/, 'Selamat datang, $1'],
      [/^Preview (.+)$/, 'Pratinjau $1'], [/^View (.+)$/, 'Lihat $1'], [/^Open (.+)$/, 'Buka $1'],
      [/^Notifications, (\d+) unread$/, 'Notifikasi, $1 belum dibaca'],
      [/^(\d+(?:\.\d+)?) hours$/, '$1 jam'], [/^(\d+) min$/, '$1 menit'],
    ]) { if (pattern.test(key)) { result = key.replace(pattern, replacement); break; } }
  }
  return result.replace(/\{\{(\w+)\}\}/g, (_, name) => String(values[name] ?? ''));
}

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    try { const saved = window.localStorage.getItem('jakija.locale'); return supported.has(saved) ? saved : 'en'; } catch { return 'en'; }
  });
  const setLocale = (next) => {
    if (!supported.has(next)) return;
    setLocaleState(next);
    try { window.localStorage.setItem('jakija.locale', next); } catch { /* The language still works when storage is unavailable. */ }
  };
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = locale === 'id' ? 'JakIja Learn — Belajar sesuai ritmemu' : 'JakIja Learn — Learning, at your pace';
  }, [locale]);
  const t = (key, values) => translate(key, locale, values);
  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>;
}

export function useLanguage() {
  return useContext(LocaleContext) || { locale: 'en', setLocale: () => {}, t: (key, values) => translate(key, 'en', values) };
}

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();
  return <label className="language-switcher"><span className="lp-visually-hidden">{t('Interface language')}</span><select aria-label={t('Interface language')} value={locale} onChange={(event) => setLocale(event.target.value)}><option value="en">English</option><option value="id">Indonesia</option></select></label>;
}

export function courseLanguageKey(languages = ['en']) {
  return languages.length === 2 ? 'Both languages' : languages[0] === 'id' ? 'Indonesian only' : 'English only';
}

export function localizeCourse(course, locale) {
  const languages = course.languages || ['en'];
  const localized = languages.includes(locale) ? course.translations?.[locale] : null;
  return { ...course, languages, title: localized?.title || course.title, description: localized?.description || course.description };
}

export function matchesCourseLanguage(course, filter) {
  if (filter === 'all') return true;
  const languages = course.languages || ['en'];
  return filter === 'both' ? languages.length === 2 : languages.length === 1 && languages[0] === filter;
}
