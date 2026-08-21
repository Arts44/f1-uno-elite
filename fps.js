/* ══════════════════════════════════════════════════════════════════
   COMPTEUR D'IMAGES DU FOND DE LA VITRINE — outil de mesure, chargé
   UNIQUEMENT quand l'URL porte `?fps=1`.

   POURQUOI IL EST DANS UN FICHIER À PART. Inline dans `index.html`, il
   coûtait 1,6 Ko gzippés à CHAQUE visiteur, sur une marge de plafond de
   4,4 Ko, pour un usage qui n'arrive qu'en octobre 2026 — aucun
   appareil mobile n'est disponible avant (POINTS-SIGNALES n°32). Ici,
   le chargement normal ne paie rien : ni octet, ni requête.

   CE QU'IL MESURE, ET CE QU'IL REFUSE DE MESURER.

   ① L'INTERVALLE ENTRE DEUX rAF, PAS LE TEMPS DE DESSIN. Les mesures
      de bureau du fond donnent « 0,50 ms de médiane », et ce chiffre ne
      compte QUE la boucle de remplissage : ni l'upload de la texture,
      ni la composition. Un intervalle rAF contient toute la trame —
      c'est ce que l'œil subit.

   ② LE SEUIL DE 16,7 ms EST UN PIÈGE, et ce compteur le dit au lieu de
      le taire. Il vaut une trame à 60 Hz : la moitié de la gigue
      normale le franchit sans que rien ne se voie. Mesuré sur un poste
      de bureau parfaitement fluide : 277 trames sur 720 au-dessus de
      16,7 ms, et ZÉRO saut réel. Sur un écran à 120 Hz, le même seuil
      vaut DEUX trames et rate donc tous les sauts simples.
      D'où la détection de la cadence de l'appareil — médiane des
      intervalles 10 à 50, moins d'une seconde — et le compte des SAUTS
      au-delà de 1,75 fois cette base. Les deux chiffres sont affichés :
      celui qui est classique, et celui qui répond.

   ③ AUCUNE MOYENNE COMME VERDICT. Un bégaiement est une RAFALE : dix
      trames perdues d'affilée se voient, dix éparpillées sur douze
      secondes ne se voient pas, et les deux donnent la même moyenne.
      La ligne qui tranche est donc `serie max`, la plus longue suite
      consécutive. 0 ou 1 : rien de perceptible. 3 et plus : ça bégaie.

   Le « min » est le pire QUART DE SECONDE, pas la pire trame : une
   trame isolée à 40 ms afficherait 25 fps sans que personne ne l'ait
   sentie. La pire trame est donnée à part, en millisecondes.

   À RETIRER, avec son chargeur dans `index.html`, une fois la mesure
   faite et consignée.
   ══════════════════════════════════════════════════════════════════ */
export function compteur() {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;top:8px;right:8px;z-index:9;padding:6px 9px;' +
    'font:600 11px/1.5 ui-monospace,Menlo,monospace;color:#F3F0F1;text-align:right;' +
    'background:rgba(16,14,15,.86);border:1px solid #2E2A2C;border-radius:8px;' +
    'white-space:pre;pointer-events:none';
  document.body.appendChild(el);

  let prec = 0, total = 0, lentes = 0, sauts = 0, pire = 0, serie = 0, pireSerie = 0;
  let minFps = 999, n = 0, cumul = 0, dernier = 0, base = 0;
  const ech = [];

  const ecrire = fin => {
    el.textContent = (fin ? 'FIN\n' : '') +
      Math.round(1000 / (cumul / (n || 1))) + ' fps · min ' + Math.round(minFps) + '\n' +
      'base ' + (base ? base.toFixed(1) + ' ms · ' + Math.round(1000 / base) + ' Hz' : '…') + '\n' +
      '> 16,7 ms : ' + lentes + ' / ' + total + '\n' +
      'sauts : ' + sauts + ' · pire ' + Math.round(pire) + ' ms\n' +
      'serie max : ' + pireSerie;
  };

  return (ts, fin) => {
    if (prec) {
      const dt = ts - prec;
      total++; n++; cumul += dt;
      if (total > 10 && ech.length < 40) {
        ech.push(dt);
        if (ech.length === 40) base = [...ech].sort((a, b) => a - b)[20];
      }
      if (dt > 16.7) lentes++;
      /* Le saut se compte contre la cadence RÉELLE. Tant qu'elle n'est
         pas connue, on ne compte rien plutôt que de compter faux. */
      if (base && dt > base * 1.75) {
        sauts++; serie++; if (serie > pireSerie) pireSerie = serie;
      } else if (base) serie = 0;
      if (dt > pire) pire = dt;
      if (ts - dernier > 250) {
        const fps = 1000 / (cumul / n);
        if (fps < minFps) minFps = fps;
        ecrire(false);
        dernier = ts; n = 0; cumul = 0;
      }
    }
    prec = ts;
    if (fin) ecrire(true);
  };
}
