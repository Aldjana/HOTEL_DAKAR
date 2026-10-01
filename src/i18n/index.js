import { useSyncExternalStore } from 'react';
import { login } from './login';
import { trPattern } from './patterns';

// Traduction : le texte français sert de clé. `t('Se connecter')` renvoie le français tel quel,
// ou l'anglais si la langue active est « en » et que le texte figure dans i18n/en/*.js.
// Variables : t('Chambre {n}', { n: 12 }). Texte absent du dictionnaire → repli sur le français.
const DICT = { login };
const EN = {};
Object.values(import.meta.glob('./en/*.js', { eager: true })).forEach((m) => Object.assign(EN, m.default || {}));

const KEY = 'pms_lang';
const listeners = new Set();
const read = () => { try { const l = localStorage.getItem(KEY); if (l === 'fr' || l === 'en') return l; } catch { /* ignore */ } return 'fr'; };
let lang = read();
if (typeof document !== 'undefined') document.documentElement.lang = lang;

export const LANGS = [{ code: 'fr', label: 'Français' }, { code: 'en', label: 'English' }];
export const getLang = () => lang;
export const getLocale = () => (lang === 'en' ? 'en-GB' : 'fr-FR');
export const setLang = (l) => {
  lang = l;
  try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
  document.documentElement.lang = l;
  listeners.forEach((f) => f());
};
const subscribe = (f) => { listeners.add(f); return () => listeners.delete(f); };

const en = (fr) => EN[fr] ?? trPattern(fr) ?? fr;
const fill = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m)) : s);
// Utilisable hors composants (toasts, constantes) : lit la langue courante au moment de l'appel.
export const tr = (fr, vars) => fill(lang === 'en' ? en(fr) : fr, vars);

// Variante avec contexte : cherche 'ctx|texte' puis 'texte' (évite les conflits, ex. « Arrivée » statut ≠ colonne).
export const trc = (ctx, fr, vars) => fill(lang === 'en' ? (EN[`${ctx}|${fr}`] ?? en(fr)) : fr, vars);

// useT()        → t(texteFrançais, vars)
// useT('login') → t(clé) pour l'espace de noms « login »
export const useT = (ns) => {
  const current = useSyncExternalStore(subscribe, () => lang);
  const t = ns
    ? (key) => DICT[ns]?.[current]?.[key] ?? DICT[ns]?.fr?.[key] ?? key
    : (fr, vars) => fill(current === 'en' ? en(fr) : fr, vars);
  return { t, lang: current, setLang };
};
