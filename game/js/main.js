// ===== SPACE TRADER — hlavní smyčka =====

// State machine
let gameState = null;  // hráč, entity, nav, atd.
let state = 'menu';    // 'menu' | 'playing' | 'docked' | 'map' | 'galaxy' | 'warping'
let canvas, W2, H2;    // W,H jsou v render.js
let last = 0, frameCount = 0;

// Warp systém
window.currentGalaxy = 'sol';
window.warpTarget = null;
let warpPhase = null;   // null | 'countdown' | 'warping'
let warpTimer = 0;
let warpElapsed = 0;

// Globální zpráva
window.msgText=''; window.msgTimer=0;
function setMsg(txt,ms=3000){window.msgText=txt;window.msgTimer=ms;}

// Input
const keys={};
document.addEventListener('keydown',e=>{
  if(keys[e.code])return;
  keys[e.code]=true;

  // Warp countdown — intercept first
  if(warpPhase==='countdown'){
    if(e.key==='Escape'){e.preventDefault();cancelWarp();return;}
    if(e.key==='w'||e.key==='W'){e.preventDefault();beginWarp();return;}
    return;
  }

  if(state==='playing'){
    if(e.key===' '){e.preventDefault();tryShoot();}
    if(e.key==='m'||e.key==='M'){e.preventDefault();openMap();}
    if(e.key==='r'||e.key==='R'){e.preventDefault();openGalaxyMap();}
    if(e.key==='q'||e.key==='Q'){e.preventDefault();startWarpCountdown();}
    if(e.key==='e'||e.key==='E'){e.preventDefault();tryDock();}
    if(e.key==='Escape'){e.preventDefault();openPause();}
    if(e.key==='n'||e.key==='N'){clearNav();}
  } else if(state==='paused'){
    if(e.key==='Escape'){e.preventDefault();closePause();}
  } else if(state==='map'){
    if(e.key==='m'||e.key==='M'||e.key==='Escape'){e.preventDefault();closeMap();}
  } else if(state==='galaxy'){
    if(e.key==='r'||e.key==='R'||e.key==='Escape'){e.preventDefault();closeGalaxyMap();}
  } else if(state==='docked'){
    if(e.key==='e'||e.key==='E'||e.key==='Escape'){e.preventDefault();undock();}
  }
});
document.addEventListener('keyup',e=>{keys[e.code]=false;});
window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});

function isKey(...codes){return codes.some(c=>keys[c]);}

// ---- Inicializace hry ----
function startGame(fromSave=false){
  document.getElementById('menu').style.display='none';
  document.getElementById('hud').style.display='block';
  window.currentGalaxy='sol';
  window.warpTarget=null;
  window._warpArrival=0;
  warpPhase=null;warpTimer=0;warpElapsed=0;

  const save=fromSave?loadSave():null;

  // Výchozí spawn: u Země (SOL chunk 0,0; sunX=1500,sunY=1500; Země orbit 7000, phase 2.1)
  // earthX = 1500 + cos(2.1)*7000 ≈ 1500-3534 = -2034,  earthY = 1500 + sin(2.1)*7000 ≈ 1500+6042 = 7542
  const EARTH_X=-2034, EARTH_Y=7542;
  const player={
    x:save?.x||EARTH_X, y:save?.y||EARTH_Y,
    vx:0, vy:0, angle:save?.angle||-Math.PI/2,
    hull:save?.hull||100, hullMax:100,
    shield:save?.shield||100, shieldMax:100,
    fuel:save?.fuel||C.FUEL_MAX, fuelMax:C.FUEL_MAX,
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
    bullets:[], enemies:[], particles:[], loots:[],
    navTarget:null,
    nearStation:null, dockStation:null,
    dockingState:{approaching:false,align:0,speed:0},
    totalEarned:save?.totalEarned||0,
    t:0
  };
  window.gameState=gameState;

  // Pre-generuj sluneční soustavu aby byla viditelná na mapě od začátku
  getChunk(C.SOLAR_CHUNK.cx, C.SOLAR_CHUNK.cy);

  // Spawnuj nepřátele
  spawnInitialEnemies();

  state='playing';
  setMsg('Vítejte ve Space Trader! [WASD] let  [BOOST] Shift+W  [E] přistání  [M] mapa  [R] galaxie  [Q] warp',7000);
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
  // Zmrazit pozici portu — loď poletí přesně do otvoru
  const portX=station.x+station.r*0.88*Math.cos(station.angle);
  const portY=station.y+station.r*0.88*Math.sin(station.angle);
  gs.dockAnim={station,timer:0,duration:3.8,progress:0,
    startX:p.x,startY:p.y,portX,portY,
    savedRotSpeed:station.rotSpeed};
  station.rotSpeed=0.00012; // téměř zastavit rotaci
  state='docking';
  document.getElementById('hud').style.display='none';
  setMsg('');
}

