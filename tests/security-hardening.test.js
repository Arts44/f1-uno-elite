/* ══════════════════════════════════════════════════════════
   DURCISSEMENT — passe Codacy (1.47.1)

   Trois signalements réels, séparés des ~400 faux positifs :

   1. pin.js  — l'empreinte du PIN était comparée avec `===`, qui
      s'arrête au premier caractère différent. Fuite de timing.
   2. render.js — card.image partait dans un <img src> sans la
      moindre validation : n'importe quel schéma passait.
   3. badges.js — LA vraie trouvaille. L'objet titre entier était
      persisté dans f1uno_title puis réaffiché tel quel, alors que
      cette clé fait partie des préférences RESTAURÉES PAR UN
      IMPORT. Une sauvegarde hostile y plaçait du markup exécuté
      en innerHTML — même vecteur que la XSS #backup= de 1.42.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import '../translations.js';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { escapeHtml, safeImagePath } from '../i18n.js';

const read = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

describe('PIN — comparaison à temps constant', () => {
  test('plus aucune comparaison naïve d’empreinte dans pin.js', () => {
    const src = read('pin.js');
    assert.ok(!/hash\s*===\s*(stored|getStoredPinHash\(\))/.test(src),
      'une comparaison `===` d’empreinte subsiste');
    assert.ok(!/sha256\([^)]*\)\s*===/.test(src),
      'une empreinte fraîche est comparée avec ===');
  });

  test('timingSafeEqual est exporté et parcourt TOUTE la chaîne', () => {
    const src = read('pin.js');
    assert.match(src, /export function timingSafeEqual/);
    const fn = src.slice(src.indexOf('export function timingSafeEqual'));
    // Un `return false` dans la boucle rétablirait la fuite qu'on ferme.
    const body = fn.slice(0, fn.indexOf('\n}'));
    assert.ok(body.includes('|='), 'l’accumulation par OU binaire est absente');
    assert.ok(!/for\s*\([^)]*\)\s*\{[^}]*return\s+false/.test(body),
      'sortie anticipée dans la boucle : la fuite de timing revient');
  });

  test('les quatre points de vérification du PIN l’utilisent', () => {
    const src = read('pin.js');
    // 1 définition + 4 usages
    assert.ok((src.match(/timingSafeEqual/g) || []).length >= 5);
  });
});

describe('safeImagePath — seuls les chemins relatifs passent', () => {
  const REFUSES = [
    'http://evil.example/x.png', 'https://evil.example/x.png',
    '//evil.example/x.png', '/absolu.png',
    'javascript:alert(1)', 'JaVaScRiPt:alert(1)',
    'data:text/html;base64,PHNjcmlwdD4=',
    '../../etc/passwd', 'cards/../../secret',
    'x.png" onerror="alert(1)', "x.png' onload='alert(1)",
    'x.png><script>alert(1)</script>', 'a b.png', '',
  ];
  for (const bad of REFUSES) {
    test(`refusé : ${JSON.stringify(bad)}`, () => {
      assert.equal(safeImagePath(bad), '');
    });
  }

  const ACCEPTES = ['cards/001.png', './cards/001.png', 'img.webp', 'a/b/c/d.jpg'];
  for (const ok of ACCEPTES) {
    test(`accepté : ${ok}`, () => assert.equal(safeImagePath(ok), ok));
  }

  test('null / undefined / nombre ne font pas exploser l’appel', () => {
    assert.equal(safeImagePath(null), '');
    assert.equal(safeImagePath(undefined), '');
    assert.equal(safeImagePath(42), '42');
  });

  test('render.js passe bien card.image par ce filtre', () => {
    const src = read('render.js');
    assert.ok(!/<img src="\$\{card\.image\}/.test(src),
      'card.image est encore injecté brut dans un attribut src');
    assert.match(src, /safeImagePath\(card\.image\)/);
    assert.match(src, /alt="\$\{escapeHtml\(card\.name\)\}"/);
  });
});

describe('titre porté — l’objet stocké n’est plus jamais affiché', () => {
  const src = read('badges.js');

  test('seul l’identifiant est persisté', () => {
    assert.ok(!/selectedTitle\b(?!Id)/.test(src),
      'une référence à l’objet titre stocké subsiste');
    assert.match(src, /let selectedTitleId = null/);
    assert.match(src, /JSON\.stringify\(selectedTitleId\)/);
  });

  test('l’identifiant relu est validé avant d’être retenu', () => {
    const fn = src.slice(src.indexOf('function loadSelectedTitle'));
    assert.match(fn.slice(0, 900), /\/\^\[a-z0-9_\]\{1,64\}\$\/i/,
      'aucune validation de forme sur l’id relu');
  });

  test('le titre AFFICHÉ vient de getUnlockedTitles, pas du localStorage', () => {
    const fn = src.slice(src.indexOf('export function updateUserTitle'));
    const head = fn.slice(0, 800);
    assert.match(head, /unlocked\.find\(t => t\.id === selectedTitleId\)/);
    // L'objet actif ne peut être que `chosen` (issu de unlocked) ou le
    // défaut littéral — jamais quelque chose sorti de JSON.parse.
    assert.match(head, /const active = chosen/);
  });

  test('l’ancien format (objet complet) reste lisible — pas de titre perdu', () => {
    const fn = src.slice(src.indexOf('function loadSelectedTitle'));
    assert.match(fn.slice(0, 900), /typeof v === 'string' \? v :/,
      'la relecture de l’ancien format a disparu');
  });
});

describe('provenance — toute donnée externe est échappée', () => {
  test('escapeHtml neutralise la charge de preuve', () => {
    const p = '<img src=x onerror="window.__pwned()">';
    const out = escapeHtml(p);
    assert.ok(!out.includes('<img'));
    assert.ok(!out.includes('"'));
    assert.match(out, /&lt;img/);
  });

  test('les quatre sites à donnée externe sont couverts', () => {
    // Recensés par balayage de tous les innerHTML des modules livrés.
    assert.match(read('storage.js'), /tEsc\('imp\.sub'/);        // import JSON / #backup=
    assert.match(read('cloud.js'), /escapeHtml\(email\)/);        // session cloud
    assert.match(read('feedback.js'), /escapeHtml\(r\.message\)/); // retours serveur
    // badges.js : `active.name` EST toujours interpolé, et c'est correct
    // depuis le correctif — `active` ne peut plus venir que de
    // getUnlockedTitles() (dépôt) ou du littéral par défaut. La garantie
    // est structurelle, pas un échappement : elle est vérifiée par la
    // suite « titre porté » ci-dessus. Ce qu'on interdit ici, c'est le
    // retour de l'objet du localStorage dans le rendu.
    assert.ok(!/JSON\.parse[\s\S]{0,200}innerHTML/.test(read('badges.js')),
      'un objet relu du localStorage repart directement en innerHTML');
  });

  test('le type d’un retour de feedback reste sur liste blanche', () => {
    assert.match(read('feedback.js'), /FEEDBACK_TYPES\.includes\(r\.type\)/);
  });
});

describe('tutoriel 1.47.0 — rien d’externe ne transite par la bulle', () => {
  const src = read('tutorial.js');

  test('la bulle n’a qu’UN innerHTML, et il n’interpole que du dépôt', () => {
    const sites = src.match(/innerHTML/g) || [];
    assert.equal(sites.length, 1, 'un second innerHTML est apparu — à auditer');
    const i = src.indexOf('_bubble.innerHTML');
    const tpl = src.slice(i, src.indexOf('</div>`;', i));
    const interp = [...tpl.matchAll(/\$\{([^}]{1,70})/g)].map(m => m[1].trim());
    // Sources autorisées : traductions du dépôt, entiers calculés,
    // markup construit ici. Toute autre provenance doit être échappée.
    const ok = /^(t\(|ch\.(n|of)\b|rail\b|skip(Id|Long|Short)\b|isLast\b|showNext\b|opts\.missing\b|i === 0)/;
    const suspects = interp.filter(x => !ok.test(x));
    assert.deepEqual(suspects, [], `interpolations non tracées : ${suspects.join(' | ')}`);
  });

  test('les clés i18n sont bâties sur des identifiants du dépôt', () => {
    // t('tut.' + step.id) : step.id vient de TUTORIAL_STEPS, pas d'une
    // saisie. Une clé absente renvoie la clé elle-même — texte du dépôt.
    assert.match(src, /t\('tut\.' \+ step\.id \+ '_t'\)/);
    assert.match(src, /t\('tut\.ch_' \+ ch\.id\)/);
  });

  test('le nom accessible passe par setAttribute, pas par du markup', () => {
    assert.match(src, /_bubble\.setAttribute\('aria-label'/);
  });

  test('le tutoriel n’AFFICHE aucune valeur relue du localStorage', () => {
    // Il en capture et en restaure (bac à sable), mais ne les rend jamais.
    const i = src.indexOf('_bubble.innerHTML');
    const tpl = src.slice(i, src.indexOf('</div>`;', i));
    assert.ok(!/localStorage|JSON\.parse/.test(tpl));
  });
});

/* ══════════════════════════════════════════════════════════
   ALÉA — le bon générateur au bon endroit.

   Codacy signale le Math.random() de badges.js (positionnement des
   particules de célébration). L'alerte est désactivée côté service,
   ce qui laisse une question ouverte : et si un Math.random()
   apparaissait un jour LÀ où ça compte ? Ce test tient la frontière
   à la place du pattern qu'on a fait taire.
   ══════════════════════════════════════════════════════════ */
