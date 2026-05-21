// ===== SPACE TRADER — hlavní smyčka =====

// State machine
let gameState = null;  // hráč, entity, nav, atd.
let state = 'menu';    // 'menu' | 'playing' | 'docked' | 'map' | 'galaxy' | 'warping'
let canvas, W2, H2;    // W,H jsou v render.js

// Light / Dark mode
window.lightMode = localStorage.getItem('st_theme') === 'light';
(function applyTheme(){
  if(window.lightMode) document.body.classList.add('light');
  else document.body.classList.remove('light');
})();

function toggleTheme(){
  window.lightMode = !window.lightMode;
  if(window.lightMode){ document.body.classList.add('light'); localStorage.setItem('st_theme','light'); }
  else { document.body.classList.remove('light'); localStorage.setItem('st_theme','dark'); }
  const icon = document.getElementById('theme-icon');
  const lbl  = document.getElementById('theme-label');
  if(icon) icon.textContent = window.lightMode ? '🌙' : '☀';
  if(lbl)  lbl.textContent  = window.lightMode ? 'DARK MODE' : 'LIGHT MODE';
  initMenuStars();
}
let last = 0, frameCount = 0;

// Warp systém
window.currentGalaxy = 'sol';
window.warpTarget = null;
let warpPhase = null;
let warpTimer = 0;
let warpElapsed = 0;
let parkingMode = false;
Object.defineProperty(window,'parkingMode',{get:()=>parkingMode});
let interiorData = null;

// ---- Systém uložených her (Farming Simulator styl) ----
const SLOT_KEYS = ['st_save_s1','st_save_s2','st_save_s3','st_save_s4'];
let activeSlot = -1;

// ===== Systém klávesových zkratek =====
const DEFAULT_BINDINGS = {
  thrust:  'KeyW',
  rotLeft: 'KeyA',
  rotRight:'KeyD',
  strafeL: 'KeyQ',
  strafeR: 'KeyE',
  boost:   'ShiftLeft',
  shoot:   'Space',
  dock:    'KeyF',
  sysMap:  'KeyM',
  galaxy:  'KeyN',
  warp:    'KeyR',
  parking: 'KeyP',
  pause:   'Escape',
};
const BINDING_ALIASES = {
  thrust:  ['ArrowUp'],
  rotLeft: ['ArrowLeft'],
  rotRight:['ArrowRight'],
  boost:   ['ShiftRight'],
};
const BINDING_LABELS = {
  thrust:  'Zrychlení (dopředu)',
  rotLeft: 'Otočení vlevo',
  rotRight:'Otočení vpravo',
  strafeL: 'Boční let vlevo',
  strafeR: 'Boční let vpravo',
  boost:   'Boost',
  shoot:   'Střelba',
  dock:    'Přistání / Vzlet',
  sysMap:  'Mapa soustavy',
  galaxy:  'Mapa galaxií',
  warp:    'Warpové motory',
  parking: 'Parkovací režim',
  pause:   'Menu / Pauza',
};
let bindings = {...DEFAULT_BINDINGS};

function keyLabel(code){
  const M={Space:'Mezerník',Escape:'ESC',ArrowUp:'↑',ArrowDown:'↓',
    ArrowLeft:'←',ArrowRight:'→',ShiftLeft:'Shift L',ShiftRight:'Shift R',
    ControlLeft:'Ctrl L',ControlRight:'Ctrl R',AltLeft:'Alt L',AltRight:'Alt R',
    Enter:'Enter',Tab:'Tab',Backspace:'Backspace',Delete:'Del'};
  if(M[code])return M[code];
  if(code.startsWith('Key'))return code.slice(3);
  if(code.startsWith('Digit'))return code.slice(5);
  if(code.startsWith('Numpad'))return 'Num'+code.slice(6);
  return code;
}
function isAction(action){
  const k=bindings[action];
  if(keys[k])return true;
  return(BINDING_ALIASES[action]||[]).some(a=>keys[a]);
}
function codeMatchesAction(code,action){
  return bindings[action]===code||(BINDING_ALIASES[action]||[]).includes(code);
}
function saveBindings(){try{localStorage.setItem('st_bindings',JSON.stringify(bindings));}catch(e){}}
function loadBindings(){try{const s=JSON.parse(localStorage.getItem('st_bindings'));if(s)bindings={...DEFAULT_BINDINGS,...s};}catch(e){}}

// Globální zpráva
window.msgText=''; window.msgTimer=0;
function setMsg(txt,ms=3000){window.msgText=txt;window.msgTimer=ms;}

// Spotřeba paliva — nejprve hlavní nádrž, pak záloha
function consumeFuel(p,amount){
  if(p.fuel>=amount){p.fuel=Math.max(0,p.fuel-amount);return;}
  const used=p.fuel;p.fuel=0;
  p.fuelReserve=Math.max(0,(p.fuelReserve||0)-(amount-used));
}

// Input
const keys={};
document.addEventListener('keydown',e=>{
  if(keys[e.code])return;
  keys[e.code]=true;

  // Blokuj herní klávesy pokud je otevřeno nastavení
  if(document.getElementById('settings-overlay').style.display!=='none')return;

  // Warp countdown — intercept first
  if(warpPhase==='countdown'){
    if(codeMatchesAction(e.code,'pause')){e.preventDefault();cancelWarp();return;}
    return;
  }

  if(state==='playing'){
    if(codeMatchesAction(e.code,'shoot')){e.preventDefault();tryShoot();}
    if(codeMatchesAction(e.code,'sysMap')){e.preventDefault();openMap();}
    if(codeMatchesAction(e.code,'galaxy')){e.preventDefault();openGalaxyMap();}
    if(codeMatchesAction(e.code,'warp')){e.preventDefault();startWarpCountdown();}
    if(codeMatchesAction(e.code,'dock')){e.preventDefault();tryDock();}
    if(codeMatchesAction(e.code,'parking')){parkingMode=!parkingMode;setMsg(parkingMode?'⚓ PARKOVACÍ REŽIM AKTIVNÍ':'Parkovací režim vypnut.',2500);}
    if(codeMatchesAction(e.code,'pause')){e.preventDefault();openPause();}
  } else if(state==='paused'){
    if(codeMatchesAction(e.code,'pause')){e.preventDefault();closePause();}
  } else if(state==='map'){
    if(codeMatchesAction(e.code,'sysMap')||codeMatchesAction(e.code,'pause')){e.preventDefault();closeMap();}
  } else if(state==='galaxy'){
    if(codeMatchesAction(e.code,'galaxy')||codeMatchesAction(e.code,'pause')){e.preventDefault();closeGalaxyMap();}
  } else if(state==='interior'){
    if(codeMatchesAction(e.code,'dock')){e.preventDefault();completeParkingInInterior();}
    if(codeMatchesAction(e.code,'pause')){e.preventDefault();exitInterior();}
  } else if(state==='docked'){
    if(codeMatchesAction(e.code,'dock')||codeMatchesAction(e.code,'pause')){e.preventDefault();undock();}
  }
});
document.addEventListener('keyup',e=>{keys[e.code]=false;});
window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});

function isKey(...codes){return codes.some(c=>keys[c]);}

// ---- Inicializace hry ----
function startGame(fromSave=false){
  document.getElementById('menu').style.display='none';
  document.getElementById('hud').style.display='block';
  window.warpTarget=null;
  window._warpArrival=0;
  warpPhase=null;warpTimer=0;warpElapsed=0;parkingMode=false;

  const save=fromSave?loadSave():null;
  window.currentGalaxy=(save?.galaxyId)||'sol';

  // Výchozí spawn: u Země (SOL chunk 0,0; sunX=1500,sunY=1500; Země orbit 7000, phase 2.1)
  // earthX = 1500 + cos(2.1)*7000 ≈ 1500-3534 = -2034,  earthY = 1500 + sin(2.1)*7000 ≈ 1500+6042 = 7542
  const EARTH_X=-2034, EARTH_Y=7542;
  const player={
    x:save?.x||EARTH_X, y:save?.y||EARTH_Y,
    vx:0, vy:0, angle:-Math.PI/2,
    hull:save?.hull||100, hullMax:100,
    shield:save?.shield||100, shieldMax:100,
    fuel:save?.fuel||C.FUEL_MAX, fuelMax:C.FUEL_MAX,
    fuelReserve:save?.fuelReserve??C.FUEL_MAX*0.1, fuelReserveMax:C.FUEL_MAX*0.1,
    credits:save?.credits||1000,
    cargo:save?.cargo||{}, cargoCount:save?.cargoCount||0,
    upgrades:save?.upgrades||{},
    xp:save?.xp||0, level:save?.level||1,
    invTimer:0, shieldRegenTimer:0,
    thrusting:false, boosting:false,
    dead:false
  };
  applyUpgrades(player);

  gameState={
    player, chunks:[],
    bullets:[], enemies:[], particles:[], loots:[], stationDebris:[],
    navTarget:null,
    nearStation:null, dockStation:null,
    dockingState:{approaching:false,align:0,speed:0},
    totalEarned:save?.totalEarned||0,
    playTime:save?.playTime||0,
    t:0
  };
  window.gameState=gameState;

  // Pre-generuj sluneční soustavu aby byla viditelná na mapě od začátku
  getChunk(C.SOLAR_CHUNK.cx, C.SOLAR_CHUNK.cy);

  // Spawnuj nepřátele
  spawnInitialEnemies();

  state='playing';
  setMsg('Vítejte! [W] thrust  [AD] otočení  [QE] strafe  [F] přistání  [M] mapa  [N] galaxie  [R] warp',7000);
}

function spawnInitialEnemies(){
  // Pár nepřátel do okolí
  for(let i=0;i<3;i++){
    const a=Math.random()*Math.PI*2, d=1500+Math.random()*1000;
    spawnEnemy(d*Math.cos(a),d*Math.sin(a));
  }
}

// ---- Nepřátelé ----
function spawnEnemy(x,y){
  gameState.enemies.push({
    x,y,vx:0,vy:0,angle:Math.random()*Math.PI*2,
    hp:C.ENEMY_HP,maxHp:C.ENEMY_HP,
    state:'patrol',stateTimer:0,
    shootCd:2+Math.random()*2,
    wanderAngle:Math.random()*Math.PI*2,wanderTimer:0,
    thrusting:false
  });
}

