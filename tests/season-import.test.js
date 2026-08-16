/* ══════════════════════════════════════════════════════════
   IMPORT D'UNE AUTRE SAISON — non-régression.

   Bug corrigé en 1.47.4 : _applyImport() se contentait de
   setCurrentSeason(data.season). Le VARIABLE de saison changeait,
   mais ni le catalogue de cartes ni la collection stockée pour
   cette saison n'étaient rechargés. Conséquence : la collection
   de la saison PRÉCÉDENTE, restée en mémoire, était fusionnée
   avec l'import puis réécrite sous la clé de la NOUVELLE saison.
   Deux saisons se mélangeaient en une.

   Ces tests vérifient l'isolation des saisons de part et d'autre
   de l'import, dans les deux modes (remplacer / fusionner).
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './_setup.js';
import { installFixtures } from './_fixtures.js';
import { loadData, coll, _applyImport } from '../app/storage.js';
import { _currentSeason, setCurrentSeason } from '../app/data.js';

const OWNED_2025 = { P1: { blue: { owned: true, wishlist: false, doubles: false, favorite: false, qty: 1 } } };
const OWNED_2026 = { P2: { blue: { owned: true, wishlist: false, doubles: false, favorite: false, qty: 3 } } };

/* _applyImport() repeint la grille et les stats. Le document du
   harnais rend `null` pour tout élément ; renderGrid() écrit sur
   #cardGrid sans garde. On fournit donc un élément permissif le
   temps de ces tests, et on rend le document d'origine ensuite. */
const _realDoc = {
  getElementById: globalThis.document.getElementById,
  createElement: globalThis.document.createElement,
  createTextNode: globalThis.document.createTextNode,
};
const _fakeEl = () => ({
  style: {}, dataset: {}, parentElement: null, textContent: '', innerHTML: '',
  classList: { add(){}, remove(){}, toggle(){}, contains: () => false },
  appendChild(){}, append(){}, prepend(){}, insertBefore(){}, remove(){},
  setAttribute(){}, removeAttribute(){}, getAttribute: () => null,
  addEventListener(){}, removeEventListener(){}, focus(){},
  closest: () => null, querySelector: () => null, querySelectorAll: () => [],
  getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }),
});

const seed2025 = () => {
  localStorage.setItem('f1uno_owned_2025', JSON.stringify(OWNED_2025));
  loadData();
};

describe('import d\'une sauvegarde d\'une autre saison', () => {
  beforeEach(() => {
    resetStorage(); installFixtures(); setCurrentSeason(2025);
    globalThis.document.getElementById = _fakeEl;
    globalThis.document.createElement = _fakeEl;
    globalThis.document.createTextNode = _fakeEl;
  });
  afterEach(() => {
    setCurrentSeason(2025);
    Object.assign(globalThis.document, _realDoc);
  });

  test('mode « remplacer » : la saison importée ne contient QUE les cartes importées', async () => {
    seed2025();
    await _applyImport({ season: 2026, owned: OWNED_2026 }, 'replace');
    const s26 = JSON.parse(localStorage.getItem('f1uno_owned_2026'));
    assert.deepEqual(Object.keys(s26).sort(), ['P2']);
  });

  test('mode « fusionner » : la collection 2025 ne fuit pas dans 2026', async () => {
    seed2025();
    await _applyImport({ season: 2026, owned: OWNED_2026 }, 'merge');
    const s26 = JSON.parse(localStorage.getItem('f1uno_owned_2026'));
    assert.deepEqual(Object.keys(s26).sort(), ['P2'],
      'P1 vient de 2025 : sa présence en 2026 est la fuite inter-saisons');
  });

  test('la saison d\'origine reste intacte après l\'import', async () => {
    seed2025();
    await _applyImport({ season: 2026, owned: OWNED_2026 }, 'replace');
    const s25 = JSON.parse(localStorage.getItem('f1uno_owned_2025'));
    assert.equal(s25.P1.blue.owned, true);
    assert.equal(s25.P1.blue.qty, 1);
    assert.equal(s25.P2, undefined);
  });

  test('« fusionner » fusionne bien avec la collection DE LA SAISON IMPORTÉE', async () => {
    seed2025();
    // 2026 a déjà une carte, stockée sous sa propre clé.
    localStorage.setItem('f1uno_owned_2026', JSON.stringify({
      G1: { blue: { owned: true, wishlist: false, doubles: false, favorite: false, qty: 2 } },
    }));
    await _applyImport({ season: 2026, owned: OWNED_2026 }, 'merge');
    const s26 = JSON.parse(localStorage.getItem('f1uno_owned_2026'));
    assert.deepEqual(Object.keys(s26).sort(), ['G1', 'P2']);
    assert.equal(s26.G1.blue.qty, 2, 'l\'existant 2026 doit survivre à la fusion');
  });

  test('la saison courante suit bien la sauvegarde importée', async () => {
    seed2025();
    await _applyImport({ season: 2026, owned: OWNED_2026 }, 'replace');
    assert.equal(_currentSeason, 2026);
    assert.equal(coll.P2.blue.qty, 3);
  });

  test('import de la MÊME saison : comportement inchangé (fusion en place)', async () => {
    seed2025();
    await _applyImport({ season: 2025, owned: { G1: { blue: { owned: true, qty: 1 } } } }, 'merge');
    const s25 = JSON.parse(localStorage.getItem('f1uno_owned_2025'));
    assert.deepEqual(Object.keys(s25).sort(), ['G1', 'P1']);
  });

  test('sauvegarde sans champ season : reste sur la saison courante', async () => {
    seed2025();
    await _applyImport({ owned: { G1: { blue: { owned: true, qty: 1 } } } }, 'merge');
    assert.equal(_currentSeason, 2025);
    assert.equal(localStorage.getItem('f1uno_owned_2026'), null);
  });
});
