/* ══════════════════════════════════════════════════════════
   MODE POCHETTE (v2.3 phase G) — le flux « j'ouvre un booster ».

   Geste de table, pensé mobile d'abord : on tape le numéro de la
   carte tirée sur un pavé numérique, l'app la reconnaît dès le
   3e chiffre, et un seul gros bouton ajoute un exemplaire. Puis
   la carte suivante, sans jamais quitter l'écran.

   Trois garanties :
   1. RIEN N'EST PERDU — un instantané de TOUTES les clés de
      collection est pris à l'ouverture (même mécanique éprouvée
      que le tutoriel) : « Tout annuler » restaure l'état exact
      d'avant la pochette, quoi qu'il se soit passé entre-temps.
   2. PAS DE RAFALE — les badges qui tombent pendant la session
      sont RETENUS (badges.js passe en mode hold) et livrés
      GROUPÉS sur l'écran de résumé.
   3. ÉCRITURES TRACÉES — chaque geste garde son état précédent,
      donc l'annulation unitaire (↩ sur le fil) est exacte.

   Toutes les écritures passent par quickAddVariant()/undoQuickAdd()
   de storage.js — aucune écriture directe ici.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { t } from './i18n.js';
import { CARDS_DB, CARD_TYPES, TEAM_COLORS, TEAM_LIVERIES, sortTypesCanonical, _currentSeason } from './data.js';
import { cardOwned, quickAddVariant, undoQuickAdd, getTypeData, loadData } from './storage.js';
import { renderCollection, showToast, defaultBaseType } from './render.js';
import { updateStats } from './stats.js';
import { holdBadgeToasts, takeHeldBadges, queueBadgeToasts, loadManualBadges } from './badges.js';
import { tutorialKeys, captureLocalStorage, applyLocalStorage } from './tutorial.js';
import { icon } from './icons.js';
import { deniedForViewer } from './session.js';

const ID_LEN = 3;               // les identifiants de carte sont sur 3 chiffres
const TRAIL_MAX = 12;           // gestes gardés dans le fil (annulation unitaire)

let _open = false;
let _buf = '';                  // saisie en cours
let _entries = [];              // { cardId, typeId, kind:'add'|'dup'|'skip', prev }
let _snapshot = null;
let _root = null;

export function isPackOpen(){ return _open; }

/* ── Helpers PURS (testés) ─────────────────────────────── */

// Ce que la saisie donne : rien, une carte, ou un numéro inconnu.
export function resolvePackInput(buf, cards){
  if(buf.length < ID_LEN) return { state: 'typing' };
  const card = cards.find(c => c.id === buf);
  return card ? { state: 'found', card } : { state: 'unknown', id: buf };
}

// Chiffre tapé / effacé — la saisie ne dépasse jamais 3 chiffres.
export function packKeyReduce(buf, key){
  if(key === 'back') return buf.slice(0, -1);
  if(!/^[0-9]$/.test(key)) return buf;
  return buf.length >= ID_LEN ? buf : buf + key;
}

// Bilan de session : ajoutées (hors passées), dont nouvelles, passées.
export function packSummary(entries){
  const added = entries.filter(e => e.kind !== 'skip');
  return {
    added: added.length,
    fresh: entries.filter(e => e.kind === 'add').length,
    dup: entries.filter(e => e.kind === 'dup').length,
    skipped: entries.filter(e => e.kind === 'skip').length,
  };
}

/* ── Cycle de vie ──────────────────────────────────────── */

export function openPack(){
  if(_open || deniedForViewer()) return;
  _open = true;
  _buf = '';
  _entries = [];
  _snapshot = captureLocalStorage(tutorialKeys(_currentSeason));
  holdBadgeToasts(true);          // les badges attendront le résumé
  _build();
  log('pack: session ouverte');
}

export function closePack(restore){
  if(!_open) return;
  if(restore && _snapshot){
    applyLocalStorage(_snapshot);
    try { loadData(); loadManualBadges(); } catch(e){ log('pack restore', e); }
    takeHeldBadges();             // rien n'est arrivé : on jette les badges retenus
  }
  _open = false;
  _snapshot = null;
  _entries = [];
  _buf = '';
  holdBadgeToasts(false);
  _root?.remove();
  _root = null;
  document.removeEventListener('keydown', _onKey, true);
  updateStats();
  renderCollection();
}

/* ── Actions ───────────────────────────────────────────── */

