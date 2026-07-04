/* ══════════════════════════════════════════════════════════
   I18N — translations, language switching
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { applyFilters, renderSidebar, openModal, currentView, currentCardId } from './render.js';
import { renderBadges, updateUserTitle } from './badges.js';
import { updateStats, renderStats } from './stats.js';
import { renderSettings } from './pin.js';

export const LANGS = {en:'English',fr:'Français',es:'Español',zh:'中文',it:'Italiano',nl:'Nederlands',de:'Deutsch'};

export function getLang(){ return localStorage.getItem('f1uno_lang')||'en'; }

export function setLang(code){
  localStorage.setItem('f1uno_lang', code);
  applyLanguage();
}

export function t(key, p={}){
  const d = (window.__T||{})[getLang()]||(window.__T||{}).en||{};
  const base = (window.__T||{}).en||{};
  let s = d[key]||base[key]||key;
  Object.keys(p).forEach(k=>{ s=s.replace('{'+k+'}',p[k]); });
  log('t() called:', key, p, 'result:', s);
  return s;
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
  // Search placeholder in header
  const si = document.getElementById('searchInput');
  if(si) si.placeholder = t('header.search');

  // Update displayedCount counter
  const displayedCount = document.getElementById('displayedCount');
  if(displayedCount) {
    const currentCount = document.querySelectorAll('.card').length;
    displayedCount.textContent = t('header.displayed',{n:currentCount});
  }

  // Re-render grid to update rarity translations
  applyFilters();

  // Re-render badges to update badge translations
  if(currentView === 'badges') renderBadges();

  // Sort select options
  const sel = document.getElementById('sidebarSortSel');
  if(sel){
    const sortKeys = ['number:sort.num','name:sort.name','rarity_desc:sort.rar_desc','rarity_asc:sort.rar_asc','category:sort.cat'];
    sortKeys.forEach(pair=>{
      const [val,key] = pair.split(':');
      const opt = sel.querySelector(`option[value="${val}"]`);
      if(opt) opt.textContent = t(key);
    });
  }
  // Re-render dynamic content
  renderSidebar();
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