function updateEnemies(dt,player){
  const gs=gameState;
  gs.enemies.forEach(e=>{
    const d=dist2(e,player);
    e.stateTimer+=dt;
    if(e.state==='patrol'){
      if(d<700)e.state='chase';
      e.wanderTimer-=dt;
      if(e.wanderTimer<=0){e.wanderAngle+=rnd(-1,1);e.wanderTimer=rnd(1.5,4);}
      const da=angleDiff(e.wanderAngle,e.angle);
      e.angle+=clamp(da,-C.ROT_SPD*dt,C.ROT_SPD*dt);
      e.vx+=Math.cos(e.angle)*0.04;e.vy+=Math.sin(e.angle)*0.04;
      const spd=Math.hypot(e.vx,e.vy);if(spd>0.8){e.vx*=0.8/spd;e.vy*=0.8/spd;}
      e.thrusting=true;
    } else if(e.state==='chase'){
      if(d>900)e.state='patrol';
      const ta=Math.atan2(player.y-e.y,player.x-e.x);
      const da=angleDiff(ta,e.angle);
      e.angle+=clamp(da,-C.ROT_SPD*1.2*dt,C.ROT_SPD*1.2*dt);
      if(d>150){e.vx+=Math.cos(e.angle)*0.12;e.vy+=Math.sin(e.angle)*0.12;}
      else{e.vx*=0.9;e.vy*=0.9;}
      const spd=Math.hypot(e.vx,e.vy);if(spd>2.5){e.vx*=2.5/spd;e.vy*=2.5/spd;}
      e.thrusting=d>150;
      // Střelba
      e.shootCd-=dt;
      if(d<400&&e.shootCd<=0){
        e.shootCd=1.8+Math.random()*1.5;
        const spread=(Math.random()-.5)*0.08;
        const sa=Math.atan2(player.y-e.y,player.x-e.x)+spread;
        gs.bullets.push({x:e.x+Math.cos(e.angle)*16,y:e.y+Math.sin(e.angle)*16,
          vx:Math.cos(sa)*C.BULLET_SPD*0.8,vy:Math.sin(sa)*C.BULLET_SPD*0.8,
          life:1.8,owner:'enemy',dmg:C.ENEMY_DMG});
      }
    }
    e.vx*=0.97;e.vy*=0.97;e.x+=e.vx;e.y+=e.vy;

    // Odhazuj nepřátele pokud moc daleko
    if(dist2(e,player)>5000)Object.assign(e,{x:player.x+rnd(-4000,4000),y:player.y+rnd(-4000,4000),hp:C.ENEMY_HP,state:'patrol'});
  });

  // Periodicky přidej nové nepřátele (max 5)
  if(gs.enemies.length<5&&Math.random()<dt*0.02){
    const a=Math.random()*Math.PI*2,d=1200+Math.random()*800;
    spawnEnemy(player.x+Math.cos(a)*d,player.y+Math.sin(a)*d);
  }
}

// ---- Střelba ----
let shootCd=0;
function tryShoot(){
  if(state!=='playing'||!gameState||gameState.player.dead)return;
  if(shootCd>0)return;
  const p=gameState.player;
  const wpLvl=p.upgrades.weapons||0;
  shootCd=C.SHOOT_CD*(1-wpLvl*0.08);
  const bx=p.x+Math.cos(p.angle)*20, by=p.y+Math.sin(p.angle)*20;
  const dmg=C.BULLET_DMG+wpLvl*10;
  gameState.bullets.push({x:bx,y:by,
    vx:p.vx*0.2+Math.cos(p.angle)*C.BULLET_SPD,
    vy:p.vy*0.2+Math.sin(p.angle)*C.BULLET_SPD,
    life:1.4,owner:'player',dmg});
  spawnParticles(bx,by,4,'#ff9500',3,0.3,true);
}

// ---- Přistání ----
function tryDock(){
  if(!gameState)return;
  const gs=gameState;
  if(gs.dockingState.dockable&&gs.nearStation){
    initDockingSequence(gs.nearStation);
  }
}

function initDockingSequence(station){
  const gs=gameState,p=gs.player;
  const portFrac=station.type==='large'?1.0:0.88;
  const portX=station.x+station.r*portFrac*Math.cos(station.angle);
  const portY=station.y+station.r*portFrac*Math.sin(station.angle);
  const dur=station.type==='large'?5.2:3.8;
  gs.dockAnim={station,phase:1,timer:0,duration:dur,progress:0,
    startX:p.x,startY:p.y,portX,portY,
    savedRotSpeed:station.rotSpeed};
  station.rotSpeed=station.type==='large'?0.00004:0.00012;
  state='docking';
  document.getElementById('hud').style.display='none';
  setMsg('');
}

function completeDocking(station){
  const anim=gameState.dockAnim;
  if(station.type==='large'){
    // Phase 1 done — fly through slot into interior (phase 2)
    const p=gameState.player;
    const iR=station.r*0.82;
    anim.phase=2;
    anim.timer=0;
    anim.duration=1.6;
    anim.progress=0;
    anim.startX=p.x;
    anim.startY=p.y;
    // Target: dead center of the station (hub)
    anim.targetX=station.x;
    anim.targetY=station.y;
  } else {
    if(anim)station.rotSpeed=anim.savedRotSpeed;
    gameState.dockAnim=null;
    startDocking(station);
  }
}

function showParkingBayUI(station){
  state='docked';
  window._parkingStation=station;
  document.getElementById('parking-station-name').textContent=station.name;
  const grid=document.getElementById('parking-bays-grid');
  grid.innerHTML='';
  // Seed bays from station name for consistent layout
  const seed=station.name.split('').reduce((s,c)=>s+c.charCodeAt(0),0);
  const rng2=makeRng(seed);
  const numBays=8;
  for(let i=1;i<=numBays;i++){
    const occupied=rng2()<0.28;
    const btn=document.createElement('button');
    btn.className='parking-bay-btn'+(occupied?' occupied':'');
    btn.innerHTML=`<div class="bay-num">BAY-${String(i).padStart(2,'0')}</div>`+
      `<div class="bay-status">${occupied?'🔴 OBSAZENO':'🟢 VOLNÉ'}</div>`;
    if(!occupied){
      btn.onclick=()=>selectParkingBay(station,i);
    } else {
      btn.disabled=true;
    }
    grid.appendChild(btn);
  }
  document.getElementById('parking-overlay').style.display='flex';
}

function selectParkingBay(station,bayNum){
  window._parkingStation=null;
  document.getElementById('parking-overlay').style.display='none';
  setMsg(`Coriolis hangár — přistání na BAY-${String(bayNum).padStart(2,'0')} potvrzeno.`,3500);
  startDocking(station);
}

function enterInterior(station){
  const gs=gameState,p=gs.player;
  gs.dockAnim=null;
  const iR=station.r*0.82;
  // Bays built into the ring wall — far from center, spread in a wide arc
  const bayDist=iR*0.80;
  const entryA=station.angle;
  // 6 bays spread across 270° arc, leaving 90° gap at the entry/exit slot
  const bayOffs=[55,110,165,195,250,305].map(d=>d*Math.PI/180);
  const seed=station.name.split('').reduce((s,c)=>s+c.charCodeAt(0),0);
  const rngB=makeRng(seed+777);
  const bays=bayOffs.map((off,i)=>{
    const a=entryA+off;
    return{
      x:station.x+Math.cos(a)*bayDist,
      y:station.y+Math.sin(a)*bayDist,
      angle:a, num:i+1,
      occupied:rngB()<0.3,
      r:iR*0.16
    };
  });
  // Player arrives at hub center — zero velocity, facing the interior
  p.vx=0;p.vy=0;
  p.angle=station.angle+Math.PI; // face back toward entry slot
  p.thrusting=false;p.boosting=false;
  interiorData={station,iR,bays,entryFlash:1.0,nearBay:null};
  state='interior';
  document.getElementById('hud').style.display='block';
  setMsg('VNITŘEK STANICE — [WASDQE] pro let  •  [F] přistát u hangáru  •  ESC = nouzový výstup',8000);
}

function updateInterior(dt){
  if(!interiorData)return;
  const id=interiorData,gs=gameState,p=gs.player,st=id.station;
  if(p.dead)return;

  // Fade entry flash
  if(id.entryFlash>0)id.entryFlash=Math.max(0,id.entryFlash-dt*2.5);

  st.angle+=st.rotSpeed*dt;
  if(window.msgTimer>0)window.msgTimer=Math.max(0,window.msgTimer-dt*1000);
  gs.t+=dt;
  if(shootCd>0)shootCd=Math.max(0,shootCd-dt);

  // Full flight controls — spacious interior, only slightly reduced thrust
  const intMult=0.70;
  const thrusting=isAction('thrust');
  const boost=isAction('boost')&&p.fuel>0;
  const rotL=isAction('rotLeft');
  const rotR=isAction('rotRight');
  const strafeL=isAction('strafeL');
  const strafeR=isAction('strafeR');
  window._strafeL=strafeL;window._strafeR=strafeR;

  if(rotL)p.angle-=C.ROT_SPD*dt;
  if(rotR)p.angle+=C.ROT_SPD*dt;

  if(thrusting){
    const thrust=(boost?C.BOOST_THRUST:C.THRUST)*intMult;
    p.vx+=Math.cos(p.angle)*thrust;
    p.vy+=Math.sin(p.angle)*thrust;
    consumeFuel(p,boost?C.FUEL_BOOST*0.5:C.FUEL_THRUST*0.5);
    spawnTrail(p);
  }
  if(strafeL){p.vx+=Math.sin(p.angle)*C.SIDE_THRUST*intMult;p.vy-=Math.cos(p.angle)*C.SIDE_THRUST*intMult;}
  if(strafeR){p.vx-=Math.sin(p.angle)*C.SIDE_THRUST*intMult;p.vy+=Math.cos(p.angle)*C.SIDE_THRUST*intMult;}

  p.thrusting=thrusting;p.boosting=boost&&thrusting;

  // Speed cap — generous inside the station
  const spd=Math.hypot(p.vx,p.vy);
  const maxIntSpd=boost?C.MAX_SPD*1.4:C.MAX_SPD*0.85;
  if(spd>maxIntSpd){p.vx*=maxIntSpd/spd;p.vy*=maxIntSpd/spd;}
  const drag=boost?C.DRAG_BOOST:C.DRAG;
  p.vx*=drag;p.vy*=drag;
  p.x+=p.vx;p.y+=p.vy;

  // Soft wall boundary — ring wall, slight damage on hard impact
  const wallD=Math.hypot(p.x-st.x,p.y-st.y);
  const wallR=id.iR*0.86;
  if(wallD>wallR){
    const nx=(p.x-st.x)/wallD,ny=(p.y-st.y)/wallD;
    const dot=p.vx*nx+p.vy*ny;
    p.vx=(p.vx-2*dot*nx)*0.60;p.vy=(p.vy-2*dot*ny)*0.60;
    p.x=st.x+nx*wallR;p.y=st.y+ny*wallR;
    if(dot>2.0)hitPlayer(Math.ceil(dot*2));
  }

  // Engine trails
  engineTrails.forEach(t=>{t.x+=t.vx;t.y+=t.vy;t.life-=dt;t.vx*=0.92;t.vy*=0.92;});
  engineTrails=engineTrails.filter(t=>t.life>0);

  // Particles
  gs.particles.forEach(pt=>{pt.x+=pt.vx;pt.y+=pt.vy;pt.life-=dt;pt.vx*=0.93;pt.vy*=0.93;});
  gs.particles=gs.particles.filter(pt=>pt.life>0);

  // Camera follows PLAYER — station interior shifts as you move through it
  camX=p.x-W/2;camY=p.y-H/2;
  // Zoom: enough to see the ring wall from the center; feels vast when flying
  const targetZoom=Math.min(W,H)*0.30/id.iR;
  camZoom+=(targetZoom-camZoom)*Math.min(1,dt*2.5);

  gs.chunks=getVisibleChunks(p.x,p.y);

  // Find nearest free bay
  id.nearBay=null;
  let closestBD=Infinity;
  id.bays.forEach(bay=>{
    if(bay.occupied)return;
    const bd=Math.hypot(p.x-bay.x,p.y-bay.y);
    if(bd<bay.r*2.2&&bd<closestBD){closestBD=bd;id.nearBay=bay;}
  });

  if(p.invTimer>0)p.invTimer=Math.max(0,p.invTimer-dt);
  p.shieldRegenTimer+=dt;
  if(p.shieldRegenTimer>5)p.shield=Math.min(p.shieldMax,p.shield+dt*8);
}

