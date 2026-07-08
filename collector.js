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
