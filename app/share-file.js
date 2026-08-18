/* ══════════════════════════════════════════════════════════
   SORTIE DE FICHIERS — blob → File → navigator.share, repli
   téléchargement. EXTRAITE de profile-card.js (1.66.0), où elle
   était née avec le sceau de badges : c'était la « plomberie de
   sortie » que POINTS-SIGNALES n°15 attendait de voir partagée.
   Deux consommateurs : la carte de profil (PNG) et la liste
   d'échange (texte). AUCUNE dépendance — feuille du graphe, et
   c'est voulu : tout module peut sortir un fichier sans
   embarquer une vue.

   Renvoie 'shared' (feuille de partage acceptée) ou 'saved'
   (téléchargement) : le toast appartient à l'APPELANT — partager
   n'a pas de confirmation à donner, le système l'a déjà montrée.
   ══════════════════════════════════════════════════════════ */
export async function shareOrDownloadFile(blob, filename){
  const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });
  if(navigator.canShare && navigator.canShare({ files: [file] })){
    try { await navigator.share({ files: [file] }); return 'shared'; } catch(e){ /* annulé → repli */ }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'saved';
}