function _addCurrent(typeId){
  const r = resolvePackInput(_buf, CARDS_DB);
  if(r.state !== 'found') return;
  const card = r.card;
  const ty = typeId || defaultBaseType(card);
  const wasOwned = cardOwned(card.id);
  const prev = quickAddVariant(card.id, ty);
  _entries.push({ cardId: card.id, typeId: ty, kind: wasOwned ? 'dup' : 'add', prev });
  if(navigator.vibrate) { try { navigator.vibrate(25); } catch(e){} }   // iOS : dégradation silencieuse
  _afterAction();
}

function _skipCurrent(){
  const r = resolvePackInput(_buf, CARDS_DB);
  if(r.state !== 'found') return;
  _entries.push({ cardId: r.card.id, kind: 'skip' });
  _afterAction();
}

// Annulation unitaire depuis le fil — restaure l'état exact d'AVANT ce geste.
function _undoEntry(idx){
  const e = _entries[idx];
  if(!e) return;
  if(e.kind !== 'skip') undoQuickAdd(e.cardId, e.typeId, e.prev);
  _entries.splice(idx, 1);
  _render();
}

function _afterAction(){
  _buf = '';
  updateStats();                 // déclenche checkNewAutoBadges (retenu par le hold)
  _render();
}

/* ── Rendu ─────────────────────────────────────────────── */

function _visualHTML(card){
  const lv = TEAM_LIVERIES[card.team];
  const col = TEAM_COLORS[card.team] || 'var(--tx3)';
  const bar = lv ? `<span class="pk-lvb" style="--c1:${lv.c1};--c2:${lv.c2}"></span>` : '';
  return `<div class="pk-vis" style="--tc:${col}">${bar}<b>${card.id.replace(/^0+/, '') || card.id}</b></div>`;
}

function _matchHTML(){
  const r = resolvePackInput(_buf, CARDS_DB);
  if(r.state === 'typing') return `<div class="pk-empty">${t('pack.hint')}</div>`;
  if(r.state === 'unknown') return `<div class="pk-empty">${t('pack.unknown', { id: r.id })}</div>`;
  const card = r.card;
  const owned = cardOwned(card.id);
  return `<div class="pk-card">
    ${_visualHTML(card)}
    <div class="pk-info">
      <div class="pk-name">#${card.id} ${card.name}</div>
      <div class="pk-team">${card.team || t('cat.' + card.category)}</div>
      <span class="pk-tag ${owned ? 'dup' : 'new'}">${t(owned ? 'pack.is_dup' : 'pack.is_new')}</span>
    </div>
  </div>`;
}

function _trailHTML(){
  const shown = _entries.slice(-TRAIL_MAX);
  const offset = _entries.length - shown.length;
  return shown.map((e, i) => {
    const label = e.kind === 'skip' ? t('pack.skipped') : e.kind === 'dup' ? t('pack.dup_short') : '+1';
    return `<span class="pk-chip">#${e.cardId} ${label}
      <button type="button" class="pk-undo" data-undo="${offset + i}" aria-label="${t('pack.undo_one')}">↩</button></span>`;
  }).join('');
}

function _build(){
  _root = document.createElement('div');
  _root.className = 'pack-overlay';
  _root.setAttribute('role', 'dialog');
  _root.setAttribute('aria-modal', 'true');
  _root.setAttribute('aria-label', t('pack.title'));
  document.body.appendChild(_root);
  document.addEventListener('keydown', _onKey, true);
  _render();
}

function _render(){
  if(!_root) return;
  const s = packSummary(_entries);
  const r = resolvePackInput(_buf, CARDS_DB);
  const has = r.state === 'found';
  const digits = Array.from({ length: ID_LEN }, (_, i) =>
    `<span class="pk-d${i === _buf.length ? ' on' : ''}">${_buf[i] || ''}</span>`).join('');
  const keys = ['1','2','3','4','5','6','7','8','9','back','0'];

  _root.innerHTML = `
    <div class="pack-sheet">
      <div class="pk-head">
        <span class="pk-title">${t('pack.title')}</span>
        <span class="pk-count">${s.added ? t(s.added > 1 ? 'pack.count_many' : 'pack.count_one', { n: s.added }) : ''}</span>
        <button type="button" class="pk-x" data-pack="finish" aria-label="${t('pack.finish')}">✕</button>
      </div>
      <div class="pk-trail">${_trailHTML()}</div>
      <div class="pk-echo">${digits}</div>
      <div class="pk-match">${_matchHTML()}</div>
      <div class="pk-acts">
        <button type="button" class="pk-act primary" data-pack="add"${has ? '' : ' disabled'}>
          ${has && cardOwned(r.card.id) ? t('pack.add_dup') : t('pack.add_new')}
        </button>
        <button type="button" class="pk-act" data-pack="variant"${has ? '' : ' disabled'}>${t('pack.variant')}</button>
        <button type="button" class="pk-act" data-pack="skip"${has ? '' : ' disabled'}>${t('pack.skip')}</button>
      </div>
      <div class="pk-pad">
        ${keys.map(k => `<button type="button" class="pk-key" data-key="${k}">${k === 'back' ? '⌫' : k}</button>`).join('')}
      </div>
    </div>`;
}

