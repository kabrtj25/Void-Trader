// ===== SPACE TRADER — konfigurace =====
const C = {
  // Svět
  CHUNK:        3000,
  VIEW_R:       5,
  SAFE_ZONE:    4000,

  // Let — tryskový pohon s bočními tryskami
  THRUST:           0.32,
  SIDE_THRUST:      0.20,
  BRAKE_MULT:       0.80,
  DRAG:             0.984,
  DRAG_BOOST:       0.9985,
  DRAG_WARP:        0.997,
  MAX_SPD:          28,
  BOOST_THRUST:     0.90,
  WARP_THRUST:      3.0,
  WARP_SPEED_KMS:   90000000,  // 90 mil. km/s = 0.3c — prah aktivace warpu
  ROT_SPD:          2.0,
  SPEED_KMS_FACTOR: 150000,    // 1 herní jednotka = 150 000 km (1 AU = 1000 j. = 150 mil. km)

  // Palivo
  FUEL_MAX:     100,
  FUEL_THRUST:  0.03,
  FUEL_BOOST:   0.12,
  FUEL_IDLE:    0.0005,

  // Přistání
  DOCK_DIST:    120,
  DOCK_SPD:     5,
  DOCK_ANGLE:   28,

  // Boj
  BULLET_SPD:   14,
  BULLET_DMG:   20,
  SHOOT_CD:     0.28,
  ENEMY_HP:     60,
  ENEMY_DMG:    10,
  ENEMY_REWARD: 400,

  // Stanice ceny
  FUEL_PRICE:   3,
  HULL_PRICE:   8,
  SHIELD_PRICE: 5,

  // Ostatní
  SAVE_KEY:     'spacetradersave_v2',
  MINIMAP_R:    2200,
  SOLAR_CHUNK:  {cx:0, cy:0},    // chunk s naší soustavou — hráč startuje uvnitř
};

const GOODS = [
  {name:'Potraviny',   base:12,  vol:1, icon:'🌾', desc:'Základní potraviny a zásoby. Stabilní poptávka na každé stanici ve vesmíru.'},
  {name:'Textil',      base:22,  vol:1, icon:'🧵', desc:'Průmyslové i luxusní tkaniny. Vhodné jako doplňkový náklad na kratší trasy.'},
  {name:'Elektronika', base:85,  vol:2, icon:'💾', desc:'Výpočetní čipy a výkonné moduly. Vysoká hodnota, nestálé tržní ceny.'},
  {name:'Léčiva',      base:110, vol:1, icon:'💊', desc:'Syntetické léčivé přípravky. Vždy žádané v odlehlých a pohraničních sektorech.'},
  {name:'Rudy',        base:35,  vol:3, icon:'⛏',  desc:'Těžená surová ruda z asteroidů. Nízká cena za kus, velký objem.'},
  {name:'Technologie', base:180, vol:2, icon:'⚙',  desc:'Pokročilé strojní díly a kybernetické systémy. Špičková obchodní marže.'},
  {name:'Zbraně',      base:320, vol:2, icon:'🔫', desc:'Regulované vojenské vybavení. Velmi výnosné — vysoké riziko přepravy.'},
  {name:'Biopalivo',   base:48,  vol:1, icon:'⚗',  desc:'Organická paliva a reaktanty. Stabilní cena, vysoká obchodní rotace.'},
];

const UPGRADES = [
  {id:'engine',  name:'Motor',           max:4, cost:800,  desc:'Rychlost +15%'},
  {id:'shield',  name:'Štít',            max:4, cost:1200, desc:'Štít +30'},
  {id:'hull',    name:'Pancéřování',     max:3, cost:1000, desc:'Max. HP +25'},
  {id:'cargo',   name:'Náklad',          max:4, cost:600,  desc:'Náklad +5'},
  {id:'weapons', name:'Zbraně',          max:3, cost:1500, desc:'DMG +10'},
  {id:'fuel',    name:'Nádrž',           max:3, cost:700,  desc:'Nádrž +25%'},
];

