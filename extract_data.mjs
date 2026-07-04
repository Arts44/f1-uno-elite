import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Static config (from script.js lines 4-57) ──
const CARD_TYPES = {
  blue:{id:'blue',label:'Blue',icon:'🔵',css:'tv-blue',foil:false,color:'#1a3a6b'},
  green:{id:'green',label:'Green',icon:'🟢',css:'tv-green',foil:false,color:'#0d4a1f'},
  red:{id:'red',label:'Red',icon:'🔴',css:'tv-red',foil:false,color:'#cc0000'},
  yellow:{id:'yellow',label:'Yellow',icon:'🟡',css:'tv-yellow',foil:false,color:'#ffd000'},
  blue_foil:{id:'blue_foil',label:'Blue Foil',icon:'✦',css:'tv-blue_foil',foil:true,color:'#2d6abf'},
  green_foil:{id:'green_foil',label:'Green Foil',icon:'✦',css:'tv-green_foil',foil:true,color:'#1a8c3a'},
  red_foil:{id:'red_foil',label:'Red Foil',icon:'✦',css:'tv-red_foil',foil:true,color:'#ff4d4d'},
  yellow_foil:{id:'yellow_foil',label:'Yellow Foil',icon:'✦',css:'tv-yellow_foil',foil:true,color:'#fff3b0'},
  blue_red_foil:{id:'blue_red_foil',label:'Blue and Red Foil',icon:'◈',css:'tv-blue_red_foil',foil:true,color:'#4a2080'},
  green_yellow_foil:{id:'green_yellow_foil',label:'Green and Yellow Foil',icon:'◈',css:'tv-green_yellow_foil',foil:true,color:'#3a6000'},
  wild_foil:{id:'wild_foil',label:'Wild Foil',icon:'🃏',css:'tv-wild_foil',foil:true,color:'#FF2D55'},
  nitro_foil:{id:'nitro_foil',label:'Nitro Foil',icon:'❋',css:'tv-nitro_foil',foil:true,color:'#7b2fbe'},
  promo_blue:{id:'promo_blue',label:'Promo Blue',icon:'★',css:'tv-promo-blue',foil:true,color:'#1a3a6b'},
  promo_green:{id:'promo_green',label:'Promo Green',icon:'★',css:'tv-promo-green',foil:true,color:'#0d4a1f'},
  promo_red:{id:'promo_red',label:'Promo Red',icon:'★',css:'tv-promo-red',foil:true,color:'#cc0000'},
  promo_yellow:{id:'promo_yellow',label:'Promo Yellow',icon:'★',css:'tv-promo-yellow',foil:true,color:'#ffd000'},
};

const TYPE_BADGE_RARITY = {blue:'common',green:'common',red:'common',yellow:'common',blue_foil:'rare',green_foil:'rare',red_foil:'rare',yellow_foil:'rare',blue_red_foil:'epic',green_yellow_foil:'epic',wild_foil:'legendary',nitro_foil:'mythic',promo_blue:'ultra',promo_green:'ultra',promo_red:'ultra',promo_yellow:'ultra'};
const RARITY_KEYS = ['common','rare','epic','legendary','mythic','ultra','cosmic','divine'];
const RARITY_ORDER = {common:0,rare:1,epic:2,legendary:3,mythic:4,ultra:5,cosmic:6,divine:7};
const RARITIES = {common:{label:'Commune',color:'#8E8E93',stars:1},rare:{label:'Rare',color:'#007AFF',stars:2},epic:{label:'Épique',color:'#AF52DE',stars:3},legendary:{label:'Légendaire',color:'#FF9500',stars:4},mythic:{label:'Mythique',color:'#34C759',stars:5},ultra:{label:'Ultra rare',color:'#FF2D55',stars:6},cosmic:{label:'Cosmique',color:'#7C3AED',stars:7},divine:{label:'Divin',color:'#FACC15',stars:8}};
const CATS = {pilote:{label:'Pilote',emoji:'🏎️'},reserve:{label:'Pilote de réserve',emoji:'🔧'},directeur:{label:'Directeur',emoji:'🎯'},gp:{label:'Grand Prix',emoji:'🏁'}};

