/* ══════════════════════════════════════════════════════════
   VERROUILLAGE SPECTATEUR — une action sensible, un test.

   Le mode spectateur est un partage EN LECTURE SEULE. Chaque
   fonction ci-dessous est vérifiée APPELÉE DIRECTEMENT : c'est
   le seul niveau qui tienne, puisqu'un bouton absent ou grisé se
   contourne depuis la console. Les fuites (export, code de
   sauvegarde) comptent autant que les écritures.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resetStorage } from './_setup.js';
import { installFixtures, seedCollection } from './_fixtures.js';
import { isViewer, setViewer, deniedForViewer } from '../session.js';
import { deleteLocalCollectionData, loadData, cardOwned } from '../storage.js';

const read = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

describe('session.js — le drapeau de privilège', () => {
  afterEach(() => setViewer(false));

  test('module feuille : n’importe rien (aucun cycle possible)', () => {
    assert.equal(/^\s*import\s/m.test(read('session.js')), false,
      'session.js doit rester sans import — c’est ce qui garantit l’absence de cycle');
  });

  test('par défaut on n’est PAS spectateur', () => {
    assert.equal(isViewer(), false);
    assert.equal(deniedForViewer(), false);
  });

  test('setViewer bascule et normalise en booléen', () => {
    setViewer('oui');
    assert.equal(isViewer(), true);
    assert.equal(deniedForViewer(), true);
    setViewer(0);
    assert.equal(isViewer(), false);
  });
});

describe('refus logique, action par action', () => {
  // Les fonctions cloud/backup touchent au réseau et au DOM : on
  // vérifie la PRÉSENCE du garde en tête de chacune, et on exécute
  // pour de vrai celle qui est purement locale (suppression).
  const GUARDED = {
    'storage.js': ['deleteLocalCollectionData', 'triggerImport', 'exportCollection', '_showImportDialog'],
    'backup.js':  ['generateBackupCode', 'maybeHandleBackupHash'],
    // Le découpage de cloud.js déplace ces fonctions de fichier ; le
    // contrat, lui, ne bouge pas — chacune doit toujours refuser en
    // tête. La table suit les fonctions, elle ne les relâche pas.
    // pushCollection/pullCollection sont devenus des délégués d'une ligne
    // vers pushSeason/pullSeason : c'est là que vit désormais le garde.
    'cloud-sync.js': ['pushSeason', 'pullSeason', 'cloudDeleteAll'],
    'cloud-auth.js': ['signOut', 'requestEmailChange', 'sendMagicLink',
                      'verifyOtpCode', 'handleAuthRedirect'],
    'account.js': ['openDeleteModal'],
  };

  for (const [file, fns] of Object.entries(GUARDED)) {
    for (const fn of fns) {
      test(`${file} → ${fn}() refuse en spectateur`, () => {
        const src = read(file);
        const at = src.search(new RegExp(`(export )?(async )?function ${fn}\\s*\\(`));
        assert.ok(at >= 0, `${fn} introuvable dans ${file}`);
        const head = src.slice(at, at + 400);
        const bodyStart = head.indexOf('{');
        const firstLines = head.slice(bodyStart, bodyStart + 160);
        assert.match(firstLines, /deniedForViewer\(\)/,
          `${fn} doit refuser en tête de fonction, avant tout effet`);
      });
    }
  }

  test('la suppression locale ne fait RIEN en spectateur (exécution réelle)', () => {
    resetStorage(); installFixtures();
    seedCollection({ P1: { blue: { owned: true, qty: 2 } } }); loadData();
    assert.equal(cardOwned('P1'), true);

    setViewer(true);
    const removed = deleteLocalCollectionData();
    assert.equal(removed, 0, 'aucune clé ne doit être supprimée');
    loadData();
    assert.equal(cardOwned('P1'), true, 'la collection doit être intacte');

    setViewer(false);
    assert.ok(deleteLocalCollectionData() > 0, 'et fonctionner à nouveau une fois propriétaire');
    loadData();
    assert.equal(cardOwned('P1'), false);
  });
});

describe('surface exposée', () => {
  test('l’export est bloqué par la délégation (fuite, pas écriture)', () => {
    assert.match(read('app.js'), /VIEWER_BLOCKED[\s\S]{0,400}'exportCollection'/,
      'exportCollection doit figurer dans VIEWER_BLOCKED');
  });

  test('renderAccount rend l’état verrouillé AVANT tout contrôle', () => {
    const src = read('account.js');
    const fn = src.slice(src.indexOf('export function renderAccount'));
    const guardAt = fn.indexOf('deniedForViewer()');
    const formAt = fn.indexOf('dangerDeleteBtn');
    assert.ok(guardAt >= 0 && guardAt < formAt,
      'le garde doit précéder la construction du formulaire');
    assert.match(fn.slice(guardAt, guardAt + 260), /return;/,
      'l’état verrouillé doit interrompre le rendu');
  });

  test('l’état verrouillé offre une sortie (passage propriétaire)', () => {
    const src = read('account.js');
    assert.match(src, /accAdminBtn/);
    assert.match(src, /showAdminPinScreen/,
      'un état bloqué doit dire comment se débloquer');
  });

  test('le tutoriel saute TOUT le chapitre Compte en spectateur', () => {
    // Depuis 1.47.0 le parcours est chapitré : on ne retire plus deux
    // étapes à la main, on retire le chapitre entier — et le compteur
    // de chapitres tombe de 5 à 4.
    const src = read('tutorial.js');
    assert.match(src, /VIEWER_SKIPPED_CHAPTER\s*=\s*'account'/);
    assert.match(src, /export function activeTutorialSteps/);
    assert.match(src, /export function activeTutorialChapters/);
    assert.match(src, /filter\(c => c\.id !== VIEWER_SKIPPED_CHAPTER\)/,
      'les chapitres doivent être filtrés, sinon le compteur reste à 5');
    assert.match(src, /filter\(s => s\.chapter !== VIEWER_SKIPPED_CHAPTER\)/,
      'les étapes du chapitre doivent être filtrées');
  });
});
