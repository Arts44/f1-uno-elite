/* ══════════════════════════════════════════════════════════
   LES TITRES — un concept utilisateur distinct des badges

   POURQUOI CE MODULE EXISTE. Un titre n'est pas un badge : c'est ce que
   le collectionneur AFFICHE de lui-même. Il se gagne par les badges,
   mais il a sa propre clé de stockage, sa propre sélection, et ses
   propres consommateurs — `i18n.js` (re-rendu au changement de langue),
   `settings-sync.js` (restauration d'une sauvegarde) et `stats.js`.

   Ces trois-là n'avaient besoin QUE de `updateUserTitle()`, et
   importaient pour ça un module de mille lignes.

   LA RÈGLE QUI TIENT TOUT : le titre affiché vient TOUJOURS de la liste
   débloquée ; le stockage ne fournit qu'un IDENTIFIANT à retrouver.
   Persister l'objet entier a déjà produit une XSS (même vecteur que
   #backup=, corrigée en 1.42) — une sauvegarde hostile pouvait y placer
   un nom porteur de balises.

   UNE BIZARRERIE FIGÉE, PAS CORRIGÉE, et c'est délibéré : une valeur de
   titre ILLISIBLE reste indéfiniment en place. `loadSelectedTitle()`
   échoue à la parser, laisse l'identifiant à null, et la branche de
   nettoyage — qui exige un identifiant non nul — n'est jamais atteinte.
   Sans conséquence visible : elle n'est jamais affichée. Le test de
   caractérisation (section B) la décrit ; l'« améliorer » ici serait un
   changement de comportement déguisé en refactor.
   ══════════════════════════════════════════════════════════ */
import { t, getLang } from './i18n.js';
import { icon } from './icons.js';
import { AUTO_BADGES, MANUAL_BADGES } from './data.js';
import { _storageKey } from './storage-keys.js';
import { manualBadges, loadManualBadges } from './badges-store.js';
import { isAutoBadgeUnlocked } from './badge-rules.js';
/* Oubliés au pas 4 du découpage v2 : toggleTitlePicker() les utilise, et
   ni les tests ni la vérification navigateur ne passaient par ce chemin.
   Trouvés par noUndeclaredVariables, dès sa première exécution. */
import { badgeDifficulty, difficultyLabelKey } from './difficulty.js';

const BADGE_TITLES = {
  // Auto badges
  first_card:'Débutant',collector_10:'Collectionneur',hunter_25:'Chasseur',expert_50:'Expert',
  master_75:'Maître',legend_101:'Légende vivante',dreamer_5:'Rêveur',ambitious_15:'Ambitieux',
  doubler_5:'Doubleur',massive_50:'Collection massive',fan_5:'Fan',superfan_15:'Super Fan',
  pilote_all:'Pilote collector',reserve_all:'Réserve collector',director_all:'Directeur collector',
  gp_all:'GP collector',champ_all:'Champion collector',foil_5:'Foil hunter',nitro_1:'Nitro master',
  wild_3:'Wild card',promo_1:'Promo king',blue_20:'Blue team',green_20:'Green machine',
  red_20:'Red baron',yellow_20:'Yellow flash',
  // Manual badges
  spectateur:'Spectateur',premier_achat:'Premier acheteur',cadeau:'Lucky gift',echange:'Négociateur',
  photo_pilote:'Selfie star',circuit_visit:'Circuit walker',fan_tv:'Téléspectateur',gamer:'Gamer F1',
  merch:'Merch addict',app_f1tv:'F1 TV viewer',launch_day:'Day One',globe:'Globe-trotter',
  vip:'VIP Access',f1tv_pro:'F1 TV Pro',rencontre:'Rencontreur',sim_racing:'Sim Racer',
  livre_f1:'Connaisseur',fan_art:'Artiste F1',communaute:'Communautaire',benevole:'Bénévole',
  cinema_f1:'Cinéphile F1',podcast_f1:'Podcaster',stands_visit:'Pit lane',prediction:'Prophète',
  karting:'Karting pilot'
};

// Special milestone titles (unlocked when conditions met)
const MILESTONE_TITLES = [
  {id:'25_badges', name:'Champion',      icon:'🏆', color:'#34C759', desc:'25 badges débloqués'},
  {id:'50_badges', name:'Hall of Fame',  icon:'🌟', color:'#FF6B35', desc:'50 badges débloqués'},
  {id:'all_auto',  name:'Cyborg',        icon:'🤖', color:'#007AFF', desc:'Tous les badges auto'},
  {id:'all_manual',name:'Explorateur',   icon:'🧭', color:'#FF9500', desc:'Tous les badges manuels'},
];

