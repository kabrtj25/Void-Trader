// ===== SPACE TRADER — konfigurace =====
const C = {
  // Svět
  CHUNK:        3000,
  VIEW_R:       5,
  SAFE_ZONE:    4000,

  // Let — pomalejší, realistické
  THRUST:       0.30,
  BRAKE_MULT:   0.80,
  DRAG:         0.980,
  MAX_SPD:      15,
  BOOST_SPD:    35,
  BOOST_THRUST: 0.50,
  ROT_SPD:      2.0,

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
  {name:'Potraviny',    base:12,  vol:1},
  {name:'Textil',       base:22,  vol:1},
  {name:'Elektronika',  base:85,  vol:2},
  {name:'Léčiva',       base:110, vol:1},
  {name:'Rudy',         base:35,  vol:3},
  {name:'Technologie',  base:180, vol:2},
  {name:'Zbraně',       base:320, vol:2},
  {name:'Biopalivo',    base:48,  vol:1},
];

const UPGRADES = [
  {id:'engine',  name:'Motor',           max:4, cost:800,  desc:'Rychlost +15%'},
  {id:'shield',  name:'Štít',            max:4, cost:1200, desc:'Štít +30'},
  {id:'hull',    name:'Pancéřování',     max:3, cost:1000, desc:'Max. HP +25'},
  {id:'cargo',   name:'Náklad',          max:4, cost:600,  desc:'Náklad +5'},
  {id:'weapons', name:'Zbraně',          max:3, cost:1500, desc:'DMG +10'},
  {id:'fuel',    name:'Nádrž',           max:3, cost:700,  desc:'Nádrž +25%'},
];

// Fixní stanice (garantované při spuštění)
// Poznámka: chunk (0,0) je vyhrazen pro Sluneční soustavu, Stanice Alfa přesunuta
const FIXED_STATIONS = [
  {cx:2,  cy:0,  name:'Stanice Alfa',      tier:3, color:'#ff9500'},
  {cx:3,  cy:1,  name:'Základna Beta',     tier:2, color:'#ff6a00'},
  {cx:-2, cy:3,  name:'Port Gamma',        tier:2, color:'#ffbb00'},
  {cx:4,  cy:-2, name:'Stanice Delta',     tier:1, color:'#ff8c00'},
  {cx:-3, cy:-2, name:'Věž Epsilon',       tier:2, color:'#ff7700'},
  {cx:2,  cy:5,  name:'Základna Zeta',     tier:3, color:'#ffaa00'},
  {cx:-5, cy:2,  name:'Port Eta',          tier:1, color:'#ff9500'},
  {cx:1,  cy:-4, name:'Stanice Theta',     tier:2, color:'#ffcc00'},
  {cx:6,  cy:-1, name:'Nexus Hub',         tier:2, color:'#ffaa00'},
  {cx:-1, cy:6,  name:'Frontier Post',     tier:1, color:'#ff8c00'},
  {cx:7,  cy:3,  name:'Colonia Bravo',     tier:2, color:'#ffcc00'},
  {cx:-6, cy:-4, name:'Deep Space Alpha',  tier:3, color:'#ff9500'},
  {cx:0,  cy:-5, name:'Polární Stanice',   tier:1, color:'#ffbb00'},
  {cx:8,  cy:-5, name:'Port Iota',         tier:2, color:'#ff7700'},
  {cx:-4, cy:7,  name:'Stanice Lambda',    tier:1, color:'#ff9500'},
  {cx:3,  cy:-7, name:'Kepler Station',    tier:3, color:'#ffaa00'},
  {cx:-7, cy:1,  name:'Outer Rim Post',    tier:1, color:'#ff8c00'},
  {cx:5,  cy:6,  name:'Meridian Hub',      tier:2, color:'#ffcc00'},
  // Speciální — Sluneční soustava je v SOLAR_CHUNK, stanice se generuje separátně
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
