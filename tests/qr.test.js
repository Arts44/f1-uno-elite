/* ══════════════════════════════════════════════════════════
   QR DE SAUVEGARDE — exécution réelle de l'encodeur.

   Jusqu'ici qrcodegen.js n'était jamais exécuté par les tests : la
   seule preuve qu'il fonctionnait était de scanner un QR à l'œil. Une
   régression dans l'encodeur — ou dans makeBackupQrSvg — serait passée
   en production sans qu'aucun test ne bronche, alors que le QR est
   l'un des deux canaux de transfert d'une collection.

   Ce que ces tests prouvent VRAIMENT :
   · l'encodeur produit une matrice conforme au spec ISO/IEC 18004 :
     bonne taille, motifs de détection, motifs de synchronisation,
     module noir obligatoire, et surtout INFORMATION DE FORMAT vérifiée
     contre la table canonique du spec, recopiée ici — pas recalculée
     avec le code testé ;
   · makeBackupQrSvg renvoie un SVG bien formé, déterministe, et
     bascule proprement en { tooBig } au-delà de la capacité.

   Ce qu'ils NE prouvent pas : que la charge utile est relisible. Il
   faudrait un DÉCODEUR indépendant, que le dépôt n'a pas (zéro
   dépendance). La lecture réelle reste vérifiée à la main, au scan.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { encodeBinary, toSvg, Ecc } from '../qrcodegen.js';
import { buildBackupLink, makeBackupQrSvg } from '../backup.js';

const enc = s => new TextEncoder().encode(s);
const qrOf = s => encodeBinary(enc(s), Ecc.LOW, 1, 25);

/* ── Table C.1 du spec ISO/IEC 18004 : les 32 chaînes d'information
   de format, indexées par (bits de niveau << 3 | masque). Recopiée du
   spec, PAS produite par qrcodegen.js — c'est ce qui rend la
   vérification indépendante. ── */
const FORMAT_INFO = [
  '101010000010010', '101000100100101', '101111001111100', '101101101001011',
  '100010111111001', '100000011001110', '100111110010111', '100101010100000',
  '111011111000100', '111001011110011', '111110110101010', '111100010011101',
  '110011000101111', '110001100011000', '110110001000001', '110100101110110',
  '001011010001001', '001001110111110', '001110011100111', '001100111010000',
  '000011101100010', '000001001010101', '000110100001100', '000100000111011',
  '011010101011111', '011000001101000', '011111100110001', '011101000000110',
  '010010010110100', '010000110000011', '010111011011010', '010101111101101',
];

// Les 15 positions de la PREMIÈRE copie de l'information de format
// (géométrie imposée par le spec), du bit 0 au bit 14.
function formatBitPositions(){
  const pos = [];
  for(let i = 0; i <= 5; i++) pos.push([8, i]);
  pos.push([8, 7], [8, 8], [7, 8]);
  for(let i = 9; i < 15; i++) pos.push([14 - i, 8]);
  return pos;
}

describe('qrcodegen — conformité de la matrice', () => {
  test('la taille suit la version : 4v + 17', () => {
    for(const s of ['a', 'x'.repeat(40), 'y'.repeat(300)]){
      const qr = qrOf(s);
      assert.equal(qr.size, qr.version * 4 + 17, `version ${qr.version}`);
      assert.ok(qr.version >= 1 && qr.version <= 25);
    }
  });

  test('les trois motifs de détection sont présents et corrects', () => {
    const qr = qrOf('https://example.test/#backup=ABCDEF');
    // Un motif de détection est un carré 7×7 : bord noir, anneau blanc,
    // cœur 3×3 noir. On le vérifie aux trois coins imposés par le spec.
    const corners = [[0, 0], [qr.size - 7, 0], [0, qr.size - 7]];
    for(const [ox, oy] of corners){
      for(let dy = 0; dy < 7; dy++){
        for(let dx = 0; dx < 7; dx++){
          const ring = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
          const expected = ring !== 2;   // anneau blanc à la distance 2
          assert.equal(qr.getModule(ox + dx, oy + dy), expected,
            `motif (${ox},${oy}) module (${dx},${dy})`);
        }
      }
    }
  });

  test('les motifs de synchronisation alternent sur la ligne et la colonne 6', () => {
    const qr = qrOf('f1uno backup');
    for(let i = 8; i < qr.size - 8; i++){
      assert.equal(qr.getModule(i, 6), i % 2 === 0, `horizontal @${i}`);
      assert.equal(qr.getModule(6, i), i % 2 === 0, `vertical @${i}`);
    }
  });

  test('le module noir obligatoire est en (8, 4v+9)', () => {
    const qr = qrOf('f1uno backup');
    assert.equal(qr.getModule(8, qr.version * 4 + 9), true);
  });

  test('l\'information de format correspond à la table du spec', () => {
    for(const [name, ecc] of Object.entries(Ecc)){
      const qr = encodeBinary(enc('table check'), ecc, 1, 25);
      // C'est le niveau RÉELLEMENT gravé qui compte : encodeBinary
      // remonte le niveau de correction quand la place restante le
      // permet sans changer de version (boostEcl, actif par défaut).
      const idx = (qr.errorCorrectionLevel.formatBits << 3) | qr.mask;
      const want = FORMAT_INFO[idx];
      // want est MSB-first ; la matrice porte le bit 0 en premier.
      const got = formatBitPositions()
        .map(([x, y]) => (qr.getModule(x, y) ? '1' : '0'))
        .reverse().join('');
      assert.equal(got, want, `${name}, masque ${qr.mask}`);
    }
  });

  test('boostEcl : le niveau demandé est un PLANCHER, pas une consigne', () => {
    // Documenté ici parce que c'est contre-intuitif et que la table du
    // spec ci-dessus l'a révélé : demander LOW peut graver QUARTILE.
    const qr = encodeBinary(enc('table check'), Ecc.LOW, 1, 25);
    assert.ok(qr.errorCorrectionLevel.ordinal >= Ecc.LOW.ordinal);
    const strict = encodeBinary(enc('table check'), Ecc.LOW, 1, 25, false);
    assert.equal(strict.errorCorrectionLevel.ordinal, Ecc.LOW.ordinal);
  });

  test('le masque choisi reste dans les 8 masques du spec', () => {
    const qr = qrOf('mask range');
    assert.ok(Number.isInteger(qr.mask) && qr.mask >= 0 && qr.mask <= 7);
  });
});

