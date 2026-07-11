/* ══════════════════════════════════════════════════════════
   SETTINGS SYNC — optional inclusion of device settings in
   backups (JSON export, backup code, QR, cloud push/pull).

   Two user-facing categories:
   - prefs    : language, theme, font, title — safe to carry around.
   - security : PIN (enabled + SHA-256 hash) and viewer mode —
                SENSITIVE: restoring replaces this device's PIN, so
                it is opt-in on both export and import, with an
                explicit warning at restore time.

   Deliberately NOT included (device-local by nature):
   f1uno_setup_done / f1uno_onboarded (first-launch flags),
   f1uno_install_dismissed (per-device banner opt-out),
   f1uno_cloud_session (auth token — must never travel),
   f1uno_last_backup / f1uno_changes_since_backup (per-device
   reminder), migration/version keys, season data (that IS the
   collection part of the snapshot).

   Backward compatible: `settings` is an OPTIONAL extra field on the
   snapshot — old backups without it import unchanged, and old
   readers ignore the extra field.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { applyLanguage } from './i18n.js';
import { applySavedFont } from './pin.js';
import { updateUserTitle } from './badges.js';

export const PREF_KEYS = {
  lang: 'f1uno_lang',
  theme: 'f1uno_theme',
  font: 'f1uno_font',
  title: 'f1uno_title',
};
export const SECURITY_KEYS = {
  pinEnabled: 'f1uno_pin_enabled',
  pinHash: 'f1uno_pin_hash',
  viewerEnabled: 'f1uno_viewer_enabled',
};

/* ── What the user includes in backups (remembered choice) ──
   Applies to ALL four channels. Defaults: prefs ON, security OFF. */
const INC_PREFS_KEY = 'f1uno_backup_inc_prefs';
const INC_SEC_KEY = 'f1uno_backup_inc_sec';

export function backupIncludes(){
  return {
    prefs: localStorage.getItem(INC_PREFS_KEY) !== 'false',
    security: localStorage.getItem(INC_SEC_KEY) === 'true',
  };
}
export function setBackupIncludes(inc){
  if('prefs' in inc) localStorage.setItem(INC_PREFS_KEY, String(!!inc.prefs));
  if('security' in inc) localStorage.setItem(INC_SEC_KEY, String(!!inc.security));
}

/* ── Gather (export side) ──
   Returns the optional `settings` section, or null when nothing is
   included (the snapshot then has NO settings field at all). Absent
   localStorage keys are simply omitted. */
export function gatherSettings(include = {}){
  const settings = {};
  if(include.prefs){
    const prefs = {};
    Object.entries(PREF_KEYS).forEach(([name, key]) => {
      const v = localStorage.getItem(key);
      if(v !== null) prefs[name] = v;
    });
    if(Object.keys(prefs).length) settings.prefs = prefs;
  }
  if(include.security){
    const sec = {};
    Object.entries(SECURITY_KEYS).forEach(([name, key]) => {
      const v = localStorage.getItem(key);
      if(v !== null) sec[name] = v;
    });
    if(Object.keys(sec).length) settings.security = sec;
  }
  return Object.keys(settings).length ? settings : null;
}

/* ── Apply (import side) ──
   Writes ONLY the chosen categories, then refreshes the UI in place
   (theme attribute, font vars, language, title) — no reload needed.
   Returns which categories were actually applied. */
export function applySettings(settings, choose = {}){
  const applied = { prefs: false, security: false };
  if(!settings || typeof settings !== 'object') return applied;

  if(choose.prefs && settings.prefs && typeof settings.prefs === 'object'){
    Object.entries(PREF_KEYS).forEach(([name, key]) => {
      if(typeof settings.prefs[name] === 'string') localStorage.setItem(key, settings.prefs[name]);
    });
    applied.prefs = true;
  }
  if(choose.security && settings.security && typeof settings.security === 'object'){
    Object.entries(SECURITY_KEYS).forEach(([name, key]) => {
      if(typeof settings.security[name] === 'string') localStorage.setItem(key, settings.security[name]);
    });
    applied.security = true;
  }

  // Immediate UI refresh (browser only — each guarded for node tests)
  if(applied.prefs){
    try {
      const theme = localStorage.getItem(PREF_KEYS.theme);
      if(theme) document.documentElement.setAttribute('data-theme', theme);
      else document.documentElement.removeAttribute('data-theme');
    } catch(e){}
    try { applySavedFont(); } catch(e){}
    try { applyLanguage(); } catch(e){ log('settings-sync: applyLanguage skipped', e); }
    try { updateUserTitle(); } catch(e){}
  }
  log('settings-sync: applied', applied);
  return applied;
}
