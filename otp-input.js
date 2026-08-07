/* ══════════════════════════════════════════════════════════
   SEGMENTED INPUT — composant partagé de saisie par cases.
   Consommé par le flux OTP cloud (8 chiffres) et, à terme, par
   l'interface PIN (masquage + auto-submit). Un seul principe :
   le VRAI <input> reste l'unique source logique (clavier, collage,
   backspace, lecteur d'écran, autocomplete one-time-code) ; les
   cases ne sont qu'un miroir visuel aria-hidden.

   États : idle → (saisie) → success | error. Les états sont posés
   par setState() sous forme de classes seg-success / seg-error sur
   la racine ; TOUT le style vit dans styles.css via les tokens de
   composant --seg-* (aucune couleur en dur ici ni là-bas).
   ══════════════════════════════════════════════════════════ */

/* ── Helpers purs (unit-testés) ── */

// Ce que la case i doit AFFICHER. Masquage type PIN : le dernier
// chiffre saisi reste lisible (revealIdx) puis se masque — le
// composant repasse un revealIdx=-1 après revealMs.
export function segDisplay(value, i, { mask = false, revealIdx = -1 } = {}){
  const ch = String(value || '')[i] || '';
  if(!ch) return '';
  if(mask && i !== revealIdx) return '•';
  return ch;
}

// Index de la case active (celle qui recevra le prochain chiffre),
// -1 quand la saisie est complète.
export function segActiveIndex(value, length){
  const n = String(value || '').length;
  return n >= length ? -1 : n;
}

export function segSanitize(value, length){
  return String(value || '').replace(/\D+/g, '').slice(0, length);
}

/* ── Adaptateur clavier-écran (PIN) ──
   Même rendu, mêmes classes, mêmes helpers — mais piloté par set(v)
   au lieu d'un <input> : au boot, la source de saisie est le pavé
   numérique à l'écran (pinKey/pinDel), pas le clavier système. Pas
   de badge dans le markup : le succès reste discret (cases vertes),
   comme il se doit sur un écran de déverrouillage. */
