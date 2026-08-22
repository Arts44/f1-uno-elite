/* ══════════════════════════════════════════════════════════
   CARTE DE PROFIL — canvas → PNG → partage

   POURQUOI CE MODULE EXISTE, et c'est la raison la plus concrète du
   découpage : les vingt dernières lignes de ce fichier sont la
   PLOMBERIE DE SORTIE de l'app — `toBlob`, `File`, `navigator.share`,
   repli sur un téléchargement, toast de confirmation.

   La promesse est tenue depuis : la plomberie elle-même vit dans
   share-file.js (1.66.0, n°15 fermé — fmtTrade a ses appelants), et ce
   module est devenu la maison des DESSINS canvas qui sortent de l'app :
   le sceau de badges (shareProfileCard) et la fiche d'échange
   (shareTradeSheet, 1.69.0).

   ⚠️ C'EST LE SEUL MORCEAU DU DÉCOUPAGE QUE LE FILET NE PROUVE PAS.
   `shareProfileCard()` dessine sur un canvas : sa sortie est une image,
   pas une valeur, et la vérifier demanderait un canvas complet en Node.
   Son déplacement a donc été vérifié AUTREMENT — le PNG produit a été
   capturé avant et après, et comparé. Résultat dans le commit.
   ══════════════════════════════════════════════════════════ */
import { t, tEsc } from './i18n.js';
import { shareOrDownloadFile } from './share-file.js';
import { encodeBinary, Ecc } from './qrcodegen.js';
import { QR_MIN_PX_PER_MODULE, qrRenderSize } from './backup.js';
import { AUTO_BADGES, MANUAL_BADGES, badgeTr } from './data.js';
import { showToast } from './render.js';
import { manualBadges, autoBadgeUnlocked, loadManualBadges } from './badges-store.js';
import { isAutoBadgeUnlocked, hardestUnlockedBadge, evaluateBadgeCondition } from './badge-rules.js';

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
  /* Le sceau reprend la SOURCE DE VÉRITÉ du lockup (styles.css .lockup) :
     Space Grotesk, graisse 700 RÉELLE — system-ui portait la mauvaise
     police sur le seul rendu qui SORT de l'app. Barre pleine dessous,
     mêmes proportions (hauteur 0.08em, ~78 % du nom). Divergence tenue
     par tests/lockup-geometry.test.js. */
  x.font = "700 54px 'Space Grotesk', system-ui"; x.fillText('F1 UNO ÉLITE', W / 2, 126);
  x.fillStyle = red;
  const _bw = 240;
  x.beginPath(); x.roundRect((W - _bw) / 2, 140, _bw, 5, 2.5); x.fill();
  x.fillStyle = ink;
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
  x.fillText('arts44.dev', W / 2, H - 90);

  const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
  if(!blob) return;
  // La plomberie de sortie vit dans share-file.js depuis 1.66.0
  // (n°15 fermé) : ce module ne garde que le dessin du sceau.
  const how = await shareOrDownloadFile(blob, 'f1-uno-badges.png');
  if(how === 'saved') showToast(t('b.share_saved'));
}
/* ══════════════════════════════════════════════════════════
   LA FICHE D'ÉCHANGE (1.69.0) — le second consommateur de la
   plomberie canvas, celui que l'arête interdite
   profile-card → badges promettait (« doit servir à autre chose
   qu'aux badges »). L'IMAGE plafonne à 6 lignes par colonne
   (modèle tradeSheetModel, collector.js — règles d'honnêteté
   incluses) ; le QR en pied porte TOUJOURS la liste complète
   (#trade=, backup.js — mesuré v11/25 au pire cas absolu).
   ══════════════════════════════════════════════════════════ */