const DRIVER_NUMBERS = {'Alex Albon':{n:23,cls:'dn-alb'},'Fernando Alonso':{n:14,cls:'dn-alo'},'Kimi Antonelli':{n:12,cls:'dn-ant'},'Oliver Bearman':{n:87,cls:'dn-bea'},'Gabriel Bortoleto':{n:5,cls:'dn-bor'},'Franco Colapinto':{n:43,cls:'dn-col'},'Jack Doohan':{n:61,cls:'dn-doo'},'Pierre Gasly':{n:10,cls:'dn-gas'},'Isack Hadjar':{n:6,cls:'dn-had'},'Lewis Hamilton':{n:44,cls:'dn-ham'},'Nico Hülkenberg':{n:27,cls:'dn-hul'},'Liam Lawson':{n:30,cls:'dn-law'},'Charles Leclerc':{n:16,cls:'dn-lec'},'Lando Norris':{n:4,cls:'dn-nor'},'Esteban Ocon':{n:31,cls:'dn-oco'},'Oscar Piastri':{n:81,cls:'dn-pia'},'George Russell':{n:63,cls:'dn-rus'},'Carlos Sainz':{n:55,cls:'dn-sai'},'Lance Stroll':{n:18,cls:'dn-str'},'Yuki Tsunoda':{n:22,cls:'dn-tsu'},'Max Verstappen':{n:1,cls:'dn-ver'}};

const TEAM_COLORS = {'Oracle Red Bull Racing':'#3671C6','Scuderia Ferrari HP':'#E8002D','McLaren F1':'#FF8000','Mercedes-AMG Petronas Formula One Team':'#27F4D2','Aston Martin Aramco Formula One Team':'#229971','BWT Alpine F1 Team':'#FF87BC','MoneyGram Haas F1 Team':'#B6BABD','Visa Cash App RB Formula One':'#6692FF','Atlassian Williams Racing':'#64C4FF','Stake F1 Team KICK Sauber':'#52E252'};

const TEAM_LOGOS = {'Oracle Red Bull Racing':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/team%20logos/red%20bull%20racing.png','Scuderia Ferrari HP':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/team%20logos/ferrari.png','McLaren F1':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/team%20logos/mclaren.png','Mercedes-AMG Petronas Formula One Team':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/team%20logos/mercedes.png','Aston Martin Aramco Formula One Team':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/team%20logos/aston%20martin.png','BWT Alpine F1 Team':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/team%20logos/alpine.png','MoneyGram Haas F1 Team':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/team%20logos/haas.png','Visa Cash App RB Formula One':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/team%20logos/rb.png','Atlassian Williams Racing':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/team%20logos/williams.png','Stake F1 Team KICK Sauber':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/team%20logos/kick%20sauber.png'};

const DRIVER_IMAGES = {'Alex Albon':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/driver-number-logos/23.svg','Fernando Alonso':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/driver-number-logos/14.svg','Kimi Antonelli':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/driver-number-logos/12.svg','Oliver Bearman':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/driver-number-logos/87.svg','Gabriel Bortoleto':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/driver-number-logos/5.svg','Franco Colapinto':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/driver-number-logos/43.svg','Jack Doohan':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/driver-number-logos/61.svg','Pierre Gasly':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/driver-number-logos/10.svg','Isack Hadjar':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/driver-number-logos/6.svg','Lewis Hamilton':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/driver-number-logos/44.svg','Nico Hülkenberg':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/driver-number-logos/27.svg','Liam Lawson':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/driver-number-logos/30.svg','Charles Leclerc':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/driver-number-logos/16.svg','Lando Norris':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/driver-number-logos/4.svg','Esteban Ocon':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/driver-number-logos/31.svg','Oscar Piastri':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/driver-number-logos/81.svg','George Russell':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/driver-number-logos/63.svg','Carlos Sainz':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/driver-number-logos/55.svg','Lance Stroll':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/driver-number-logos/18.svg','Yuki Tsunoda':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/driver-number-logos/22.svg','Max Verstappen':'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/driver-number-logos/1.svg'};

const TEAM_LOGO_BG = {'Oracle Red Bull Racing':'#1A1A2E','Scuderia Ferrari HP':'#5C0A0A','McLaren F1':'#2B1A00','Mercedes-AMG Petronas Formula One Team':'#0A1A1A','Aston Martin Aramco Formula One Team':'#0A2E1A','BWT Alpine F1 Team':'#2E0A2E','MoneyGram Haas F1 Team':'#1A1A1A','Visa Cash App RB Formula One':'#0A0A2E','Atlassian Williams Racing':'#0A1A2E','Stake F1 Team KICK Sauber':'#0A2E0A'};

const TEAM_LOGO_NOEFFECTS = new Set(['MoneyGram Haas F1 Team','Stake F1 Team KICK Sauber']);

const ROLE_BASE_RARITY = {pilote:'legendary',reserve:'epic',directeur:'epic',gp:'legendary'};

// ── CARDS_DB raw (before normalizeTypes) ──
// Read from script.js and parse
import { readFileSync } from 'fs';
const src = readFileSync(join(__dirname, 'script.js'), 'utf8');

