const settings={
  sfxVol:0.7,shake:true,trails:true,nebulae:true,
  stars:true,scanlines:false,vignette:true,
  particleCount:100,parallax:100,
  turnSpeed:1.0,thrustMult:1.0,maxSpdMult:1.0,drag:0.978,
  minimapSize:160,hudOpacity:82,minimapLegend:true,minimapRange:2500,
  engineSound:true,shootSound:true,
};

const CHUNK_SIZE=800,CHUNK_VIEW=4;
const FUEL_COST_PER_PCT=3,HULL_COST_PER_PCT=8,SHIELD_COST_PER_PCT=4,CARGO_MAX=20;
const SPAWN_SAFE_RADIUS=1200;
const SAVE_KEY='voidtrader_v4';
const OV_SIZE=700;
const OV_ZOOM_STEPS=[0.12,0.2,0.35,0.6,1,2,3,4,6];
const STAR_CELL=80,STAR_LAYERS=[0.12,0.25,0.45];

const FORCED_STATIONS=[
  {cx:3, cy:2,  name:'Základna Alfa',  color:'#40a8ff',tier:3},
  {cx:-3,cy:1,  name:'Stanice Beta',   color:'#ff8840',tier:2},
  {cx:1, cy:5,  name:'Přístav Gamma',  color:'#40e880',tier:2},
  {cx:5, cy:-2, name:'Relé Delta',     color:'#b040ff',tier:1},
  {cx:-4,cy:-2, name:'Věž Epsilon',    color:'#ff4090',tier:2},
  {cx:6, cy:3,  name:'Zásobník Zeta',  color:'#40d4ff',tier:3},
  {cx:2, cy:-5, name:'Outpost Eta',    color:'#ffd040',tier:1},
  {cx:-2,cy:7,  name:'Sonda Theta',    color:'#80ff60',tier:1},
];

const GOODS=[
  {name:'Toaleták',         color:'#7cf'},
  {name:'Kovový šrot',      color:'#aaa'},
  {name:'Biopalivo',        color:'#4f8'},
  {name:'Elektronika',      color:'#f7c'},
  {name:'Potraviny',        color:'#fd8'},
  {name:'Léčiva',           color:'#7ff'},
  {name:'Textil',           color:'#c8f'},
  {name:'Rudy',             color:'#fa8'},
  {name:'Stará technika',   color:'#fc8',lootOnly:true},
  {name:'Pirátská data',    color:'#f44',lootOnly:true},
  {name:'Černý trh zboží',  color:'#f84',lootOnly:true},
  {name:'Anomálie Fragment', color:'#b0f',lootOnly:true},
  {name:'Vrak Součástky',   color:'#8af',lootOnly:true},
];
const LOOT_GOODS=GOODS.filter(g=>g.lootOnly);
const TRADE_GOODS=GOODS.filter(g=>!g.lootOnly);

const UPGRADES=[
  {id:'cargo',   name:'Nákladní prostor',maxLvl:4,baseCost:400,effect:'Max. náklad +5'},
  {id:'shield',  name:'Generátor štítu', maxLvl:4,baseCost:500,effect:'Max. štít +25'},
  {id:'engine',  name:'Motor',           maxLvl:4,baseCost:350,effect:'Rychlost +15%'},
  {id:'weapons', name:'Zbraňový systém', maxLvl:3,baseCost:600,effect:'Poškození +5'},
  {id:'fuel',    name:'Nádrž',           maxLvl:3,baseCost:300,effect:'Turbo spotřeba -25%'},
  {id:'scanner', name:'Skener',          maxLvl:3,baseCost:450,effect:'Radar dosah +50%'},
];

const STATION_NAMES=[
  'Alfa Port','Beta Hub','Gama Depot','Delta Base','Epsilon Outpost',
  'Zeta Node','Eta Relay','Theta Gate','Iota Beacon','Kappa Bay',
  'Lambda Dock','Mu Nexus','Nu Station','Xi Platform','Omikron Yard',
  'Pi Terminal','Rho Harbor','Sigma Post','Tau Junction','Upsilon Core',
  'Phi Waypoint','Chi Anchorage','Psi Station','Omega Terminus',
  'Nova Station','Abyss Port','Frontier Hub','Void Gate','Deep Anchorage',
  'Echo Relay','Storm Dock','Ruin Post','Pilgrim Bay','Iron Hub',
];

const XP_TABLE=[0,100,250,450,700,1000,1400,1900,2500,3200,4200];

const SOLAR_SYSTEM=[
  {name:'Slunce', orbit:0,    period:0,     r:180,innerColor:'#fffbe0',outerColor:'#ff8800',glowColor:'rgba(255,160,0,0.22)',  ring:false,isSun:true},
  {name:'Merkur', orbit:1900, period:1800,  r:28, innerColor:'#c8b8a8',outerColor:'#806858',glowColor:'rgba(180,150,120,0.14)',ring:false},
  {name:'Venuše', orbit:3200, period:3000,  r:48, innerColor:'#f5e898',outerColor:'#c08830',glowColor:'rgba(220,160,40,0.16)', ring:false},
  {name:'Země',   orbit:4600, period:4800,  r:52, innerColor:'#3a9ce0',outerColor:'#1a6020',glowColor:'rgba(40,120,220,0.18)', ring:false,hasOcean:true},
  {name:'Měsíc',  orbit:380,  period:270,   r:14, innerColor:'#b8b8b8',outerColor:'#606060',glowColor:'rgba(160,160,160,0.10)',ring:false,parentIdx:3},
  {name:'Mars',   orbit:6400, period:7500,  r:38, innerColor:'#e05030',outerColor:'#8a2810',glowColor:'rgba(200,60,30,0.15)',  ring:false},
  {name:'Jupiter',orbit:11000,period:21000, r:120,innerColor:'#d4a860',outerColor:'#8a5820',glowColor:'rgba(180,120,50,0.18)', ring:false,stripes:true},
  {name:'Saturn', orbit:15500,period:45000, r:100,innerColor:'#e0c868',outerColor:'#a07830',glowColor:'rgba(200,170,60,0.16)', ring:true},
  {name:'Uran',   orbit:20000,period:97500, r:68, innerColor:'#80e0e0',outerColor:'#208080',glowColor:'rgba(80,200,200,0.15)', ring:false},
  {name:'Neptun', orbit:24500,period:180000,r:64, innerColor:'#3060e8',outerColor:'#102060',glowColor:'rgba(40,80,220,0.15)',  ring:false},
];
SOLAR_SYSTEM.forEach((p,i)=>{p._phase=(i/SOLAR_SYSTEM.length)*Math.PI*2;});