function completeDocking(station){
  const anim=gameState.dockAnim;
  if(anim)station.rotSpeed=anim.savedRotSpeed;
  gameState.dockAnim=null;
  startDocking(station);
}

function updateDocking(dt){
  const gs=gameState;
  if(!gs.dockAnim)return;
  const anim=gs.dockAnim,p=gs.player,st=anim.station;
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
    const dx=p.x-st.x,dy=p.y-st.y;
    const d=Math.hypot(dx,dy)||1;
    p.vx=dx/d*2;p.vy=dy/d*2;
  }
  gameState.dockStation=null;
  document.getElementById('dock-panel').style.display='none';
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
  if(!window.warpTarget){setMsg('Nejdřív nastav kurz — stiskni [R] pro mapu galaxií.',3500);return;}
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
  setMsg('TERMOJETOVÉ MOTORY NASTARTOVÁNY — drž [W] pro warp!',6000);
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
  document.getElementById('esc-settings-panel').style.display='none';
  document.getElementById('btn-pause-settings').classList.remove('active');
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
  const cx=pw/2, cy=ph*0.48;
  const scale=4.5;

  // Pozadí
  pc.clearRect(0,0,pw,ph);
  pc.fillStyle='#000408';pc.fillRect(0,0,pw,ph);

  // Hvězdy
  _pauseStars.forEach(s=>{
    const tw=0.55+Math.sin(t*s.speed+s.phase)*0.45;
    pc.globalAlpha=s.bright*tw;
    pc.fillStyle=s.color;
    pc.beginPath();pc.arc(s.x,s.y,s.r,0,Math.PI*2);pc.fill();
  });
  pc.globalAlpha=1;

  // Mlhovina za lodí
  const neb=pc.createRadialGradient(cx,cy,0,cx,cy,Math.min(pw,ph)*0.45);
  neb.addColorStop(0,'rgba(40,15,80,0.22)');
  neb.addColorStop(0.5,'rgba(255,80,0,0.07)');
  neb.addColorStop(1,'transparent');
  pc.fillStyle=neb;pc.fillRect(0,0,pw,ph);

  // Pulzující záře za lodí
  const glowPulse=0.5+Math.sin(t*1.4)*0.5;
  const glow=pc.createRadialGradient(cx,cy,0,cx,cy,scale*22);
  glow.addColorStop(0,'rgba(255,120,0,'+(0.15+glowPulse*0.1)+')');
  glow.addColorStop(1,'transparent');
  pc.fillStyle=glow;pc.beginPath();pc.arc(cx,cy,scale*22,0,Math.PI*2);pc.fill();

  // === Loď v scale space ===
  pc.save();
  pc.translate(cx,cy);
  pc.scale(scale,scale);
  // Nose points up: local (0,-16) → screen (cx, cy-16*scale)

  // Motor — idle plamen (v native ship coords)
  const fl=10+Math.sin(t*9)*5;
  pc.globalAlpha=0.8+Math.sin(t*11)*0.1;
  const eg=pc.createLinearGradient(0,12,0,14+fl);
  eg.addColorStop(0,'rgba(255,150,0,0.95)');
  eg.addColorStop(0.4,'rgba(255,50,0,0.55)');
  eg.addColorStop(1,'transparent');
  pc.fillStyle=eg;
  pc.beginPath();pc.moveTo(-5,12);pc.lineTo(5,12);pc.lineTo(0,14+fl);pc.fill();
  pc.globalAlpha=0.5;
  const eg2=pc.createLinearGradient(0,12,0,14+fl*0.55);
  eg2.addColorStop(0,'rgba(255,230,120,0.9)');eg2.addColorStop(1,'transparent');
  pc.fillStyle=eg2;
  pc.beginPath();pc.moveTo(-2,12);pc.lineTo(2,12);pc.lineTo(0,14+fl*0.55);pc.fill();
  pc.globalAlpha=1;

  // Trup
  pc.shadowColor='rgba(255,149,0,0.55)';pc.shadowBlur=3;
  pc.fillStyle='#060e22';
  pc.strokeStyle='#ff9500';pc.lineWidth=0.35;
  pc.beginPath();pc.moveTo(0,-16);pc.lineTo(10,10);pc.lineTo(5,7);pc.lineTo(-5,7);pc.lineTo(-10,10);pc.closePath();
  pc.fill();pc.stroke();

  // Panel detaily
  pc.strokeStyle='rgba(255,149,0,0.28)';pc.lineWidth=0.22;
  pc.beginPath();pc.moveTo(0,-12);pc.lineTo(4,4);pc.stroke();
  pc.beginPath();pc.moveTo(0,-12);pc.lineTo(-4,4);pc.stroke();

  // Přední okno
  pc.shadowColor='rgba(100,200,255,0.9)';pc.shadowBlur=4;
  pc.fillStyle='rgba(100,200,255,0.6)';
  pc.beginPath();pc.ellipse(0,-5,3,5,0,0,Math.PI*2);pc.fill();
  pc.shadowBlur=0;

  // Wingtips
  pc.strokeStyle='#ff9500';pc.lineWidth=0.28;
  pc.beginPath();pc.moveTo(-10,10);pc.lineTo(-14,14);pc.stroke();
  pc.beginPath();pc.moveTo(10,10);pc.lineTo(14,14);pc.stroke();
  // Wingtip navigační světla
  pc.fillStyle='#ff3300';pc.shadowColor='#ff4400';pc.shadowBlur=3;
  pc.beginPath();pc.arc(-14,14,1.1,0,Math.PI*2);pc.fill();
  pc.fillStyle='#00cc44';pc.shadowColor='#00ff66';
  pc.beginPath();pc.arc(14,14,1.1,0,Math.PI*2);pc.fill();
  pc.shadowBlur=0;

  // Boční tryskové pody
  pc.strokeStyle='rgba(255,149,0,0.45)';pc.lineWidth=0.28;
  pc.fillStyle='rgba(10,20,40,0.9)';
  pc.beginPath();pc.rect(11,-4,8,7);pc.fill();pc.stroke();
  pc.beginPath();pc.rect(-19,-4,8,7);pc.fill();pc.stroke();
  // Výfukové otvory — idle záře
  const idleSide=0.15+Math.sin(t*6)*0.1;
  pc.fillStyle=`rgba(80,180,255,${idleSide})`;pc.shadowColor='#4488ff';pc.shadowBlur=4;
  pc.beginPath();pc.arc(19,0,2,0,Math.PI*2);pc.fill();
  pc.beginPath();pc.arc(-19,0,2,0,Math.PI*2);pc.fill();
  pc.shadowBlur=0;

  pc.restore();

  // Štít (v screen coords, mimo scale blok)
  if(gameState&&gameState.player.shield>0){
    const shPct=gameState.player.shield/gameState.player.shieldMax;
    pc.save();
    pc.globalAlpha=0.04+shPct*0.18+Math.sin(t*2.2)*0.03;
    pc.strokeStyle='#4488ff';pc.lineWidth=1.8;
    pc.shadowColor='#4488ff';pc.shadowBlur=10;
    pc.beginPath();pc.arc(cx,cy,scale*13.5,0,Math.PI*2);pc.stroke();
    pc.restore();
  }

  // Engine glow aura (pod lodí, v screen coords)
  const engY=cy+scale*14;
  const engA=pc.createRadialGradient(cx,engY,0,cx,engY,scale*16);
  engA.addColorStop(0,'rgba(255,110,0,'+(0.35+glowPulse*0.25)+')');
  engA.addColorStop(1,'transparent');
  pc.fillStyle=engA;pc.beginPath();pc.arc(cx,engY,scale*16,0,Math.PI*2);pc.fill();

  // CRT scan lines
  pc.globalAlpha=0.022;
  for(let y2=0;y2<ph;y2+=4){pc.fillStyle='#000';pc.fillRect(0,y2,pw,2);}
  pc.globalAlpha=1;
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

