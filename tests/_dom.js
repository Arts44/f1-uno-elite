/* ══════════════════════════════════════════════════════════
   MINI-DOM — juste assez de DOM pour tester les chemins d'UI
   sous `node --test`, sans ajouter une seule dépendance.

   POURQUOI CE FICHIER EXISTE. `_setup.js` rend un document
   objet-nul : tout `getElementById` renvoie null. Ça suffit pour
   les helpers purs, et c'est ce qui a laissé `bindCloudSection()`
   (180 lignes de câblage) sans le moindre test. jsdom réglerait
   le problème en une ligne de package.json — et casserait la
   règle « zéro dépendance » (une devDependency reste une
   dépendance, et le dépôt n'en a qu'une : esbuild).

   CE QUE ÇA COUVRE — strictement ce que le code applicatif
   touche : innerHTML (avec un parseur du sous-ensemble produit
   par l'app), getElementById, querySelector(All) sur `.classe`,
   `#id` et `balise`, classList, style, value/disabled/textContent,
   addEventListener/click/focus, createTextNode et nodeType.

   CE QUE ÇA NE COUVRE PAS, ET QUI COMPTE : aucune mise en page,
   aucun style calculé, aucune propagation d'événement, aucune
   sémantique de formulaire. Ce mini-DOM prouve le CÂBLAGE, pas
   le RENDU. Le rendu se vérifie au navigateur — c'est la règle
   du dépôt et elle ne change pas ici.
   ══════════════════════════════════════════════════════════ */

const VOID = new Set(['input', 'br', 'img', 'hr', 'meta', 'link', 'source', 'use']);

class TextNode {
  constructor(data){ this.nodeType = 3; this.data = String(data); this.parentNode = null; }
  get textContent(){ return this.data; }
}

class El {
  constructor(tagName, doc){
    this.nodeType = 1;
    this.tagName = String(tagName).toUpperCase();
    this._doc = doc;
    this.attributes = new Map();
    this.childNodes = [];
    this.parentNode = null;
    this.style = {};
    this._listeners = new Map();
    this.value = '';
    this.disabled = false;
    // offsetWidth n'existe que pour les `void el.offsetWidth` qui forcent
    // un reflow avant de relancer une animation. Valeur sans importance.
    this.offsetWidth = 0;
  }

  /* ── attributs & propriétés reflétées ── */
  setAttribute(n, v){
    this.attributes.set(n, String(v));
    if(n === 'style') _parseStyle(String(v), this.style);
  }
  getAttribute(n){ return this.attributes.has(n) ? this.attributes.get(n) : null; }
  removeAttribute(n){ this.attributes.delete(n); }
  hasAttribute(n){ return this.attributes.has(n); }
  get id(){ return this.getAttribute('id') || ''; }
  set id(v){ this.setAttribute('id', v); }
  get className(){ return this.getAttribute('class') || ''; }
  set className(v){ this.setAttribute('class', v); }

  get classList(){
    const self = this;
    const list = () => (self.className.trim() ? self.className.trim().split(/\s+/) : []);
    const write = a => { self.className = a.join(' '); };
    return {
      add: (...c) => { const a = list(); c.forEach(x => { if(!a.includes(x)) a.push(x); }); write(a); },
      remove: (...c) => write(list().filter(x => !c.includes(x))),
      contains: c => list().includes(c),
      toggle: (c, force) => {
        const has = list().includes(c);
        const on = force === undefined ? !has : !!force;
        if(on && !has) write([...list(), c]);
        if(!on && has) write(list().filter(x => x !== c));
        return on;
      },
    };
  }

  /* ── arbre ── */
  appendChild(node){
    if(node.parentNode) node.parentNode.removeChild(node);
    node.parentNode = this;
    this.childNodes.push(node);
    return node;
  }
  removeChild(node){
    const i = this.childNodes.indexOf(node);
    if(i >= 0){ this.childNodes.splice(i, 1); node.parentNode = null; }
    return node;
  }
  remove(){ if(this.parentNode) this.parentNode.removeChild(this); }
  get children(){ return this.childNodes.filter(n => n.nodeType === 1); }
  get lastChild(){ return this.childNodes[this.childNodes.length - 1] || null; }
  get firstChild(){ return this.childNodes[0] || null; }

  get textContent(){ return this.childNodes.map(n => n.textContent).join(''); }
  set textContent(v){
    this.childNodes.forEach(n => { n.parentNode = null; });
    this.childNodes = [];
    if(v !== '' && v != null) this.appendChild(new TextNode(v));
  }

  get innerHTML(){ return this.childNodes.map(_serialize).join(''); }
  set innerHTML(html){
    this.childNodes.forEach(n => { n.parentNode = null; });
    this.childNodes = [];
    _parse(String(html), this, this._doc).forEach(n => this.appendChild(n));
  }

  /* ── sélecteurs : `.classe`, `#id`, `balise`, et les combinaisons
        séparées par une virgule. Pas de descendance, pas d'attribut —
        l'app n'en utilise pas dans les chemins testés ici. ── */
  matches(sel){
    return String(sel).split(',').some(one => {
      const s = one.trim();
      if(!s) return false;
      if(s[0] === '.') return this.classList.contains(s.slice(1));
      if(s[0] === '#') return this.id === s.slice(1);
      return this.tagName === s.toUpperCase();
    });
  }
  querySelectorAll(sel){
    const out = [];
    const walk = n => n.children.forEach(c => { if(c.matches(sel)) out.push(c); walk(c); });
    walk(this);
    return out;
  }
  querySelector(sel){ return this.querySelectorAll(sel)[0] || null; }