export async function shareTradeSheet(m){
  const dark = document.documentElement.getAttribute('data-theme') !== 'light';
  const W = 1000;
  const rowH = 56, secGap = 46;
  const wantRows = m.sheet.want.length, offerRows = m.sheet.offer.length;
  /* Le QR est encodé D'ABORD : sa taille dépend de sa version (donc de
     la longueur de la liste) et la hauteur de la fiche en dépend. */
  const qr = encodeBinary(new TextEncoder().encode(m.link), Ecc.LOW, 1, 25);
  const cell = QR_MIN_PX_PER_MODULE;                 // pas ENTIER, par construction
  const qrSize = qrRenderSize(qr.size);              // (modules + quiet zone) × pas
  const H = 330
    + (m.sheet.hasWant ? secGap + wantRows * rowH + (m.sheet.wantMore ? 44 : 0) : 0)
    + (m.sheet.hasOffer ? secGap + offerRows * rowH + (m.sheet.offerMore ? 44 : 0) : 0)
    + qrSize + 140;   // le QR + son en-tête + le pied + les marges
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  const ink = dark ? '#F3F0F1' : '#191716';
  const sub = dark ? '#A5A0A2' : '#6A6461';
  const red = dark ? '#FF4757' : '#E8002D';
  const green = dark ? '#1DAF54' : '#00A94F';
  const line = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  x.fillStyle = dark ? '#100E0F' : '#F4F1ED'; x.fillRect(0, 0, W, H);
  x.strokeStyle = red; x.lineWidth = 10; x.strokeRect(25, 25, W - 50, H - 50);

  // En-tête : titre + date + sous-titre
  x.textAlign = 'left'; x.fillStyle = ink;
  x.font = "700 52px 'Space Grotesk', system-ui";
  x.fillText(t('tr.title'), 70, 130);
  x.textAlign = 'right'; x.fillStyle = sub; x.font = '700 24px system-ui';
  x.fillText(new Date().toLocaleDateString().toUpperCase(), W - 70, 130);
  x.textAlign = 'left'; x.font = '500 28px system-ui';
  x.fillText(tEsc('st.sub', { owned: m.owned, total: m.total }) + ' · ' + m.season, 70, 180);

  let y = 240;
  const section = (color, label, total, rows, more, rowFn) => {
    x.fillStyle = color; x.font = "800 30px 'Space Grotesk', system-ui";
    x.fillText(label.toUpperCase() + '  ·  ' + total, 70, y);
    y += 26;
    rows.forEach(r => {
      y += rowH;
      x.strokeStyle = line; x.lineWidth = 1;
      x.beginPath(); x.moveTo(70, y + 14); x.lineTo(W - 70, y + 14); x.stroke();
      rowFn(r, y);
    });
    if(more){
      y += 44;
      x.fillStyle = sub; x.font = 'italic 500 26px system-ui';
      x.fillText(tEsc('tr.more', { n: more }), 70, y);
    }
    y += secGap;
  };

  if(m.sheet.hasWant){
    section(red, '▲ ' + t('tools.want'), m.sheet.wantTotal, m.sheet.want, m.sheet.wantMore, (r, yy) => {
      x.fillStyle = sub; x.font = "700 24px 'Space Grotesk', system-ui";
      x.fillText('#' + r.id, 70, yy);
      x.fillStyle = ink; x.font = '600 30px system-ui';
      x.fillText(r.name, 160, yy);
      if(r.wishlist){ x.fillStyle = dark ? '#F472B6' : '#EC4899'; x.font = '600 26px system-ui'; x.textAlign = 'right'; x.fillText('★', W - 70, yy); x.textAlign = 'left'; }
    });
  }
  if(m.sheet.hasOffer){
    section(green, '▼ ' + t('tools.offer'), m.sheet.offerTotal, m.sheet.offer, m.sheet.offerMore, (r, yy) => {
      x.fillStyle = sub; x.font = "700 24px 'Space Grotesk', system-ui";
      x.fillText('#' + r.id, 70, yy);
      x.fillStyle = ink; x.font = '600 30px system-ui';
      x.fillText(r.name, 160, yy);
      x.fillStyle = sub; x.font = '500 24px system-ui'; x.textAlign = 'right';
      x.fillText(r.typesLabel, W - 70, yy); x.textAlign = 'left';
    });
  }

  /* QR — dessiné module par module (le SVG de toSvg ne se pose pas sur
     un canvas sans rasterisation asynchrone ; getModule suffit).

     DEUX RÈGLES, toutes deux payées par un échec réel sur iPad
     (1.71.0) : le pas est ENTIER (des modules de 4 px posés sur un pas
     de 3,38 bavaient de 0,6 px chacun), et la taille respecte le
     PLANCHER DE DENSITÉ (QR_MIN_PX_PER_MODULE, backup.js) — à 220 px
     ce QR faisait 3,38 px/module et aucun lecteur ne le trouvait dans
     l'image. Ne pas remettre une taille fixe ici : elle doit suivre la
     version, qui suit la longueur de la liste. */
  const qx = 70, qy = y + 10;
  x.fillStyle = '#ffffff'; x.fillRect(qx, qy, qrSize, qrSize);
  x.fillStyle = '#111111';
  for(let ry = 0; ry < qr.size; ry++) for(let rx = 0; rx < qr.size; rx++)
    if(qr.getModule(rx, ry)) x.fillRect(qx + (rx + 4) * cell, qy + (ry + 4) * cell, cell, cell);
  x.fillStyle = ink; x.font = '700 26px system-ui';
  x.fillText(t('tr.scan_t'), qx + qrSize + 34, qy + 56);
  x.fillStyle = sub; x.font = '500 23px system-ui';
  _wrapText(x, t('tr.scan'), qx + qrSize + 34, qy + 96, W - 70 - (qx + qrSize + 34), 32);
  x.font = "700 20px 'Space Grotesk', system-ui";
  x.fillText(`${m.code.length} car. · QR v${qr.version} / 25`, qx + qrSize + 34, qy + qrSize - 8);

  // Pied : lockup (source de vérité styles.css — graisse 700 réelle)
  x.fillStyle = ink; x.font = "700 34px 'Space Grotesk', system-ui";
  x.fillText('F1 UNO', 70, H - 70);
  x.fillStyle = red; x.font = "500 16px 'Space Grotesk', system-ui";
  x.fillText('É L I T E', 70, H - 44);
  x.fillStyle = sub; x.font = '500 22px system-ui'; x.textAlign = 'right';
  x.fillText('arts44.dev', W - 70, H - 50); x.textAlign = 'left';

  const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
  if(!blob) return;
  const how = await shareOrDownloadFile(blob, 'f1-uno-echange.png');
  if(how === 'saved') showToast(t('tr.saved'));
}

function _wrapText(x, txt, tx, ty, maxW, lh){
  const words = String(txt).split(' ');
  let lineTxt = '';
  for(const w of words){
    const test = lineTxt ? lineTxt + ' ' + w : w;
    if(x.measureText(test).width > maxW && lineTxt){ x.fillText(lineTxt, tx, ty); ty += lh; lineTxt = w; }
    else lineTxt = test;
  }
  if(lineTxt) x.fillText(lineTxt, tx, ty);
}
