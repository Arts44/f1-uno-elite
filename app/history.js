/* ══════════════════════════════════════════════════════════
   HISTORY — daily progression snapshots for the Stats curve.
   On every collection change (storage.js saveData), records
   { date: 'YYYY-MM-DD', owned: <owned card count> } into a
   season-scoped localStorage key (f1uno_history_<season>).
   - One point per day: the current day's point is updated in
     place, not stacked.
   - Capped at the most recent 365 points.
   NOTE: history starts the day this feature ships — there is
   no way to back-fill the past from the current state.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { CARDS_DB } from './data.js';
import { _storageKey, cardOwned } from './storage.js';
import { secureGet, secureSet } from './secure-store.js';

const MAX_POINTS = 365;

function _todayKey(){
  // Local date, not UTC — a "day" is the user's day
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function getHistory(){
  try {
    const s = secureGet(_storageKey('history'));
    const arr = s ? JSON.parse(s) : [];
    return Array.isArray(arr) ? arr : [];
  } catch(e){
    return [];
  }
}

// Called from storage.js saveData() — kept out of renderStats()
// (hot path); one owned-count scan per persisted change is cheap.
export function recordHistoryPoint(){
  try {
    const owned = CARDS_DB.filter(c => cardOwned(c.id)).length;
    const today = _todayKey();
    const hist = getHistory();
    const last = hist[hist.length - 1];
    if(last && last.date === today){
      if(last.owned === owned) return; // nothing changed today
      last.owned = owned;              // refresh today's point
    } else {
      hist.push({ date: today, owned });
    }
    if(hist.length > MAX_POINTS) hist.splice(0, hist.length - MAX_POINTS);
    secureSet(_storageKey('history'), JSON.stringify(hist));
    log('history point recorded:', today, owned);
  } catch(e){
    // History is best-effort — never let it break a save
    log('history record failed:', e);
  }
}
