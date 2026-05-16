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
  for(let i=0;i<260;i++){
    const bright=rng()<0.05?0.85+rng()*0.15:0.2+rng()*0.7;
    ch.stars.push({
      x:wx+rng()*sc, y:wy+rng()*sc,
      r:rng()<0.04?rng()*1.8+0.8:(rng()<0.12?rng()*0.8+0.3:rng()*0.5+0.1),
      bright,
      hue:rng()<0.1?(rng()<0.5?210:30):(rng()<0.04?60:0),
      twinkle:rng()*Math.PI*2,
      sparkle:bright>0.84&&rng()<0.35
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

// Pozice měsíce v čase (obíhá svou planetu)
function getMoonPos(moon,planetX,planetY,t){
  const a=(t/moon.period)*Math.PI*2+moon.phase;
  return{x:planetX+Math.cos(a)*moon.orbit, y:planetY+Math.sin(a)*moon.orbit};
}

// ---- Sluneční soustava — speciální chunk ----
function makePlanetStation(name,tier,color,r,seed){
  const sr=makeRng(seed);
  return{name:'Stanice '+name,tier,color,angle:sr()*Math.PI*2,rotSpeed:0.003+sr()*0.004,r,
    inv:generateInv(makeRng(seed+999)),fixed:true,x:0,y:0};
}
function makeMoon(name,orbit,phase,period,r,color,seed,hasSt,stTier){
  const sr=makeRng(seed);
  return{name,orbit,phase,period,r,color,
    station:hasSt?{name:'Stanice '+name,tier:stTier,color:'#ff9500',
      angle:sr()*Math.PI*2,rotSpeed:0.003+sr()*0.005,r:22+stTier*6,
      inv:generateInv(makeRng(seed+999)),fixed:false,x:0,y:0}:null};
}
function generateSolarSystem(cx,cy){
  const rng=makeRng(chunkSeed(cx,cy));
  const wx=cx*C.CHUNK, wy=cy*C.CHUNK, sc=C.CHUNK;
  const ch={cx,cy,wx,wy,stars:[],nebula:null,system:null,asteroids:[]};
  const seed=chunkSeed(cx,cy);

  // Hustší hvězdné pozadí
  for(let i=0;i<320;i++){
    const bright=rng()<0.06?0.85+rng()*0.15:0.2+rng()*0.65;
    ch.stars.push({x:wx+rng()*sc,y:wy+rng()*sc,
      r:rng()<0.05?rng()*2+0.9:(rng()<0.15?rng()*0.9+0.4:rng()*0.5+0.15),
      bright,hue:rng()<0.08?(rng()<0.5?210:30):(rng()<0.05?60:0),
      twinkle:rng()*Math.PI*2,
      sparkle:bright>0.82&&rng()<0.4});
  }

  const sunX=wx+sc*0.5, sunY=wy+sc*0.5;

  // Orbity jsou v herních jednotkách; planety obíhají velmi pomalu (period = sekundy)
  const planets=[
    {name:'Merkur', orbit:2500,  phase:0.3,  period:20000,   r:48,  color:'#a8a8a0', atmo:false,
     station:makePlanetStation('Merkur',1,'#b8b8b0',32,seed+1), moons:[]},
    {name:'Venuše', orbit:4500,  phase:1.2,  period:50000,   r:84,  color:'#e8d080', atmo:true,
     station:makePlanetStation('Venuše',1,'#e8d080',38,seed+2), moons:[]},
    {name:'Země',   orbit:7000,  phase:2.1,  period:100000,  r:96,  color:'#3a7fd4', atmo:true,
     station:makePlanetStation('Země',3,'#4488ff',65,seed+3),
     moons:[makeMoon('Luna',500,0.8,8000,36,'#aaaaaa',seed+101,true,2)]},
    {name:'Mars',   orbit:10500, phase:3.5,  period:190000,  r:66,  color:'#c84030', atmo:true,
     station:makePlanetStation('Mars',2,'#d05040',42,seed+4),
     moons:[makeMoon('Phobos',180,1.2,1500,18,'#997755',seed+102,false),
            makeMoon('Deimos',320,3.1,3000,12,'#887766',seed+103,false)]},
    {name:'Ceres',  orbit:13000, phase:1.5,  period:280000,  r:30,  color:'#b0a898', atmo:false,
     station:makePlanetStation('Ceres',1,'#b0a8a0',28,seed+10), moons:[]},
    {name:'Jupiter',orbit:20000, phase:0.8,  period:600000,  r:252, color:'#c8804a', atmo:true,
     station:makePlanetStation('Jupiter',2,'#c88050',55,seed+5),
     moons:[makeMoon('Io',       800, 0.5, 8000, 48,'#e8c040',seed+104,true, 1),
            makeMoon('Europa',  1200, 2.1,16000, 42,'#c8b8a0',seed+105,true, 2),
            makeMoon('Ganymede',1800, 4.3,40000, 60,'#a09080',seed+106,true, 2),
            makeMoon('Callisto',2500, 5.7,90000, 54,'#807060',seed+107,false)]},
    {name:'Saturn', orbit:31000, phase:4.2,  period:1500000, r:192, color:'#e0c060', atmo:true, rings:true,
     station:makePlanetStation('Saturn',2,'#d4b850',48,seed+6),
     moons:[makeMoon('Enceladus', 600,1.8, 6000, 30,'#e0e8ff',seed+108,false),
            makeMoon('Titan',    1400,3.5,50000, 54,'#d4a040',seed+109,true, 2)]},
    {name:'Uran',   orbit:44000, phase:1.7,  period:4250000, r:132, color:'#7dd0c8', atmo:true, rings:true,
     station:makePlanetStation('Uran',1,'#7dd0c8',40,seed+7),
     moons:[makeMoon('Titania',700,0.9,20000,36,'#88a8c0',seed+110,false),
            makeMoon('Oberon', 900,2.8,35000,30,'#9090a0',seed+111,false)]},
    {name:'Neptun', orbit:60000, phase:5.1,  period:8000000, r:120, color:'#4060d8', atmo:true,
     station:makePlanetStation('Neptun',1,'#5070d8',38,seed+8),
     moons:[makeMoon('Triton',600,1.2,15000,42,'#a0c8d0',seed+112,true,1)]},
    {name:'Pluto',  orbit:78000, phase:3.8,  period:18000000,r:24,  color:'#c0b0a8', atmo:false,
     station:makePlanetStation('Pluto',1,'#c0c0b8',28,seed+9), moons:[]},
  ];

  // Sluneční observatoř — stanice obíhající blízko Slunce
  const solObs={x:sunX+1200,y:sunY,name:'Sluneční Observatoř',tier:2,color:'#ffcc44',
    angle:0,rotSpeed:0.0015,r:42,inv:generateInv(makeRng(seed+1000)),fixed:false};

  ch.system={
    sx:sunX, sy:sunY,
    color:'#fff8c0', glow:'rgba(255,220,60,', r:155,
    planets, station:solObs
  };

  // Pás asteroidů (mezi Marsem a Jupiterem, orbit 11500–18000)
  for(let i=0;i<65;i++){
    const a=rng()*Math.PI*2, d=11500+rng()*6500;
    const sz=4+rng()*16,nv=5+Math.floor(rng()*5),verts=[];
    for(let j=0;j<nv;j++){const av=j/nv*Math.PI*2;verts.push({x:Math.cos(av)*sz*(0.55+rng()*0.45),y:Math.sin(av)*sz*(0.55+rng()*0.45)});}
    ch.asteroids.push({
      x:sunX+Math.cos(a)*d, y:sunY+Math.sin(a)*d,
      vx:(rng()-.5)*0.06, vy:(rng()-.5)*0.06,
      angle:rng()*Math.PI*2, rot:(rng()-.5)*0.004,
      sz,verts,hp:Math.ceil(sz/5),maxHp:Math.ceil(sz/5),
      color:`hsl(${20+Math.floor(rng()*20)},${8+Math.floor(rng()*12)}%,${20+Math.floor(rng()*18)}%)`
    });
  }

  // Kuiperův pás (za Neptunem, orbit 62000–80000)
  const krng=makeRng(seed+500);
  for(let i=0;i<45;i++){
    const a=krng()*Math.PI*2, d=62000+krng()*18000;
    const sz=3+krng()*12,nv=4+Math.floor(krng()*5),verts=[];
    for(let j=0;j<nv;j++){const av=j/nv*Math.PI*2;verts.push({x:Math.cos(av)*sz*(0.5+krng()*0.5),y:Math.sin(av)*sz*(0.5+krng()*0.5)});}
    ch.asteroids.push({
      x:sunX+Math.cos(a)*d, y:sunY+Math.sin(a)*d,
      vx:(krng()-.5)*0.02, vy:(krng()-.5)*0.02,
      angle:krng()*Math.PI*2, rot:(krng()-.5)*0.002,
      sz,verts,hp:Math.ceil(sz/5),maxHp:Math.ceil(sz/5),
      color:`hsl(${195+Math.floor(krng()*40)},${4+Math.floor(krng()*10)}%,${14+Math.floor(krng()*14)}%)`
    });
  }
  return ch;
}