describe('qrcodegen — cas limites d\'entrée', () => {
  test('chaîne vide : un QR valide est tout de même produit', () => {
    const qr = qrOf('');
    assert.equal(qr.size, qr.version * 4 + 17);
  });

  test('l\'UTF-8 multi-octets est encodé en octets, pas en caractères', () => {
    // 4 octets chacun : le contenu binaire diffère d'une chaîne ASCII
    // de même longueur en caractères.
    const emoji = qrOf('🏎️🏁');
    const ascii = qrOf('ab');
    assert.ok(emoji.version >= ascii.version);
  });

  test('deux encodages du même texte donnent la même matrice', () => {
    const a = qrOf('déterminisme'), b = qrOf('déterminisme');
    assert.equal(a.version, b.version);
    assert.equal(a.mask, b.mask);
    for(let y = 0; y < a.size; y++)
      for(let x = 0; x < a.size; x++)
        assert.equal(a.getModule(x, y), b.getModule(x, y), `(${x},${y})`);
  });

  test('au-delà de la version 25, l\'encodage lève', () => {
    assert.throws(() => encodeBinary(enc('z'.repeat(20000)), Ecc.LOW, 1, 25));
  });
});

describe('makeBackupQrSvg — la façade utilisée par l\'app', () => {
  const link = buildBackupLink('AAAABBBBCCCCDDDD');

  test('le lien de sauvegarde porte bien le code dans le hash', () => {
    assert.ok(link.endsWith('#backup=AAAABBBBCCCCDDDD'));
    assert.ok(!link.includes('?'), 'query et hash d\'origine sont retirés');
  });

  test('renvoie un SVG bien formé, avec une viewBox cohérente', () => {
    const r = makeBackupQrSvg(link);
    assert.ok(r.svg, 'un SVG est produit');
    assert.ok(!r.tooBig);
    const dim = r.version * 4 + 17 + 8;   // matrice + 2 × bordure(4)
    assert.ok(r.svg.startsWith('<svg '));
    assert.ok(r.svg.endsWith('</svg>'));
    assert.ok(r.svg.includes(`viewBox="0 0 ${dim} ${dim}"`), r.svg.slice(0, 120));
    assert.equal((r.svg.match(/<path /g) || []).length, 1);
  });

  test('les couleurs sont sombres sur blanc, quel que soit le thème', () => {
    const r = makeBackupQrSvg(link);
    assert.ok(r.svg.includes('fill="#ffffff"'));
    assert.ok(r.svg.includes('fill="#111111"'));
  });

  test('le SVG contient autant de modules que la matrice en a de noirs', () => {
    const r = makeBackupQrSvg(link);
    const qr = encodeBinary(enc(link), Ecc.LOW, 1, 25);
    let dark = 0;
    for(let y = 0; y < qr.size; y++)
      for(let x = 0; x < qr.size; x++) if(qr.getModule(x, y)) dark++;
    assert.equal((r.svg.match(/M\d+,\d+h1v1h-1z/g) || []).length, dark);
  });

  test('un lien trop long renvoie { tooBig } au lieu de lever', () => {
    const r = makeBackupQrSvg(buildBackupLink('Z'.repeat(20000)));
    assert.equal(r.tooBig, true);
    assert.equal(r.svg, undefined);
  });

  test('deux appels sur le même lien produisent un SVG identique', () => {
    assert.equal(makeBackupQrSvg(link).svg, makeBackupQrSvg(link).svg);
  });

  test('toSvg respecte la bordure demandée', () => {
    const qr = qrOf('border');
    assert.ok(toSvg(qr, { border: 0 }).includes(`viewBox="0 0 ${qr.size} ${qr.size}"`));
    assert.ok(toSvg(qr, { border: 2 }).includes(`viewBox="0 0 ${qr.size + 4} ${qr.size + 4}"`));
  });
});
