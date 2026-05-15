// --- Utility functions ---
function makeRng(seed){
  let s=seed>>>0;
  return function(){
    s=Math.imul(s^(s>>>15),s|1);s^=s+Math.imul(s^(s>>>7),s|61);
    return((s^(s>>>14))>>>0)/4294967296;
  };
}
function chunkSeed(cx,cy){const x=cx+100000,y=cy+100000;return((x+y)*(x+y+1)/2+y)|0;}
function worldDistFromOrigin(wx,wy){return Math.hypot(wx,wy);}
function worldDistBetween(ax,ay,bx,by){return Math.hypot(ax-bx,ay-by);}

function rnd(a,b){return Math.random()*(b-a)+a;}
function rndInt(a,b){return Math.floor(rnd(a,b+1));}
function rndItem(arr){return arr[Math.floor(Math.random()*arr.length)];}
function dist2(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function clamp(v,mn,mx){return Math.max(mn,Math.min(mx,v));}

// --- Player stat helpers ---
function getCargoMax(){return CARGO_MAX+player.upgrades.cargo*5;}
function getShieldMax(){return 100+player.upgrades.shield*25;}
function getEngineBoost(){return 1+player.upgrades.engine*0.15;}
function getWeaponDmg(){return 10+player.upgrades.weapons*5;}
function getFuelBurn(){return Math.max(0.3,1-player.upgrades.fuel*0.25);}
function getScannerRange(){return 160+player.upgrades.scanner*80;}
function getXpForLevel(lvl){return XP_TABLE[Math.min(lvl,XP_TABLE.length-1)]||XP_TABLE[XP_TABLE.length-1]+(lvl-(XP_TABLE.length-1))*1500;}

// --- Solar system positions ---
function getPlanetPos(p,t){
  if(p.orbit===0)return{x:0,y:0};
  if(p.parentIdx!==undefined){
    const parent=SOLAR_SYSTEM[p.parentIdx];
    const pp=getPlanetPos(parent,t);
    const a=(t/p.period)*Math.PI*2+p._phase;
    return{x:pp.x+Math.cos(a)*p.orbit,y:pp.y+Math.sin(a)*p.orbit};
  }
  const angle=(p.period>0?(t/p.period)*Math.PI*2:0)+p._phase;
  return{x:Math.cos(angle)*p.orbit,y:Math.sin(angle)*p.orbit};
}

// --- Chunk system ---
const chunkCache=new Map();

function getChunk(cx,cy){
  const key=`${cx},${cy}`;
  if(chunkCache.has(key))return chunkCache.get(key);
  const chunk=generateChunk(cx,cy);chunkCache.set(key,chunk);return chunk;
}

function generateChunk(cx,cy){
  const rng=makeRng(chunkSeed(cx,cy));
  const wx=cx*CHUNK_SIZE,wy=cy*CHUNK_SIZE;
  const chunkCenterX=wx+CHUNK_SIZE/2,chunkCenterY=wy+CHUNK_SIZE/2;
  const distFromSpawn=worldDistFromOrigin(chunkCenterX,chunkCenterY);
  const data={cx,cy,wx,wy,asteroids:[],station:null,blackhole:null,wreck:null,nebula:null,anomaly:null,storm:null};

  if(rng()<0.40){
    const cols=['#3050ff','#ff4060','#20b080','#8030c0','#ff8020','#0090c0','#c02080'];
    data.nebula={x:wx+rng()*CHUNK_SIZE,y:wy+rng()*CHUNK_SIZE,r:180+rng()*320,color:cols[Math.floor(rng()*cols.length)],alpha:0.03+rng()*0.055};
  }

  const stationPreset=FORCED_STATIONS.find(s=>s.cx===cx&&s.cy===cy);
  const forceStation=!!stationPreset;
  if(forceStation||rng()<0.24){
    const r2=makeRng(chunkSeed(cx,cy)+1);
    const abund=[...TRADE_GOODS].sort(()=>r2()-.5).slice(0,4);
    const need=[...TRADE_GOODS].sort(()=>r2()-.5).slice(0,4);
    const inv={};
    abund.forEach(g=>{inv[g.name]={qty:Math.floor(r2()*45)+15,buyPrice:Math.floor(r2()*14)+4,sellPrice:Math.floor(r2()*30)+25};});
    need.forEach(g=>{if(!inv[g.name])inv[g.name]={qty:Math.floor(r2()*4),buyPrice:null,sellPrice:Math.floor(r2()*55)+45};});
    LOOT_GOODS.forEach(g=>{inv[g.name]={qty:0,buyPrice:null,sellPrice:Math.floor(r2()*90)+60};});
    const hue=Math.floor(r2()*120)+180;
    const stX=forceStation?wx+CHUNK_SIZE/2:wx+150+r2()*(CHUNK_SIZE-300);
    const stY=forceStation?wy+CHUNK_SIZE/2:wy+150+r2()*(CHUNK_SIZE-300);
    data.station={
      x:stX,y:stY,
      name:forceStation?stationPreset.name:STATION_NAMES[Math.floor(r2()*STATION_NAMES.length)],
      inv,
      color:forceStation?stationPreset.color:`hsl(${hue},60%,55%)`,
      angle:r2()*Math.PI*2,ring:38+Math.floor(r2()*22),
      tier:forceStation?stationPreset.tier:1+Math.floor(r2()*3),
      armRot:[r2()*Math.PI*2,r2()*Math.PI*2],
    };
  }

  if(rng()<0.03){
    const bhX=wx+200+rng()*(CHUNK_SIZE-400),bhY=wy+200+rng()*(CHUNK_SIZE-400);
    const bhDistFromSpawn=worldDistFromOrigin(bhX,bhY);
    const bhDistFromStation=data.station?worldDistBetween(bhX,bhY,data.station.x,data.station.y):9999;
    if(bhDistFromSpawn>SPAWN_SAFE_RADIUS&&bhDistFromStation>400){
      data.blackhole={x:bhX,y:bhY,r:45+rng()*35,pullRadius:350+rng()*250,angle:0};
    }
  }

  if(rng()<0.20&&!data.station)data.wreck={x:wx+rng()*CHUNK_SIZE,y:wy+rng()*CHUNK_SIZE,angle:rng()*Math.PI*2,looted:false,type:rng()<0.5?'fighter':'freighter'};
  if(rng()<0.08)data.anomaly={x:wx+rng()*CHUNK_SIZE,y:wy+rng()*CHUNK_SIZE,r:30+rng()*25,phase:rng()*Math.PI*2,active:true};
  if(rng()<0.10)data.storm={x:wx+rng()*CHUNK_SIZE,y:wy+rng()*CHUNK_SIZE,r:200+rng()*200,intensity:0.5+rng()*0.5,angle:rng()*Math.PI*2};

  const numAst=Math.floor(rng()*4)+1;
  for(let i=0;i<numAst;i++){
    const sz=14+Math.floor(rng()*34),nv=7+Math.floor(rng()*6),verts=[];
    for(let j=0;j<nv;j++){const a=j/nv*Math.PI*2;verts.push({x:Math.cos(a)*sz*(0.6+rng()*0.55),y:Math.sin(a)*sz*(0.6+rng()*0.55)});}
    data.asteroids.push({x:wx+rng()*CHUNK_SIZE,y:wy+rng()*CHUNK_SIZE,vx:(rng()-.5)*.36,vy:(rng()-.5)*.36,angle:rng()*Math.PI*2,rot:(rng()-.5)*.016,sz,verts,hp:Math.ceil(sz/7),maxHp:Math.ceil(sz/7),color:`hsl(${15+Math.floor(rng()*30)},15%,${25+Math.floor(rng()*20)}%)`});
  }
  return data;
}

function getVisibleChunks(){
  const pcx=Math.floor(player.x/CHUNK_SIZE),pcy=Math.floor(player.y/CHUNK_SIZE);
  const chunks=[];
  for(let dy=-CHUNK_VIEW;dy<=CHUNK_VIEW;dy++)for(let dx=-CHUNK_VIEW;dx<=CHUNK_VIEW;dx++)chunks.push(getChunk(pcx+dx,pcy+dy));
  return chunks;
}

function getVisibleChunksForOv(ox,oy,range){
  const pcx=Math.floor((ox+range/2)/CHUNK_SIZE),pcy=Math.floor((oy+range/2)/CHUNK_SIZE);
  const viewR=Math.ceil(range/CHUNK_SIZE/2)+1;const chunks=[];
  for(let dy=-viewR;dy<=viewR;dy++)for(let dx=-viewR;dx<=viewR;dx++)chunks.push(getChunk(pcx+dx,pcy+dy));
  return chunks;
}