// ===== Velké Coriolis stanice (Elite Dangerous styl) — daleko od středu =====
const LARGE_STATIONS = [
  {cx:13,  cy:4,   name:'Port Leviathan',      tier:3, color:'#00d4ff'},
  {cx:-12, cy:14,  name:'Nexus Colossus',       tier:3, color:'#aa44ff'},
  {cx:18,  cy:-11, name:'Titan Gate',            tier:3, color:'#ff5533'},
  {cx:-16, cy:-13, name:'Void Fortress',         tier:3, color:'#00ff88'},
  {cx:7,   cy:17,  name:'Citadel Behemoth',      tier:3, color:'#ffaa00'},
  {cx:-22, cy:8,   name:'Omega Station Alpha',   tier:3, color:'#ff6622'},
  {cx:15,  cy:-18, name:'Deep Forge Prime',      tier:3, color:'#8844ff'},
  {cx:-8,  cy:-21, name:'Abyss Colossus',        tier:3, color:'#ff2244'},
];

// Fixní stanice rovnoměrně rozložené po celé mapě
const FIXED_STATIONS = [
  // Vnitřní oblast (1-4 chunky od středu)
  {cx:2,  cy:0,  name:'Stanice Alfa',       tier:3, color:'#ff9500'},
  {cx:3,  cy:1,  name:'Základna Beta',      tier:2, color:'#ff6a00'},
  {cx:-2, cy:3,  name:'Port Gamma',         tier:2, color:'#ffbb00'},
  {cx:4,  cy:-2, name:'Stanice Delta',      tier:1, color:'#ff8c00'},
  {cx:-3, cy:-2, name:'Věž Epsilon',        tier:2, color:'#ff7700'},
  {cx:-1, cy:2,  name:'Orbit Outpost',      tier:1, color:'#ff9500'},
  {cx:1,  cy:-2, name:'Helion Base',        tier:1, color:'#ffaa00'},
  {cx:-2, cy:-4, name:'Voidreach Post',     tier:2, color:'#ffcc00'},
  {cx:4,  cy:3,  name:'Stellar Junction',   tier:2, color:'#ff9500'},
  {cx:-4, cy:-1, name:'Darkside Hub',       tier:1, color:'#ff8c00'},
  {cx:0,  cy:3,  name:'Apex Station',       tier:2, color:'#ffbb00'},
  // Střední oblast (5-7 chunků)
  {cx:2,  cy:5,  name:'Základna Zeta',      tier:3, color:'#ffaa00'},
  {cx:-5, cy:2,  name:'Port Eta',           tier:1, color:'#ff9500'},
  {cx:1,  cy:-4, name:'Stanice Theta',      tier:2, color:'#ffcc00'},
  {cx:6,  cy:-1, name:'Nexus Hub',          tier:2, color:'#ffaa00'},
  {cx:-1, cy:6,  name:'Frontier Post',      tier:1, color:'#ff8c00'},
  {cx:7,  cy:3,  name:'Colonia Bravo',      tier:2, color:'#ffcc00'},
  {cx:-6, cy:-4, name:'Deep Space Alpha',   tier:3, color:'#ff9500'},
  {cx:0,  cy:-5, name:'Polární Stanice',    tier:1, color:'#ffbb00'},
  {cx:6,  cy:0,  name:'Rimward Post',       tier:1, color:'#ff9500'},
  {cx:-5, cy:4,  name:'Nebula Drift',       tier:1, color:'#ff9500'},
  {cx:2,  cy:-5, name:'Binary Station',     tier:2, color:'#ffcc00'},
  {cx:-3, cy:5,  name:'Crescent Station',   tier:2, color:'#ffbb00'},
  // Vnější oblast (8-11 chunků)
  {cx:8,  cy:-5, name:'Port Iota',          tier:2, color:'#ff7700'},
  {cx:-4, cy:7,  name:'Stanice Lambda',     tier:1, color:'#ff9500'},
  {cx:3,  cy:-7, name:'Kepler Station',     tier:3, color:'#ffaa00'},
  {cx:-7, cy:1,  name:'Outer Rim Post',     tier:1, color:'#ff8c00'},
  {cx:5,  cy:6,  name:'Meridian Hub',       tier:2, color:'#ffcc00'},
  {cx:9,  cy:2,  name:'Far Reach Hub',      tier:1, color:'#ff9500'},
  {cx:-8, cy:-1, name:'Void Gate Alpha',    tier:2, color:'#ff9500'},
  {cx:4,  cy:-8, name:'Nova Outpost',       tier:1, color:'#ff8c00'},
  {cx:10, cy:-3, name:'Edge Station',       tier:1, color:'#ff9500'},
  {cx:-9, cy:3,  name:'Horizon Post',       tier:1, color:'#ff9500'},
  {cx:6,  cy:7,  name:'Outer Reach Station',tier:2, color:'#ffcc00'},
  {cx:8,  cy:-8, name:'Deep Space Beta',    tier:2, color:'#ff9500'},
  {cx:-6, cy:6,  name:'Frontier Alpha',     tier:1, color:'#ff8c00'},
  {cx:11, cy:5,  name:'Outer Rim Gamma',    tier:1, color:'#ff9500'},
  {cx:-10,cy:-5, name:'Abyss Station',      tier:2, color:'#ffaa00'},
  {cx:7,  cy:-6, name:'Crossroads Hub',     tier:2, color:'#ff9500'},
  {cx:-7, cy:8,  name:'Polar Reach',        tier:1, color:'#ffbb00'},
  // Speciální — Sluneční soustava je v SOLAR_CHUNK, stanice se generuje separátně
];