function completeParkingInInterior(){
  if(!interiorData)return;
  const bay=interiorData.nearBay;
  if(!bay){setMsg('Nejsi dostatečně blízko hangáru.',2000);return;}
  const st=interiorData.station;
  bay.occupied=true;
  interiorData=null;
  setMsg(`BAY-${String(bay.num).padStart(2,'0')} — přistání potvrzeno.`,3500);
  startDocking(st);
}

function exitInterior(){
  if(!interiorData)return;
  const st=interiorData.station,p=gameState.player;
  interiorData=null;
  state='playing';
  // Eject out through slot
  p.x=st.x+Math.cos(st.angle)*st.r*0.45;
  p.y=st.y+Math.sin(st.angle)*st.r*0.45;
  p.vx=Math.cos(st.angle)*3.5;p.vy=Math.sin(st.angle)*3.5;
  p.angle=st.angle;
  camZoom=0.6;
  document.getElementById('hud').style.display='block';
  setMsg('Nouzový výstup ze stanice.',2500);
}

function updateDocking(dt){
  const gs=gameState;
  if(!gs.dockAnim)return;
  const anim=gs.dockAnim,p=gs.player,st=anim.station;

  if(anim.phase===2){
    anim.timer+=dt;
    anim.progress=Math.min(1,anim.timer/anim.duration);
    const ease=Math.pow(anim.progress,0.55);
    p.x=anim.startX+(anim.targetX-anim.startX)*ease;
    p.y=anim.startY+(anim.targetY-anim.startY)*ease;
    p.angle=Math.atan2(anim.targetY-anim.startY,anim.targetX-anim.startX);
    p.thrusting=anim.progress<0.7;p.boosting=false;
    st.angle+=st.rotSpeed*dt;
    camX=st.x-W/2;camY=st.y-H/2;
    gs.chunks=getVisibleChunks(p.x,p.y);
    if(anim.progress>=1)enterInterior(st);
    return;
  }

  anim.timer+=dt;
  anim.progress=Math.min(1,anim.timer/anim.duration);
  const prog=anim.progress;
  // Let k dokovacímu portu (zmrazená pozice)
  const ease=Math.pow(Math.min(1,prog*1.08),0.6);
  p.x=anim.startX+(anim.portX-anim.startX)*ease;
  p.y=anim.startY+(anim.portY-anim.startY)*ease;
  p.angle=Math.atan2(anim.portY-anim.startY,anim.portX-anim.startX);
  p.thrusting=prog<0.8;p.boosting=false;
  // Rotace stanice (téměř zastavena)
  st.angle+=st.rotSpeed*dt;
  // Engine trail
  if(prog<0.8){
    for(let i=0;i<3;i++){
      const spread=(Math.random()-.5)*0.25,ba=p.angle+Math.PI+spread,spd=rnd(0.8,2.2);
      engineTrails.push({
        x:p.x+Math.cos(p.angle+Math.PI)*16+rnd(-3,3),
        y:p.y+Math.sin(p.angle+Math.PI)*16+rnd(-3,3),
        vx:Math.cos(ba)*spd,vy:Math.sin(ba)*spd,
        life:rnd(0.1,0.32),maxLife:0.32,r:rnd(1.5,2.8),color:'#ff7700',glow:true
      });
    }
  }
  engineTrails.forEach(tr=>{tr.x+=tr.vx;tr.y+=tr.vy;tr.life-=dt;tr.vx*=0.92;tr.vy*=0.92;});
  engineTrails=engineTrails.filter(tr=>tr.life>0);
  camX=st.x-W/2;camY=st.y-H/2; // kamera na stanici, loď je vidět jak letí do portu
  gs.chunks=getVisibleChunks(p.x,p.y);
  if(!gs.chunks.find(ch=>ch.cx===C.SOLAR_CHUNK.cx&&ch.cy===C.SOLAR_CHUNK.cy))
    gs.chunks.push(getChunk(C.SOLAR_CHUNK.cx,C.SOLAR_CHUNK.cy));
  if(anim.progress>=1)completeDocking(st);
}

function startDocking(station){
  const gs=gameState;
  gs.player.vx=0;gs.player.vy=0;
  gs.dockStation=station;
  parkingMode=false;
  state='docked';
  document.getElementById('hud').style.display='none';
  renderDockPanel(gs.player,station);
  setMsg('');
}

function undock(){
  if(!gameState)return;
  state='playing';
  const p=gameState.player;
  // Odleť v opačném směru od stanice
  const st=gameState.dockStation;
  if(st){
    if(st.type==='large'){
      // Launch out through the mail slot
      p.x=st.x+Math.cos(st.angle)*st.r*0.45;
      p.y=st.y+Math.sin(st.angle)*st.r*0.45;
      p.vx=Math.cos(st.angle)*3;p.vy=Math.sin(st.angle)*3;
      p.angle=st.angle;
    } else {
      const dx=p.x-st.x,dy=p.y-st.y;
      const d=Math.hypot(dx,dy)||1;
      p.vx=dx/d*2;p.vy=dy/d*2;
    }
  }
  gameState.dockStation=null;
  document.getElementById('dock-panel').style.display='none';
  document.getElementById('trade-overlay').style.display='none';
  document.getElementById('parking-overlay').style.display='none';
  document.getElementById('hud').style.display='block';
  saveGame();
  setMsg('Vzlet dokončen.',2000);
}

// ---- Mapa ----
function openMap(){
  state='map';
  document.getElementById('map-overlay').style.display='flex';
  // Přizpůsob canvas aktuální velikosti okna
  if(mapCanvas){
    const hdr=document.getElementById('map-header');
    const hdrH=hdr?hdr.offsetHeight||48:48;
    mapCanvas.width=window.innerWidth;
    mapCanvas.height=Math.max(300,window.innerHeight-hdrH);
  }
  drawBigMap();
}
function closeMap(){
  state='playing';
  document.getElementById('map-overlay').style.display='none';
}

// ---- Galaxy mapa ----
function openGalaxyMap(){
  state='galaxy';
  document.getElementById('galaxy-overlay').style.display='flex';
  resizeGalaxyCanvas();
  startGalaxyAnim();
}
function closeGalaxyMap(){
  state='playing';
  document.getElementById('galaxy-overlay').style.display='none';
  stopGalaxyAnim();
}

// ---- Warp systém ----
function startWarpCountdown(){
  if(!window.warpTarget){setMsg('Nejdřív nastav kurz — stiskni [N] pro mapu galaxií.',3500);return;}
  const p=gameState.player;
  const g=window.warpTarget;
  const hullPct=p.hull/p.hullMax*100;
  const fuelPct=p.fuel/p.fuelMax*100;
  if(hullPct<g.intReq){setMsg(`Trup příliš poškozen! Min. ${g.intReq}% (máš ${Math.floor(hullPct)}%).`,4000);return;}
  if(fuelPct<g.fuelCost){setMsg(`Nedostatek paliva! Potřebuješ ${g.fuelCost}% nádrže (máš ${Math.floor(fuelPct)}%).`,4000);return;}
  warpPhase='countdown';
  warpTimer=20;
  document.getElementById('warp-dest-name').textContent=g.name;
  document.getElementById('warp-countdown-num').textContent='20';
  document.getElementById('warp-bar-fill').style.width='0%';
  document.getElementById('warp-overlay').style.display='flex';
}
function cancelWarp(){
  warpPhase=null;warpTimer=0;
  document.getElementById('warp-overlay').style.display='none';
  setMsg('Warpové motory vypnuty.',2000);
}
function beginWarp(){
  const p=gameState.player;
  const g=window.warpTarget;
  p.fuel=Math.max(0,p.fuel-(g.fuelCost/100)*p.fuelMax);
  // Loď NELÉTÁ zpět — pokračuje s aktuální rychlostí
  warpPhase='boosting';
  warpElapsed=0;
  document.getElementById('warp-overlay').style.display='none';
  setMsg('TERMOHMOTOVÉ MOTORY NASTARTOVÁNY — drž [W] pro warp!',6000);
}
function completeWarp(){
  const g=window.warpTarget;
  const p=gameState.player;
  // Záblesk při příjezdu
  window._warpArrival=0.9;
  // Prudké zpomalení
  p.vx*=0.03;p.vy*=0.03;
  window.currentGalaxy=g.id;
  window.warpTarget=null;
  warpPhase=null;warpElapsed=0;
  chunkCache.clear();
  // Sol: přistání u Země; ostatní: zůstaň na aktuální pozici (nový svět se vygeneruje kolem)
  if(g.id==='sol'){p.x=-2034;p.y=7542;p.vx=0;p.vy=0;p.angle=-Math.PI/2;getChunk(C.SOLAR_CHUNK.cx,C.SOLAR_CHUNK.cy);}
  getChunk(Math.floor(p.x/C.CHUNK),Math.floor(p.y/C.CHUNK));
  gameState.bullets=[];gameState.enemies=[];gameState.particles=[];gameState.loots=[];
  gameState.navTarget=null;
  spawnInitialEnemies();
  setMsg(`Warp úspěšný! Vítejte v ${g.name}.`,6000);
}

function clearNav(){
  if(gameState){gameState.navTarget=null;setMsg('Navigace zrušena.',1500);}
}

// ---- Pause ----
let _pauseShipAnimId=null;
let _pauseStars=null;

function openPause(){
  if(state!=='playing')return;
  state='paused';
  _updatePauseStats();
  document.getElementById('pause-screen').style.display='flex';
  _startPauseShipAnim();
}

function closePause(){
  state='playing';
  document.getElementById('pause-screen').style.display='none';
  _stopPauseShipAnim();
}