describe('aléa — Math.random() ne doit jamais toucher la sécurité', () => {
  const SENSIBLES = ['secure-store.js', 'pin.js', 'cloud.js', 'backup.js'];

  test('aucun Math.random() dans les modules sensibles', () => {
    for(const f of SENSIBLES){
      const src = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
      assert.ok(!/Math\s*\.\s*random\s*\(/.test(src),
        `${f} : le sel, l'IV et tout secret doivent venir de crypto.getRandomValues()`);
    }
  });

  test('secure-store.js tire bien son sel et son IV d\'un CSPRNG', () => {
    const src = readFileSync(new URL('../secure-store.js', import.meta.url), 'utf8');
    const n = (src.match(/crypto\.getRandomValues\(/g) || []).length;
    assert.ok(n >= 3, `attendu ≥3 appels (1 IV + 2 sels), trouvé ${n}`);
  });

  test('le seul Math.random() du dépôt est décoratif et documenté', () => {
    const badges = readFileSync(new URL('../badges.js', import.meta.url), 'utf8');
    // Le commentaire de justification cite lui-même Math.random() :
    // on compte le CODE, pas la prose qui l'explique.
    const code = badges.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const n = (code.match(/Math\.random\(/g) || []).length;
    assert.equal(n, 1, 'un seul usage attendu : les particules de célébration');
    assert.ok(/\/\/\s*Math\.random\(\)\s*DÉCORATIF/.test(badges),
      'l\'usage doit rester justifié sur place, en toutes lettres');
  });
});