// Écran de résumé : bilan + badges retenus, livrés groupés ici.
function _renderSummary(){
  const s = packSummary(_entries);
  const held = takeHeldBadges();
  const names = held.map(b => b.name).join(' · ');
  _root.innerHTML = `
    <div class="pack-sheet sum">
      <h2 class="pk-sum-title">${t('pack.done_title')}</h2>
      <div class="pk-sum-nums">
        <div class="pk-kv"><b>${s.added}</b><span>${t('pack.added')}</span></div>
        <div class="pk-kv"><b>${s.fresh}</b><span>${t('pack.new')}</span></div>
        <div class="pk-kv"><b>${s.skipped}</b><span>${t('pack.skipped')}</span></div>
      </div>
      <div class="pk-sum-badges">${held.length
        ? `${icon('medal')} <b>${t(held.length > 1 ? 'b.toast_many' : 'b.toast_one', { n: held.length })}</b><br>${names}`
        : t('pack.no_badge')}</div>
      <div class="pk-sum-acts">
        <button type="button" class="pk-act ghost" data-pack="undoAll">${t('pack.undo_all')}</button>
        <button type="button" class="pk-act primary" data-pack="close">${t('pack.close')}</button>
      </div>
    </div>`;
  // Les badges retenus repartent dans la file normale APRÈS la fermeture
  // (si l'utilisateur annule tout, ils sont jetés — voir closePack).
  _root._held = held;
}

/* ── Entrées utilisateur ───────────────────────────────── */

function _onKey(e){
  if(!_open) return;
  if(e.key === 'Escape'){ e.preventDefault(); _finish(); return; }
  if(/^[0-9]$/.test(e.key)){ e.preventDefault(); _buf = packKeyReduce(_buf, e.key); _render(); return; }
  if(e.key === 'Backspace'){ e.preventDefault(); _buf = packKeyReduce(_buf, 'back'); _render(); return; }
  if(e.key === 'Enter'){ e.preventDefault(); _addCurrent(); }
}

function _finish(){
  if(!_entries.length){ closePack(false); return; }
  _renderSummary();
}

// Sélecteur de variante : les types de la carte dans l'ordre canonique.
function _openVariantPicker(){
  const r = resolvePackInput(_buf, CARDS_DB);
  if(r.state !== 'found') return;
  const card = r.card;
  const sheet = _root.querySelector('.pack-sheet');
  const pop = document.createElement('div');
  pop.className = 'pk-vpick';
  pop.innerHTML = `<div class="pk-vpick-t">${t('pack.variant_pick')}</div>
    <div class="pk-vpick-g">${sortTypesCanonical(card.types).map(ty => {
      const ct = CARD_TYPES[ty];
      const q = getTypeData(card.id, ty).qty || 0;
      return `<button type="button" class="pk-v" data-vtype="${ty}" style="--vc:${ct.color}">
        <span class="pk-v-n">${ct.label}</span>${q > 0 ? `<span class="pk-v-q">×${q}</span>` : ''}</button>`;
    }).join('')}</div>`;
  sheet.appendChild(pop);
}

// Délégation locale — l'overlay est autonome (rien dans app.js).
document.addEventListener('click', e => {
  if(!_open || !_root) return;
  const k = e.target.closest('[data-key]');
  if(k){ _buf = packKeyReduce(_buf, k.getAttribute('data-key')); _render(); return; }
  const u = e.target.closest('[data-undo]');
  if(u){ _undoEntry(parseInt(u.getAttribute('data-undo'), 10)); return; }
  const v = e.target.closest('[data-vtype]');
  if(v){ _addCurrent(v.getAttribute('data-vtype')); return; }
  const a = e.target.closest('[data-pack]');
  if(!a) return;
  switch(a.getAttribute('data-pack')){
    case 'add': _addCurrent(); break;
    case 'skip': _skipCurrent(); break;
    case 'variant': _openVariantPicker(); break;
    case 'finish': _finish(); break;
    case 'undoAll': closePack(true); showToast(t('pack.undone')); break;
    case 'close': {
      const held = _root._held || [];
      closePack(false);
      if(held.length) queueBadgeToasts(held);   // livraison groupée, après la fermeture
      break;
    }
  }
});