// Extract CARDS_DB array using regex
const match = src.match(/const CARDS_DB = \[([\s\S]*?)\n\];/);
if(!match) { console.error('Could not find CARDS_DB'); process.exit(1); }

// We need to eval the array. Create a safe eval context.
const cardsStr = `[${match[1]}]`;
let CARDS_DB;
try {
  CARDS_DB = eval(cardsStr);
} catch(e) {
  console.error('Eval CARDS_DB error:', e.message);
  process.exit(1);
}

// ── Apply normalizeTypes logic ──
const isPerson = c => c.category==='pilote' || c.category==='reserve' || c.category==='directeur';

CARDS_DB.forEach(c => {
  if(!c.types.includes('blue')) c.types.unshift('blue');
  if(!c.types.includes('green')) c.types.push('green');
  if(!c.types.includes('red')) c.types.push('red');
  if(!c.types.includes('yellow')) c.types.push('yellow');
  c.types = c.types.filter(t => t !== 'nitro_foil' && t !== 'promo');
  if(c.category === 'gp') {
    c.types = c.types.filter(t => !(CARD_TYPES[t] && CARD_TYPES[t].foil));
  }
  if(isPerson(c) && parseInt(c.id, 10) <= 78) {
    ['blue_foil','green_foil','red_foil','yellow_foil','blue_red_foil','green_yellow_foil','wild_foil'].forEach(t => {
      if(!c.types.includes(t)) c.types.push(t);
    });
  }
});

const byName = {};
CARDS_DB.forEach(c => {
  if(c.category === 'pilote') {
    (byName[c.name] ||= []).push(c);
  }
});
Object.values(byName).forEach(cards => {
  if(cards.length === 3) {
    cards.sort((a,b) => a.id.localeCompare(b.id));
    cards.slice(0,2).forEach(c => {
      if(!c.types.includes('nitro_foil')) c.types.push('nitro_foil');
    });
  }
});

CARDS_DB.forEach(c => {
  if(c.id === '010' || c.id === '057') {
    ['promo_blue','promo_green','promo_red','promo_yellow'].forEach(t => {
      if(!c.types.includes(t)) c.types.push(t);
    });
  }
});

// ── Build cards-2025.json ──
const cards2025 = CARDS_DB.map(c => ({
  id: c.id,
  season: 2025,
  number: parseInt(c.id, 10),
  name: c.name,
  team: c.team || '',
  category: c.category,
  nationality: c.nationality || '',
  champion: c.champion || false,
  championYears: c.championYears || [],
  description: c.description || '',
  tags: c.tags || [],
  types: c.types,
  retired: false
}));

// ── Extract CIRCUIT_SVGS ──
const circuitMatch = src.match(/const CIRCUIT_SVGS = \{([\s\S]*?)\n\};/);
if(!circuitMatch) { console.error('Could not find CIRCUIT_SVGS'); process.exit(1); }
const circuitStr = `({${circuitMatch[1]}})`;
let CIRCUIT_SVGS;
try {
  CIRCUIT_SVGS = eval(circuitStr);
} catch(e) {
  console.error('Eval CIRCUIT_SVGS error:', e.message);
  process.exit(1);
}

const circuits = {};
for(const [id, data] of Object.entries(CIRCUIT_SVGS)) {
  circuits[id] = { path: data.p, drs: data.d || [] };
}

// ── Build metadata.json ──
const metadata = {
  cardTypes: CARD_TYPES,
  typeBadgeRarity: TYPE_BADGE_RARITY,
  rarityKeys: RARITY_KEYS,
  rarityOrder: RARITY_ORDER,
  rarities: RARITIES,
  categories: CATS,
  driverNumbers: DRIVER_NUMBERS,
  teamColors: TEAM_COLORS,
  teamLogos: TEAM_LOGOS,
  driverImages: DRIVER_IMAGES,
  teamLogoBg: TEAM_LOGO_BG,
  teamLogoNoeffects: [...TEAM_LOGO_NOEFFECTS],
  roleBaseRarity: ROLE_BASE_RARITY
};

// ── Write files ──
const dataDir = join(__dirname, 'data');
if(!existsSync(dataDir)) mkdirSync(dataDir);

writeFileSync(join(dataDir, 'cards-2025.json'), JSON.stringify(cards2025, null, 2), 'utf8');
console.log(`✓ cards-2025.json: ${cards2025.length} cards`);

writeFileSync(join(dataDir, 'circuits.json'), JSON.stringify(circuits, null, 2), 'utf8');
console.log(`✓ circuits.json: ${Object.keys(circuits).length} circuits`);

writeFileSync(join(dataDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf8');
console.log(`✓ metadata.json: static config`);

console.log('Extraction complete!');
