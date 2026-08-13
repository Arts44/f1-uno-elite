/* ══════════════════════════════════════════════════════════
   CARTE DE PROFIL — canvas → PNG → partage

   POURQUOI CE MODULE EXISTE, et c'est la raison la plus concrète du
   découpage : les vingt dernières lignes de ce fichier sont la
   PLOMBERIE DE SORTIE de l'app — `toBlob`, `File`, `navigator.share`,
   repli sur un téléchargement, toast de confirmation.

   `fmtMissing()`, `fmtDoubles()` et `fmtTrade()` existent depuis la
   v2.x dans stats.js, produisent du texte, et n'ont AUCUN appelant. Ce
   qui leur manque n'est pas la logique : c'est cette plomberie. Tant
   qu'elle vivait au milieu de mille lignes de page Badges, l'atteindre
   voulait dire importer le DOM, l'i18n, les minuteurs et 120 badges —
   ou la recopier.

   Un futur `export-trade-list.js` importe désormais ce module seul.
   Voir docs/POINTS-SIGNALES.md, point n°15.

   ⚠️ C'EST LE SEUL MORCEAU DU DÉCOUPAGE QUE LE FILET NE PROUVE PAS.
   `shareProfileCard()` dessine sur un canvas : sa sortie est une image,
   pas une valeur, et la vérifier demanderait un canvas complet en Node.
   Son déplacement a donc été vérifié AUTREMENT — le PNG produit a été
   capturé avant et après, et comparé. Résultat dans le commit.
   ══════════════════════════════════════════════════════════ */
import { t, getLang } from './i18n.js';
import { AUTO_BADGES, MANUAL_BADGES, badgeTr } from './data.js';
import { showToast } from './render.js';
import { manualBadges, autoBadgeUnlocked, loadManualBadges } from './badges-store.js';
import { isAutoBadgeUnlocked, hardestUnlockedBadge, evaluateBadgeCondition } from './badge-rules.js';
import { getUnlockedTitles } from './badge-titles.js';

/* ── Carte de profil exportable (canvas → PNG) ── */
export async function shareProfileCard(){
  loadManualBadges();
  const total = AUTO_BADGES.filter(b => isAutoBadgeUnlocked(b)).length
    + Object.values(manualBadges).filter(Boolean).length;
  const TOTAL = AUTO_BADGES.length + MANUAL_BADGES.length;
  const unlockedList = [...AUTO_BADGES, ...MANUAL_BADGES]
    .filter(b => autoBadgeUnlocked[b.id] || manualBadges[b.id]);
  const hardest = hardestUnlockedBadge([...AUTO_BADGES, ...MANUAL_BADGES], evaluateBadgeCondition, b => !!(autoBadgeUnlocked[b.id] || manualBadges[b.id]));
  const titleEl = document.querySelector('#headerTitle .ht-icon + span');
  const titleTxt = titleEl ? titleEl.textContent : 'Rookie';
  const dark = document.documentElement.getAttribute('data-theme') !== 'light';

  const W = 1000, H = 1250;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  x.fillStyle = dark ? '#100E0F' : '#F4F1ED'; x.fillRect(0, 0, W, H);
  const ink = dark ? '#F3F0F1' : '#191716';
  const sub = dark ? '#A5A0A2' : '#6A6461';
  const red = dark ? '#FF4757' : '#E8002D';
  // liseré
  x.strokeStyle = red; x.lineWidth = 10; x.strokeRect(25, 25, W - 50, H - 50);
  // en-tête
  x.fillStyle = ink; x.textAlign = 'center';
  x.font = '700 54px system-ui'; x.fillText('F1 UNO ÉLITE', W / 2, 130);
  x.fillStyle = sub; x.font = '600 30px system-ui'; x.fillText(t('b.title').replace('🏅 ', '').toUpperCase(), W / 2, 180);
  // anneau
  const cx = W / 2, cy = 430, r = 150;
  x.lineWidth = 26; x.lineCap = 'round';
  x.strokeStyle = dark ? '#2E2A2C' : '#E3DED7';
  x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke();
  x.strokeStyle = red;
  x.beginPath(); x.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (total / TOTAL)); x.stroke();
  x.fillStyle = ink; x.font = '700 110px system-ui'; x.fillText(String(total), cx, cy + 20);
  x.fillStyle = sub; x.font = '600 36px system-ui'; x.fillText(`/ ${TOTAL}`, cx, cy + 75);
  // titre actif
  x.fillStyle = red; x.font = '700 44px system-ui'; x.fillText(titleTxt, W / 2, 700);
  if(hardest){
    x.fillStyle = sub; x.font = '500 28px system-ui';
    x.fillText(`${t('b.hardest')} ${badgeTr(hardest).name || hardest.name}`, W / 2, 755);
  }
  // badges marquants (jusqu'à 8 emojis)
  const show = unlockedList.slice(0, 8);
  x.font = '64px system-ui';
  show.forEach((b, i) => {
    const bx = W / 2 + (i - (show.length - 1) / 2) * 100;
    x.fillText(b.emoji, bx, 890);
  });
  // pied
  x.fillStyle = sub; x.font = '500 26px system-ui';
  x.fillText('arts44.github.io/f1-uno-elite', W / 2, H - 90);

  const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
  if(!blob) return;
  const file = new File([blob], 'f1-uno-badges.png', { type: 'image/png' });
  if(navigator.canShare && navigator.canShare({ files: [file] })){
    try { await navigator.share({ files: [file] }); return; } catch(e){ /* annulé → repli */ }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'f1-uno-badges.png'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  showToast(t('b.share_saved'));
}