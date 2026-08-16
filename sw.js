/* ══════════════════════════════════════════════════════════
   SW DE DÉMOLITION — racine d'arts44.dev, depuis le déplacement
   de l'app vers /app/ (1.62.0).

   POURQUOI CE FICHIER EXISTE. Les PWA installées quand l'app vivait à
   la racine ont un service worker de scope « / » qui sert TOUT depuis
   son cache. Sans ce fichier, leur vérification de mise à jour
   échouerait (404) et elles resteraient GELÉES pour toujours — le
   scénario du n°18 de POINTS-SIGNALES, reproduit à domicile.

   Ce SW est ce que ces installations téléchargent comme « mise à
   jour » : il saute l'attente, purge les caches f1uno-*, se
   désenregistre, et recharge ses clients — qui retombent sur le
   réseau, donc sur la vitrine, qui mène à /app/.

   ⚠️ IL NE TOUCHE JAMAIS localStorage. Un service worker n'y a
   d'ailleurs PAS ACCÈS (l'API n'existe pas dans un worker) — c'est
   une garantie de plateforme, pas une promesse de code. La collection
   survit : le localStorage est par ORIGINE, pas par chemin, et /app/
   lit exactement le même magasin. Prouvé sur installation réelle,
   mesuré avant/après — voir POINTS-SIGNALES n°19.

   PAS de gestionnaire fetch : dès l'activation, plus rien n'est
   intercepté, tout part au réseau. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const cles = await caches.keys();
    await Promise.all(cles.filter(k => k.startsWith('f1uno-')).map(k => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(c => { try { c.navigate(c.url); } catch(err){ /* client déjà parti */ } });
  })());
});