// Seul l'IDENTIFIANT du titre choisi est gardé : l'objet affiché est
// toujours retrouvé dans getUnlockedTitles(). Voir loadSelectedTitle().
let selectedTitleId = null;

/* ── f1uno_title : on ne persiste QUE l'identifiant ───────────
   Avant, l'OBJET titre entier était sérialisé dans le localStorage,
   puis relu et affiché tel quel. Le garde ne vérifiait que son `id`
   contre les titres débloqués — mais c'est l'objet STOCKÉ qui était
   ensuite interpolé en innerHTML. Or f1uno_title fait partie des
   préférences restaurées par un import (settings-sync.js, PREF_KEYS) :
   une sauvegarde ou un lien #backup= hostile pouvait donc y placer
   {id:"<un id valide>", name:"<img src=x onerror=…>"} et faire exécuter
   du script. Même vecteur que la XSS #backup= corrigée en 1.42.
   Le titre est une donnée DÉRIVÉE : seul son id a besoin d'être
   persisté, et l'objet affiché vient toujours de getUnlockedTitles(). */
function loadSelectedTitle(){
  selectedTitleId = null;
  try {
    // Clé scoppée par saison depuis 1.47.4 (un titre se gagne AVEC les
    // badges d'une saison). La migration v3 déplace l'ancienne clé nue ;
    // la relecture de secours ci-dessous couvre le cas où le titre est
    // lu avant que loadData() n'ait migré.
    const raw = localStorage.getItem(_storageKey('title'))
      ?? localStorage.getItem('f1uno_title');
    if(!raw) return;
    const v = JSON.parse(raw);
    // Ancien format (objet complet) ET nouveau (id nu) : on ne retient
    // que l'identifiant, et seulement s'il ressemble à un identifiant.
    const id = typeof v === 'string' ? v : (v && typeof v.id === 'string' ? v.id : null);
    if(id && /^[a-z0-9_]{1,64}$/i.test(id)) selectedTitleId = id;
  } catch(e){}
}
function saveSelectedTitle(){
  if(selectedTitleId) localStorage.setItem(_storageKey('title'), JSON.stringify(selectedTitleId));
  else localStorage.removeItem(_storageKey('title'));
}

export function getUnlockedTitles(){
  loadManualBadges();
  const titles = [];
  // Per-badge titles
  // v3 : CHAQUE badge débloqué offre un titre — l'entrée explicite de
  // BADGE_TITLES garde la priorité, sinon le nom traduit du badge.
  // t() renvoie la CLÉ quand la traduction manque — on la traite comme
  // absente (sinon les nouveaux badges affichent « title.foil_15 »).
  const trOrEmpty = k => { const v = t(k); return v === k ? '' : v; };
  const titleOf = b => trOrEmpty('title.'+b.id) || BADGE_TITLES[b.id]
    || (window.__BADGE_T?.[b.id]?.[getLang()] || window.__BADGE_T?.[b.id]?.en || {}).name || b.name;
  AUTO_BADGES.forEach(b => {
    if(isAutoBadgeUnlocked(b))
      titles.push({id:b.id, name:titleOf(b), emoji:b.emoji, source:'badge'});
  });
  MANUAL_BADGES.forEach(b => {
    if(manualBadges[b.id])
      titles.push({id:b.id, name:titleOf(b), emoji:b.emoji, source:'badge'});
  });
  // Milestone titles
  const autoCount = AUTO_BADGES.filter(b=>isAutoBadgeUnlocked(b)).length;
  const manualCount = Object.values(manualBadges).filter(Boolean).length;
  const total = autoCount + manualCount;
  if(total >= 25) titles.push({...MILESTONE_TITLES[0], name:t('milestone.25_badges')||MILESTONE_TITLES[0].name, desc:t('milestone.25_badges_desc')||MILESTONE_TITLES[0].desc, source:'milestone'});
  if(total >= 50) titles.push({...MILESTONE_TITLES[1], name:t('milestone.50_badges')||MILESTONE_TITLES[1].name, desc:t('milestone.50_badges_desc')||MILESTONE_TITLES[1].desc, source:'milestone'});
  if(autoCount >= 25) titles.push({...MILESTONE_TITLES[2], name:t('milestone.all_auto')||MILESTONE_TITLES[2].name, desc:t('milestone.all_auto_desc')||MILESTONE_TITLES[2].desc, source:'milestone'});
  if(manualCount >= 25) titles.push({...MILESTONE_TITLES[3], name:t('milestone.all_manual')||MILESTONE_TITLES[3].name, desc:t('milestone.all_manual_desc')||MILESTONE_TITLES[3].desc, source:'milestone'});
  return titles;
}

export function selectTitle(titleObj){
  selectedTitleId = titleObj && titleObj.id ? titleObj.id : null;
  saveSelectedTitle();
  updateUserTitle();
}

