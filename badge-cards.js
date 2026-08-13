/* ══════════════════════════════════════════════════════════
   BADGE → CARTES — la correspondance, sans rien qui l'affiche

   POURQUOI CE MODULE EXISTE, et ce n'est pas la longueur de badges.js :
   il répond à une AUTRE question que le reste. Le reste demande « ce
   badge est-il débloqué, et à quel point ? » ; celui-ci demande
   « quelles cartes ce badge concerne-t-il ? ».

   La différence est visible dans ses dépendances : ni DOM, ni i18n, ni
   minuteur. Il lit le catalogue et la collection, il rend un tableau.
   C'est ce qui le rend RÉEMPLOYABLE — notamment par le futur export de
   liste d'échange, qui a besoin de la même forme {id, name, owned} sans
   vouloir de la page Badges.

   DEUX COMPORTEMENTS À NE PAS « SIMPLIFIER » — ils sont figés par
   tests/badges-caracterisation.test.js, section A :

     · les badges de CATÉGORIE listent aussi les cartes MANQUANTES
       (`cat:true`), parce que la liste sert de check-list ;
     · les badges de PALIER renvoient ce qui est RÉELLEMENT possédé,
       tronqué au seuil mais jamais complété jusqu'à lui — la liste
       décrit un état, elle ne promet pas un objectif.

   Un badge inconnu renvoie un tableau vide et ne lève pas : la page
   Badges d'une saison future ne doit pas tomber sur un identifiant
   qu'elle ne connaît pas encore.
   ══════════════════════════════════════════════════════════ */
import { CARDS_DB, CARD_TYPES } from './data.js';
import { getTypeData, cardOwned, cardWishlist, cardDoubles, cardFavorite } from './storage.js';

export function getBadgeCards(badgeId){
  const catMap = {pilote_all:'pilote',reserve_all:'reserve',director_all:'directeur',gp_all:'gp',champ_all:'champion'};
  // Category badges: show all cards in category with owned/missing
  if(catMap[badgeId]){
    const cat = catMap[badgeId]==='champion' ? null : catMap[badgeId];
    const cards = cat
      ? CARDS_DB.filter(c=>c.category===cat)
      : CARDS_DB.filter(c=>c.champion);
    return cards.map(c=>({id:c.id,name:c.name,owned:cardOwned(c.id),cat:true}));
  }
  // Other auto badges: show owned cards that contribute
  const owned = CARDS_DB.filter(c=>cardOwned(c.id));
  if(badgeId==='first_card') return owned.slice(0,1).map(c=>({id:c.id,name:c.name,owned:true,cat:false}));
  if(badgeId==='collector_10') return owned.slice(0,10).map(c=>({id:c.id,name:c.name,owned:true,cat:false}));
  if(badgeId==='hunter_25') return owned.slice(0,25).map(c=>({id:c.id,name:c.name,owned:true,cat:false}));
  if(badgeId==='expert_50') return owned.slice(0,50).map(c=>({id:c.id,name:c.name,owned:true,cat:false}));
  if(badgeId==='master_75') return owned.slice(0,75).map(c=>({id:c.id,name:c.name,owned:true,cat:false}));
  if(badgeId==='legend_101') return owned.map(c=>({id:c.id,name:c.name,owned:true,cat:false}));
  if(badgeId==='dreamer_5') return CARDS_DB.filter(c=>cardWishlist(c.id)).slice(0,5).map(c=>({id:c.id,name:c.name,owned:cardOwned(c.id),cat:false}));
  if(badgeId==='ambitious_15') return CARDS_DB.filter(c=>cardWishlist(c.id)).slice(0,15).map(c=>({id:c.id,name:c.name,owned:cardOwned(c.id),cat:false}));
  if(badgeId==='doubler_5') return CARDS_DB.filter(c=>cardDoubles(c.id)).slice(0,5).map(c=>({id:c.id,name:c.name,owned:true,cat:false}));
  if(badgeId==='massive_50'){let t=0;const r=[];CARDS_DB.forEach(c=>{c.types.forEach(ty=>{const d=getTypeData(c.id,ty);if(d.owned&&d.qty>0){t+=d.qty;if(t<=50)r.push({id:c.id,name:c.name,owned:true,cat:false});}});});return r;}
  if(badgeId==='fan_5') return CARDS_DB.filter(c=>cardFavorite(c.id)).slice(0,5).map(c=>({id:c.id,name:c.name,owned:cardOwned(c.id),cat:false}));
  if(badgeId==='superfan_15') return CARDS_DB.filter(c=>cardFavorite(c.id)).slice(0,15).map(c=>({id:c.id,name:c.name,owned:cardOwned(c.id),cat:false}));
  if(badgeId==='foil_5'){let n=0;const r=[];CARDS_DB.forEach(c=>{c.types.forEach(t=>{if(CARD_TYPES[t]&&CARD_TYPES[t].foil&&getTypeData(c.id,t).owned&&n<5){n++;r.push({id:c.id,name:c.name,owned:true,cat:false});}});});return r;}
  if(badgeId==='nitro_1'){let n=0;const r=[];CARDS_DB.forEach(c=>{c.types.forEach(t=>{if(t==='nitro_foil'&&getTypeData(c.id,t).owned&&n<1){n++;r.push({id:c.id,name:c.name,owned:true,cat:false});}});});return r;}
  if(badgeId==='wild_3'){const r=[];CARDS_DB.forEach(c=>{c.types.forEach(t=>{if(t==='wild_foil'&&getTypeData(c.id,t).owned&&r.length<3)r.push({id:c.id,name:c.name,owned:true,cat:false});});});return r;}
  if(badgeId==='promo_1'){const r=[];CARDS_DB.forEach(c=>{c.types.forEach(t=>{if((t==='promo_blue'||t==='promo_green'||t==='promo_red'||t==='promo_yellow')&&getTypeData(c.id,t).owned&&r.length<1)r.push({id:c.id,name:c.name,owned:true,cat:false});});});return r;}
  if(badgeId==='blue_20') return CARDS_DB.filter(c=>getTypeData(c.id,'blue').owned).slice(0,20).map(c=>({id:c.id,name:c.name,owned:true,cat:false}));
  if(badgeId==='green_20') return CARDS_DB.filter(c=>getTypeData(c.id,'green').owned).slice(0,20).map(c=>({id:c.id,name:c.name,owned:true,cat:false}));
  if(badgeId==='red_20') return CARDS_DB.filter(c=>getTypeData(c.id,'red').owned).slice(0,20).map(c=>({id:c.id,name:c.name,owned:true,cat:false}));
  if(badgeId==='yellow_20') return CARDS_DB.filter(c=>getTypeData(c.id,'yellow').owned).slice(0,20).map(c=>({id:c.id,name:c.name,owned:true,cat:false}));
  return [];
}