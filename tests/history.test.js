import './_setup.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './_setup.js';
import { installFixtures, seedCollection } from './_fixtures.js';
import { loadData } from '../storage.js';
import { getHistory, recordHistoryPoint } from '../history.js';

const KEY = 'f1uno_history_2025';
const today = () => {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

describe('history — daily progression points', () => {
  beforeEach(() => { resetStorage(); installFixtures(); });

  test('empty by default', () => {
    seedCollection({}); loadData();
    assert.deepEqual(getHistory(), []);
  });

  test('records one point with the current owned count', () => {
    seedCollection({ P1: { blue: { owned: true, qty: 1 } } }); loadData();
    recordHistoryPoint();
    assert.deepEqual(getHistory(), [{ date: today(), owned: 1 }]);
  });

  test('two records the same day update one single point', () => {
    seedCollection({ P1: { blue: { owned: true, qty: 1 } } }); loadData();
    recordHistoryPoint();
    seedCollection({
      P1: { blue: { owned: true, qty: 1 } },
      R1: { blue: { owned: true, qty: 1 } },
    });
    loadData();
    recordHistoryPoint();
    const h = getHistory();
    assert.equal(h.length, 1);
    assert.deepEqual(h[0], { date: today(), owned: 2 });
  });

  test('same day, same count → stored value untouched', () => {
    seedCollection({ P1: { blue: { owned: true, qty: 1 } } }); loadData();
    recordHistoryPoint();
    const before = localStorage.getItem(KEY);
    recordHistoryPoint();
    assert.equal(localStorage.getItem(KEY), before);
  });

  test('history is capped at 365 points (oldest dropped)', () => {
    seedCollection({ P1: { blue: { owned: true, qty: 1 } } }); loadData();
    const old = Array.from({ length: 365 }, (_, i) =>
      ({ date: `2020-01-${String((i % 28) + 1).padStart(2, '0')}`, owned: i }));
    localStorage.setItem(KEY, JSON.stringify(old));
    recordHistoryPoint(); // adds today → 366 → trimmed back to 365
    const h = getHistory();
    assert.equal(h.length, 365);
    assert.equal(h[h.length - 1].date, today());
    assert.equal(h[0].owned, 1, 'the oldest point must be dropped');
  });

  test('corrupted stored history is treated as empty', () => {
    seedCollection({}); loadData();
    localStorage.setItem(KEY, '[broken');
    assert.deepEqual(getHistory(), []);
    recordHistoryPoint(); // must not throw
    assert.equal(getHistory().length, 1);
  });
});
