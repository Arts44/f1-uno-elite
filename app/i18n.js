/* ══════════════════════════════════════════════════════════
   I18N — translations, language switching
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { renderCollection, openModal, currentView, currentCardId } from './render.js';
import { renderBadges } from './badges.js';
/* Le titre vient de son propre module : i18n n'a besoin QUE de le
   redessiner au changement de langue, pas de la page Badges. */
import { updateUserTitle } from './badge-titles.js';
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

/* ══════════════════════════════════════════════════════════
   LE PLURIEL (1.72.0) — « 1 cartes dans votre collection » était
   faux sur CHAQUE libellé de la page Stats à une carte, c'est-à-dire
   dans l'état que voit un nouvel utilisateur : celui qui compte le
   plus, et le seul qu'aucune capture ne montrait.

   Les règles DIFFÈRENT selon la langue, et c'est pour ça qu'un
   `n > 1 ? 's' : ''` bricolé au point d'appel ne pouvait pas marcher :
     · fr  — 0 et 1 au SINGULIER (« 0 carte », « 1 carte »)
     · en, de, nl, es, it — seul 1 est singulier (« 0 cards »)
     · zh  — AUCUN pluriel : une seule forme, toujours
   D'où deux clés par libellé, `…_one` et `…_other`, et cette
   fonction qui choisit. En zh les deux clés portent le même texte :
   c'est voulu et lisible, plutôt qu'une exception dans le code.

   `tp('st.hero_early', n)` → cherche `st.hero_early_one` /
   `st.hero_early_other`, avec {n} interpolé par défaut.
   ══════════════════════════════════════════════════════════ */
const _UNE_SEULE_FORME = new Set(['zh']);          // pas de pluriel du tout
const _ZERO_EST_SINGULIER = new Set(['fr']);       // « 0 carte », pas « 0 cartes »

export function pluralForm(lang, n){
  if(_UNE_SEULE_FORME.has(lang)) return 'other';
  const abs = Math.abs(n);
  if(_ZERO_EST_SINGULIER.has(lang)) return abs < 2 ? 'one' : 'other';
  return abs === 1 ? 'one' : 'other';
}

export function tp(key, n, p = {}){
  return t(`${key}_${pluralForm(getLang(), n)}`, { n, ...p });
}
export function tpEsc(key, n, p = {}){
  return tEsc(`${key}_${pluralForm(getLang(), n)}`, { n, ...p });
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

/* ══════════════════════════════════════════════════════════
   DEUX VOIES EXPLICITES VERS innerHTML

   Le dépôt mélangeait deux choses très différentes sous le même
   appel : du markup FIGÉ écrit ici (icônes, gabarits) et du
   markup nourri par des données EXTERNES (sauvegarde importée,
   cloud, saisie). Un relecteur — humain ou outil — ne pouvait
   pas les distinguer d'un coup d'œil.

   - setSafeHTML(el, html) : le HTML vient du dépôt, point.
   - escapeHtml / tEsc     : la seule voie pour une donnée qui
                             vient d'ailleurs.

   Ce n'est pas une protection (setSafeHTML fait exactement ce
   que faisait innerHTML) : c'est une DÉCLARATION D'INTENTION,
   qui rend le mélange visible.
   ══════════════════════════════════════════════════════════ */
export function setSafeHTML(el, html){
  // CETTE ligne EST le point d'assignation que les analyseurs
  // cherchent. C'est précisément pour la rendre unique et nommée
  // qu'elle existe — un analyseur qui crie ici crie sur la déclaration
  // d'intention, pas sur un risque. Toute donnée externe passe par
  // escapeHtml/tEsc AVANT d'arriver ici, ce que verrouille
  // tests/security-hardening.test.js.
  //
  // Pas de directive eslint-disable : les alertes restantes viennent
  // des patterns NATIFS de Codacy, pas d'ESLint. Une directive ne les
  // atteint pas, et le plugin no-unsanitized n'étant pas chargé côté
  // Codacy, elle y produisait sa propre alerte. Traité côté service,
  // dans Code patterns (voir .codacy.yml).
  if(el) el.innerHTML = html;
  return el;
}

/* Une source d'image de confiance : chemin RELATIF, rien d'autre.
   card.image vient aujourd'hui du dépôt, mais rien dans le code ne
   le garantissait — une URL absolue ou un `javascript:` y passait.
   On refuse tout schéma, tout //hôte, tout chemin absolu, et les
   remontées de répertoire. Retourne '' si la valeur est refusée. */
export function safeImagePath(src){
  const v = String(src == null ? '' : src).trim();
  if(!v) return '';
  if(/^[a-z][a-z0-9+.-]*:/i.test(v)) return '';   // http:, data:, javascript:…
  if(v.startsWith('//')) return '';                // protocole-relatif
  if(v.startsWith('/')) return '';                 // absolu : casse aussi GitHub Pages
  if(v.split('/').includes('..')) return '';       // remontée de répertoire
  if(/[<>"'`\s\\]/.test(v)) return '';              // rien qui puisse casser l'attribut
  return v;
}