// ===== 5 Galaxií — warp destinace =====
const GALAXIES = [
  {id:'sol',      name:'Sluneční soustava', desc:'Naše rodná hvězdná soustava. Devět planet, bezpočet stanic.',
   mapX:0,   mapY:0,    color:'#ffee88', glow:'rgba(255,238,136,', fuelCost:0,   intReq:0,  lightYears:0,   warpSecs:0},
  {id:'aethon',   name:'Aethon Prime',      desc:'Vzdálená soustava s modrou obří hvězdou. Vyspělá technologie a hustá obchodní síť.',
   mapX:300, mapY:-130, color:'#88aaff', glow:'rgba(136,170,255,', fuelCost:55,  intReq:55, lightYears:4.2, warpSecs:12},
  {id:'veridia',  name:'Mlhovina Veridia',  desc:'Hustá zelená mlhovina obklopující prastará slunce. Bohatá na vzácné biominery.',
   mapX:-280,mapY:200,  color:'#66ffbb', glow:'rgba(102,255,187,', fuelCost:85,  intReq:50, lightYears:6.8, warpSecs:16},
  {id:'krynn',    name:'Krynn Nexus',       desc:'Rudý systém s červenou trpasličí hvězdou. Nebezpečný, ale výnosný obchod.',
   mapX:60,  mapY:310,  color:'#ff8844', glow:'rgba(255,136,68,',  fuelCost:40,  intReq:65, lightYears:3.1, warpSecs:10},
  {id:'voidreach',name:'Void Reach',        desc:'Záhyb temného prostoru na hranici poznatelného vesmíru. Přežití není zaručeno.',
   mapX:-220,mapY:-260, color:'#cc88ff', glow:'rgba(204,136,255,', fuelCost:90,  intReq:35, lightYears:9.4, warpSecs:20},
];

const XP_TABLE = [0,100,250,450,700,1000,1400,1900,2500,3200,4500];
function xpNeeded(lvl){return XP_TABLE[Math.min(lvl,XP_TABLE.length-1)]||XP_TABLE[XP_TABLE.length-1]+(lvl-XP_TABLE.length+1)*2000;}

// Utility
function makeRng(seed){
  let s=seed>>>0;
  return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296;};
}
function chunkKey(cx,cy){return`${cx},${cy}`;}
function chunkSeed(cx,cy){return Math.abs((cx*73856093)^(cy*19349663))>>>0;}
function rnd(a,b){return Math.random()*(b-a)+a;}
function rndInt(a,b){return Math.floor(rnd(a,b+1));}
function rndItem(arr){return arr[Math.floor(Math.random()*arr.length)];}
function dist2(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}
function angleDiff(a,b){let d=((a-b)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI;return d;}