// ---- Engine trails ----
let engineTrails=[];
function spawnTrail(p){
  if(!isKey('KeyW','ArrowUp'))return;
  const boost=isKey('ShiftLeft','ShiftRight')&&p.fuel>0;
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

  // Pohyb hráče — boční trysky místo rotace
  const thrusting=isKey('KeyW','ArrowUp');
  const braking=isKey('KeyS','ArrowDown');
  const strafeL=isKey('KeyA','ArrowLeft');
  const strafeR=isKey('KeyD','ArrowRight');
  const warpBoosting=warpPhase==='boosting'&&thrusting;
  const normalBoost=!warpBoosting&&isKey('ShiftLeft','ShiftRight')&&thrusting&&p.fuel>0;
  const boost=normalBoost||warpBoosting;
  window._strafeL=strafeL; window._strafeR=strafeR;
  window._warpBoosting=warpBoosting;

  const engMult=1+0.15*(p.upgrades.engine||0);

  // Hlavní motor — warp má mnohem větší tah
  if(thrusting){
    const thrust=warpBoosting?C.WARP_THRUST:(boost?C.BOOST_THRUST:C.THRUST)*engMult;
    p.vx+=Math.cos(p.angle)*thrust;p.vy+=Math.sin(p.angle)*thrust;
    p.fuel=Math.max(0,p.fuel-(boost?C.FUEL_BOOST:C.FUEL_THRUST));
    spawnTrail(p);
  }

  // Boční trysky — strafe (zakázáno při warpu)
  if(warpPhase!=='boosting'){
    const sideThr=C.SIDE_THRUST*engMult;
    if(strafeL){p.vx+=Math.sin(p.angle)*sideThr;p.vy-=Math.cos(p.angle)*sideThr;p.fuel=Math.max(0,p.fuel-C.FUEL_THRUST*0.4);}
    if(strafeR){p.vx-=Math.sin(p.angle)*sideThr;p.vy+=Math.cos(p.angle)*sideThr;p.fuel=Math.max(0,p.fuel-C.FUEL_THRUST*0.4);}
  }

  // Brzdění — zakázáno při warp boostu
  if(braking&&warpPhase!=='boosting'){
    const spd=Math.hypot(p.vx,p.vy);
    if(spd>0.01){
      const brakePow=C.THRUST*C.BRAKE_MULT*engMult;
      const newSpd=Math.max(0,spd-brakePow);
      p.vx=p.vx/spd*newSpd;p.vy=p.vy/spd*newSpd;
    }else{p.vx=0;p.vy=0;}
  }

  // Speed cap — žádný při boost nebo warpu
  if(!boost){
    const spd=Math.hypot(p.vx,p.vy);
    const maxSpd=C.MAX_SPD*engMult;
    if(spd>maxSpd){p.vx*=maxSpd/spd;p.vy*=maxSpd/spd;}
  }

  // Drag — warp má nejmenší drag (loď se nepřestává zrychlovat)
  const drag=warpBoosting?C.DRAG_WARP:(boost?C.DRAG_BOOST:C.DRAG);
  p.vx*=drag;p.vy*=drag;
  p.x+=p.vx;p.y+=p.vy;
  p.thrusting=thrusting;p.boosting=boost;

  // Auto-rotate: loď se pomalu natáčí ve směru pohybu
  const spd=Math.hypot(p.vx,p.vy);
  if(spd>0.8){
    const targetAngle=Math.atan2(p.vy,p.vx);
    const da=angleDiff(targetAngle,p.angle);
    p.angle+=da*Math.min(0.18,dt*2.2);
  }

  // Camera zoom — oddaluje se s rychlostí
  const targetZoom=Math.max(0.08,1/(1+spd*0.026));
  camZoom+=(targetZoom-camZoom)*Math.min(1,dt*2.8);

  // Warp boost — počítej čas při vysoké rychlosti → příjezd
  if(warpPhase==='boosting'){
    const spdKms=spd*C.SPEED_KMS_FACTOR;
    if(spdKms>=C.WARP_SPEED_KMS){warpElapsed+=dt;}
    if(window.warpTarget&&warpElapsed>=window.warpTarget.warpSecs){completeWarp();return;}
  }

  // Idle fuel
  p.fuel=Math.max(0,p.fuel-C.FUEL_IDLE);

  // Invincibility
  if(p.invTimer>0)p.invTimer=Math.max(0,p.invTimer-dt);

  // Shield regen
  p.shieldRegenTimer+=dt;
  if(p.shieldRegenTimer>5)p.shield=Math.min(p.shieldMax,p.shield+dt*8);

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
    if(d<closestStD){closestStD=d;if(d<800)gs.nearStation=st;}
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
    // Směr dokovacího průchodu (rotuje se stanicí)
    const portAngle=st.angle;  // mail slot direction
    const portNormal=portAngle; // normal pointing outward from port
    // Vektor přiblížení hráče
    const approachAngle=Math.atan2(p.y-st.y,p.x-st.x);
    // Zarovnání = jak moc letí hráč DO průchodu
    const align=Math.abs(angleDiff(approachAngle,portNormal))*180/Math.PI;
    const speed=Math.hypot(p.vx,p.vy);
    gs.dockingState={
      approaching:d<C.DOCK_DIST*3,
      align,speed,
      dockable: d<C.DOCK_DIST&&align<C.DOCK_ANGLE&&speed<C.DOCK_SPD
    };
  } else {
    gs.dockingState={approaching:false,align:0,speed:0,dockable:false};
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

  // Autosave každých 30s
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
  document.getElementById('death-screen').style.display='flex';
}