function _updatePauseStats(){
  if(!gameState)return;
  const p=gameState.player;
  const cmax=getCargoMax(p);
  const xpPct=Math.min(100,Math.round(p.xp/xpNeeded(p.level)*100));
  document.getElementById('esc-credits-val').textContent=p.credits.toLocaleString()+' Cr';
  document.getElementById('esc-level-val').textContent=p.level;
  document.getElementById('esc-earned-val').textContent=(gameState.totalEarned||0).toLocaleString()+' Cr';
  const hullPct=Math.round(p.hull/p.hullMax*100);
  const shieldPct=Math.round(p.shield/p.shieldMax*100);
  const fuelPct=Math.round(p.fuel/p.fuelMax*100);
  document.getElementById('esc-hull-val').textContent=hullPct+'%';
  document.getElementById('esc-shield-val').textContent=shieldPct+'%';
  document.getElementById('esc-fuel-val').textContent=fuelPct+'%';
  document.getElementById('esc-xp-val').textContent=xpPct+'%';
  document.getElementById('esc-hull-bar').style.width=hullPct+'%';
  document.getElementById('esc-shield-bar').style.width=shieldPct+'%';
  document.getElementById('esc-fuel-bar').style.width=fuelPct+'%';
  document.getElementById('esc-xp-bar').style.width=xpPct+'%';
  document.getElementById('esc-cargo-val').textContent=p.cargoCount+' / '+cmax;
  const upgCount=Object.values(p.upgrades).reduce((s,v)=>s+v,0);
  document.getElementById('esc-upgrades-val').textContent=upgCount>0?upgCount+' instalováno':'žádné';
}

function _startPauseShipAnim(){
  const canvas=document.getElementById('esc-ship-canvas');
  if(!canvas)return;

  function frame(ts){
    if(state!=='paused'){_pauseShipAnimId=null;return;}
    // Resize canvas na správnou velikost při každém framu (layout mohl ještě nebýt hotov)
    const vp=document.getElementById('esc-ship-viewport');
    const vpW=vp.clientWidth||600, vpH=vp.clientHeight||400;
    if(canvas.width!==vpW||canvas.height!==vpH){
      canvas.width=vpW;canvas.height=vpH;
      _pauseStars=null; // Přegeneruj hvězdy pro novou velikost
    }
    // Vygeneruj hvězdy pokud ještě neexistují
    if(!_pauseStars){
      _pauseStars=Array.from({length:160},()=>({
        x:Math.random()*vpW, y:Math.random()*vpH,
        r:Math.random()*1.3+0.2,
        bright:0.2+Math.random()*0.8,
        speed:0.4+Math.random()*1.2,
        phase:Math.random()*Math.PI*2,
        color:['#e8eeff','#90b8ff','#ffeeaa','#ffd0a0'][Math.floor(Math.random()*4)]
      }));
    }
    _drawPauseShip(canvas,ts/1000);
    _pauseShipAnimId=requestAnimationFrame(frame);
  }
  _pauseShipAnimId=requestAnimationFrame(frame);
}

function _stopPauseShipAnim(){
  if(_pauseShipAnimId)cancelAnimationFrame(_pauseShipAnimId);
  _pauseShipAnimId=null;
}

function _drawPauseShip(canvas,t){
  const pc=canvas.getContext('2d');
  const pw=canvas.width, ph=canvas.height;
  const cx=pw/2, cy=ph*0.50;
  const scale=4.8;

  pc.clearRect(0,0,pw,ph);

  if(window.lightMode){
    // Světlé pozadí — bílé s jemným gradientem
    const bg=pc.createRadialGradient(cx,cy,0,cx,cy,Math.min(pw,ph)*0.7);
    bg.addColorStop(0,'#ffffff');
    bg.addColorStop(1,'#e8f0ff');
    pc.fillStyle=bg;pc.fillRect(0,0,pw,ph);
    // Jemné hvězdy — černé tečky
    _pauseStars.forEach(s=>{
      const tw=0.4+Math.sin(t*s.speed+s.phase)*0.3;
      pc.globalAlpha=Math.min(1,s.bright*tw*1.8);
      pc.fillStyle='#000000';
      pc.beginPath();pc.arc(s.x,s.y,Math.max(s.r,0.4),0,Math.PI*2);pc.fill();
    });
    pc.globalAlpha=1;
  } else {
    // Tmavé pozadí
    pc.fillStyle='#000408';pc.fillRect(0,0,pw,ph);
    _pauseStars.forEach(s=>{
      const tw=0.55+Math.sin(t*s.speed+s.phase)*0.45;
      pc.globalAlpha=s.bright*tw;
      pc.fillStyle=s.color;
      pc.beginPath();pc.arc(s.x,s.y,s.r,0,Math.PI*2);pc.fill();
    });
    pc.globalAlpha=1;
    // Mlhovina
    const neb=pc.createRadialGradient(cx,cy,0,cx,cy,Math.min(pw,ph)*0.45);
    neb.addColorStop(0,'rgba(40,15,80,0.22)');
    neb.addColorStop(0.5,'rgba(255,80,0,0.07)');
    neb.addColorStop(1,'transparent');
    pc.fillStyle=neb;pc.fillRect(0,0,pw,ph);
  }

  const glowPulse=0.5+Math.sin(t*1.4)*0.5;

  // Záře za motorama
  const engScreenY=cy+scale*16;
  const engA=pc.createRadialGradient(cx,engScreenY,0,cx,engScreenY,scale*18);
  engA.addColorStop(0,'rgba(80,160,255,'+(0.25+glowPulse*0.18)+')');
  engA.addColorStop(1,'transparent');
  pc.fillStyle=engA;pc.beginPath();pc.arc(cx,engScreenY,scale*18,0,Math.PI*2);pc.fill();

  // === Raketoplan v scale bloku ===
  pc.save();
  pc.translate(cx,cy);
  pc.scale(scale,scale);

  // 3 SSME plameny (pod motorovou sekcí, y=16)
  const fl=8+Math.sin(t*11)*4;
  [-4,0,4].forEach((ex,i)=>{
    const phase=t*9+i*1.1;
    const fli=fl+Math.sin(phase)*3;
    pc.globalAlpha=0.85+Math.sin(phase)*0.1;
    const eg=pc.createLinearGradient(ex,16,ex,16+fli);
    eg.addColorStop(0,'rgba(160,210,255,1)');
    eg.addColorStop(0.2,'rgba(80,160,255,0.85)');
    eg.addColorStop(0.6,'rgba(40,80,255,0.4)');
    eg.addColorStop(1,'transparent');
    pc.fillStyle=eg;
    pc.beginPath();pc.ellipse(ex,16+fli*.5,1.5+Math.sin(phase)*.3,fli*.55,0,0,Math.PI*2);pc.fill();
    // Jádro bílé
    pc.globalAlpha=0.7;
    const eg2=pc.createLinearGradient(ex,16,ex,16+fli*.4);
    eg2.addColorStop(0,'rgba(255,255,255,0.95)');eg2.addColorStop(1,'transparent');
    pc.fillStyle=eg2;
    pc.beginPath();pc.ellipse(ex,16+fli*.2,.7,fli*.25,0,0,Math.PI*2);pc.fill();
  });
  pc.globalAlpha=1;

  // Raketoplan (volá drawGameShuttle přes dočasný ctx swap)
  const _savedCtx=ctx;
  ctx=pc;
  drawGameShuttle();
  ctx=_savedCtx;

  pc.restore();

  // Štít
  if(gameState&&gameState.player.shield>0){
    const shPct=gameState.player.shield/gameState.player.shieldMax;
    pc.save();
    pc.globalAlpha=0.05+shPct*0.2+Math.sin(t*2.2)*0.03;
    pc.strokeStyle='#4488ff';pc.lineWidth=2;
    pc.shadowColor='#4488ff';pc.shadowBlur=12;
    pc.beginPath();pc.arc(cx,cy,scale*26,0,Math.PI*2);pc.stroke();
    pc.restore();
  }

  // CRT scan lines (jen v dark mode)
  if(!window.lightMode){
    pc.globalAlpha=0.022;
    for(let y2=0;y2<ph;y2+=4){pc.fillStyle='#000';pc.fillRect(0,y2,pw,2);}
    pc.globalAlpha=1;
  }
}

// ---- Částice ----
function spawnParticles(x,y,n,color,speed,life=0.6,glow=false){
  if(!gameState)return;
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2,s=rnd(0.2,speed);
    gameState.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life,maxLife:life,color,r:rnd(1,3),glow});
  }
}
function spawnExplosion(x,y,big=false){
  const n=big?40:18;
  spawnParticles(x,y,n,'#ff6600',big?4:3,0.9,true);
  spawnParticles(x,y,Math.ceil(n*0.4),'#ffffff',big?6:4,0.35,false);
  spawnParticles(x,y,Math.ceil(n*0.3),'#ffcc00',big?2:1.5,1.4,false);
}

function stationCrash(st){
  const gs=gameState,p=gs.player;
  if(p.dead||p.invTimer>0)return;

  // Initial flash explosions
  spawnExplosion(p.x,p.y,true);
  for(let i=0;i<4;i++){
    const ox=(Math.random()-.5)*st.r*0.8,oy=(Math.random()-.5)*st.r*0.8;
    spawnExplosion(st.x+ox,st.y+oy,true);
  }

  // Station breaks into large structural debris chunks that float in space
  gs.stationDebris=gs.stationDebris||[];
  const debCols=[st.color,st.color,st.color+'cc','#1a2030','#0a1520','#2a1500','#151515'];
  const numChunks=22+Math.floor(Math.random()*12);
  for(let i=0;i<numChunks;i++){
    const a=(i/numChunks)*Math.PI*2+(Math.random()-.5)*0.55;
    const speed=0.3+Math.random()*2.8;
    const dist=st.r*(0.1+Math.random()*0.8);
    // Bigger pieces further out, smaller near impact
    const sz=i<6?(60+Math.random()*80):(20+Math.random()*55);
    const nv=4+Math.floor(Math.random()*4);
    const verts=[];
    for(let j=0;j<nv;j++){
      const jA=(j/nv)*Math.PI*2+(Math.random()-.5)*0.55;
      const r=sz*(0.3+Math.random()*0.7);
      verts.push({x:Math.cos(jA)*r,y:Math.sin(jA)*r});
    }
    gs.stationDebris.push({
      x:st.x+Math.cos(a)*dist, y:st.y+Math.sin(a)*dist,
      vx:Math.cos(a)*speed+p.vx*0.2,
      vy:Math.sin(a)*speed+p.vy*0.2,
      angle:Math.random()*Math.PI*2,
      rotSpeed:(Math.random()-.5)*0.03,
      verts, sz,
      color:debCols[Math.floor(Math.random()*debCols.length)],
      glowFade:1.0 // hot debris glow that fades
    });
  }
  // Small ship debris (particles — these are fine)
  spawnParticles(p.x,p.y,35,'#4488ff',5,1.8,true);
  spawnParticles(p.x,p.y,20,'#ff9500',4,1.2,true);

  // Heavy screen shake
  shakeX=(Math.random()-.5)*60;shakeY=(Math.random()-.5)*60;
  p.dead=true;
  setMsg('KOLIZE SE STANICÍ — KATASTROFICKÝ VÝBUCH!',5000);
  setTimeout(showDeath,2400);
}

