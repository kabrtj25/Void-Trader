// ===== SPACE TRADER — generace světa =====
const chunkCache = new Map();

function getChunk(cx,cy){
  const key=chunkKey(cx,cy);
  if(chunkCache.has(key))return chunkCache.get(key);
  const isSolar=cx===C.SOLAR_CHUNK.cx&&cy===C.SOLAR_CHUNK.cy;
  const ch=isSolar?generateSolarSystem(cx,cy):generateChunk(cx,cy);
  chunkCache.set(key,ch);return ch;
}

function generateChunk(cx,cy){
  const rng=makeRng(chunkSeed(cx,cy));
  const wx=cx*C.CHUNK, wy=cy*C.CHUNK;
  const ch={cx,cy,wx,wy,stars:[],nebula:null,system:null,asteroids:[]};

  // Pozadí hvězdy
  const sc=C.CHUNK;
  for(let i=0;i<200;i++){
    ch.stars.push({
      x:wx+rng()*sc, y:wy+rng()*sc,
      r:rng()<0.04?rng()*1.4+0.6:rng()*0.8+0.2,
      bright:0.25+rng()*0.75,
      hue:rng()<0.12?(rng()<0.5?210:30):0,  // blue, orange, nebo white
      twinkle:rng()*Math.PI*2
    });
  }

  // Mlhovina
  if(rng()<0.45){
    const cols=['rgba(255,120,0,','rgba(255,60,0,','rgba(100,80,255,','rgba(0,80,200,','rgba(180,0,200,','rgba(0,140,200,'];
    ch.nebula={x:wx+rng()*sc,y:wy+rng()*sc,r:600+rng()*800,col:cols[Math.floor(rng()*cols.length)],alpha:0.03+rng()*0.045};
  }

  // Sluneční soustava (20% šance, nebo fixní)
  const fixed=FIXED_STATIONS.find(s=>s.cx===cx&&s.cy===cy);
  const hasSystem=fixed||rng()<0.20;
  if(hasSystem){
    const sr=makeRng(chunkSeed(cx,cy)+99);
    const starX=wx+sc*0.3+sr()*sc*0.4;
    const starY=wy+sc*0.3+sr()*sc*0.4;
    const starTypes=[
      {color:'#fff9e0',glow:'rgba(255,240,180,',r:60+sr()*40},
      {color:'#ffd090',glow:'rgba(255,160,60,', r:50+sr()*30},
      {color:'#a0c8ff',glow:'rgba(140,180,255,',r:45+sr()*25},
      {color:'#ffb060',glow:'rgba(255,120,20,', r:55+sr()*35},
    ];
    const stype=starTypes[Math.floor(sr()*starTypes.length)];
    const planets=[];
    const numP=rndIntR(sr,1,4);
    for(let p=0;p<numP;p++){
      const orbit=200+p*180+sr()*120;
      const phase=sr()*Math.PI*2;
      const period=2000+orbit*8+sr()*3000;
      const pCols=['#c87050','#5080c8','#60a060','#d09030','#8060a0','#306090','#a06030','#70c080'];
      const r=12+sr()*28;
      planets.push({orbit,phase,period,r,color:pCols[Math.floor(sr()*pCols.length)],atmo:sr()<0.6});
    }
    // Stanice
    let station=null;
    if(fixed){
      station={
        x:starX+240, y:starY+240,
        name:fixed.name, tier:fixed.tier, color:fixed.color,
        angle:sr()*Math.PI*2, rotSpeed:0.003+sr()*0.004,
        r:45+fixed.tier*15,
        inv:generateInv(sr),
        fixed:true
      };
    } else if(sr()<0.6){
      const stNames=['Colonia Port','Kepler Hub','Orion Dock','Sirius Base','Vega Station','Tau Port','Ceti Hub','Nova Dock'];
      station={
        x:starX+200+sr()*400, y:starY+200+sr()*400,
        name:stNames[Math.floor(sr()*stNames.length)],
        tier:1+Math.floor(sr()*3), color:'#ff9500',
        angle:sr()*Math.PI*2, rotSpeed:0.002+sr()*0.005,
        r:40+sr()*25,
        inv:generateInv(sr),
        fixed:false
      };
    }
    ch.system={sx:starX,sy:starY,...stype,planets,station};
  }

  // Asteroidy
  const numA=Math.floor(rng()*5)+2;
  for(let i=0;i<numA;i++){
    const sz=10+rng()*30,nv=6+Math.floor(rng()*5),verts=[];
    for(let j=0;j<nv;j++){const a=j/nv*Math.PI*2;verts.push({x:Math.cos(a)*sz*(0.6+rng()*0.45),y:Math.sin(a)*sz*(0.6+rng()*0.45)});}
    ch.asteroids.push({
      x:wx+rng()*sc, y:wy+rng()*sc,
      vx:(rng()-.5)*0.25, vy:(rng()-.5)*0.25,
      angle:rng()*Math.PI*2, rot:(rng()-.5)*0.008,
      sz,verts,
      hp:Math.ceil(sz/5), maxHp:Math.ceil(sz/5),
      color:`hsl(${20+Math.floor(rng()*25)},${10+Math.floor(rng()*18)}%,${20+Math.floor(rng()*20)}%)`
    });
  }
  return ch;
}