// ---- Save / Load ----
function saveGame(){
  if(!gameState||gameState.player.dead)return;
  const p=gameState.player;
  const data={x:p.x,y:p.y,angle:p.angle,hull:p.hull,shield:p.shield,fuel:p.fuel,
    credits:p.credits,cargo:p.cargo,cargoCount:p.cargoCount,upgrades:p.upgrades,
    xp:p.xp,level:p.level,totalEarned:gameState.totalEarned};
  try{localStorage.setItem(C.SAVE_KEY,JSON.stringify(data));}catch(e){}
}
function loadSave(){try{const r=localStorage.getItem(C.SAVE_KEY);return r?JSON.parse(r):null;}catch(e){return null;}}
function hasSave(){return!!localStorage.getItem(C.SAVE_KEY);}

// ---- Hlavní smyčka ----
function loop(ts){
  requestAnimationFrame(loop);
  const dt=Math.min((ts-last)/1000,0.05);last=ts;
  frameCount++;

  if(state==='menu')return;
  if(state==='docking')updateDocking(dt);
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
  const allParts=[...engineTrails,...gs.particles];
  renderParticles(allParts);
  gs.loots.forEach(l=>renderLoot(l));
  gs.enemies.forEach(e=>renderEnemy(e,t));

  gs.chunks.forEach(ch=>{
    if(!ch.system)return;
    const drawSt=(st)=>{
      if(!st)return;
      const isNear=st===gs.nearStation;
      renderStation(st,t,isNear,isNear&&gs.dockingState?.dockable);
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
      const alpha=s.bright*(0.6+Math.sin(t*s.speed+s.tw)*0.4);
      mx.globalAlpha=alpha;
      mx.fillStyle='#e8eeff';
      mx.beginPath();mx.arc(s.x,s.y,s.r,0,Math.PI*2);mx.fill();
    });
    mx.globalAlpha=1;
  })(0);
}

