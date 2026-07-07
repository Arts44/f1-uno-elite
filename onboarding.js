/* ══════════════════════════════════════════════════════════
   ONBOARDING — first-launch guided intro (3 slides).
   Shown ONLY on the very first launch, right after the setup
   wizard, once the app is visible. The f1uno_onboarded flag
   blocks any re-display; existing installs get the flag set
   silently at boot (app.js) so they never see it retroactively.
   ══════════════════════════════════════════════════════════ */
import { log } from './logger.js';
import { t } from './i18n.js';

const KEY = 'f1uno_onboarded';

export function isOnboarded(){ return localStorage.getItem(KEY) === 'true'; }
export function markOnboarded(){ localStorage.setItem(KEY, 'true'); }

const SLIDES = [
  { icon: '🎴', title: 'ob.s1_title', text: 'ob.s1_text' },
  { icon: '🧭', title: 'ob.s2_title', text: 'ob.s2_text' },
  { icon: '💾', title: 'ob.s3_title', text: 'ob.s3_text' },
];

export function maybeShowOnboarding(){
  if (isOnboarded()) return;
  // Flag set the moment it is shown: even a mid-tour reload
  // counts as seen — it must never reappear.
  markOnboarded();
  log('Onboarding: first launch — showing intro');

  let idx = 0;
  const ov = document.createElement('div');
  ov.className = 'ob-overlay';
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-modal', 'true');
  ov.setAttribute('aria-label', t('ob.s1_title'));

  const render = () => {
    const s = SLIDES[idx];
    const last = idx === SLIDES.length - 1;
    ov.innerHTML = `
      <div class="ob-card">
        <div class="ob-icon" aria-hidden="true">${s.icon}</div>
        <div class="ob-title">${t(s.title)}</div>
        <div class="ob-text">${t(s.text)}</div>
        <div class="ob-dots" aria-hidden="true">
          ${SLIDES.map((_, i) => `<span class="ob-dot${i === idx ? ' active' : ''}"></span>`).join('')}
        </div>
        <div class="ob-btns">
          <button class="ob-skip" id="obSkipBtn" type="button"${last ? ' style="visibility:hidden"' : ''}>${t('ob.skip')}</button>
          <button class="ob-next" id="obNextBtn" type="button">${last ? t('ob.done') : t('ob.next')}</button>
        </div>
      </div>`;
    ov.querySelector('#obSkipBtn').addEventListener('click', close);
    ov.querySelector('#obNextBtn').addEventListener('click', () => {
      if (last) { close(); return; }
      idx++;
      render();
    });
  };

  const close = () => {
    ov.classList.add('ob-closing');
    setTimeout(() => ov.remove(), 250);
  };

  render();
  document.body.appendChild(ov);
}
