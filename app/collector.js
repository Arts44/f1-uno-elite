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