// ---- Init ----
window.addEventListener('load',()=>{
  canvas=document.getElementById('c');
  ctx=canvas.getContext('2d');
  W=canvas.width=window.innerWidth;
  H=canvas.height=window.innerHeight;
  W2=W;H2=H;
  window.addEventListener('resize',()=>{W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;});

  initMinimap();
  initMapCanvas();
  initGalaxyCanvas();
  initMenuStars();

  // Menu tlačítka
  document.getElementById('btn-new').onclick=()=>startGame(false);
  document.getElementById('btn-load').onclick=()=>{if(hasSave())startGame(true);else setMsg('Žádná uložená hra',2000);};
  document.getElementById('btn-settings').onclick=()=>{document.getElementById('settings-panel').style.display=document.getElementById('settings-panel').style.display==='block'?'none':'block';};
  document.getElementById('btn-restart').onclick=()=>{document.getElementById('death-screen').style.display='none';startGame(false);};
  document.getElementById('btn-menu').onclick=()=>{document.getElementById('death-screen').style.display='none';document.getElementById('menu').style.display='flex';document.getElementById('hud').style.display='none';state='menu';gameState=null;initMenuStars();};
  document.getElementById('btn-close-map').onclick=()=>closeMap();
  document.getElementById('btn-close-galaxy').onclick=()=>closeGalaxyMap();
  document.getElementById('btn-cancel-warp').onclick=()=>cancelWarp();
  document.getElementById('btn-undock').onclick=()=>undock();

  // Pause menu
  document.getElementById('btn-resume').onclick=()=>closePause();
  document.getElementById('btn-pause-settings').onclick=()=>{
    const p=document.getElementById('esc-settings-panel');
    const btn=document.getElementById('btn-pause-settings');
    const visible=p.style.display==='block';
    p.style.display=visible?'none':'block';
    btn.classList.toggle('active',!visible);
  };
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
    state='menu';gameState=null;initMenuStars();
  };

  // Save button
  const sbtn=document.getElementById('btn-save');if(sbtn)sbtn.onclick=()=>{saveGame();setMsg('Hra uložena!',2000);};

  // Load button na menu
  document.getElementById('btn-load').style.opacity=hasSave()?'1':'0.4';

  requestAnimationFrame(loop);
});
