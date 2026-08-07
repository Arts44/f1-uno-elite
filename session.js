/* ══════════════════════════════════════════════════════════
   SESSION — source unique du niveau de privilège courant.

   Module FEUILLE : il n'importe rien. C'est délibéré. Le drapeau
   « mode spectateur » est une donnée de sécurité lue par storage,
   backup, cloud, account, feedback, render et app ; le loger dans
   pin.js obligerait la moitié de ces modules à importer l'écran
   PIN, et le graphe deviendrait cyclique. Ici, tout le monde lit
   la même valeur et personne ne peut créer de cycle.

   Le mode spectateur est un partage EN LECTURE SEULE : le visiteur
   consulte la collection, mais ne doit ni la modifier, ni la faire
   sortir de l'appareil (export, code de sauvegarde et QR sont des
   fuites au même titre qu'une écriture est une atteinte), ni
   toucher au compte cloud, ni supprimer quoi que ce soit.
   ══════════════════════════════════════════════════════════ */
let _viewer = false;

export function isViewer(){ return _viewer; }
export function setViewer(v){ _viewer = !!v; }

/* Garde à placer en TÊTE de chaque action sensible : elle protège
   l'action même appelée directement (console, script, deep link),
   pas seulement le bouton qui la déclenche.
   Retourne true quand l'appel doit être refusé. */
export function deniedForViewer(){ return _viewer; }