// ---- Engine trails ----
let engineTrails=[];
function spawnTrail(p){
  if(!isAction('thrust'))return;
  const boost=isAction('boost')&&p.fuel>0;
  const n=boost?4:2;
  for(let i=0;i<n;i++){
    const spread=(Math.random()-.5)*0.3;
    const ba=p.angle+Math.PI+spread;
    const spd=rnd(1,boost?3.5:2);
    engineTrails.push({
      x:p.x+Math.cos(p.angle+Math.PI)*16+rnd(-3,3),
      y:p.y+Math.sin(p.angle+Math.PI)*16+rnd(-3,3),
      vx:Math.cos(ba)*spd+p.vx*0.1,vy:Math.sin(ba)*spd+p.vy*0.1,
      life:boost?rnd(.2,.5):rnd(.1,.3),maxLife:boost?.5:.3,
      r:rnd(1.5,boost?4:2.5),
      color:boost?'#00aaff':'#ff7700',glow:true
    });
  }
}

// ---- Fyzika & update ----
function update(dt){
  if(!gameState)return;

  // Warp countdown — hra zmražena (ale render běží pro warm-up efekt)
  if(warpPhase==='countdown'){
    warpTimer=Math.max(0,warpTimer-dt);
    const pct=(20-warpTimer)/20;
    document.getElementById('warp-countdown-num').textContent=Math.ceil(warpTimer)||'0';
    document.getElementById('warp-bar-fill').style.width=(pct*100)+'%';
    if(warpTimer<=0)beginWarp();
    return;  // hra zmražena
  }

  if(state!=='playing')return;
  const gs=gameState;
  const p=gs.player;
  if(p.dead)return;

  gs.t+=dt;
  if(shootCd>0)shootCd=Math.max(0,shootCd-dt);
  if(window.msgTimer>0)window.msgTimer=Math.max(0,window.msgTimer-dt*1000);

  // Pohyb hráče
  const thrusting=isAction('thrust');
  const rotL=isAction('rotLeft');
  const rotR=isAction('rotRight');
  const strafeL=isAction('strafeL');
  const strafeR=isAction('strafeR');
  const warpBoosting=warpPhase==='boosting'&&thrusting;
  const normalBoost=!warpBoosting&&isAction('boost')&&thrusting&&p.fuel>0;
  const boost=normalBoost||warpBoosting;
  window._strafeL=strafeL; window._strafeR=strafeR;
  window._warpBoosting=warpBoosting;

  const engMult=1+0.15*(p.upgrades.engine||0);
  const parkMult=parkingMode?0.28:1;

  // Hlavní motor — warp má mnohem větší tah, parking má nízký tah
  if(thrusting){
    const thrust=warpBoosting?C.WARP_THRUST:(boost?C.BOOST_THRUST:C.THRUST)*engMult*parkMult;
    p.vx+=Math.cos(p.angle)*thrust;p.vy+=Math.sin(p.angle)*thrust;
    if(!warpBoosting)consumeFuel(p,boost?C.FUEL_BOOST:C.FUEL_THRUST);
    spawnTrail(p);
  }

  // Boční trysky — strafe (zakázáno při warpu)
  if(warpPhase!=='boosting'){
    const sideThr=C.SIDE_THRUST*engMult*parkMult;
    if(strafeL){p.vx+=Math.sin(p.angle)*sideThr;p.vy-=Math.cos(p.angle)*sideThr;consumeFuel(p,C.FUEL_THRUST*0.4);}
    if(strafeR){p.vx-=Math.sin(p.angle)*sideThr;p.vy+=Math.cos(p.angle)*sideThr;consumeFuel(p,C.FUEL_THRUST*0.4);}
  }

  // Speed cap — v parkovacím režimu velmi nízký, žádný při boost nebo warpu
  if(!boost){
    const spd=Math.hypot(p.vx,p.vy);
    const maxSpd=parkingMode?3.5:C.MAX_SPD*engMult;
    if(spd>maxSpd){p.vx*=maxSpd/spd;p.vy*=maxSpd/spd;}
  }

  // Drag — parking má vysoký drag (loď přirozeně zpomaluje), warp minimální
  const drag=warpBoosting?C.DRAG_WARP:parkingMode?0.90:(boost?C.DRAG_BOOST:C.DRAG);
  p.vx*=drag;p.vy*=drag;
  p.x+=p.vx;p.y+=p.vy;

  // Rotace A/D (zakázáno při warpu)
  if(warpPhase!=='boosting'){
    if(rotL)p.angle-=C.ROT_SPD*dt;
    if(rotR)p.angle+=C.ROT_SPD*dt;
  }

  p.thrusting=thrusting;p.boosting=boost;

  // Camera zoom — oddaluje se s rychlostí
  const spd=Math.hypot(p.vx,p.vy);
  const targetZoom=Math.max(0.08,1/(1+spd*0.026));
  camZoom+=(targetZoom-camZoom)*Math.min(1,dt*2.8);

  // Warp boost — počítej čas při vysoké rychlosti → příjezd
  if(warpPhase==='boosting'){
    const spdKms=spd*C.SPEED_KMS_FACTOR;
    if(spdKms>=C.WARP_SPEED_KMS){warpElapsed+=dt;}
    if(window.warpTarget&&warpElapsed>=window.warpTarget.warpSecs){completeWarp();return;}
  }

  // Idle fuel
  consumeFuel(p,C.FUEL_IDLE);

  // Invincibility
  if(p.invTimer>0)p.invTimer=Math.max(0,p.invTimer-dt);

  // Shield regen
  p.shieldRegenTimer+=dt;
  if(p.shieldRegenTimer>5)p.shield=Math.min(p.shieldMax,p.shield+dt*8);

  // Screen shake decay
  shakeX*=0.82;shakeY*=0.82;

  // Camera follow
  camX=p.x-W/2;camY=p.y-H/2;

  // Chunks
  gs.chunks=getVisibleChunks(p.x,p.y);
  // Sluneční soustava je vždy viditelná (planety na vzdálenost 120 000 jednotek)
  if(!gs.chunks.find(ch=>ch.cx===C.SOLAR_CHUNK.cx&&ch.cy===C.SOLAR_CHUNK.cy))
    gs.chunks.push(getChunk(C.SOLAR_CHUNK.cx,C.SOLAR_CHUNK.cy));

  // Stanice — dokovací logika
  gs.nearStation=null;
  let closestStD=Infinity;
  const processStation=(st)=>{
    if(!st)return;
    st.angle+=st.rotSpeed;
    const d=dist2(p,st);
    const nearRange=st.type==='large'?st.r*4:800;
    if(d<closestStD){closestStD=d;if(d<nearRange)gs.nearStation=st;}
  };
  gs.chunks.forEach(ch=>{
    if(!ch.system)return;
    processStation(ch.system.station);
    // Planetární a měsíční stanice — aktualizuj pozice aby sledovaly planetu/měsíc
    ch.system.planets?.forEach(pl=>{
      const pos=getPlanetPos(pl,ch.system.sx,ch.system.sy,gs.t);
      if(pl.station){
        pl.station.x=pos.x+(pl.r+pl.station.r)*1.9;
        pl.station.y=pos.y;
        processStation(pl.station);
      }
      pl.moons?.forEach(mn=>{
        const mpos=getMoonPos(mn,pos.x,pos.y,gs.t);
        if(mn.station){
          mn.station.x=mpos.x+(mn.r+mn.station.r)*1.5;
          mn.station.y=mpos.y;
          processStation(mn.station);
        }
      });
    });
  });

  // Dokovací podmínky
  if(gs.nearStation){
    const st=gs.nearStation;
    const d=dist2(p,st);
    const portAngle=st.angle;
    const approachAngle=Math.atan2(p.y-st.y,p.x-st.x);
    const align=Math.abs(angleDiff(approachAngle,portAngle))*180/Math.PI;
    const speed=Math.hypot(p.vx,p.vy);
    const isLarge=st.type==='large';
    const dockDist=isLarge?st.r:C.DOCK_DIST;
    const dockAngle=isLarge?12:C.DOCK_ANGLE;
    const approachDist=isLarge?st.r*4.5:C.DOCK_DIST*3;
    gs.dockingState={
      approaching:d<approachDist,
      align,speed,
      dockable:d<dockDist&&align<dockAngle&&speed<C.DOCK_SPD
    };
  } else {
    gs.dockingState={approaching:false,align:0,speed:0,dockable:false};
  }

  // Stanice — kolize s tělem (netrefení do otvoru); vypnuto během warp letu
  if(gs.nearStation&&!gs.dockingState.dockable&&!p.dead&&warpPhase!=='boosting'){
    const st=gs.nearStation;
    const d=dist2(p,st);
    const isLarge=st.type==='large';
    const collR=isLarge?st.r*1.05:st.r*1.1;
    const dockAngleLim=isLarge?12:C.DOCK_ANGLE;
    const spd=Math.hypot(p.vx,p.vy);
    if(d<collR&&gs.dockingState.align>=dockAngleLim&&spd>0.8){
      stationCrash(st);
    }
  }

  // Asteroidy — kolize
  gs.chunks.forEach(ch=>{
    ch.asteroids.forEach(a=>{
      a.x+=a.vx;a.y+=a.vy;a.angle+=a.rot;
      const d=dist2(p,a);
      if(d<a.sz+14&&p.invTimer<=0){
        hitPlayer(6);a.vx*=-1;a.vy*=-1;
        // Odrazi hráče
        p.vx+=(p.x-a.x)*0.02;p.vy+=(p.y-a.y)*0.02;
      }
    });
  });

  // Engine trails update
  engineTrails.forEach(t=>{t.x+=t.vx;t.y+=t.vy;t.life-=dt;t.vx*=0.92;t.vy*=0.92;});
  engineTrails=engineTrails.filter(t=>t.life>0);

  // Bullets update
  for(let i=gs.bullets.length-1;i>=0;i--){
    const b=gs.bullets[i];b.x+=b.vx;b.y+=b.vy;b.life-=dt;
    if(b.life<=0){gs.bullets.splice(i,1);continue;}
    if(b.owner==='player'){
      // Hit enemies
      let hit=false;
      for(let j=gs.enemies.length-1;j>=0;j--){
        const e=gs.enemies[j];
        if(dist2(b,e)<18){
          e.hp-=b.dmg;spawnParticles(e.x,e.y,6,'#ff4400',2.5,0.5,true);
          gs.bullets.splice(i,1);hit=true;
          if(e.hp<=0){
            spawnExplosion(e.x,e.y,true);
            p.credits+=C.ENEMY_REWARD;gs.totalEarned+=C.ENEMY_REWARD;
            addXP(p,50);
            // Loot drop
            gs.loots.push({x:e.x,y:e.y,name:'Salvage',value:rndInt(50,200),blink:0,life:30});
            gs.enemies.splice(j,1);
            setMsg(`Nepřítel zničen! +${C.ENEMY_REWARD} Cr`,2500);
          }
          break;
        }
      }
      if(hit)continue;
      // Hit asteroids
      for(let ch of gs.chunks){
        for(let j=ch.asteroids.length-1;j>=0;j--){
          const a=ch.asteroids[j];
          if(dist2(b,a)<a.sz){
            a.hp-=b.dmg;spawnParticles(a.x,a.y,5,'#887755',1.5,0.4);
            gs.bullets.splice(i,1);hit=true;
            if(a.hp<=0){
              spawnExplosion(a.x,a.y);
              ch.asteroids.splice(j,1);addXP(p,5);
              if(Math.random()<0.3)gs.loots.push({x:a.x,y:a.y,name:'Rudy',value:rndInt(20,80),blink:0,life:20});
            }
            break;
          }
        }
        if(hit)break;
      }
    } else {
      if(p.invTimer<=0&&dist2(b,p)<20){hitPlayer(b.dmg);gs.bullets.splice(i,1);}
    }
  }

  // Enemies update
  updateEnemies(dt,p);

  // Particles update
  gs.particles.forEach(pt=>{pt.x+=pt.vx;pt.y+=pt.vy;pt.life-=dt;pt.vx*=0.93;pt.vy*=0.93;});
  gs.particles=gs.particles.filter(pt=>pt.life>0);

  // Loots update
  for(let i=gs.loots.length-1;i>=0;i--){
    const l=gs.loots[i];l.blink+=dt*4;l.life-=dt;
    if(l.life<=0){gs.loots.splice(i,1);continue;}
    if(dist2(p,l)<30){
      const cmax=getCargoMax(p);
      if(p.cargoCount<cmax){
        p.cargo[l.name]=(p.cargo[l.name]||0)+1;p.cargoCount++;
        p.credits+=l.value;addXP(p,10);
        setMsg(`Sebráno: ${l.name} (+${l.value} Cr)`,1500);
      }
      gs.loots.splice(i,1);
    }
  }

  // Station debris — float through space permanently, glow cools down
  if(gs.stationDebris?.length){
    gs.stationDebris.forEach(d=>{
      d.x+=d.vx;d.y+=d.vy;
      d.angle+=d.rotSpeed;
      d.vx*=0.9998;d.vy*=0.9998; // near-zero drag in space
      if(d.glowFade>0)d.glowFade=Math.max(0,d.glowFade-dt*0.18);
    });
  }

  // Čas hry + autosave každých 30s
  gs.playTime=(gs.playTime||0)+dt;
  gs._saveTimer=(gs._saveTimer||0)+dt;
  if(gs._saveTimer>30){gs._saveTimer=0;saveGame();}
}

