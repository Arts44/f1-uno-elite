/* ══════════════════════════════════════════════════════════
   PAGE HEAD — le bandeau d'en-tête commun aux 5 pages (1.45.0)

   Avant : chaque page inventait son entrée. Collection n'avait
   rien, Badges un hero, Stats un .sv-title, Compte et Réglages
   un .setv-title — quatre traitements pour une même fonction.

   Le pattern, en trois invariants :
     1. ligne d'identité — l'icône de l'onglet (le MÊME signe que
        la nav du bas), le titre, un sous-titre d'une ligne qui
        porte le chiffre clé de la page ;
     2. slot d'actions à droite, cibles 44 px ;
     3. slot « mesure » plein largeur, facultatif — c'est là que
        se rangent l'anneau de Badges et les barres de progression.
        Rien n'a été supprimé : tout a été rangé.

   Le header global (lockup + titre porté + saisons) reste collant
   au-dessus ; ce bandeau-ci DÉFILE avec le contenu, pour que son
   coût vertical se paie une fois et pas en permanence.

   Le module est une feuille du graphe : il n'importe que i18n et
   icons, et n'est importé que par les vues.
   ══════════════════════════════════════════════════════════ */
import { escapeHtml } from './i18n.js';
import { icon } from './icons.js';

/**
 * @param {object} o
 * @param {string} o.icon    clé d'icônes (icons.js) — celle de l'onglet
 * @param {string} o.title   titre déjà traduit (texte brut, échappé ici)
 * @param {string} [o.sub]   sous-titre déjà traduit (texte brut, échappé ici)
 * @param {string} [o.actions] HTML des boutons du slot d'actions
 * @param {string} [o.metric]  HTML du slot mesure
 * @param {string} [o.id]      id posé sur le bandeau
 */
export function pageHeadHTML(o){
  return `<div class="ph"${o.id ? ` id="${o.id}"` : ''}>
    <div class="ph-top">
      <div class="ph-id">
        <div class="ph-icon">${icon(o.icon)}</div>
        <div class="ph-txt">
          <h1 class="ph-title">${escapeHtml(o.title)}</h1>
          ${o.sub ? `<div class="ph-sub">${escapeHtml(o.sub)}</div>` : ''}
        </div>
      </div>
      ${o.actions ? `<div class="ph-act">${o.actions}</div>` : ''}
    </div>
    ${o.metric ? `<div class="ph-metric">${o.metric}</div>` : ''}
  </div>`;
}

/** Bouton du slot d'actions — 44 px, icône seule, nom accessible obligatoire. */
export function pageHeadBtn(iconName, label, attrs = ''){
  return `<button class="ph-btn" type="button" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}" ${attrs}>${icon(iconName)}</button>`;
}
