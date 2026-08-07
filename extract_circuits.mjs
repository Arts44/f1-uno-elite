/* ══════════════════════════════════════════════════════════
   EXTRACT CIRCUITS — GPS → chemins SVG (outil de dev, hors bundle).

   Les 23 tracés de data/circuits.json étaient dessinés à main
   levée : plusieurs ne ressemblaient pas au circuit réel (Suzuka
   n'était même pas un huit fermé). Ce script les régénère depuis
   des relevés GPS réels, ce qui rend la géométrie vérifiable et
   la correction reproductible.

   Source : github.com/bacinger/f1-circuits (f1-circuits.geojson,
   licence MIT, © 2019-2025 Tomislav Bacinger). Données non
   officielles, sans lien avec Formula One Licensing B.V.
   Le fichier n'est PAS embarqué : il sert au build, l'app ne
   dépend de rien à l'exécution (règle dure n°1).

   Usage :
     node extract_circuits.mjs <chemin/vers/f1-circuits.geojson>

   Écrit data/circuits.json (les zones DRS existantes sont
   préservées) puis met data-embedded.js en parité.
   ══════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/* Carte GP (id de carte) → circuit du jeu de données. Faite à la
   main : les noms ne se correspondent pas (« Belgian GP » vs
   « Circuit de Spa-Francorchamps »), et plusieurs pays ont
   plusieurs circuits dans le fichier (it-1922 Monza vs it-1953
   Imola, us-2012 Austin vs us-2022 Miami vs us-2023 Las Vegas). */
const MAP = {
  '079': 'au-1953', // Albert Park
  '080': 'cn-2004', // Shanghai
  '081': 'jp-1962', // Suzuka
  '082': 'bh-2002', // Sakhir
  '083': 'sa-2021', // Djeddah
  '084': 'us-2022', // Miami
  '085': 'it-1953', // Imola
  '086': 'mc-1929', // Monaco
  '087': 'es-1991', // Barcelone-Catalogne
  '088': 'ca-1978', // Gilles-Villeneuve
  '089': 'at-1969', // Red Bull Ring
  '090': 'gb-1948', // Silverstone
  '091': 'be-1925', // Spa-Francorchamps
  '092': 'hu-1986', // Hungaroring
  '093': 'nl-1948', // Zandvoort
  '094': 'it-1922', // Monza
  '095': 'az-2016', // Bakou
  '096': 'sg-2008', // Marina Bay
  '097': 'us-2012', // COTA
  '098': 'br-1940', // Interlagos
  '099': 'us-2023', // Las Vegas
  '100': 'qa-2004', // Losail
  '101': 'ae-2009', // Yas Marina
};

const BOX = 500;      // viewBox de circuitSVG() dans render.js
const MARGIN = 22;    // > moitié du stroke-width (8) : aucun bord rogné
const TOLERANCE = 1.1; // simplification, en unités du viewBox

/* ── Projection ──
   Équirectangulaire recentrée, avec correction du cosinus de la
   latitude : sans elle, un circuit à 57° (Silverstone) serait
   étiré horizontalement de près du double. */
function project(coords){
  const latMean = coords.reduce((s, c) => s + c[1], 0) / coords.length;
  const k = Math.cos(latMean * Math.PI / 180);
  return coords.map(([lon, lat]) => [lon * k, -lat]); // -lat : le nord vers le haut
}

/* ── Ramer-Douglas-Peucker ──
   Le relevé brut compte 80 à 200 points ; à 500 px de large, un
   écart d'un pixel est invisible sous un trait de 8. On coupe ce
   qui ne se voit pas, le fichier reste petit. */
function rdp(pts, eps){
  if(pts.length < 3) return pts;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  const dx = bx - ax, dy = by - ay;
  const norm = Math.hypot(dx, dy) || 1;
  let maxD = -1, idx = 0;
  for(let i = 1; i < pts.length - 1; i++){
    const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / norm;
    if(d > maxD){ maxD = d; idx = i; }
  }
  if(maxD <= eps) return [pts[0], pts[pts.length - 1]];
  return [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)];
}

