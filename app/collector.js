/* ══════════════════════════════════════════════════════════
   COLLECTOR TOOLS — shareable lists built from the current
   collection state: missing cards, doubles to trade, and a
   combined trade list. Pure selection logic (no DOM, no i18n)
   so it stays unit-testable; the Settings UI (pin.js) formats
   these into human-readable text.
   ══════════════════════════════════════════════════════════ */
import { CARDS_DB } from './data.js';
import {
  cardMissing, cardWishlist, cardDoubles, cardRarity, getTypeData
} from './storage.js';

// Every non-owned card, tagged with whether it is on the wishlist.
// wishlist ⊆ missing (cardWishlist is false once a card is owned).
export function missingCards(){
  return CARDS_DB
    .filter(c => cardMissing(c.id))
    .map(c => ({
      id: c.id, name: c.name, category: c.category,
      rarity: cardRarity(c), wishlist: cardWishlist(c.id),
    }));
}

// The wishlist subset of the missing cards.
export function wishlistCards(){
  return missingCards().filter(c => c.wishlist);
}

// Cards with at least one type flagged as a double, with the exact
// duplicated types and their copy counts (for a trade offer).
export function doublesList(){
  const out = [];
  CARDS_DB.forEach(c => {
    if(!cardDoubles(c.id)) return;
    const types = c.types
      .filter(ty => getTypeData(c.id, ty).doubles)
      .map(ty => ({ type: ty, qty: getTypeData(c.id, ty).qty || 0 }));
    if(types.length) out.push({
      id: c.id, name: c.name, category: c.category,
      rarity: cardRarity(c), types,
    });
  });
  return out;
}

// Combined swap sheet: what I'm looking for + what I'm offering.
export function tradeList(){
  return { want: missingCards(), offer: doublesList() };
}

/* ── LA FICHE D'ÉCHANGE (1.69.0) — le modèle de l'IMAGE.
   L'image plafonne à `cap` lignes par colonne (souhaitées d'abord) ;
   le CODE porte toujours la liste complète. Deux règles d'honnêteté,
   tenues ici et testées : jamais de « + 0 autres dans le code »
   (xxxMore vaut 0 → pas de ligne), jamais de colonne vide (hasXxx
   faux → la section ne se dessine pas). Pur, sans DOM ni i18n. ── */
export function tradeSheetModel(want, offer, cap = 6){
  const wantSorted = [...want].sort((a, b) => (b.wishlist ? 1 : 0) - (a.wishlist ? 1 : 0));
  return {
    want: wantSorted.slice(0, cap),
    offer: offer.slice(0, cap),
    wantMore: Math.max(0, want.length - cap),
    offerMore: Math.max(0, offer.length - cap),
    hasWant: want.length > 0,
    hasOffer: offer.length > 0,
    wantTotal: want.length,
    offerTotal: offer.length,
  };
}


/* ── OBJECTIFS PROCHES (phase H) — les buts « à N cartes près ».
   Pur et injectable : candidats = chaque écurie (posséder toutes ses
   cartes), chaque catégorie, et les champions. Ne garde que les buts
   ENTAMÉS et non finis, triés par manque croissant (le plus proche
   d'aboutir d'abord), limités à `limit`. Chaque objectif emporte ses
   cartes manquantes — l'UI les rend cliquables. ── */
export function nearGoals(cards, ownedFn, limit = 4){
  const goals = [];
  const consider = (kind, key, pool) => {
    if(!pool.length) return;
    const missing = pool.filter(c => !ownedFn(c.id));
    if(missing.length === 0 || missing.length === pool.length) return; // fini, ou pas commencé
    goals.push({ kind, key, total: pool.length, owned: pool.length - missing.length,
                 missing: missing.map(c => ({ id: c.id, name: c.name })) });
  };
  [...new Set(cards.map(c => c.team).filter(Boolean))]
    .forEach(tm => consider('team', tm, cards.filter(c => c.team === tm)));
  [...new Set(cards.map(c => c.category))]
    .forEach(cat => consider('category', cat, cards.filter(c => c.category === cat)));
  consider('champion', 'champion', cards.filter(c => c.champion));
  goals.sort((a, b) => a.missing.length - b.missing.length || b.owned / b.total - a.owned / a.total);
  return goals.slice(0, limit);
}


