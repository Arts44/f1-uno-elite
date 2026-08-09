/* ══════════════════════════════════════════════════════════
   I18N — translations, language switching
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { renderCollection, openModal, currentView, currentCardId } from './render.js';
import { renderBadges, updateUserTitle } from './badges.js';
import { updateStats, renderStats } from './stats.js';
import { renderSettings } from './pin.js';

export const LANGS = {en:'English',fr:'Français',es:'Español',zh:'中文',it:'Italiano',nl:'Nederlands',de:'Deutsch'};

export function getLang(){ return localStorage.getItem('f1uno_lang')||'en'; }

export function setLang(code){
  localStorage.setItem('f1uno_lang', code);
  applyLanguage();
}

/* Échappement HTML — UNE seule implémentation pour tout le projet.
   Nécessaire parce que le rendu passe massivement par innerHTML avec
   des chaînes de template : toute donnée qui n'est pas du code doit
   être échappée avant d'y entrer. */
export function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function t(key, p={}){
  const d = (window.__T||{})[getLang()]||(window.__T||{}).en||{};
  const base = (window.__T||{}).en||{};
  let s = d[key]||base[key]||key;
  Object.keys(p).forEach(k=>{ s=s.replace('{'+k+'}',p[k]); });
  log('t() called:', key, p, 'result:', s);
  return s;
}

/* t() destiné à innerHTML : les VALEURS interpolées sont échappées,
   pas le gabarit traduit (qui est du contenu maîtrisé du dépôt).
   À utiliser dès qu'un paramètre vient d'ailleurs que du code —
   fichier importé, code de sauvegarde, lien #backup=, réponse cloud.
   Corrige la XSS de 1.42.1 : un `season` hostile dans une sauvegarde
   partagée s'exécutait dans l'origine de l'app. */
export function tEsc(key, p={}){
  const safe = {};
  Object.keys(p).forEach(k => { safe[k] = escapeHtml(p[k]); });
  return t(key, safe);
}

export function applyLanguage(){
  const lang = getLang();

  // Update HTML lang attribute
  document.documentElement.lang = lang;

  // Update page title
  const titleEl = document.querySelector('title[data-i18n]');
  if(titleEl) titleEl.textContent = t(titleEl.getAttribute('data-i18n'));

  // Process all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  // Process all data-i18n-aria elements (aria-labels)
  document.querySelectorAll('[data-i18n-aria]').forEach(el=>{
    el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
  });
  // Re-render grid to update rarity translations (le bandeau de page
  // de Collection, lui, est réécrit par updateStats() plus bas)
  renderCollection();

  // Re-render badges to update badge translations
  if(currentView === 'badges') renderBadges();

  // Re-render dynamic content
  updateStats();
  if(currentView==='stats') renderStats();
  else if(currentView==='settings') renderSettings();
  else if(currentView==='badges') renderBadges();
  // Re-render modal if open to update description translation and rarity
  if(currentCardId && document.getElementById('mo').classList.contains('open')){
    openModal(currentCardId);
  }
  // Re-render user title to update badge title translation
  updateUserTitle();
}
