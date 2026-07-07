import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './_setup.js';
import { installFixtures, seedCollection, SAMPLE_COLL } from './_fixtures.js';
import { loadData, collectionSnapshot } from '../storage.js';
import { generateBackupCode, decodeBackupCode, buildBackupLink, MAX_CODE_CHARS } from '../backup.js';

describe('backup code round-trip', () => {
  beforeEach(() => { resetStorage(); installFixtures(); });

  test('collectionSnapshot → encode → decode → identical payload', async () => {
    seedCollection(SAMPLE_COLL); loadData();
    const snap = collectionSnapshot();
    const { code, tooBig } = await generateBackupCode(snap);
    assert.match(code, /^F1U[01]\.[A-Za-z0-9_-]+$/);
    assert.equal(tooBig, false);
    const decoded = await decodeBackupCode(code);
    assert.deepEqual(decoded.owned, SAMPLE_COLL);
    assert.equal(decoded.season, 2025);
    assert.ok(decoded.exportDate);
  });

  test('snapshot schema carries season, owned and badge maps', () => {
    seedCollection(SAMPLE_COLL); loadData();
    const snap = collectionSnapshot();
    assert.deepEqual(
      Object.keys(snap).sort(),
      ['autoBadges', 'exportDate', 'manualBadges', 'owned', 'season']
    );
  });

  test('a compressed code (F1U1) is produced when CompressionStream exists', async () => {
    assert.equal(typeof CompressionStream, 'function', 'Node should provide CompressionStream');
    const { code } = await generateBackupCode({ season: 2025, owned: {} });
    assert.ok(code.startsWith('F1U1.'));
  });

  test('accepts a full #backup= link, not just the bare code', async () => {
    const { code } = await generateBackupCode({ season: 2025, owned: { X: {} } });
    const viaLink = await decodeBackupCode(`https://host/app/index.html#backup=${code}`);
    assert.deepEqual(viaLink.owned, { X: {} });
  });

  test('buildBackupLink targets the current deployment path', async () => {
    const { code } = await generateBackupCode({ season: 2025, owned: {} });
    assert.equal(buildBackupLink(code), `https://example.test/f1uno/#backup=${code}`);
  });
});

describe('backup code rejection', () => {
  beforeEach(() => { resetStorage(); installFixtures(); });

  test('garbage input throws', async () => {
    await assert.rejects(() => decodeBackupCode('definitely not a code'));
    await assert.rejects(() => decodeBackupCode(''));
    await assert.rejects(() => decodeBackupCode(null));
  });

  test('wrong prefix throws', async () => {
    await assert.rejects(() => decodeBackupCode('F1U9.AAAA'));
  });

  test('corrupted payload throws', async () => {
    const { code } = await generateBackupCode({ season: 2025, owned: {} });
    const tampered = code.slice(0, -6) + 'XXXXXX';
    await assert.rejects(() => decodeBackupCode(tampered));
  });

  test('valid JSON without an owned map is rejected', async () => {
    const { code } = await generateBackupCode({ hello: 'world' });
    await assert.rejects(() => decodeBackupCode(code));
  });

  test('non-integer season is rejected', async () => {
    const { code } = await generateBackupCode({ season: 'twenty', owned: {} });
    await assert.rejects(() => decodeBackupCode(code));
  });

  test('oversized (incompressible) snapshot sets tooBig', async () => {
    // random bytes do not compress — force the code above MAX_CODE_CHARS
    const blob = Array.from({ length: 6000 }, () => crypto.randomUUID()).join('');
    const { code, tooBig } = await generateBackupCode({ season: 2025, owned: { blob } });
    assert.ok(code.length > MAX_CODE_CHARS);
    assert.equal(tooBig, true);
    // ...but the code itself still round-trips
    const decoded = await decodeBackupCode(code);
    assert.equal(decoded.owned.blob, blob);
  });
});