/* ══════════════════════════════════════════════════════════
   LE RECOUPEMENT (1.75.0) — l'accord entre deux collections.

   L'APP CALCULE, ELLE N'ARBITRE PAS. Elle pose ce qui peut passer
   d'un côté et de l'autre, et ce que ça ferait monter. Elle ne dit
   jamais si un échange est « bon », « juste » ou « à votre
   avantage » : ce jugement appartient aux deux personnes. Les deux
   directions sont donc traitées par le MÊME code et rendues par les
   MÊMES gabarits — la neutralité est ainsi VÉRIFIABLE (voir
   tests/accord.test.js) plutôt qu'annoncée.

   ⚠️ AUCUNE COLLECTION FICTIVE N'EST NÉCESSAIRE POUR PRÉDIRE UNE
   MONTÉE DE PALIER, et c'est contre-intuitif — quelqu'un voudra
   construire un état hypothétique pour répondre à la question. Ce
   n'est pas utile : `variantRarity(carte, type)` est PURE, elle ne
   dépend que de la carte et du type, jamais de ce qu'on possède.
   Comparer sa valeur au `cardRarity` COURANT suffit donc à savoir si
   la carte reçue ferait monter. C'est cette propriété qui a fait
   tomber le coût de ce chantier de « moyen » à « faible » (n°21 de
   POINTS-SIGNALES).

   Pur : ni DOM, ni i18n. `rarityOrder`/`variantRarity`/`cardRarity`
   sont injectés pour que le module reste une feuille du graphe.
   ══════════════════════════════════════════════════════════ */
export function accordModel(moi, autre, deps = {}){
  const { cards = [], rarityOrder = {}, variantRarity = null, cardRarity = null } = deps;
  const parCarte = id => cards.find(c => c.id === id) || null;

  // Ce qui ARRIVE : ses doubles qui sont dans mes manquantes.
  // Ce qui PART   : mes doubles qui sont dans ses manquantes.
  // Deux intersections, une seule forme — la symétrie est structurelle.
  const mesWant = new Set(moi.want || []);
  const sesWant = new Set(autre.want || []);
  const sesOffreIds = (autre.offer || []).map(o => Array.isArray(o) ? o[0] : o.id);
  const mesOffreIds = (moi.offer || []).map(o => Array.isArray(o) ? o[0] : o.id);

  const entrant = sesOffreIds.filter(id => mesWant.has(id)).map(id => {
    const c = parCarte(id);
    const ligne = { id, name: c ? c.name : `#${id}` };
    // La montée : le meilleur type qu'elle offre pour cette carte,
    // comparé au palier COURANT. Sans simuler quoi que ce soit.
    if(c && variantRarity && cardRarity){
      const types = (autre.offer.find(o => (Array.isArray(o) ? o[0] : o.id) === id) || [])[1] || [];
      const courant = rarityOrder[cardRarity(c)] ?? 0;
      let meilleur = null;
      types.forEach(([ty]) => {
        const r = variantRarity(c, ty);
        if((rarityOrder[r] ?? 0) > courant && (!meilleur || (rarityOrder[r] ?? 0) > (rarityOrder[meilleur] ?? 0))) meilleur = r;
      });
      if(meilleur) ligne.monte = meilleur;
    }
    return ligne;
  });

  const sortant = mesOffreIds.filter(id => sesWant.has(id)).map(id => {
    const c = parCarte(id);
    const o = (moi.offer || []).find(x => (Array.isArray(x) ? x[0] : x.id) === id);
    const types = (Array.isArray(o) ? o[1] : o && o.types) || [];
    // « il vous en reste N » : on ne donne que des doubles, la mention
    // évite le regret.
    const reste = types.reduce((s, t) => s + Math.max(0, (Array.isArray(t) ? t[1] : t.qty) - 1), 0);
    return { id, name: c ? c.name : `#${id}`, reste };
  });

  return {
    entrant, sortant,
    nIn: entrant.length, nOut: sortant.length,
    // Trois états, et AUCUN ne porte de jugement de valeur :
    //  · 'aucun'    — rien ne circule (fréquent entre collections jeunes)
    //  · 'possible' — les deux sens ont quelque chose
    //  · 'unilateral' — un seul sens ; « à voir entre vous », jamais
    //    « déséquilibré » ni « à votre désavantage ». C'est le MÊME état
    //    dans les deux directions : l'app ne distingue pas celui qui
    //    donne de celui qui reçoit.
    etat: entrant.length === 0 && sortant.length === 0 ? 'aucun'
      : (entrant.length > 0 && sortant.length > 0) ? 'possible' : 'unilateral',
  };
}

/* Miroir exact — utilisé par le test de symétrie : échanger les deux
   collections doit produire l'accord inverse, sans exception. */
export function accordMiroir(a){
  return { entrant: a.sortant, sortant: a.entrant, nIn: a.nOut, nOut: a.nIn, etat: a.etat };
}
