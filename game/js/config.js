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
  {id:'engine',  name:'Motor',           max:4, cost:200000,  desc:'Rychlost +15%'},
  {id:'shield',  name:'Štít',            max:4, cost:300000,  desc:'Štít +30'},
  {id:'hull',    name:'Pancéřování',     max:3, cost:250000,  desc:'Max. HP +25'},
  {id:'cargo',   name:'Náklad',          max:4, cost:150000,  desc:'Náklad +5'},
  {id:'weapons', name:'Zbraně',          max:3, cost:400000,  desc:'DMG +10'},
  {id:'fuel',    name:'Nádrž',           max:3, cost:175000,  desc:'Nádrž +25%'},
];

const CONTRACT_CARGO = [
  {name:'Zásilka elektroniky',  icon:'💾', base:800,  danger:0},
  {name:'Lékařský náklad',      icon:'💊', base:650,  danger:0},
  {name:'Vojenský materiál',    icon:'🔫', base:1300, danger:2},
  {name:'Humanitární pomoc',    icon:'🌾', base:450,  danger:0},
  {name:'Průmyslové díly',      icon:'⚙',  base:750,  danger:0},
  {name:'Vzácné minerály',      icon:'💎', base:1600, danger:1},
  {name:'Chemikálie',           icon:'⚗',  base:950,  danger:1},
  {name:'Diplomatická pošta',   icon:'📫', base:1100, danger:0},
  {name:'Biologické vzorky',    icon:'🧪', base:1050, danger:1},
  {name:'Luxusní zboží',        icon:'🏺', base:1800, danger:0},
  {name:'Zbraňové součástky',   icon:'🔩', base:1400, danger:2},
  {name:'Tajná zásilka',        icon:'📦', base:2100, danger:3},
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

// ===== LODĚ — katalog (20 lodí) =====
const SHIPS = [
  // TIER 1 — Startovní
  {id:'viper',         name:'Viper Mk.I',        icon:'🚀', desc:'Základní loď Federace. Vyvážené vlastnosti, ideální pro nováčky.',
   hullMult:1.0, shieldMult:1.0, cargoBase:10, speedMult:1.0,  cost:0,        color:'#99bbff', thruster:'#ff7700', scale:1.0},
  {id:'sidewinder',    name:'Sidewinder',         icon:'▽',  desc:'Malý levný stíhač. Čistý trojúhelníkový design, skvělý pro začátek.',
   hullMult:0.8, shieldMult:0.9, cargoBase:8,  speedMult:1.1,  cost:40000,    color:'#ccddee', thruster:'#ffaa44', scale:0.85},
  {id:'hauler',        name:'Lakon Type-6',       icon:'📦', desc:'Robustní nákladní plavidlo. Nízká rychlost, obrovský nákladový prostor.',
   hullMult:1.2, shieldMult:0.8, cargoBase:22, speedMult:0.78, cost:180000,   color:'#cc9955', thruster:'#ffaa00', scale:1.15},
  {id:'scout',         name:'Scout Mk.II',        icon:'⚡', desc:'Lehký průzkumník. Extrémně rychlý a manévrovatelný, ale křehký.',
   hullMult:0.7, shieldMult:1.2, cargoBase:6,  speedMult:1.42, cost:120000,   color:'#55ffaa', thruster:'#00ffcc', scale:0.82},
  // TIER 2 — Střední třída
  {id:'cobra',         name:'Cobra Mk.III',       icon:'🐍', desc:'Legendární loď — výborná rovnováha útoku, obrany i obchodu. Favorit pilotů.',
   hullMult:1.3, shieldMult:1.3, cargoBase:14, speedMult:1.15, cost:450000,   color:'#ff7722', thruster:'#ff4400', scale:1.05},
  {id:'eagle',         name:'Imperial Eagle',     icon:'🦅', desc:'Bojový stroj Impéria. Čistá delta konfigurace. Vysoká manévrovatelnost.',
   hullMult:0.9, shieldMult:1.6, cargoBase:8,  speedMult:1.32, cost:320000,   color:'#ffdd00', thruster:'#ffaa00', scale:0.9},
  {id:'diamondback',   name:'Diamondback Scout',  icon:'💠', desc:'Průzkumný stíhač s hranatým diamantovým trupem. Odolný v každém terénu.',
   hullMult:1.1, shieldMult:1.1, cargoBase:10, speedMult:1.2,  cost:380000,   color:'#44aaff', thruster:'#0066ff', scale:0.95},
  {id:'vulture',       name:'Vulture',            icon:'🔱', desc:'Dvouboomový útočník. Mezera mezi boomy dodává charakteristický profil.',
   hullMult:1.0, shieldMult:1.4, cargoBase:9,  speedMult:1.25, cost:500000,   color:'#ff4488', thruster:'#ff0066', scale:0.92},
  // TIER 3 — Pokročilé
  {id:'krait',         name:'Krait Mk.II',        icon:'🔥', desc:'Kompaktní dělový křižník se širokým nosem. Silný štít, devastující palba.',
   hullMult:1.4, shieldMult:1.8, cargoBase:12, speedMult:1.12, cost:700000,   color:'#ff6600', thruster:'#ff3300', scale:1.08},
  {id:'python',        name:'Python',             icon:'🌀', desc:'Oválné všestranné plavidlo střední třídy. Silné, spolehlivé, prověřené.',
   hullMult:1.5, shieldMult:1.4, cargoBase:16, speedMult:1.05, cost:650000,   color:'#aa55ff', thruster:'#8833ff', scale:1.1},
  {id:'mamba',         name:'Mamba',              icon:'⚔',  desc:'Ultra-rychlý závodní stíhač. Obrovská delta křídla, minimální odpor.',
   hullMult:0.95,shieldMult:1.3, cargoBase:8,  speedMult:1.55, cost:600000,   color:'#ff2255', thruster:'#cc0033', scale:0.88},
  {id:'falcon',        name:'Falcon Mk.IV',       icon:'🎯', desc:'Těžký čtyřboomový X-stíhač pro zkušené piloty. Devastující štíty.',
   hullMult:1.2, shieldMult:2.0, cargoBase:10, speedMult:1.38, cost:750000,   color:'#ff3366', thruster:'#ff0044', scale:0.95},
  // TIER 4 — Elitní
  {id:'asp',           name:'ASP Explorer',       icon:'✦',  desc:'X-wing průzkumník. Čtyři motorové gondoly, skvělý dosah a výdrž.',
   hullMult:1.3, shieldMult:1.2, cargoBase:18, speedMult:1.18, cost:850000,   color:'#55ddff', thruster:'#00aaee', scale:1.05},
  {id:'clipper',       name:'Imperial Clipper',   icon:'💎', desc:'Prémiová loď Impéria. Elegantně zametená křídla, rychlost a smrtonosnost.',
   hullMult:1.4, shieldMult:1.5, cargoBase:18, speedMult:1.28, cost:900000,   color:'#44ddff', thruster:'#0088ff', scale:1.08},
  {id:'fer_de_lance',  name:'Fer-de-Lance',       icon:'🏆', desc:'Luxusní bojový křižník ve tvaru kapky. Symbol bohatství a síly.',
   hullMult:1.35,shieldMult:1.7, cargoBase:14, speedMult:1.35, cost:980000,   color:'#ffcc44', thruster:'#ff9900', scale:1.0},
  {id:'type7',         name:'Type-7 Transport',   icon:'🚛', desc:'Masivní boxy nákladní transportér. Ideální pro obchodní trasy.',
   hullMult:1.8, shieldMult:0.9, cargoBase:34, speedMult:0.62, cost:1200000,  color:'#ff9900', thruster:'#ff6600', scale:1.28},
  // TIER 5 — Dreadnought
  {id:'imperial_cutter',name:'Imperial Cutter',  icon:'👑', desc:'Diamantová bitevní loď Impéria. Čtyři sekundární motory, ovládá prostor.',
   hullMult:1.9, shieldMult:1.8, cargoBase:22, speedMult:0.95, cost:1100000,  color:'#eebb00', thruster:'#ffdd00', scale:1.2},
  {id:'anaconda',      name:'Anaconda',           icon:'🏗',  desc:'Mamutí T-tvar Zahn Corp. Dominanta vesmíru. Enormní HP a nákladový prostor.',
   hullMult:2.2, shieldMult:1.6, cargoBase:30, speedMult:0.68, cost:1500000,  color:'#ff4444', thruster:'#cc0000', scale:1.35},
  {id:'type9',         name:'Type-9 Heavy',       icon:'🐋', desc:'Největší nákladní loď. Šestihranný trup, pohybuje celé lodní regimenty.',
   hullMult:2.0, shieldMult:0.7, cargoBase:50, speedMult:0.52, cost:1800000,  color:'#8899aa', thruster:'#5566aa', scale:1.5},
  {id:'carrier',       name:'Fleet Carrier',      icon:'🛸', desc:'Mobilní základna. Plochá přístavní plošina s hangáry pro 8 lodí.',
   hullMult:3.0, shieldMult:2.0, cargoBase:40, speedMult:0.42, cost:2500000,  color:'#aabbff', thruster:'#8899ff', scale:1.7},
];

// ===== DEALERSKÉ STANICE (loděnice) — 10 na galaxii =====
const DEALERS_DATA = {
  sol: [
    {cx:0, cy:-1, name:'Loděnice Merkur',       color:'#ffaa00'},
    {cx:-1,cy:0,  name:'Orion Shipyards',        color:'#ffaa00'},
    {cx:3, cy:2,  name:'Ship Market Beta',       color:'#ffaa00'},
    {cx:-2,cy:1,  name:'Vega Ship Depot',        color:'#ffaa00'},
    {cx:4, cy:-1, name:'Jupiter Loděnice',       color:'#ffaa00'},
    {cx:-1,cy:-3, name:'Deep Void Market',       color:'#ffaa00'},
    {cx:5, cy:-1, name:'Rimward Shipworks',      color:'#ffaa00'},
    {cx:3, cy:-5, name:'Kepler Ship Corp',       color:'#ffaa00'},
    {cx:-4,cy:3,  name:'Frontier Dealers',       color:'#ffaa00'},
    {cx:7, cy:1,  name:'Far Reach Loděnice',     color:'#ffaa00'},
  ],
  aethon: [
    {cx:1, cy:-1, name:'Aethon Ship Hub',        color:'#8899ff'},
    {cx:-1,cy:2,  name:'Blue Star Dealers',      color:'#8899ff'},
    {cx:3, cy:1,  name:'Ion Shipworks',          color:'#8899ff'},
    {cx:-2,cy:-1, name:'Core Ship Market',       color:'#8899ff'},
    {cx:2, cy:3,  name:'Pulse Loděnice',         color:'#8899ff'},
    {cx:-3,cy:2,  name:'Deep Harbor Ships',      color:'#8899ff'},
    {cx:4, cy:-2, name:'Sector VII Market',      color:'#8899ff'},
    {cx:-1,cy:-3, name:'Nexus Ship Corp',        color:'#8899ff'},
    {cx:5, cy:2,  name:'Orbital Dealers',        color:'#8899ff'},
    {cx:-4,cy:-1, name:'Aethon Outer Ships',     color:'#8899ff'},
  ],
  veridia: [
    {cx:1, cy:1,  name:'Veridia Loděnice',       color:'#44cc88'},
    {cx:-1,cy:-1, name:'Bio Ship Market',        color:'#44cc88'},
    {cx:2, cy:-2, name:'Spore Shipworks',        color:'#44cc88'},
    {cx:-2,cy:2,  name:'Green Reach Ships',      color:'#44cc88'},
    {cx:3, cy:0,  name:'Canopy Dealers',         color:'#44cc88'},
    {cx:0, cy:-3, name:'Chlora Ship Hub',        color:'#44cc88'},
    {cx:-3,cy:1,  name:'Verdant Loděnice',       color:'#44cc88'},
    {cx:4, cy:2,  name:'Myco Ship Corp',         color:'#44cc88'},
    {cx:-1,cy:3,  name:'Bio Market Prime',       color:'#44cc88'},
    {cx:5, cy:-1, name:'Outer Veridia Ships',    color:'#44cc88'},
  ],
  krynn: [
    {cx:0, cy:1,  name:'Krynn Loděnice',         color:'#ff7744'},
    {cx:1, cy:-1, name:'Red Forge Ships',        color:'#ff7744'},
    {cx:-1,cy:2,  name:'Ember Ship Market',      color:'#ff7744'},
    {cx:2, cy:1,  name:'Inferno Shipworks',      color:'#ff7744'},
    {cx:-2,cy:-1, name:'Pyre Dealers',           color:'#ff7744'},
    {cx:3, cy:-2, name:'Cinder Ship Hub',        color:'#ff7744'},
    {cx:-1,cy:-2, name:'Magma Loděnice',         color:'#ff7744'},
    {cx:4, cy:1,  name:'Scorch Ship Corp',       color:'#ff7744'},
    {cx:-3,cy:2,  name:'Fire Market Prime',      color:'#ff7744'},
    {cx:2, cy:-3, name:'Krynn Outer Ships',      color:'#ff7744'},
  ],
  voidreach: [
    {cx:1, cy:0,  name:'Void Loděnice',          color:'#cc88ff'},
    {cx:-1,cy:1,  name:'Shadow Ship Market',     color:'#cc88ff'},
    {cx:2, cy:-1, name:'Dark Harbor Ships',      color:'#cc88ff'},
    {cx:-2,cy:2,  name:'Umbra Shipworks',        color:'#cc88ff'},
    {cx:0, cy:-2, name:'Rift Dealers',           color:'#cc88ff'},
    {cx:3, cy:1,  name:'Null Ship Hub',          color:'#cc88ff'},
    {cx:-3,cy:-1, name:'Abyss Loděnice',         color:'#cc88ff'},
    {cx:1, cy:3,  name:'Eclipse Ship Corp',      color:'#cc88ff'},
    {cx:-1,cy:-3, name:'Void Market Prime',      color:'#cc88ff'},
    {cx:4, cy:-2, name:'Outer Void Ships',       color:'#cc88ff'},
  ],
};

// ===== GARÁŽE — 10 na galaxii (kupovatelné) =====
const GARAGES_DATA = {
  sol: [
    {cx:0, cy:1,  name:'Hangár Sol-1',     color:'#00ccff', cost:50000},
    {cx:2, cy:-1, name:'Hangár Sol-2',     color:'#00ccff', cost:75000},
    {cx:-2,cy:-1, name:'Hangár Sol-3',     color:'#00ccff', cost:80000},
    {cx:4, cy:1,  name:'Hangár Sol-4',     color:'#00ccff', cost:100000},
    {cx:-3,cy:1,  name:'Hangár Sol-5',     color:'#00ccff', cost:110000},
    {cx:5, cy:4,  name:'Hangár Sol-6',     color:'#00ccff', cost:150000},
    {cx:-5,cy:-1, name:'Hangár Sol-7',     color:'#00ccff', cost:160000},
    {cx:7, cy:-5, name:'Hangár Sol-8',     color:'#00ccff', cost:200000},
    {cx:-6,cy:3,  name:'Hangár Sol-9',     color:'#00ccff', cost:220000},
    {cx:9, cy:4,  name:'Hangár Sol-10',    color:'#00ccff', cost:300000},
  ],
  aethon: [
    {cx:0, cy:-1, name:'Hangár Aethon-1',  color:'#5577ff', cost:60000},
    {cx:2, cy:1,  name:'Hangár Aethon-2',  color:'#5577ff', cost:90000},
    {cx:-1,cy:-2, name:'Hangár Aethon-3',  color:'#5577ff', cost:95000},
    {cx:3, cy:-1, name:'Hangár Aethon-4',  color:'#5577ff', cost:120000},
    {cx:-3,cy:0,  name:'Hangár Aethon-5',  color:'#5577ff', cost:130000},
    {cx:4, cy:3,  name:'Hangár Aethon-6',  color:'#5577ff', cost:170000},
    {cx:-4,cy:2,  name:'Hangár Aethon-7',  color:'#5577ff', cost:180000},
    {cx:6, cy:-2, name:'Hangár Aethon-8',  color:'#5577ff', cost:230000},
    {cx:-5,cy:-3, name:'Hangár Aethon-9',  color:'#5577ff', cost:250000},
    {cx:8, cy:1,  name:'Hangár Aethon-10', color:'#5577ff', cost:350000},
  ],
  veridia: [
    {cx:1, cy:2,  name:'Hangár Veridia-1', color:'#22bb66', cost:55000},
    {cx:-1,cy:-2, name:'Hangár Veridia-2', color:'#22bb66', cost:85000},
    {cx:3, cy:1,  name:'Hangár Veridia-3', color:'#22bb66', cost:90000},
    {cx:-2,cy:3,  name:'Hangár Veridia-4', color:'#22bb66', cost:115000},
    {cx:2, cy:-2, name:'Hangár Veridia-5', color:'#22bb66', cost:125000},
    {cx:-3,cy:-2, name:'Hangár Veridia-6', color:'#22bb66', cost:155000},
    {cx:4, cy:-1, name:'Hangár Veridia-7', color:'#22bb66', cost:175000},
    {cx:-4,cy:4,  name:'Hangár Veridia-8', color:'#22bb66', cost:210000},
    {cx:6, cy:2,  name:'Hangár Veridia-9', color:'#22bb66', cost:240000},
    {cx:-5,cy:-1, name:'Hangár Veridia-10',color:'#22bb66', cost:320000},
  ],
  krynn: [
    {cx:-1,cy:1,  name:'Hangár Krynn-1',   color:'#ee6633', cost:65000},
    {cx:2, cy:-2, name:'Hangár Krynn-2',   color:'#ee6633', cost:95000},
    {cx:-2,cy:-2, name:'Hangár Krynn-3',   color:'#ee6633', cost:100000},
    {cx:3, cy:2,  name:'Hangár Krynn-4',   color:'#ee6633', cost:130000},
    {cx:-3,cy:3,  name:'Hangár Krynn-5',   color:'#ee6633', cost:140000},
    {cx:4, cy:-3, name:'Hangár Krynn-6',   color:'#ee6633', cost:165000},
    {cx:-4,cy:-1, name:'Hangár Krynn-7',   color:'#ee6633', cost:185000},
    {cx:5, cy:2,  name:'Hangár Krynn-8',   color:'#ee6633', cost:220000},
    {cx:-5,cy:3,  name:'Hangár Krynn-9',   color:'#ee6633', cost:260000},
    {cx:7, cy:-3, name:'Hangár Krynn-10',  color:'#ee6633', cost:330000},
  ],
  voidreach: [
    {cx:2, cy:1,  name:'Hangár Void-1',    color:'#aa66ee', cost:70000},
    {cx:-2,cy:-1, name:'Hangár Void-2',    color:'#aa66ee', cost:100000},
    {cx:1, cy:-2, name:'Hangár Void-3',    color:'#aa66ee', cost:105000},
    {cx:-1,cy:2,  name:'Hangár Void-4',    color:'#aa66ee', cost:135000},
    {cx:3, cy:-2, name:'Hangár Void-5',    color:'#aa66ee', cost:145000},
    {cx:-3,cy:1,  name:'Hangár Void-6',    color:'#aa66ee', cost:175000},
    {cx:4, cy:2,  name:'Hangár Void-7',    color:'#aa66ee', cost:195000},
    {cx:-4,cy:-3, name:'Hangár Void-8',    color:'#aa66ee', cost:235000},
    {cx:6, cy:-1, name:'Hangár Void-9',    color:'#aa66ee', cost:270000},
    {cx:-5,cy:4,  name:'Hangár Void-10',   color:'#aa66ee', cost:340000},
  ],
};

// Klíč garáže pro save/load
function garageKey(galaxyId,cx,cy){return`${galaxyId}_${cx}_${cy}`;}
// Najdi dealer def pro aktuální galaxii a chunk
function findDealer(galaxyId,cx,cy){return(DEALERS_DATA[galaxyId]||[]).find(d=>d.cx===cx&&d.cy===cy)||null;}
function findGarage(galaxyId,cx,cy){return(GARAGES_DATA[galaxyId]||[]).find(g=>g.cx===cx&&g.cy===cy)||null;}
// Vrať SHIPS objekt podle id
function getShipDef(id){return SHIPS.find(s=>s.id===id)||SHIPS[0];}

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
