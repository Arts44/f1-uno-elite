/* ══════════════════════════════════════════════════════════
   CHANGELOG — in-app version history + the app version itself.
   - CHANGELOG is ordered NEWEST FIRST; APP_VERSION is derived from
     the first entry, so adding an entry IS the version bump
     (single source of truth, nothing can drift).
   - Every entry carries its texts in ALL 7 LANGUAGES (en, fr, es,
     zh, it, nl, de) — an entry without the 7 is an incomplete
     change (tests enforce this).
   - Release routine: add an entry here (top of the array), then
     bump SW_VERSION in sw.js, `npm run build`, commit, push.
   ══════════════════════════════════════════════════════════ */

export const CHANGELOG = [
  {
    version: '1.3.0',
    date: '2026-07-12',
    changes: {
      en: [
        'Optional local-data encryption (Settings → Security, requires the PIN): your collection is stored encrypted in the browser. Warning: a forgotten PIN makes the local data unrecoverable — back up first.',
      ],
      fr: [
        'Chiffrement optionnel des données locales (Réglages → Sécurité, nécessite le PIN) : ta collection est stockée chiffrée dans le navigateur. Attention : PIN oublié = données locales irrécupérables — sauvegarde d’abord.',
      ],
      es: [
        'Cifrado opcional de los datos locales (Ajustes → Seguridad, requiere el PIN): tu colección se guarda cifrada en el navegador. Atención: un PIN olvidado hace los datos locales irrecuperables — haz una copia primero.',
      ],
      zh: [
        '可选的本地数据加密（设置 → 安全，需要 PIN）：你的收藏将加密存储在浏览器中。注意：忘记 PIN 将导致本地数据无法恢复——请先备份。',
      ],
      it: [
        'Cifratura opzionale dei dati locali (Impostazioni → Sicurezza, richiede il PIN): la collezione è salvata cifrata nel browser. Attenzione: PIN dimenticato = dati locali irrecuperabili — fai prima un backup.',
      ],
      nl: [
        'Optionele versleuteling van lokale gegevens (Instellingen → Beveiliging, vereist de pincode): je collectie wordt versleuteld opgeslagen in de browser. Let op: pincode vergeten = lokale gegevens onherstelbaar — maak eerst een back-up.',
      ],
      de: [
        'Optionale Verschlüsselung der lokalen Daten (Einstellungen → Sicherheit, erfordert die PIN): deine Sammlung wird verschlüsselt im Browser gespeichert. Achtung: vergessene PIN = lokale Daten unwiederbringlich — vorher sichern.',
      ],
    },
  },
  {
    version: '1.2.0',
    date: '2026-07-12',
    changes: {
      en: [
        'More readable rarity chips: white text on every rarity, with the orange (legendary), green (mythic) and red (ultra) backgrounds slightly darkened to keep full contrast.',
      ],
      fr: [
        'Pastilles de rareté plus lisibles : texte blanc sur toutes les raretés, avec les fonds orange (légendaire), vert (mythique) et rouge (ultra) légèrement assombris pour garder un contraste parfait.',
      ],
      es: [
        'Chips de rareza más legibles: texto blanco en todas las rarezas, con los fondos naranja (legendaria), verde (mítica) y rojo (ultra) ligeramente oscurecidos para mantener el contraste.',
      ],
      zh: [
        '稀有度标签更易读：所有稀有度均为白色文字，橙色（传奇）、绿色（神话）和红色（超稀有）背景略微加深以保持对比度。',
      ],
      it: [
        'Chip di rarità più leggibili: testo bianco su tutte le rarità, con gli sfondi arancione (leggendaria), verde (mitica) e rosso (ultra) leggermente scuriti per mantenere il contrasto.',
      ],
      nl: [
        'Beter leesbare zeldzaamheidslabels: witte tekst op elke zeldzaamheid, met de oranje (legendarisch), groene (mythisch) en rode (ultra) achtergronden iets donkerder voor volledig contrast.',
      ],
      de: [
        'Besser lesbare Seltenheits-Chips: weiße Schrift auf jeder Seltenheit, mit leicht abgedunkelten Hintergründen bei Orange (legendär), Grün (mythisch) und Rot (ultra) für vollen Kontrast.',
      ],
    },
  },
  {
    version: '1.1.0',
    date: '2026-07-12',
    changes: {
      en: [
        'The app now updates itself: when a new version is online, a small banner offers to reload — no more manual cache clearing.',
        'Version history: this “What’s new” screen, also available anytime from Settings.',
        'The app version is shown at the bottom of Settings.',
      ],
      fr: [
        'L’app se met désormais à jour toute seule : quand une nouvelle version est en ligne, un petit bandeau propose de recharger — plus besoin de vider le cache.',
        'Historique des versions : cet écran « Nouveautés », consultable à tout moment depuis les Réglages.',
        'La version de l’app est affichée en bas des Réglages.',
      ],
      es: [
        'La aplicación ahora se actualiza sola: cuando hay una nueva versión en línea, un pequeño aviso propone recargar — se acabó vaciar la caché a mano.',
        'Historial de versiones: esta pantalla de «Novedades», disponible en cualquier momento desde Ajustes.',
        'La versión de la aplicación se muestra al final de Ajustes.',
      ],
      zh: [
        '应用现在会自动更新：当有新版本上线时，会出现一个小横幅提示重新加载——不再需要手动清除缓存。',
        '版本历史：这个“更新内容”页面，随时可以在设置中查看。',
        '应用版本号显示在设置底部。',
      ],
      it: [
        'L’app ora si aggiorna da sola: quando una nuova versione è online, un piccolo banner propone di ricaricare — basta svuotare la cache a mano.',
        'Cronologia delle versioni: questa schermata «Novità», consultabile in ogni momento dalle Impostazioni.',
        'La versione dell’app è mostrata in fondo alle Impostazioni.',
      ],
      nl: [
        'De app werkt zichzelf voortaan bij: zodra er een nieuwe versie online staat, stelt een kleine banner voor om te herladen — nooit meer handmatig de cache legen.',
        'Versiegeschiedenis: dit “Wat is nieuw”-scherm, altijd te openen via Instellingen.',
        'De appversie staat onderaan in Instellingen.',
      ],
      de: [
        'Die App aktualisiert sich jetzt selbst: Sobald eine neue Version online ist, bietet ein kleines Banner das Neuladen an — kein manuelles Cache-Leeren mehr.',
        'Versionsverlauf: dieser „Neuigkeiten“-Bildschirm, jederzeit über die Einstellungen erreichbar.',
        'Die App-Version wird unten in den Einstellungen angezeigt.',
      ],
    },
  },
  {
    version: '1.0.0',
    date: '2026-07-11',
    changes: {
      en: [
        'Optional cloud backup: sign in with an email code and save/restore your collection in the cloud (manual, never automatic).',
        'Backups can include your preferences and — with an explicit warning — your PIN, on every channel (file, code, QR, cloud).',
        'Locking the app is now instant, and the PIN fields accept the Enter key.',
        'New app icon: the card fan on F1 red.',
      ],
      fr: [
        'Sauvegarde cloud optionnelle : connexion par code reçu par e-mail, envoi/récupération manuelle de ta collection (jamais automatique).',
        'Les sauvegardes peuvent inclure tes préférences et — avec un avertissement explicite — ton PIN, sur tous les canaux (fichier, code, QR, cloud).',
        'Le verrouillage de l’app est désormais instantané, et les champs PIN acceptent la touche Entrée.',
        'Nouvelle icône : l’éventail de cartes sur fond rouge F1.',
      ],
      es: [
        'Copia en la nube opcional: inicia sesión con un código recibido por correo y envía/recupera tu colección manualmente (nunca automático).',
        'Las copias pueden incluir tus preferencias y — con una advertencia explícita — tu PIN, en todos los canales (archivo, código, QR, nube).',
        'El bloqueo de la aplicación ahora es instantáneo, y los campos del PIN aceptan la tecla Intro.',
        'Nuevo icono: el abanico de cartas sobre rojo F1.',
      ],
      zh: [
        '可选云备份：通过邮件验证码登录，手动上传/恢复你的收藏（绝不自动）。',
        '备份可以包含你的偏好设置，以及——在明确警告下——你的 PIN，适用于所有渠道（文件、代码、二维码、云端）。',
        '应用锁定现在是即时的，PIN 输入框支持回车键。',
        '新应用图标：F1 红底上的卡牌扇形。',
      ],
      it: [
        'Backup cloud opzionale: accedi con un codice ricevuto via e-mail e invia/recupera la collezione manualmente (mai automatico).',
        'I backup possono includere le tue preferenze e — con un avviso esplicito — il tuo PIN, su ogni canale (file, codice, QR, cloud).',
        'Il blocco dell’app ora è istantaneo, e i campi PIN accettano il tasto Invio.',
        'Nuova icona: il ventaglio di carte su rosso F1.',
      ],
      nl: [
        'Optionele cloudback-up: log in met een code per e-mail en verstuur/herstel je collectie handmatig (nooit automatisch).',
        'Back-ups kunnen je voorkeuren bevatten en — met een expliciete waarschuwing — je pincode, via elk kanaal (bestand, code, QR, cloud).',
        'Het vergrendelen van de app is nu onmiddellijk, en de pincodevelden accepteren de Enter-toets.',
        'Nieuw app-pictogram: de kaartenwaaier op F1-rood.',
      ],
      de: [
        'Optionale Cloud-Sicherung: Anmeldung per E-Mail-Code, manuelles Senden/Wiederherstellen deiner Sammlung (nie automatisch).',
        'Sicherungen können deine Einstellungen enthalten und — mit ausdrücklicher Warnung — deine PIN, auf jedem Kanal (Datei, Code, QR, Cloud).',
        'Das Sperren der App ist jetzt sofortig, und die PIN-Felder akzeptieren die Eingabetaste.',
        'Neues App-Symbol: der Kartenfächer auf F1-Rot.',
      ],
    },
  },
];

// The app version IS the newest changelog entry — one source of truth.
export const APP_VERSION = CHANGELOG[0].version;

/* ── Pure helpers (unit-tested) ── */

// Numeric semver-ish compare: -1 / 0 / 1. '1.10.0' > '1.9.0'.
export function compareVersions(a, b){
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for(let i = 0; i < len; i++){
    const d = (pa[i] || 0) - (pb[i] || 0);
    if(d) return d < 0 ? -1 : 1;
  }
  return 0;
}

// Entries strictly newer than `lastSeen` (newest first, like CHANGELOG).
// No baseline recorded → nothing to announce (fresh installs must not
// be greeted with the full history).
export function entriesSince(lastSeen, list = CHANGELOG){
  if(!lastSeen) return [];
  return list.filter(e => compareVersions(e.version, lastSeen) > 0);
}

// Texts of an entry in the given language (English as the app-wide fallback).
export function changesFor(entry, lang){
  const c = (entry && entry.changes) || {};
  return c[lang] || c.en || [];
}