  /* ── événements ── */
  addEventListener(type, fn){
    if(!this._listeners.has(type)) this._listeners.set(type, []);
    this._listeners.get(type).push(fn);
  }
  removeEventListener(type, fn){
    const a = this._listeners.get(type);
    if(a) this._listeners.set(type, a.filter(f => f !== fn));
  }
  // Renvoie une promesse : les handlers de l'app sont `async`, et un test
  // qui n'attend pas leur résolution vérifierait un état intermédiaire.
  dispatchEvent(type, ev){
    const a = this._listeners.get(type) || [];
    const e = Object.assign({ type, target: this, preventDefault(){}, stopPropagation(){} }, ev || {});
    return Promise.all(a.map(fn => fn.call(this, e)));
  }
  click(){ return this.dispatchEvent('click'); }
  focus(){ this._doc.activeElement = this; return this.dispatchEvent('focus'); }
  blur(){ if(this._doc.activeElement === this) this._doc.activeElement = null; return this.dispatchEvent('blur'); }
}

function _parseStyle(css, target){
  css.split(';').forEach(d => {
    const i = d.indexOf(':');
    if(i < 0) return;
    const k = d.slice(0, i).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if(k) target[k] = d.slice(i + 1).trim();
  });
  return target;
}

function _serialize(n){
  if(n.nodeType === 3) return n.data;
  const attrs = [...n.attributes].map(([k, v]) => ` ${k}="${v}"`).join('');
  const tag = n.tagName.toLowerCase();
  if(VOID.has(tag)) return `<${tag}${attrs}>`;
  return `<${tag}${attrs}>${n.childNodes.map(_serialize).join('')}</${tag}>`;
}

const TAG_RE = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s">]+))?)*)\s*(\/?)>|([^<]+)/g;
const ATTR_RE = /([^\s=/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s">]+)))?/g;

function _parse(html, owner, doc){
  const root = { childNodes: [], _isRoot: true };
  const stack = [root];
  const top = () => stack[stack.length - 1];
  const push = n => top().childNodes.push(n);
  let m;
  TAG_RE.lastIndex = 0;
  while((m = TAG_RE.exec(html)) !== null){
    const [full, close, open, rawAttrs, selfClose, text] = m;
    if(full.startsWith('<!--')) continue;
    if(text !== undefined){
      if(text.trim()) push(new TextNode(text));
      continue;
    }
    if(close){
      // ferme le premier élément ouvert de ce nom ; un `</div>` orphelin
      // est ignoré plutôt que de dépiler la racine
      for(let i = stack.length - 1; i > 0; i--){
        if(stack[i].tagName === close.toUpperCase()){ stack.length = i; break; }
      }
      continue;
    }
    const el = new El(open, doc);
    ATTR_RE.lastIndex = 0;
    let a;
    while((a = ATTR_RE.exec(rawAttrs || '')) !== null){
      const val = a[2] !== undefined ? a[2] : a[3] !== undefined ? a[3] : a[4] !== undefined ? a[4] : '';
      el.setAttribute(a[1], val);
    }
    if(el.hasAttribute('value')) el.value = el.getAttribute('value');
    if(el.hasAttribute('disabled')) el.disabled = true;
    push(el);
    if(!VOID.has(open.toLowerCase()) && !selfClose) stack.push(el);
  }
  return root.childNodes;
}

/* ══════════════════════════════════════════════════════════
   INSTALLATION — remplace les stubs de _setup.js par ce DOM.
   Appeler `installDom()` dans un beforeEach ; `resetDom()` remet
   un body vide sans reconstruire les globals.
   ══════════════════════════════════════════════════════════ */

let _doc = null;

export function installDom(){
  const doc = {
    activeElement: null,
    createElement(tag){ return new El(tag, doc); },
    createTextNode(data){ return new TextNode(data); },
    getElementById(id){
      const walk = n => {
        for(const c of n.children){
          if(c.id === id) return c;
          const found = walk(c);
          if(found) return found;
        }
        return null;
      };
      return walk(doc.body);
    },
    querySelector(sel){ return doc.body.querySelector(sel); },
    querySelectorAll(sel){ return doc.body.querySelectorAll(sel); },
    addEventListener(){}, removeEventListener(){},
    documentElement: new El('html', null),
  };
  doc.body = new El('body', doc);
  doc.documentElement._doc = doc;
  globalThis.document = doc;
  _doc = doc;
  return doc;
}

export function resetDom(){
  if(!_doc) return installDom();
  _doc.body = new El('body', _doc);
  _doc.activeElement = null;
  return _doc;
}

/** Monte un fragment HTML dans le body et renvoie le conteneur. */
export function mount(html){
  const doc = _doc || installDom();
  const host = new El('div', doc);
  doc.body.appendChild(host);
  host.innerHTML = html;
  return host;
}

export { El, TextNode };
