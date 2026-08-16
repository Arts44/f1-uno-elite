/* ══════════════════════════════════════════════════════════
   CLOUD CONFIG — Supabase project coordinates (manual push/pull).

   ⬇️ PASTE YOUR TWO VALUES BELOW (Supabase → Settings → API):
   - url:     the project URL,  e.g. 'https://abcdefghij.supabase.co'
   - anonKey: the "anon public" key (long JWT starting with 'eyJ…')

   These two values are PUBLIC BY DESIGN: they ship in the front-end
   of every Supabase app, and the data is protected by Row Level
   Security on the server, not by hiding them.
   ⚠️ NEVER put the "service_role" key here (or anywhere in this
   repo): it bypasses RLS entirely. Only the anon key belongs here.

   Leave both values empty ('') to disable the cloud feature — the
   app then behaves exactly as before (the Settings section shows
   that cloud sync is not configured).

   Classic script (not part of the esbuild bundle) so editing it
   never requires a rebuild — just save, bump nothing, reload.
   ══════════════════════════════════════════════════════════ */
window.__F1UNO_CLOUD = {
  url: 'https://pwyfgnanvgwuznayspot.supabase.co',      // ← paste your project URL here
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3eWZnbmFudmd3dXpuYXlzcG90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NjMwMjYsImV4cCI6MjA5OTIzOTAyNn0.hp9gaNojDVZWuIFwVuN9QusLioa4_xrn5JpopHynHxg',  // ← paste your anon public key here
};
