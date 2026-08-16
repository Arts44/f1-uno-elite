/* ══════════════════════════════════════════════════════════
   LOGGER — debug logging gated behind a flag
   Set DEBUG = true to re-enable verbose console output.
   In production DEBUG stays false → log()/warn() are no-ops.
   ══════════════════════════════════════════════════════════ */
export const DEBUG = false;

export function log(...args){ if(DEBUG) console.log(...args); }
export function warn(...args){ if(DEBUG) console.warn(...args); }
