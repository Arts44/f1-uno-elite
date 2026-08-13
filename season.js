/* ══════════════════════════════════════════════════════════
   LA SAISON COURANTE — une variable, aucune dépendance

   POURQUOI CE MODULE DE QUINZE LIGNES EXISTE, et il a été créé pendant
   le découpage de badges.js plutôt qu'avant :

   `storage-keys.js` et `badges-store.js` avaient été extraits pour
   sortir de l'enchevêtrement d'imports. Mesuré juste après, ils y
   étaient RENTRÉS — la composante était passée de 22 à 24 modules.
   La cause tenait à une seule donnée : la saison courante vivait dans
   `data.js`, qui importe `render.js` et `stats.js`. Tout module ayant
   besoin de connaître l'année héritait donc de la moitié de l'app.

   Une variable et son setter n'ont besoin de RIEN. En les isolant ici,
   `storage-keys.js` et `badges-store.js` deviennent des feuilles — ce
   qui était l'objet du découpage, et que les deux premiers pas
   n'obtenaient pas.

   `data.js` la RÉ-EXPORTE : les douze modules qui lisent
   `_currentSeason` depuis data.js ne bougent pas. L'export `let` garde
   sa liaison vivante — ils voient la valeur changer comme avant.

   RIEN D'AUTRE NE DOIT ENTRER ICI. Ce module vaut par ce qu'il ignore.
   ══════════════════════════════════════════════════════════ */
export let _currentSeason = 2025;
export function setCurrentSeason(season){ _currentSeason = season; }