function rndIntR(rng,a,b){return Math.floor(rng()*(b-a+1))+a;}

function generateInv(rng){
  const inv={};
  const shuffled=[...GOODS].sort(()=>rng()-0.5);
  shuffled.forEach((g,i)=>{
    const buy=i<4?Math.round(g.base*(0.7+rng()*0.5)):null;
    const sell=Math.round(g.base*(1.1+rng()*0.8));
    inv[g.name]={buy,sell,qty:buy?Math.floor(rng()*60)+10:0};
  });
  return inv;
}

function getVisibleChunks(px,py){
  const cx=Math.floor(px/C.CHUNK), cy=Math.floor(py/C.CHUNK);
  const chunks=[];
  for(let dy=-C.VIEW_R;dy<=C.VIEW_R;dy++)
    for(let dx=-C.VIEW_R;dx<=C.VIEW_R;dx++)
      chunks.push(getChunk(cx+dx,cy+dy));
  return chunks;
}

// Pozice planety v čase
function getPlanetPos(p,starX,starY,t){
  const a=(t/p.period)*Math.PI*2+p.phase;
  return{x:starX+Math.cos(a)*p.orbit, y:starY+Math.sin(a)*p.orbit};
}

// ---- Sluneční soustava — speciální chunk ----
function generateSolarSystem(cx,cy){
  const rng=makeRng(chunkSeed(cx,cy));
  const wx=cx*C.CHUNK, wy=cy*C.CHUNK, sc=C.CHUNK;
  const ch={cx,cy,wx,wy,stars:[],nebula:null,system:null,asteroids:[]};

  // Pozadí hvězdy
  for(let i=0;i<200;i++){
    ch.stars.push({x:wx+rng()*sc,y:wy+rng()*sc,
      r:rng()<0.04?rng()*1.4+0.6:rng()*0.8+0.2,
      bright:0.2+rng()*0.7,hue:rng()<0.1?(rng()<0.5?210:30):0,twinkle:rng()*Math.PI*2});
  }

  const sunX=wx+sc*0.5, sunY=wy+sc*0.5;

  const planets=[
    {name:'Merkur', orbit:155, phase:0.3,  period:600,   r:5,  color:'#a8a8a8', atmo:false},
    {name:'Venuše', orbit:230, phase:1.2,  period:1200,  r:9,  color:'#e8d080', atmo:true},
    {name:'Země',   orbit:320, phase:2.1,  period:2000,  r:10, color:'#3a7fd4', atmo:true},
    {name:'Mars',   orbit:430, phase:3.5,  period:3200,  r:7,  color:'#c84030', atmo:true},
    {name:'Jupiter',orbit:620, phase:0.8,  period:9000,  r:26, color:'#c8804a', atmo:true},
    {name:'Saturn', orbit:800, phase:4.2,  period:15000, r:21, color:'#e0c060', atmo:true, rings:true},
    {name:'Uran',   orbit:940, phase:1.7,  period:22000, r:15, color:'#7dd0c8', atmo:true, rings:true},
    {name:'Neptun', orbit:1060,phase:5.1,  period:30000, r:14, color:'#4060d8', atmo:true},
  ];

  // Stanice Země — u Země v čase t=0
  const earthAngle=2.1; // fáze Země
  const stX=sunX+Math.cos(earthAngle)*320+50;
  const stY=sunY+Math.sin(earthAngle)*320+50;
  const station={
    x:stX, y:stY,
    name:'Stanice Země', tier:3, color:'#4488ff',
    angle:0, rotSpeed:0.004, r:60,
    inv:generateInv(makeRng(chunkSeed(cx,cy)+77)),
    fixed:true
  };

  ch.system={
    sx:sunX, sy:sunY,
    color:'#fff8c0',
    glow:'rgba(255,220,60,',
    r:130,
    planets,
    station
  };

  // Pás asteroidů (mezi Marsem a Jupiterem)
  for(let i=0;i<35;i++){
    const a=rng()*Math.PI*2;
    const d=510+rng()*90;
    const sz=4+rng()*14,nv=5+Math.floor(rng()*4),verts=[];
    for(let j=0;j<nv;j++){const av=j/nv*Math.PI*2;verts.push({x:Math.cos(av)*sz*(0.55+rng()*0.45),y:Math.sin(av)*sz*(0.55+rng()*0.45)});}
    ch.asteroids.push({
      x:sunX+Math.cos(a)*d, y:sunY+Math.sin(a)*d,
      vx:(rng()-.5)*0.08, vy:(rng()-.5)*0.08,
      angle:rng()*Math.PI*2, rot:(rng()-.5)*0.005,
      sz,verts,hp:Math.ceil(sz/5),maxHp:Math.ceil(sz/5),
      color:`hsl(${22+Math.floor(rng()*18)},${8+Math.floor(rng()*14)}%,${22+Math.floor(rng()*18)}%)`
    });
  }

  return ch;
}