export function updateUserTitle(){
  loadSelectedTitle();
  const unlocked = getUnlockedTitles();
  // Le titre affiché vient TOUJOURS de la liste débloquée, jamais du
  // localStorage : celui-ci ne fournit qu'un identifiant à retrouver.
  const chosen = selectedTitleId ? unlocked.find(t => t.id === selectedTitleId) : null;
  if(selectedTitleId && !chosen){ selectedTitleId = null; saveSelectedTitle(); }
  const active = chosen
    || (unlocked.length > 0 ? unlocked[0] : {id:'rookie',name:'Rookie',emoji:'🟡',source:'default'});

  // Regenerate name with current translation for active title
  if(active.source === 'badge' && active.id !== 'rookie'){
    { const v = t('title.'+active.id); if(v !== 'title.'+active.id) active.name = v; }
  } else if(active.source === 'milestone'){
    if(active.id === 'milestone_25_badges') active.name = t('milestone.25_badges') || active.name;
    else if(active.id === 'milestone_50_badges') active.name = t('milestone.50_badges') || active.name;
    else if(active.id === 'milestone_all_auto') active.name = t('milestone.all_auto') || active.name;
    else if(active.id === 'milestone_all_manual') active.name = t('milestone.all_manual') || active.name;
  }

  const color = active.color || (active.source==='milestone' ? '#FF6B35' : '#E8002D');
  // Header pill
  const ht = document.getElementById('headerTitle');
  if(ht) ht.innerHTML = `<span class="ht-icon">${active.emoji||active.icon||'🟡'}</span><span style="color:color-mix(in srgb, ${color} var(--ink-mix,100%), #000)">${active.name}</span>`;
  // Badges page card
  const uc = document.getElementById('userTitleCard');
  if(uc){
    const unlockedCount = unlocked.length;
    uc.innerHTML = `
      <span class="user-title-icon">${active.emoji||active.icon||'🟡'}</span>
      <span class="user-title-text" style="color:color-mix(in srgb, ${color} var(--ink-mix,100%), #000)">${active.name}</span>
      <span class="user-title-sub">${unlockedCount} ${t('b.titles_unlocked')||'titles unlocked'}</span>
      <div class="user-title-next" data-action="toggleTitlePicker">${t('b.choose')||'▼ Choose my title'}</div>
      <div class="title-picker" id="titlePicker" style="display:none"></div>`;
  }
}

export function toggleTitlePicker(){
  const picker = document.getElementById('titlePicker');
  if(!picker) return;
  if(picker.style.display !== 'none'){
    picker.style.display = 'none'; return;
  }
  const unlocked = getUnlockedTitles();
  loadSelectedTitle();
  const unlockedIds = new Set(unlocked.map(x => x.id));
  // Jalons (25/50 badges…) d'abord — hors échelle de difficulté
  let html = '<div class="title-picker-grid">';
  unlocked.filter(x => x.source === 'milestone').forEach(t => {
    const isActive = selectedTitleId === t.id;
    const color = t.color || '#E8002D';
    html += `<div class="title-pick${isActive?' active':''}" data-action="selectTitle" data-title-id="${t.id}" style="border-color:${isActive?color:'var(--border)'}">
      <span>${t.emoji || t.icon || '🏆'}</span><span style="color:color-mix(in srgb, ${color} var(--ink-mix,100%), #000)">${t.name}</span>
    </div>`;
  });
  // Puis TOUS les badges, du plus difficile au plus facile (nom en départage)
  const nameOf = b => (window.__BADGE_T?.[b.id]?.[getLang()] || window.__BADGE_T?.[b.id]?.en || {}).name || b.name;
  const all = [...AUTO_BADGES, ...MANUAL_BADGES]
    .map(b => ({ b, d: badgeDifficulty(b), nm: nameOf(b), un: unlockedIds.has(b.id) }))
    .sort((a, z) => z.d - a.d || a.nm.localeCompare(z.nm));
  all.forEach(({ b, d, nm, un }) => {
    const isActive = un && selectedTitleId === b.id;
    const diff = `<span class="tp-diff dl-${difficultyLabelKey(d).slice(7)}">${d}%</span>`;
    if(un){
      html += `<div class="title-pick${isActive?' active':''}" data-action="selectTitle" data-title-id="${b.id}">
        <span>${b.emoji}</span><span>${nm}</span>${diff}</div>`;
    } else {
      html += `<div class="title-pick tp-locked" aria-disabled="true">
        <span>${b.emoji}</span><span>${nm}</span>${diff}</div>`;
    }
  });
  html += '</div>';
  picker.innerHTML = html;
  picker.style.display = 'block';
}