export function createKeypadSegments(host, opts = {}){
  const length = opts.length || 4;
  const mask = opts.mask !== false;   // PIN : masqué par défaut
  const revealMs = opts.revealMs || 200;
  const reduce = typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  host.classList.add('otp-wrap', 'pin-segs');
  host.innerHTML = `<div class="otp-boxes" aria-hidden="true">${
    `<span class="otp-box"><span class="otp-caret"></span></span>`.repeat(length)}</div>`;
  const boxes = [...host.querySelectorAll('.otp-box')];
  let value = '', revealIdx = -1, revealTimer = 0, state = 'idle';

  const render = () => {
    const active = segActiveIndex(value, length);
    boxes.forEach((b, i) => {
      const shown = segDisplay(value, i, { mask, revealIdx });
      const txt = b.lastChild && b.lastChild.nodeType === 3 ? b.lastChild : null;
      if((txt ? txt.data : '') !== shown){
        if(txt) txt.data = shown; else b.appendChild(document.createTextNode(shown));
        if(shown && !reduce){ b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
      }
      b.classList.toggle('filled', !!value[i]);
      b.classList.toggle('active', i === active && state === 'idle');
    });
  };

  const api = {
    el: host,
    set(v){
      const grew = String(v).length > value.length;
      value = segSanitize(v, length);
      if(mask && grew){
        clearTimeout(revealTimer);
        revealIdx = value.length - 1;
        revealTimer = setTimeout(() => { revealIdx = -1; render(); }, reduce ? 0 : revealMs);
      }
      render();
    },
    setState(next){
      state = next;
      host.classList.toggle('seg-success', next === 'success');
      if(next === 'error'){
        host.classList.remove('seg-error'); void host.offsetWidth; host.classList.add('seg-error');
      } else {
        host.classList.remove('seg-error');
      }
      if(next === 'idle') render();
    },
    destroy(){ clearTimeout(revealTimer); host.innerHTML = ''; host.classList.remove('otp-wrap', 'pin-segs', 'seg-success', 'seg-error'); },
  };
  render();
  return api;
}

/* ── Fabrique ── */

// createSegmentedInput(host, opts) → api
//   host : élément vidé puis rempli par le composant
//   opts : length (8), mask (false), revealMs (200), autoSubmit (false),
//          inputId, ariaLabel, autocomplete ('one-time-code'),
//          onComplete(value), onInput(value)
export function createSegmentedInput(host, opts = {}){
  const length = opts.length || 8;
  const mask = !!opts.mask;
  const revealMs = opts.revealMs || 200;
  const reduce = typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  host.classList.add('otp-wrap');
  host.innerHTML = `
    <input type="${mask ? 'password' : 'text'}" class="otp-input"${opts.inputId ? ` id="${opts.inputId}"` : ''}
      inputmode="numeric" autocomplete="${opts.autocomplete || 'one-time-code'}"
      maxlength="${length}" aria-label="${opts.ariaLabel || ''}">
    <div class="otp-boxes" aria-hidden="true">${
      `<span class="otp-box"><span class="otp-caret"></span></span>`.repeat(length)}</div>
    <span class="otp-badge" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path class="otp-badge-path" d="M4.5 12.5l5 5 10-11"/>
      </svg>
      ${'<i class="otp-spark"></i>'.repeat(6)}
    </span>`;

  const input = host.querySelector('.otp-input');
  const boxes = [...host.querySelectorAll('.otp-box')];
  let revealIdx = -1, revealTimer = 0, state = 'idle';

  const render = () => {
    const v = segSanitize(input.value, length);
    if(input.value !== v) input.value = v;
    const active = segActiveIndex(v, length);
    const focused = document.activeElement === input;
    boxes.forEach((b, i) => {
      const shown = segDisplay(v, i, { mask, revealIdx });
      // le caret est un enfant : on ne touche qu'au texte propre
      const txt = b.lastChild && b.lastChild.nodeType === 3 ? b.lastChild : null;
      if((txt ? txt.data : '') !== shown){
        if(txt) txt.data = shown; else b.appendChild(document.createTextNode(shown));
        if(shown && !reduce){ b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
      }
      b.classList.toggle('filled', !!v[i]);
      b.classList.toggle('active', focused && i === active && state === 'idle');
    });
    if(state === 'error'){ setState('idle'); }
    if(opts.onInput) opts.onInput(v);
    if(v.length === length && opts.autoSubmit && opts.onComplete) opts.onComplete(v);
  };

  const onInput = () => {
    if(mask){
      // révèle brièvement le dernier chiffre tapé, puis masque
      clearTimeout(revealTimer);
      revealIdx = segSanitize(input.value, length).length - 1;
      revealTimer = setTimeout(() => { revealIdx = -1; render(); }, reduce ? 0 : revealMs);
    }
    render();
  };
  input.addEventListener('input', onInput);
  input.addEventListener('focus', render);
  input.addEventListener('blur', () => boxes.forEach(b => b.classList.remove('active')));
  host.addEventListener('click', () => input.focus());

  function setState(next){
    state = next;
    host.classList.toggle('seg-success', next === 'success');
    if(next === 'error'){
      host.classList.remove('seg-error'); void host.offsetWidth; host.classList.add('seg-error');
    } else {
      host.classList.remove('seg-error');
    }
    if(next === 'idle') render();
  }

  render();
  return {
    el: host, input,
    value: () => segSanitize(input.value, length),
    clear: () => { input.value = ''; revealIdx = -1; setState('idle'); },
    focus: () => input.focus(),
    setState,
    destroy: () => { clearTimeout(revealTimer); host.innerHTML = ''; host.classList.remove('otp-wrap', 'seg-success', 'seg-error'); },
  };
}