function hitPlayer(dmg){
  const p=gameState.player;
  if(p.invTimer>0)return;
  if(p.shield>0){p.shield=Math.max(0,p.shield-dmg);spawnParticles(p.x,p.y,6,'#4080ff',2,0.4,true);}
  else{p.hull=Math.max(0,p.hull-dmg);spawnParticles(p.x,p.y,8,'#ff4400',2.5,0.6,true);p.invTimer=0.7;}
  p.shieldRegenTimer=0;
  if(p.hull<=0&&!p.dead){
    p.dead=true;spawnExplosion(p.x,p.y,true);
    setTimeout(showDeath,1200);
  }
}

function addXP(p,amount){
  p.xp+=amount;
  const needed=xpNeeded(p.level);
  if(p.xp>=needed&&p.level<20){p.xp-=needed;p.level++;setMsg(`LEVEL UP! ${p.level}`,3000);}
}

function showDeath(){
  const p=gameState?.player;
  const gs=gameState;

  // --- PERMANENTNÍ SMRT: smaž slot okamžitě ---
  if(activeSlot>=0){
    try{localStorage.removeItem(SLOT_KEYS[activeSlot]);}catch(e){}
  }

  // Vyplň statistiky
  document.getElementById('ds-slot').textContent=activeSlot>=0?`PILOT ${activeSlot+1}`:'—';
  document.getElementById('ds-level').textContent=String(p?.level||1);
  document.getElementById('ds-credits').textContent=`${(p?.credits||0).toLocaleString('cs-CZ')} Cr`;
  document.getElementById('ds-earned').textContent=`${(gs?.totalEarned||0).toLocaleString('cs-CZ')} Cr`;
  const pt2=gs?.playTime||0;
  const ph=Math.floor(pt2/3600),pm=Math.floor((pt2%3600)/60),ps=Math.floor(pt2%60);
  document.getElementById('ds-time').textContent=`${ph}h ${pm.toString().padStart(2,'0')}m ${ps.toString().padStart(2,'0')}s`;
  const gal=GALAXIES.find(g=>g.id===window.currentGalaxy);
  document.getElementById('ds-galaxy').textContent=gal?gal.name:'Sluneční soustava';
  const score=((p?.level||1)*1000)+(p?.credits||0)+(gs?.totalEarned||0);
  document.getElementById('ds-score').textContent=score.toLocaleString('cs-CZ');

  document.getElementById('death-screen').style.display='flex';

  // Odpočet 8 s → auto-return do lobby
  const CD=8;
  let cdLeft=CD;
  const cdNum=document.getElementById('death-cd-num');
  const cdBar=document.getElementById('death-cd-bar');
  const lobbyBtn=document.getElementById('btn-death-lobby');
  lobbyBtn.disabled=true;
  cdBar.style.transition='none';cdBar.style.width='100%';
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    cdBar.style.transition=`width ${CD}s linear`;cdBar.style.width='0%';
  }));
  const cdIv=setInterval(()=>{
    cdLeft--;cdNum.textContent=cdLeft;
    if(cdLeft<=0){clearInterval(cdIv);_goLobby();}
  },1000);
  // Tlačítko se odemkne po 2s pro ruční skip
  setTimeout(()=>{if(lobbyBtn.disabled)lobbyBtn.disabled=false;},2000);
  lobbyBtn.onclick=()=>{clearInterval(cdIv);_goLobby();};
}

function _goLobby(){
  document.getElementById('death-screen').style.display='none';
  document.getElementById('hud').style.display='none';
  document.getElementById('dock-panel').style.display='none';
  document.getElementById('menu').style.display='flex';
  state='menu';gameState=null;activeSlot=-1;
  initMenuStars();
}

// ---- Save / Load (slot systém) ----
function getSaveData(i){try{const r=localStorage.getItem(SLOT_KEYS[i]);return r?JSON.parse(r):null;}catch(e){return null;}}

function saveGame(){
  if(!gameState||gameState.player.dead||activeSlot<0)return;
  const p=gameState.player;
  // Při uložení ve stanici ulož bezpečnou pozici MIMO stanici, ne uvnitř
  let saveX=p.x,saveY=p.y,saveAngle=p.angle;
  const dSt=gameState.dockStation;
  if(dSt){
    const safeR=dSt.r*1.4+80;
    const ang=dSt.angle+Math.PI;
    saveX=dSt.x+Math.cos(ang)*safeR;
    saveY=dSt.y+Math.sin(ang)*safeR;
    saveAngle=ang;
  }
  const data={
    x:saveX,y:saveY,angle:saveAngle,
    hull:p.hull,hullMax:p.hullMax,
    shield:p.shield,shieldMax:p.shieldMax,
    fuel:p.fuel,fuelMax:p.fuelMax,
    fuelReserve:p.fuelReserve,
    credits:p.credits,cargo:p.cargo,cargoCount:p.cargoCount,upgrades:p.upgrades,
    xp:p.xp,level:p.level,totalEarned:gameState.totalEarned,
    galaxyId:window.currentGalaxy||'sol',
    playTime:gameState.playTime||0,
    savedAt:Date.now()
  };
  try{localStorage.setItem(SLOT_KEYS[activeSlot],JSON.stringify(data));}catch(e){}
}
function loadSave(){return activeSlot>=0?getSaveData(activeSlot):null;}
function hasSave(){return SLOT_KEYS.some(k=>!!localStorage.getItem(k));}

// ---- Slot screen ----
function openSlotScreen(){
  renderSlotCards();
  document.getElementById('slots-overlay').style.display='flex';
}
function closeSlotScreen(){
  document.getElementById('slots-overlay').style.display='none';
}

function renderSlotCards(){
  const grid=document.getElementById('slots-grid');
  if(!grid)return;
  grid.innerHTML='';
  SLOT_KEYS.forEach((key,i)=>{
    const data=getSaveData(i);
    const card=document.createElement('div');
    card.className='slot-card '+(data?'filled':'empty');
    if(data){
      const gal=GALAXIES.find(g=>g.id===(data.galaxyId||'sol'));
      const galName=gal?gal.name:'Sluneční soustava';
      const galColor=gal?gal.color:'#ffee88';
      const hullPct=Math.round((data.hull/(data.hullMax||100))*100);
      const shieldPct=Math.round((data.shield/(data.shieldMax||100))*100);
      const pt=data.playTime||0;
      const playH=Math.floor(pt/3600);
      const playM=Math.floor((pt%3600)/60);
      const savedStr=data.savedAt?new Date(data.savedAt).toLocaleDateString('cs-CZ',{day:'2-digit',month:'2-digit',year:'numeric'}):'—';
      const creds=(data.credits||0).toLocaleString('cs-CZ');
      card.innerHTML=`
        <div class="sc-slot-num">PILOT ${i+1}</div>
        <div class="sc-inner">
          <div class="sc-head-row">
            <div class="sc-level">LVL ${data.level||1}</div>
            <div class="sc-credits">${creds} Cr</div>
          </div>
          <div class="sc-galaxy-name" style="color:${galColor}">${galName}</div>
          <div class="sc-stats-row">
            <span class="sc-stat">⏱ ${playH}h ${String(playM).padStart(2,'0')}m</span>
            <span class="sc-stat">📅 ${savedStr}</span>
          </div>
          <div class="sc-bars">
            <div class="sc-bar-row">
              <span class="sc-bar-label">TRUP</span>
              <div class="sc-bar-track"><div class="sc-bar-fill hull" style="width:${hullPct}%"></div></div>
              <span class="sc-bar-val">${hullPct}%</span>
            </div>
            <div class="sc-bar-row">
              <span class="sc-bar-label">ŠTÍT</span>
              <div class="sc-bar-track"><div class="sc-bar-fill shield" style="width:${shieldPct}%"></div></div>
              <span class="sc-bar-val">${shieldPct}%</span>
            </div>
          </div>
        </div>
        <div class="sc-actions">
          <button class="sc-btn sc-btn-load" onclick="startSlot(${i})">▶ POKRAČOVAT</button>
          <button class="sc-btn sc-btn-delete" onclick="deleteSlot(${i})">✕ SMAZAT</button>
        </div>`;
    }else{
      card.innerHTML=`
        <div class="sc-slot-num">PILOT ${i+1}</div>
        <div class="sc-empty-inner">
          <div class="sc-empty-icon">+</div>
          <div class="sc-empty-text">PRÁZDNÝ SLOT</div>
          <div class="sc-empty-sub">Žádná uložená hra</div>
        </div>
        <div class="sc-actions">
          <button class="sc-btn sc-btn-new" onclick="startSlot(${i})">▶ NOVÁ HRA</button>
        </div>`;
    }
    grid.appendChild(card);
  });
}

