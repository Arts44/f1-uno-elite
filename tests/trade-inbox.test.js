/* ══════════════════════════════════════════════════════════
   LA FICHE D'ÉCHANGE REÇUE (1.74.0)

   Le contrat central : une fiche reçue est CONSERVÉE — c'est ce
   qui la fait survivre au premier lancement, à la visite guidée
   et à une fermeture. Le parcours réel (profil jamais lancé, les
   deux chemins) est tenu par verify_trade_inbox.py ; ici, les
   règles qui se prouvent sans navigateur.
   ══════════════════════════════════════════════════════════ */
import './_setup.js';
import '../app/translations.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resetStorage } from './_setup.js';
import {
  getInbox, setInbox, clearInbox, markInboxLue, expiree, joursRestants,
  INBOX_KEY, INBOX_JOURS,
} from '../app/trade-inbox.js';
import { tutorialKeys } from '../app/tutorial-snapshot.js';
import { DATA_KEY_RE } from '../app/secure-store.js';

const read = f => readFileSync(new URL('../app/' + f, import.meta.url), 'utf8');
const FICHE = { season: 2025, want: ['001', '002'], offer: [['003', [['blue', 2]]]] };

describe('conservation — le cœur de la correction', () => {
  beforeEach(() => resetStorage());

  test('une fiche reçue est écrite, et relue à l’identique', () => {
    setInbox(FICHE);
    const f = getInbox();
    assert.equal(f.want.length, 2);
    assert.equal(f.offer.length, 1);
    assert.equal(f.season, 2025);
    assert.equal(f.lue, false, 'une fiche neuve n’est pas lue');
  });

  test('elle survit à un « rechargement » (relecture depuis le stockage seul)', () => {
    setInbox(FICHE);
    assert.ok(getInbox(), 'rien d’autre que localStorage ne la porte');
  });

  test('l’ouvrir la marque lue — c’est ce qui éteint la pastille', () => {
    setInbox(FICHE);
    markInboxLue();
    assert.equal(getInbox().lue, true);
  });

  test('l’effacement est explicite et total', () => {
    setInbox(FICHE);
    clearInbox();
    assert.equal(getInbox(), null);
  });
});

describe('30 jours — périssable par nature, jamais en silence', () => {
  beforeEach(() => resetStorage());

  test('le plafond est la valeur tranchée', () => {
    assert.equal(INBOX_JOURS, 30);
  });

  test('valable à J+29, périmée à J+31', () => {
    const f = setInbox(FICHE, Date.now());
    assert.equal(expiree(f, Date.now() + 29 * 86400000), false);
    assert.equal(expiree(f, Date.now() + 31 * 86400000), true);
  });

  test('une fiche périmée disparaît À LA LECTURE — pas de ménage différé', () => {
    setInbox(FICHE, Date.now() - 31 * 86400000);
    assert.equal(getInbox(), null, 'une fiche expirée ne doit jamais être rendue');
    assert.equal(localStorage.getItem(INBOX_KEY), null, 'et elle est retirée du stockage');
  });

  test('les jours restants s’arrondissent vers le HAUT — jamais « dans 0 jour »', () => {
    const f = setInbox(FICHE, Date.now());
    // 29 jours et quelques heures restantes → « 30 », pas « 29 »
    assert.equal(joursRestants(f, Date.now() + 0.5 * 86400000), 30);
    assert.equal(joursRestants(f, Date.now() + 29.5 * 86400000), 1);
  });

  test('une seule fiche à la fois : la seconde écriture remplace', () => {
    setInbox(FICHE);
    setInbox({ season: 2026, want: ['009'], offer: [] });
    assert.equal(getInbox().season, 2026);
    assert.equal(getInbox().want.length, 1);
  });
});

describe('strictement locale — les registres', () => {
  test('PAS dans DATA_KEY_RE : c’est la collection de quelqu’un d’AUTRE', () => {
    assert.equal(DATA_KEY_RE.test(INBOX_KEY), false);
  });

  test('PAS dans la sauvegarde ni le cloud', () => {
    assert.ok(!read('storage.js').includes('trade_inbox'),
      'collectionSnapshot ne doit jamais l’embarquer — périssable, et pas la nôtre');
    assert.ok(!read('cloud-sync.js').includes('trade_inbox'));
  });

  test('DANS tutorialKeys() — sinon la visite guidée l’emporterait', () => {
    assert.ok(tutorialKeys(2025).includes(INBOX_KEY),
      'le tour restaure le localStorage : sans cette clé, une fiche reçue '
      + 'juste avant serait effacée, et son propriétaire ne le saurait pas');
  });
});

describe('le moment de l’affichage — ni perdue, ni surgissante', () => {
  test('trois écrans ont priorité, et la visite guidée en fait partie', () => {
    const src = read('trade-inbox.js');
    assert.match(src, /login-screen/);
    assert.match(src, /\.tut-overlay/);
    assert.match(src, /tierCele/);
  });

  test('ENREGISTRER d’abord, AFFICHER ensuite — jamais l’inverse', () => {
    const src = read('backup.js');
    const fn = src.match(/export async function maybeHandleTradeHash[\s\S]*?\n}/)[0];
    assert.ok(fn.indexOf('setInbox(data)') < fn.indexOf('peutAfficher()'),
      'afficher avant d’enregistrer perdrait la fiche si le moment est mal choisi');
  });

  test('le repli est un toast qui dit OÙ la retrouver', () => {
    assert.match(read('backup.js'), /else showToast\(t\('tr\.recue_toast'\)\)/);
    for(const l of ['en', 'fr', 'de']){
      assert.match(window.__T[l]['tr.recue_toast'], /Stats|Statistiken|Statistiques/i);
    }
  });

  test('le remplacement NOMME ce qui part', () => {
    const src = read('backup.js');
    assert.match(src, /tr\.replace_sum/);
    assert.match(src, /tr\.replace_when/);
    assert.match(src, /tr\.replace_unread/);
  });
});

describe('i18n ×7', () => {
  const LANGS = ['en', 'fr', 'es', 'zh', 'it', 'nl', 'de'];
  const KEYS = ['tr.recue_toast', 'tr.replace_t', 'tr.replace_sub', 'tr.replace_old',
    'tr.replace_sum', 'tr.replace_when', 'tr.replace_unread', 'tr.replace_keep',
    'tr.replace_do', 'st.door_recue', 'st.door_recue_sub', 'st.recue_del', 'st.recue_deleted'];
  for(const k of KEYS){
    test(k, () => { for(const l of LANGS) assert.ok(window.__T[l]?.[k], `${k} manque en ${l}`); });
  }
  test('st.door_recue_exp existe aux deux formes ×7', () => {
    for(const l of LANGS) for(const f of ['one', 'other'])
      assert.ok(window.__T[l][`st.door_recue_exp_${f}`], `st.door_recue_exp_${f} manque en ${l}`);
  });
});