/* ── Mise à l'échelle dans le viewBox, ratio préservé ── */
function fit(pts){
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const span = BOX - 2 * MARGIN;
  const s = Math.min(span / (maxX - minX), span / (maxY - minY));
  const ox = MARGIN + (span - (maxX - minX) * s) / 2;
  const oy = MARGIN + (span - (maxY - minY) * s) / 2;
  return pts.map(([x, y]) => [ox + (x - minX) * s, oy + (y - minY) * s]);
}

/* ── Polyligne fermée → courbes de Bézier (Catmull-Rom) ──
   Le style existant est fait de courbes, pas de segments : un
   tracé en `L` jurerait au milieu des autres cartes. Catmull-Rom
   passe par tous les points, donc lisser ne déforme pas. */
const r = n => Math.round(n * 100) / 100;
/* Dans une épingle serrée, le point de contrôle Catmull-Rom déborde
   du cadre (jusqu'à +39 sur Miami) et le viewBox rognerait la courbe.
   La courbe restant dans l'enveloppe convexe de ses points, borner
   les contrôles borne le tracé. */
const clamp = n => Math.min(BOX - 6, Math.max(6, n));
function toPath(pts){
  const n = pts.length;
  const at = i => pts[(i % n + n) % n];
  let d = `M${r(pts[0][0])} ${r(pts[0][1])}`;
  for(let i = 0; i < n; i++){
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1 = [clamp(p1[0] + (p2[0] - p0[0]) / 6), clamp(p1[1] + (p2[1] - p0[1]) / 6)];
    const c2 = [clamp(p2[0] - (p3[0] - p1[0]) / 6), clamp(p2[1] - (p3[1] - p1[1]) / 6)];
    d += `C${r(c1[0])} ${r(c1[1])} ${r(c2[0])} ${r(c2[1])} ${r(p2[0])} ${r(p2[1])}`;
  }
  return d + 'Z';
}

/* ── Programme ── */
const src = process.argv[2];
if(!src){
  console.error('usage: node extract_circuits.mjs <f1-circuits.geojson>');
  process.exit(1);
}
const geo = JSON.parse(readFileSync(src, 'utf8'));
const byId = new Map(geo.features.map(f => [f.properties.id, f]));

const out = join(__dirname, 'data', 'circuits.json');
const current = JSON.parse(readFileSync(out, 'utf8'));
const next = {};
const report = [];

for(const [card, circuitId] of Object.entries(MAP)){
  const f = byId.get(circuitId);
  if(!f) throw new Error(`circuit absent du jeu de données : ${circuitId} (carte ${card})`);
  let coords = f.geometry.coordinates;
  // Le relevé répète souvent le premier point à la fin : le doublon
  // créerait une boucle de longueur nulle dans le lissage.
  const [f0, l0] = [coords[0], coords[coords.length - 1]];
  if(Math.abs(f0[0] - l0[0]) < 1e-9 && Math.abs(f0[1] - l0[1]) < 1e-9) coords = coords.slice(0, -1);

  const pts = fit(project(coords));
  const simple = rdp(pts, TOLERANCE);
  // rdp ne touche jamais aux extrémités : sur une boucle il laisse
  // parfois deux points confondus au raccord.
  const clean = simple.filter((p, i) => i === 0 || Math.hypot(p[0] - simple[i - 1][0], p[1] - simple[i - 1][1]) > 0.5);
  const path = toPath(clean);

  next[card] = { path, drs: (current[card] && current[card].drs) || [] };
  report.push({ card, circuitId, name: f.properties.Name, pts: coords.length, kept: clean.length, chars: path.length });
}

writeFileSync(out, JSON.stringify(next, null, 0) + '\n');

/* ── Parité de data-embedded.js (repli hors-ligne, testé) ── */
const embPath = join(__dirname, 'data-embedded.js');
const emb = readFileSync(embPath, 'utf8');
const line = /^(\s*circuits:\s*)(\{.*\})(,?)\s*$/m;
if(!line.test(emb)) throw new Error('ligne « circuits: » introuvable dans data-embedded.js');
writeFileSync(embPath, emb.replace(line, (_, head, __, tail) => head + JSON.stringify(next) + tail));

console.table(report);
console.log(`\n${report.length} tracés régénérés → data/circuits.json + data-embedded.js`);