function startSlot(i){
  activeSlot=i;
  closeSlotScreen();
  const isNew=!getSaveData(i);
  showLoadingScreen(i,isNew,()=>startGame(!isNew));
}

function deleteSlot(i){
  if(!confirm(`Opravdu smazat Pilota ${i+1}? Tato akce je nevratná.`))return;
  try{localStorage.removeItem(SLOT_KEYS[i]);}catch(e){}
  renderSlotCards();
}

// ---- Načítací obrazovka ----
const LOADING_TIPS=[
  'Drž W pro zrychlení. Ve vesmíru neexistuje tření — musíš sám zastavit.',
  'Boost (Shift+W) je výkonný, ale rychle spotřebovává palivo. Šetři ho.',
  'Kupuj zboží levně a prodávej ho draze na jiných stanicích — to je základ obchodu.',
  'Velké Coriolis stanice mají obří hangár — musíš zaparkovat ručně na vyhrazené molo.',
  'Nabourat do stanice bez správného zarovnání způsobí katastrofický výbuch. Pozor na úhel.',
  'Klávesa P aktivuje parkovací režim — loď lépe manévruje a rychleji brzdí.',
  'Na mapě (M) klikni na stanici pro nastavení navigační šipky na obrazovce.',
  'Warp pohon (R) tě přenese do jiné galaxie, ale vyžaduje hodně paliva a čas na nabití.',
  'Upgrade nákladového prostoru ti umožní přepravovat více zboží najednou.',
  'Nepřátelé jsou nebezpečnější ve vnějších sektorech daleko od středu galaxie.',
  'Štít se sám regeneruje po chvíli bez zásahu. Trup musíš opravit na stanici.',
  'Klávesy Q a E aktivují boční trysky — pohyb do stran bez otočení lodi.',
  'Každá stanice má jiné ceny zboží — sleduj rozdíly a vydělávej na arbitráži.',
  'Za zničeného nepřítele dostaneš kredity i zkušenostní body. Boj se vyplatí.',
];

let _loadingStarAnim=null;
let _loadingTipTimer=null;

function showLoadingScreen(slotIndex,isNew,onDone){
  const overlay=document.getElementById('loading-overlay');
  overlay.style.display='flex';
  overlay.style.opacity='1';
  overlay.style.transition='';

  // Pilot info
  document.getElementById('loading-mode-badge').textContent=isNew?'NOVÁ HRA':'NAČÍTÁNÍ PILOTA';
  document.getElementById('loading-pilot-num').textContent=`PILOT ${slotIndex+1}`;

  let galColor='#ffee88';
  if(!isNew){
    const data=getSaveData(slotIndex);
    if(data){
      const gal=GALAXIES.find(g=>g.id===(data.galaxyId||'sol'));
      if(gal){
        document.getElementById('loading-galaxy-disp').textContent=gal.name;
        galColor=gal.color;
      } else {
        document.getElementById('loading-galaxy-disp').textContent='Sluneční soustava';
      }
    } else {
      document.getElementById('loading-galaxy-disp').textContent='Sluneční soustava';
    }
  } else {
    document.getElementById('loading-galaxy-disp').textContent='Sluneční soustava';
  }

  // Tint planet glow to galaxy color
  const gl=document.getElementById('loading-planet-glow');
  if(gl) gl.style.boxShadow=`0 0 90px 50px ${galColor}22, 0 0 200px 100px ${galColor}11`;

  // Stars canvas
  _startLoadingStars();

  // Tips rotation
  _showNextTip();
  if(_loadingTipTimer)clearInterval(_loadingTipTimer);
  _loadingTipTimer=setInterval(_showNextTip,4200);

  // Reset bar
  _setLoadingPct('Inicializace...',0);

  const STEPS=[
    {label:'Inicializace vesmíru...',        pct:9,  ms:290},
    {label:'Generování hvězdné soustavy...', pct:24, ms:440},
    {label:'Mapování okolního prostoru...',  pct:41, ms:360},
    {label:'Načítání dat stanic...',         pct:57, ms:310},
    {label:'Spouštění nepřátel...',          pct:70, ms:270},
    {label:'Kalibrování navigace...',        pct:83, ms:320},
    {label:'Synchronizace senzorů...',       pct:95, ms:260},
    {label:'Připraveno!',                    pct:100,ms:520},
  ];

  let si=0;
  function runStep(){
    if(si>=STEPS.length){
      clearInterval(_loadingTipTimer);
      onDone();
      setTimeout(()=>{
        overlay.style.transition='opacity .5s ease';
        overlay.style.opacity='0';
        setTimeout(()=>{
          overlay.style.display='none';
          overlay.style.opacity='1';
          overlay.style.transition='';
          _stopLoadingStars();
        },500);
      },180);
      return;
    }
    const s=STEPS[si++];
    _setLoadingPct(s.label,s.pct);
    setTimeout(runStep,s.ms);
  }
  setTimeout(runStep,100);
}

function _setLoadingPct(label,pct){
  const fill=document.getElementById('loading-bar-fill');
  const status=document.getElementById('loading-status-text');
  const pctEl=document.getElementById('loading-pct-text');
  if(fill)fill.style.width=pct+'%';
  if(status)status.textContent=label;
  if(pctEl)pctEl.textContent=pct+' %';
}

function _showNextTip(){
  const el=document.getElementById('loading-tip-text');
  if(!el)return;
  el.style.opacity='0';
  setTimeout(()=>{
    el.textContent=LOADING_TIPS[Math.floor(Math.random()*LOADING_TIPS.length)];
    el.style.opacity='1';
  },340);
}

function _startLoadingStars(){
  const mc=document.getElementById('loading-stars-canvas');
  if(!mc)return;
  mc.width=window.innerWidth;mc.height=window.innerHeight;
  const mx=mc.getContext('2d');
  const stars=Array.from({length:280},()=>({
    x:Math.random()*mc.width, y:Math.random()*mc.height,
    r:Math.random()*1.5+0.2, bright:0.15+Math.random()*0.85,
    tw:Math.random()*Math.PI*2, spd:0.3+Math.random()*1.4
  }));
  let running=true;
  _loadingStarAnim={stop:()=>{running=false;}};
  (function drawFrame(ts){
    if(!running)return;
    requestAnimationFrame(drawFrame);
    mx.clearRect(0,0,mc.width,mc.height);
    const t=ts/1000;
    stars.forEach(s=>{
      const a=s.bright*(0.55+Math.sin(t*s.spd+s.tw)*0.45);
      mx.globalAlpha=a;
      mx.fillStyle='#ddeeff';
      mx.beginPath();mx.arc(s.x,s.y,s.r,0,Math.PI*2);mx.fill();
    });
    mx.globalAlpha=1;
  })(0);
}

function _stopLoadingStars(){
  if(_loadingStarAnim){_loadingStarAnim.stop();_loadingStarAnim=null;}
}

// ---- Hlavní smyčka ----
function loop(ts){
  requestAnimationFrame(loop);
  const dt=Math.min((ts-last)/1000,0.05);last=ts;
  frameCount++;

  if(state==='menu')return;
  if(state==='docking')updateDocking(dt);
  else if(state==='interior')updateInterior(dt);
  else if(state!=='paused'&&state!=='galaxy')update(dt);
  render(dt,ts/1000);
}

function render(dt,t){
  if(!gameState)return;
  const gs=gameState;
  const p=gs.player;

  // Cinematická sekvence přistávání
  if(state==='docking'){
    ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.setLineDash([]);ctx.shadowBlur=0;
    renderDockingSequence(gs,t);
    return;
  }

  // Vnitřek stanice
  if(state==='interior'){
    if(!interiorData)return;
    ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.setLineDash([]);ctx.shadowBlur=0;
    renderInteriorScene(interiorData,p,t,dt);
    return;
  }

  // Reset + pauza → zoom se vrací na 1
  ctx.setTransform(1,0,0,1,0,0);
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.setLineDash([]);ctx.shadowBlur=0;
  if(state==='paused') camZoom+=(1.0-camZoom)*Math.min(1,dt*3);

  // Pozadí — screen space (hvězdy s paralaxou nesmí být uvnitř zoom transformu)
  renderBackground(gs.chunks,t);

  // === SVĚTOVÁ VRSTVA se zoom transformem ===
  ctx.save();
  ctx.translate(W/2,H/2);
  ctx.scale(camZoom,camZoom);
  ctx.translate(-W/2,-H/2);

  renderSystems(gs.chunks,t);
  gs.chunks.forEach(ch=>ch.asteroids.forEach(a=>renderAsteroid(a,t)));
  if(gs.stationDebris?.length)renderStationDebris(gs.stationDebris,t);
  const allParts=[...engineTrails,...gs.particles];
  renderParticles(allParts);
  gs.loots.forEach(l=>renderLoot(l));
  gs.enemies.forEach(e=>renderEnemy(e,t));

  gs.chunks.forEach(ch=>{
    if(!ch.system)return;
    const drawSt=(st)=>{
      if(!st)return;
      const isNear=st===gs.nearStation;
      const dock=isNear&&gs.dockingState?.dockable;
      if(st.type==='large')renderLargeStation(st,t,isNear,dock);
      else renderStation(st,t,isNear,dock);
    };
    drawSt(ch.system.station);
    ch.system.planets?.forEach(pl=>{
      drawSt(pl.station);
      pl.moons?.forEach(mn=>drawSt(mn.station));
    });
  });

  gs.bullets.forEach(b=>renderBullet(b));

  ctx.restore(); // Reset zoom transformu

  // === SCREEN VRSTVA (bez zoomu) ===
  ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.setLineDash([]);ctx.shadowBlur=0;

  // Hráčova loď — vždy uprostřed, vždy stejně velká
  if(!p.dead)renderPlayerShip(p,t);

  // Warp warm-up efekt (engine stream při odpočtu)
  if(warpPhase==='countdown'&&!p.dead){
    const pct=clamp(1-warpTimer/20,0,1);
    renderWarpWarmup(p,pct,t);
  }

  // Warp flicker (problikávání planet při vysoké rychlosti)
  if(warpPhase==='boosting'&&!p.dead){
    const spdKms=Math.hypot(p.vx,p.vy)*C.SPEED_KMS_FACTOR;
    if(spdKms>C.WARP_SPEED_KMS*0.6){
      const intensity=clamp((spdKms-C.WARP_SPEED_KMS*0.6)/(C.WARP_SPEED_KMS*2),0,1);
      renderWarpFlicker(intensity,t);
    }
  }

  // Záblesk při příjezdu
  if(window._warpArrival>0){
    window._warpArrival=Math.max(0,window._warpArrival-dt*2);
    ctx.globalAlpha=window._warpArrival;
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=1;
  }

  // Vigneta
  renderVignette();

  // HUD
  if(state==='playing'){
    renderHUD(p,gs.nearStation,gs.dockingState,t);
    if(gs.nearStation&&gs.dockingState?.approaching){
      renderDockingIndicator(gs.dockingState.align,gs.dockingState.speed,gs.dockingState.dockable);
    }
    if(gs.navTarget){
      renderNavArrow(gs.navTarget.x,gs.navTarget.y,p.x,p.y,gs.navTarget.name);
    }
  }

  // Warp boost status bar (nahoře uprostřed)
  if(warpPhase==='boosting'&&window.warpTarget){
    const spdKms=Math.hypot(p.vx,p.vy)*C.SPEED_KMS_FACTOR;
    const pctSpd=clamp(spdKms/C.WARP_SPEED_KMS,0,1);
    const pctTime=clamp(warpElapsed/window.warpTarget.warpSecs,0,1);
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    // Název destinace
    ctx.textAlign='center';ctx.font='bold 12px "Courier New", monospace';
    ctx.fillStyle='#ff9500';ctx.shadowColor='rgba(255,149,0,0.5)';ctx.shadowBlur=10;
    ctx.fillText(`WARP → ${window.warpTarget.name.toUpperCase()}`,W/2,28);
    // Speed bar
    const bw=320,bh=3,bx=W/2-bw/2,by=38;
    ctx.shadowBlur=0;ctx.globalAlpha=0.2;ctx.fillStyle='#ff9500';ctx.fillRect(bx,by,bw,bh);
    ctx.globalAlpha=1;
    ctx.fillStyle=pctSpd<1?'#ff9500':'#00ff88';
    ctx.shadowColor=pctSpd<1?'rgba(255,149,0,0.7)':'rgba(0,255,136,0.7)';ctx.shadowBlur=6;
    ctx.fillRect(bx,by,bw*pctSpd,bh);
    // Progress bar (warp time)
    if(pctSpd>=1){
      ctx.globalAlpha=0.15;ctx.fillStyle='#00ff88';ctx.fillRect(bx,by+6,bw,bh);
      ctx.globalAlpha=1;ctx.fillStyle='#00ff88';ctx.fillRect(bx,by+6,bw*pctTime,bh);
    }
    ctx.font='9px "Courier New", monospace';ctx.shadowBlur=0;
    ctx.fillStyle='rgba(255,149,0,0.6)';
    const hint=pctSpd<1?`${Math.round(spdKms).toLocaleString('cs')} km/s — drž [W]`:`WARP AKTIVNÍ — přílet ${Math.max(0,window.warpTarget.warpSecs-warpElapsed).toFixed(1)} s`;
    ctx.fillText(hint,W/2,52);
    ctx.restore();
  }

  // Minimapa
  ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.setLineDash([]);ctx.shadowBlur=0;
  renderMinimap(p,gs.chunks,gs.navTarget,t);
}

// ---- Menu hvězdy ----
function initMenuStars(){
  const wrap=document.getElementById('menu-stars');if(!wrap)return;
  wrap.innerHTML='';
  const mc=document.createElement('canvas');
  mc.style.cssText='position:absolute;inset:0;width:100%;height:100%';
  mc.width=window.innerWidth;mc.height=window.innerHeight;
  wrap.appendChild(mc);
  const mx=mc.getContext('2d');
  const stars=Array.from({length:200},()=>({
    x:Math.random()*mc.width, y:Math.random()*mc.height,
    r:Math.random()*1.4+0.2, bright:0.2+Math.random()*0.8,
    tw:Math.random()*Math.PI*2, speed:0.4+Math.random()*1.2
  }));
  (function drawMenu(ts){
    if(state!=='menu'){return;}
    requestAnimationFrame(drawMenu);
    mx.clearRect(0,0,mc.width,mc.height);
    const t=ts/1000;
    stars.forEach(s=>{
      const base=s.bright*(0.6+Math.sin(t*s.speed+s.tw)*0.4);
      mx.globalAlpha=window.lightMode?Math.min(1,base*2.2):base;
      mx.fillStyle=window.lightMode?'#000000':'#e8eeff';
      mx.beginPath();mx.arc(s.x,s.y,window.lightMode?Math.max(s.r,0.5):s.r,0,Math.PI*2);mx.fill();
    });
    mx.globalAlpha=1;
  })(0);
}

// ===== Nastavení — přebindování kláves =====
let _rebindingAction=null;
let _rebindListener=null;

function openSettings(){
  for(const k in keys)keys[k]=false;
  _renderKeybindings();
  document.getElementById('settings-overlay').style.display='flex';
  switchSettingsTab('keys');
}
function closeSettings(){
  _stopRebind();
  saveBindings();
  document.getElementById('settings-overlay').style.display='none';
}
function switchSettingsTab(tab){
  ['keys','sounds'].forEach(t=>{
    document.getElementById('stab-'+t+'-panel').style.display=t===tab?'block':'none';
    document.getElementById('stab-'+t).classList.toggle('active',t===tab);
  });
}
function _renderKeybindings(){
  const list=document.getElementById('keybind-list');
  if(!list)return;
  list.innerHTML='';
  Object.keys(DEFAULT_BINDINGS).forEach(action=>{
    const row=document.createElement('div');
    row.className='keybind-row';
    row.id='kbrow-'+action;

    const lbl=document.createElement('span');
    lbl.className='kb-label';
    lbl.textContent=BINDING_LABELS[action];

    const btn=document.createElement('button');
    btn.className='kb-key';
    btn.id='kbkey-'+action;
    btn.textContent=keyLabel(bindings[action]);
    btn.onclick=()=>_startRebind(action);

    row.appendChild(lbl);
    row.appendChild(btn);

    const aliases=BINDING_ALIASES[action];
    if(aliases&&aliases.length){
      const al=document.createElement('span');
      al.className='kb-alias';
      al.textContent='+ '+aliases.map(keyLabel).join(', ');
      row.appendChild(al);
    }
    list.appendChild(row);
  });
}
function _startRebind(action){
  _stopRebind();
  _rebindingAction=action;
  const btn=document.getElementById('kbkey-'+action);
  if(btn){btn.textContent='— stiskni klávesu —';btn.classList.add('listening');}
  _rebindListener=(e)=>{
    e.preventDefault();e.stopPropagation();
    if(e.code==='Escape'){_stopRebind();return;}
    // Swap pokud klávesa již použita
    Object.keys(bindings).forEach(a=>{if(a!==action&&bindings[a]===e.code)bindings[a]=bindings[action];});
    bindings[action]=e.code;
    _stopRebind();
    _renderKeybindings();
  };
  document.addEventListener('keydown',_rebindListener,{capture:true});
}
function _stopRebind(){
  if(_rebindingAction){
    const btn=document.getElementById('kbkey-'+_rebindingAction);
    if(btn){btn.classList.remove('listening');btn.textContent=keyLabel(bindings[_rebindingAction]);}
    _rebindingAction=null;
  }
  if(_rebindListener){document.removeEventListener('keydown',_rebindListener,{capture:true});_rebindListener=null;}
}
function resetBindings(){
  bindings={...DEFAULT_BINDINGS};
  _stopRebind();
  _renderKeybindings();
}

// ===== Nápověda =====
function openHelp(){document.getElementById('help-overlay').style.display='flex';}
function closeHelp(){document.getElementById('help-overlay').style.display='none';}

// ---- Init ----
window.addEventListener('load',()=>{
  canvas=document.getElementById('c');
  ctx=canvas.getContext('2d');
  W=canvas.width=window.innerWidth;
  H=canvas.height=window.innerHeight;
  W2=W;H2=H;
  window.addEventListener('resize',()=>{W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;});

  loadBindings();
  initMinimap();
  initMapCanvas();
  initGalaxyCanvas();
  initMenuStars();

  // Aplikovat stav ikony tlačítka tématu podle uložené preference
  (function(){
    const icon=document.getElementById('theme-icon');
    const lbl=document.getElementById('theme-label');
    if(icon) icon.textContent=window.lightMode?'🌙':'☀';
    if(lbl)  lbl.textContent=window.lightMode?'DARK MODE':'LIGHT MODE';
  })();

  // Menu tlačítka
  document.getElementById('btn-play').onclick=()=>openSlotScreen();
  const themeBtn=document.getElementById('btn-theme');
  if(themeBtn) themeBtn.onclick=()=>toggleTheme();
  document.getElementById('btn-slots-back').onclick=()=>closeSlotScreen();
  document.getElementById('btn-help').onclick=()=>openHelp();
  document.getElementById('btn-help-close').onclick=()=>closeHelp();
  // death screen — handler se nastavuje dynamicky v showDeath()
  document.getElementById('btn-close-map').onclick=()=>closeMap();
  document.getElementById('btn-close-galaxy').onclick=()=>closeGalaxyMap();
  document.getElementById('btn-cancel-warp').onclick=()=>cancelWarp();
  document.getElementById('btn-undock').onclick=()=>undock();
  document.getElementById('btn-parking-skip').onclick=()=>{
    if(!window._parkingStation)return;
    document.getElementById('parking-overlay').style.display='none';
    startDocking(window._parkingStation);
    window._parkingStation=null;
  };

  // Pause menu
  document.getElementById('btn-resume').onclick=()=>closePause();
  document.getElementById('btn-pause-settings').onclick=()=>openSettings();
  document.getElementById('btn-settings-close').onclick=()=>closeSettings();
  document.getElementById('stab-keys').onclick=()=>switchSettingsTab('keys');
  document.getElementById('stab-sounds').onclick=()=>switchSettingsTab('sounds');
  document.getElementById('btn-settings-reset').onclick=()=>resetBindings();
  document.getElementById('btn-pause-radio').onclick=()=>{};
  document.getElementById('btn-pause-map').onclick=()=>{
    closePause();
    openMap();
  };
  document.getElementById('btn-pause-save').onclick=()=>{
    saveGame();
    const lbl=document.querySelector('#btn-pause-save .esc-btn-label');
    if(lbl){lbl.textContent='ULOŽENO ✓';setTimeout(()=>{lbl.textContent='ULOŽIT HRU';},1800);}
  };
  document.getElementById('btn-pause-menu').onclick=()=>{
    _stopPauseShipAnim();
    document.getElementById('pause-screen').style.display='none';
    document.getElementById('hud').style.display='none';
    document.getElementById('dock-panel').style.display='none';
    document.getElementById('menu').style.display='flex';
    state='menu';gameState=null;activeSlot=-1;initMenuStars();
  };

  // Save button
  const sbtn=document.getElementById('btn-save');if(sbtn)sbtn.onclick=()=>{saveGame();setMsg('Hra uložena!',2000);};


  requestAnimationFrame(loop);
});
