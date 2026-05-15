// --- Canvas & global state ---
let C,ctx,MM,mctx,OV,ovCtx;
let W,H;
let camX=0,camY=0;
let shakeX=0,shakeY=0,shakeDur=0,shakeMag=0;
let ovZoomLevel=1,ovDragStart=null,ovPanX=0,ovPanY=0;

let bullets=[],enemies=[],particles_arr=[],loots=[],killfeed=[];
let convoys=[],sosEvents=[],freeAsteroids=[];
let player=null;
let gameRunning=false,paused=false;
let totalEarned=0;
let nearStation=null,dockedStation=null;
let msgTimer=0,waveTimer=0,currentTab='trade';
let stormEffect=0,eventNotifTimer=0;
let saveTimer=0,solarTime=0;
let shootCooldown=0;
let showPlanetNav=false;

let landingTimer=0,landingTarget=null;
const landingTotal=2.6;
let landingStartX=0,landingStartY=0;
let takeoffTimer=0,takeoffAngle=0;
const takeoffTotal=1.4;
let undockCooldown=0;

let frameCount=0;

// --- Canvas setup ---
function resize(){
  W=C.width=window.innerWidth;
  H=C.height=window.innerHeight;
  buildScanlines();
}

function triggerShake(mag,dur){if(!settings.shake)return;if(mag>shakeMag){shakeMag=mag;shakeDur=dur;}}
function updateShake(dt){
  if(shakeDur>0){shakeDur-=dt;shakeX=(Math.random()-.5)*shakeMag*2;shakeY=(Math.random()-.5)*shakeMag*2;shakeMag*=Math.pow(.85,dt*60);}
  else{shakeX=0;shakeY=0;shakeMag=0;}
}

// --- Particles & explosions ---
function spawnParticles(x,y,n,color,speed,life=0.6){
  const actualN=Math.ceil(n*settings.particleCount/100);
  for(let i=0;i<actualN;i++){
    const a=Math.random()*Math.PI*2,s=rnd(0.4,speed);
    particles_arr.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life,maxLife:life,color,r:rnd(.8,2.5)});
  }
}
function explode(x,y,color='#f84',n=22){
  spawnParticles(x,y,n,color,3.5,0.9);
  spawnParticles(x,y,Math.ceil(n*.4),'#fff',6,0.35);
  spawnParticles(x,y,Math.ceil(n*.3),'#ff8',2,1.2);
  playSfxExplosion();triggerShake(8,0.35);
}

// --- XP & saving ---
function addXP(amount){
  if(!player)return;
  player.xp+=amount;
  const needed=getXpForLevel(player.level);
  if(player.xp>=needed&&player.level<20){
    player.xp-=needed;player.level++;
    playSfxLevelUp();showXpPopup('LEVEL UP! '+player.level);
    player.credits+=player.level*50;setMsg(`LEVEL ${player.level}! Bonus: +${player.level*50} cr`,3500);triggerShake(4,0.4);
  }
  updateHUD();
}

function saveGame(){
  if(!player||player.dead)return;
  const data={x:player.x,y:player.y,hull:player.hull,shield:player.shield,fuel:player.fuel,
    credits:player.credits,cargo:player.cargo,cargoCount:player.cargoCount,
    upgrades:player.upgrades,xp:player.xp,level:player.level,totalEarned,settings};
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(data));showSaveNotif();}catch(e){}
}
function loadGame(){try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)return null;return JSON.parse(raw);}catch(e){return null;}}

// --- Player combat & loot ---
function hitPlayer(dmg){
  if(player.invTimer>0||landingTimer>0||takeoffTimer>0)return;
  playSfxHit();triggerShake(6,0.28);
  if(player.shield>0){player.shield=Math.max(0,player.shield-dmg);spawnParticles(player.x,player.y,7,'#36f',2.5);}
  else{player.hull=Math.max(0,player.hull-dmg);spawnParticles(player.x,player.y,10,'#f42',2.5);player.invTimer=0.6;}
  player.shieldRegenTimer=0;
  if(player.hull<=0&&!player.dead){player.dead=true;explode(player.x,player.y,'#f42',50);setTimeout(showDeath,400);}
}
function hitAsteroid(ast,dmg){
  ast.hp-=dmg;spawnParticles(ast.x,ast.y,5,'#887',1.8);
  if(ast.hp<=0){
    explode(ast.x,ast.y,'#887',14);addXP(3);
    if(ast.sz>22){
      for(let i=0;i<2;i++){
        const sz2=Math.floor(ast.sz*.52),verts=[],nv=rndInt(6,10);
        for(let j=0;j<nv;j++){const a=j/nv*Math.PI*2;verts.push({x:Math.cos(a)*sz2*(0.6+Math.random()*0.5),y:Math.sin(a)*sz2*(0.6+Math.random()*0.5)});}
        freeAsteroids.push({x:ast.x+rnd(-18,18),y:ast.y+rnd(-18,18),vx:ast.vx+rnd(-.35,.35),vy:ast.vy+rnd(-.35,.35),angle:Math.random()*Math.PI*2,rot:rnd(-.012,.012),sz:sz2,verts,hp:Math.ceil(sz2/7),maxHp:Math.ceil(sz2/7),color:ast.color});
      }
    }
    if(Math.random()<0.15)loots.push({x:ast.x,y:ast.y,name:rndItem(TRADE_GOODS).name,life:20,blink:0});
    return true;
  }
  return false;
}
function dropLoot(x,y,lootTable){const name=rndItem(lootTable);loots.push({x,y,name,life:25,blink:0});}
function pickupLoot(loot){
  const cmax=getCargoMax();if(player.cargoCount>=cmax){setMsg('Nákladní prostor plný!',2000);return false;}
  player.cargo[loot.name]=(player.cargo[loot.name]||0)+1;player.cargoCount++;
  setMsg(`Sebrán: ${loot.name}`,1500);const g=GOODS.find(g=>g.name===loot.name);spawnParticles(loot.x,loot.y,8,g?g.color:'#fa8',2.5);return true;
}

// --- Shooting & docking ---
function shoot(){
  if(shootCooldown>0||player.dead)return;
  const weaponLvl=player.upgrades.weapons;
  shootCooldown=0.22*(1-weaponLvl*0.1);
  const dmg=getWeaponDmg();
  bullets.push({x:player.x+Math.cos(player.angle)*18,y:player.y+Math.sin(player.angle)*18,
    vx:player.vx*0.25+Math.cos(player.angle)*11,vy:player.vy*0.25+Math.sin(player.angle)*11,
    life:1.3,owner:'player',dmg});
  spawnParticles(player.x+Math.cos(player.angle)*18,player.y+Math.sin(player.angle)*18,4,'#4af',2.5);
  playSfxShoot();
}
function tryDock(){
  if(nearStation&&!player.dead&&!dockedStation&&landingTimer<=0&&undockCooldown<=0)startLanding(nearStation);
}
function scanArea(){
  if(player.dead)return;
  const range=getScannerRange(),found=[];
  getVisibleChunks().forEach(ch=>{
    if(ch.station&&dist2(player,ch.station)<range)found.push('Stanice: '+ch.station.name);
    if(ch.wreck&&!ch.wreck.looted&&dist2(player,ch.wreck)<range)found.push('Vrak lodi');
    if(ch.anomaly&&ch.anomaly.active&&dist2(player,ch.anomaly)<range)found.push('Vesmírná anomálie');
    if(ch.blackhole&&dist2(player,ch.blackhole)<range*1.5)found.push('⚠ ČERNÁ DÍRA');
  });
  sosEvents.forEach(s=>{if(dist2(player,s)<range)found.push('SOS signál');});
  if(found.length){setMsg('SKENER: '+found.slice(0,3).join(' · '),3000);spawnParticles(player.x,player.y,20,'#0ff',4,0.8);}
  else setMsg('Skener: Nic v dosahu ('+range+' AU)',2000);
}

// --- Landing & undocking ---
function startLanding(station){
  if(landingTimer>0)return;
  landingStartX=player.x;landingStartY=player.y;
  landingTarget=station;landingTimer=landingTotal;
  const anim=document.getElementById('landing-anim');
  anim.style.background='rgba(0,4,18,0)';anim.classList.add('active');
  document.getElementById('landing-dock-msg').style.opacity='0';
  document.getElementById('landing-dock-sub').style.opacity='0';
}
function finishLanding(){
  const target=landingTarget;
  landingTarget=null;
  player.x=target.x;player.y=target.y;player.vx=0;player.vy=0;
  dockedStation=target;
  spawnParticles(target.x,target.y,20,'#40a8ff',2.5);
  document.getElementById('landing-anim').style.background='rgba(0,4,18,0)';
  setTimeout(()=>{
    document.getElementById('landing-anim').classList.remove('active');
    document.getElementById('landing-dock-msg').style.opacity='0';
    document.getElementById('landing-dock-sub').style.opacity='0';
    if(dockedStation===target){currentTab='trade';showPanel(target);}
  },650);
}
function undock(){
  if(!dockedStation)return;
  // Explicitly clear landing animation overlay in case it's still showing
  const anim=document.getElementById('landing-anim');
  anim.classList.remove('active');
  anim.style.background='rgba(0,4,18,0)';
  document.getElementById('landing-dock-msg').style.opacity='0';
  document.getElementById('landing-dock-sub').style.opacity='0';
  takeoffAngle=player.angle+Math.PI;
  takeoffTimer=takeoffTotal;
  undockCooldown=takeoffTotal+1.5;
  spawnParticles(player.x,player.y,14,'#60c0ff',2.2);
  dockedStation=null;
  document.getElementById('panel').style.display='none';
}

// --- Game init ---
function initGame(fromSave=false){
  chunkCache.clear();bullets=[];enemies=[];particles_arr=[];loots=[];killfeed=[];
  engineTrails=[];convoys=[];sosEvents=[];freeAsteroids=[];
  waveTimer=0;stormEffect=0;saveTimer=0;shakeMag=0;shakeDur=0;shakeX=0;shakeY=0;
  landingTimer=0;landingTarget=null;landingStartX=0;landingStartY=0;
  takeoffTimer=0;undockCooldown=0;sosTimer=0;convoyTimer=0;frameCount=0;
  paused=false;hidePause();hideOverview();
  const anim=document.getElementById('landing-anim');
  anim.classList.remove('active');anim.style.background='rgba(0,4,18,0)';
  document.getElementById('landing-dock-msg').style.opacity='0';
  document.getElementById('landing-dock-sub').style.opacity='0';
  const save=fromSave?loadGame():null;
  if(save){
    totalEarned=save.totalEarned||0;
    if(save.settings)Object.assign(settings,save.settings);
    player={x:save.x||0,y:save.y||0,vx:0,vy:0,angle:-Math.PI/2,
      hull:save.hull||100,hullMax:100,shield:save.shield||100,shieldMax:100,shieldRegenTimer:0,
      fuel:save.fuel||100,credits:save.credits||1500,cargo:save.cargo||{},cargoCount:save.cargoCount||0,
      dead:false,invTimer:0,upgrades:save.upgrades||{cargo:0,shield:0,engine:0,weapons:0,fuel:0,scanner:0},
      xp:save.xp||0,level:save.level||1,_thrusting:false,_boost:false};
    setMsg('Hra načtena! Vítejte zpět.',3000);
  } else {
    totalEarned=0;
    const homeChunk=getChunk(3,2);
    const hx=homeChunk.station?homeChunk.station.x+100:3*800+400;
    const hy=homeChunk.station?homeChunk.station.y:2*800+400;
    player={x:hx,y:hy,vx:0,vy:0,angle:-Math.PI/2,hull:100,hullMax:100,shield:100,shieldMax:100,shieldRegenTimer:0,
      fuel:100,credits:1500,cargo:{},cargoCount:0,dead:false,invTimer:0,
      upgrades:{cargo:0,shield:0,engine:0,weapons:0,fuel:0,scanner:0},xp:0,level:1,_thrusting:false,_boost:false};
    setMsg('WASD pohyb · SHIFT+W turbo · SPACE střelba · E přistát · N navigace · M mapa',5000);
  }
  camX=player.x-W/2;camY=player.y-H/2;
  FORCED_STATIONS.forEach(s=>getChunk(s.cx,s.cy));
  gameRunning=true;dockedStation=null;nearStation=null;currentTab='trade';
  document.getElementById('death').style.display='none';
  document.getElementById('panel').style.display='none';
  updateHUD();
}

function restartGame(){document.getElementById('death').style.display='none';initGame();}

// --- Keyboard input ---
const keys={};
document.addEventListener('keydown',e=>{
  keys[e.code]=true;
  if((e.key==='m'||e.key==='M')&&gameRunning&&!player?.dead){
    if(isOverviewOpen()){hideOverview();}
    else if(!paused&&document.getElementById('panel').style.display==='none'){openOverview();}
    return;
  }
  if(e.key==='Escape'){
    if(isOverviewOpen()){hideOverview();return;}
    if(paused){resumeGame();return;}
    if(document.getElementById('panel').style.display==='block'){undock();return;}
    if(gameRunning&&!player?.dead){openPause();return;}
  }
  if(e.key==='n'||e.key==='N'){if(gameRunning&&!player?.dead){showPlanetNav=!showPlanetNav;updatePlanetNav();}return;}
  if(!paused&&!isOverviewOpen()){
    if(e.key==='e'||e.key==='E'){if(dockedStation)undock();else tryDock();}
    if(e.key==='f'||e.key==='F')scanArea();
    if(e.key===' '){e.preventDefault();shoot();}
    if(e.key==='F5'){e.preventDefault();saveGame();}
  }
});
document.addEventListener('keyup',e=>{keys[e.code]=false;});
window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});

function isThrusting(){return !!(keys['KeyW']||keys['ArrowUp']);}
function isBraking(){return !!(keys['KeyS']||keys['ArrowDown']);}
function isTurningLeft(){return !!(keys['KeyA']||keys['ArrowLeft']);}
function isTurningRight(){return !!(keys['KeyD']||keys['ArrowRight']);}
function isShiftHeld(){return !!(keys['ShiftLeft']||keys['ShiftRight']);}

// --- Main loop ---
let last=0;
function loop(ts){
  requestAnimationFrame(loop);
  if(!gameRunning)return;
  frameCount++;
  const dt=Math.min((ts-last)/1000,.055);last=ts;

  if(isOverviewOpen()){
    // Only redraw overview when animating (every other frame is fine)
    if(frameCount%2===0)drawOverviewMap();
    return;
  }
  if(paused)return;

  const chunks=getVisibleChunks();
  updateShake(dt);

  // Player movement — blocked while docked to prevent drifting away from station
  if(!player.dead&&!dockedStation&&landingTimer<=0&&takeoffTimer<=0){
    const thrusting=isThrusting(),braking=isBraking();
    const turnLeft=isTurningLeft(),turnRight=isTurningRight();
    const boost=isShiftHeld()&&thrusting&&player.fuel>0;
    const engMult=getEngineBoost();
    const thrust=(boost?.20:.09)*engMult;
    const maxSpd=(boost?6.5:3.8)*engMult;
    const turnSpeed=2.8*settings.turnSpeed*dt;
    if(turnLeft)player.angle-=turnSpeed;
    if(turnRight)player.angle+=turnSpeed;
    if(thrusting){
      player.vx+=Math.cos(player.angle)*thrust;player.vy+=Math.sin(player.angle)*thrust;
      if(boost)player.fuel=Math.max(0,player.fuel-dt*10*getFuelBurn());
      spawnEngineTrail(player.x,player.y,player.vx,player.vy,player.angle,boost);
    }
    if(braking){player.vx-=Math.cos(player.angle)*thrust*.35;player.vy-=Math.sin(player.angle)*thrust*.35;}
    const spd=Math.hypot(player.vx,player.vy);if(spd>maxSpd){player.vx*=maxSpd/spd;player.vy*=maxSpd/spd;}
    player.vx*=settings.drag;player.vy*=settings.drag;
    player.x+=player.vx;player.y+=player.vy;
    if(player.invTimer>0)player.invTimer-=dt;
    player.shieldRegenTimer+=dt;if(player.shieldRegenTimer>4)player.shield=Math.min(getShieldMax(),player.shield+dt*8);
    if(shootCooldown>0)shootCooldown-=dt;
    player._thrusting=thrusting;player._boost=boost;
    const boostEl=document.getElementById('boost-indicator');
    if(boost){boostEl.style.opacity='1';boostEl.style.color=player.fuel<20?'#e06020':'#00b8e0';}
    else boostEl.style.opacity='0';
  } else if(dockedStation){
    // While docked, keep velocity zero
    player.vx=0;player.vy=0;
    player._thrusting=false;player._boost=false;
  }

  // Engine trails
  engineTrails.forEach(t=>{t.x+=t.vx;t.y+=t.vy;t.life-=dt;t.vx*=.92;t.vy*=.92;});
  engineTrails=engineTrails.filter(t=>t.life>0);
  if(engineTrails.length>180)engineTrails.splice(0,engineTrails.length-180);

  // World interactions
  nearStation=null;let minD=9999;stormEffect=0;let inAnomaly=false;
  chunks.forEach(ch=>{
    for(let i=ch.asteroids.length-1;i>=0;i--){
      const a=ch.asteroids[i];a.x+=a.vx;a.y+=a.vy;a.angle+=a.rot;
      if(!player.dead&&dist2(player,a)<a.sz+10&&player.invTimer<=0){hitPlayer(8);a.vx*=-1;a.vy*=-1;}
    }
    if(ch.station){
      const d=dist2(player,ch.station);
      if(d<minD){minD=d;if(d<140)nearStation=ch.station;}
      ch.station.angle+=dt*.22;ch.station.armRot[0]+=dt*.08;ch.station.armRot[1]-=dt*.06;
    }
    if(ch.blackhole){
      const bh=ch.blackhole,d=dist2(player,bh);bh.angle+=dt*0.4;
      if(!player.dead&&d<bh.pullRadius&&landingTimer<=0&&takeoffTimer<=0){
        const normalizedDist=Math.max(0,d/bh.pullRadius);
        const pull=1.2*Math.pow(1-normalizedDist,1.8)*dt*60;
        const ax=(bh.x-player.x)/Math.max(d,1),ay=(bh.y-player.y)/Math.max(d,1);
        player.vx+=ax*pull;player.vy+=ay*pull;
        if(d<bh.r+20){
          // Silný odraz od středu — zabrání uvíznutí
          const escAx=(player.x-bh.x)/Math.max(d,1),escAy=(player.y-bh.y)/Math.max(d,1);
          player.vx=escAx*8;player.vy=escAy*8;
          hitPlayer(15);
        }
      }
    }
    if(ch.wreck&&!ch.wreck.looted&&dist2(player,ch.wreck)<50&&!player.dead){
      ch.wreck.looted=true;
      const lootTable=['Vrak Součástky','Stará technika','Pirátská data'];
      const credits=rndInt(30,100);player.credits+=credits;totalEarned+=credits;
      const cmax=getCargoMax();
      if(player.cargoCount<cmax){const item=rndItem(lootTable);player.cargo[item]=(player.cargo[item]||0)+1;player.cargoCount++;setMsg(`Vrak prohledán! +${credits} cr, nalezen: ${item}`,3000);}
      else setMsg(`Vrak prohledán! +${credits} cr (náklad plný)`,2500);
      explode(player.x,player.y,'#5af',15);addXP(15);updateHUD();
    }
    if(ch.anomaly&&ch.anomaly.active){
      ch.anomaly.phase+=dt;const d=dist2(player,ch.anomaly);
      if(d<ch.anomaly.r*1.5){inAnomaly=true;if(Math.random()<dt*0.3){const cmax=getCargoMax();if(player.cargoCount<cmax){player.cargo['Anomálie Fragment']=(player.cargo['Anomálie Fragment']||0)+1;player.cargoCount++;ch.anomaly.active=false;setMsg('Anomálie Fragment zachycen!',3000);explode(ch.anomaly.x,ch.anomaly.y,'#b0f',20);addXP(20);updateHUD();}}}
    }
    if(ch.storm){
      ch.storm.angle+=dt*0.12;
      if(!player.dead){const d=dist2(player,ch.storm);if(d<ch.storm.r){stormEffect=ch.storm.intensity*(1-d/ch.storm.r);player.shield=Math.max(0,player.shield-dt*15*stormEffect);player.shieldRegenTimer=0;if(Math.random()<dt*stormEffect*3)spawnParticles(player.x,player.y,4,'#0af',3,0.4);}}
    }
  });
  if(!inAnomaly)document.getElementById('anomaly-bar').style.opacity='0';

  // Free asteroids
  for(let i=freeAsteroids.length-1;i>=0;i--){
    const a=freeAsteroids[i];a.x+=a.vx;a.y+=a.vy;a.angle+=a.rot;
    if(!player.dead&&dist2(player,a)<a.sz+10&&player.invTimer<=0){hitPlayer(8);a.vx*=-1;a.vy*=-1;}
    if(dist2(player,a)>3000)freeAsteroids.splice(i,1);
  }

  // Bullets
  for(let i=bullets.length-1;i>=0;i--){
    const b=bullets[i];b.x+=b.vx;b.y+=b.vy;b.life-=dt;
    if(b.life<=0){bullets.splice(i,1);continue;}
    const bsx=b.x-camX,bsy=b.y-camY;
    if(bsx<-100||bsx>W+100||bsy<-100||bsy>H+100){bullets.splice(i,1);continue;}
    if(b.owner==='player'){
      let hit=false;
      for(const ch of chunks){for(let j=ch.asteroids.length-1;j>=0;j--){const a=ch.asteroids[j];if(dist2(b,a)<a.sz){if(hitAsteroid(a,b.dmg))ch.asteroids.splice(j,1);bullets.splice(i,1);hit=true;break;}}if(hit)break;}
      if(hit)continue;
      for(let j=freeAsteroids.length-1;j>=0;j--){const a=freeAsteroids[j];if(dist2(b,a)<a.sz){if(hitAsteroid(a,b.dmg))freeAsteroids.splice(j,1);bullets.splice(i,1);hit=true;break;}}
      if(hit)continue;
      for(let j=enemies.length-1;j>=0;j--){const e=enemies[j];if(dist2(b,e)<e.sz+7){e.hp-=b.dmg;spawnParticles(e.x,e.y,6,e.type==='pirate'?'#f64':'#f48',2.5);bullets.splice(i,1);if(e.hp<=0){explode(e.x,e.y,e.type==='pirate'?'#f64':'#f48',28);player.credits+=e.credits;totalEarned+=e.credits;dropLoot(e.x,e.y,e.lootTable);addKill(`↯ ${e.type==='pirate'?'Pirát':'Dron'} zničen (+${e.credits} cr)`);addXP(e.type==='pirate'?25:12);enemies.splice(j,1);}break;}}
      if(hit)continue;
      for(let j=convoys.length-1;j>=0;j--){const cv=convoys[j];if(dist2(b,cv)<cv.sz+10){cv.hp-=b.dmg;spawnParticles(cv.x,cv.y,5,'#5a9',2);bullets.splice(i,1);if(cv.hp<=0){explode(cv.x,cv.y,'#5a9',22);player.credits+=cv.credits;totalEarned+=cv.credits;const cmax=getCargoMax();if(player.cargoCount<cmax){player.cargo[cv.cargo]=(player.cargo[cv.cargo]||0)+1;player.cargoCount++;}addKill(`↯ Konvoj zničen (+${cv.credits} cr)`);addXP(20);convoys.splice(j,1);updateHUD();}break;}}
    } else {
      if(!player.dead&&dist2(b,player)<15){hitPlayer(b.dmg);bullets.splice(i,1);player.shieldRegenTimer=0;}
    }
  }

  // Enemies & waves
  waveTimer+=dt;if(waveTimer>22&&enemies.length<8){waveTimer=0;for(let i=0;i<rndInt(1,2);i++)spawnEnemy(Math.random()<0.45?'pirate':'drone');}
  enemies.forEach(e=>updateEnemyAI(e,dt));
  maybeConvoy(dt);
  for(let i=convoys.length-1;i>=0;i--){const cv=convoys[i];cv.x+=cv.vx;cv.y+=cv.vy;cv.life-=dt;if(cv.life<=0||dist2(player,cv)>4000)convoys.splice(i,1);}
  maybeSOS(dt);
  for(let i=sosEvents.length-1;i>=0;i--){const s=sosEvents[i];s.life-=dt;s.blink+=dt*4.8;if(s.life<=0){sosEvents.splice(i,1);continue;}if(!s.handled&&dist2(player,s)<50){s.handled=true;player.credits+=s.reward;totalEarned+=s.reward;addXP(30);setMsg(`SOS záchrana! +${s.reward} cr`,3000);explode(s.x,s.y,'#ff4',12);updateHUD();sosEvents.splice(i,1);}}
  for(let i=loots.length-1;i>=0;i--){const l=loots[i];l.life-=dt;l.blink+=dt*4.8;if(l.life<=0){loots.splice(i,1);continue;}if(dist2(player,l)<25){if(pickupLoot(l))loots.splice(i,1);}}
  particles_arr.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.life-=dt;p.vx*=.93;p.vy*=.93;});
  particles_arr=particles_arr.filter(p=>{if(p.life<=0)return false;const px=p.x-camX,py=p.y-camY;return px>-50&&px<W+50&&py>-50&&py<H+50;});

  // UI timers
  if(msgTimer>0){msgTimer-=dt*1000;if(msgTimer<=0)document.getElementById('msg').style.opacity='0';}
  if(eventNotifTimer>0){eventNotifTimer-=dt*1000;if(eventNotifTimer<=0)document.getElementById('event-notif').style.opacity='0';}
  if(nearStation&&!dockedStation&&msgTimer<=0){document.getElementById('msg').textContent='[E] Přistát na '+nearStation.name+' · [ESC] Pauza';document.getElementById('msg').style.opacity='1';}
  else if(!nearStation&&msgTimer<=0){document.getElementById('msg').style.opacity='0';}

  saveTimer+=dt;if(saveTimer>60){saveTimer=0;saveGame();}
  solarTime+=dt;
  if(undockCooldown>0)undockCooldown=Math.max(0,undockCooldown-dt);

  // Takeoff animation
  if(takeoffTimer>0){
    takeoffTimer-=dt;
    const prog=1-(takeoffTimer/takeoffTotal),ease=prog*prog,spd=ease*4.5;
    player.vx=Math.cos(takeoffAngle)*spd;player.vy=Math.sin(takeoffAngle)*spd;
    player.angle=takeoffAngle;player.x+=player.vx;player.y+=player.vy;
    if(Math.random()<dt*28)spawnEngineTrail(player.x,player.y,player.vx,player.vy,player.angle,false);
  }

  // Landing animation
  if(landingTimer>0){
    landingTimer-=dt;
    const progress=1-(landingTimer/landingTotal);
    if(progress<0.18){
      player.vx*=0.72;player.vy*=0.72;
    } else {
      const t=Math.min(1,(progress-0.18)/0.82);
      const ease=t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
      player.x=landingStartX+(landingTarget.x-landingStartX)*ease;
      player.y=landingStartY+(landingTarget.y-landingStartY)*ease;
      player.vx=0;player.vy=0;
      const dx=landingTarget.x-player.x+0.001,dy=landingTarget.y-player.y+0.001;
      const ta=Math.atan2(dy,dx),da=((ta-player.angle+Math.PI*3)%(Math.PI*2))-Math.PI;
      player.angle+=da*Math.min(1,dt*6);
      if(progress<0.88&&Math.random()<dt*22)spawnEngineTrail(player.x,player.y,player.vx,player.vy,player.angle,false);
    }
    if(progress>0.78&&progress<0.96&&Math.random()<dt*18){
      const a=Math.random()*Math.PI*2,r=(landingTarget.ring||38)*0.9;
      spawnParticles(landingTarget.x+Math.cos(a)*r,landingTarget.y+Math.sin(a)*r,1,'#40a8ff',1.2);
    }
    if(progress>0.78){
      const f=Math.min(1,(progress-0.78)/0.22);
      document.getElementById('landing-dock-msg').style.opacity=f;
      document.getElementById('landing-dock-sub').style.opacity=f*0.8;
      document.getElementById('landing-anim').style.background=`rgba(0,4,18,${f*0.5})`;
    }
    if(landingTimer<=0)finishLanding();
  }

  // Camera
  const targetCX=player.x-W/2,targetCY=player.y-H/2;
  camX+=(targetCX-camX)*.1;camY+=(targetCY-camY)*.1;

  // Throttled HUD & nav updates
  if(frameCount%2===0)updateHUD();
  if(frameCount%4===0){updateStationArrow(chunks);updatePlanetNav();}

  // --- Render ---
  // Drain any save() stack overflow from previous frames (spec: restore() on empty stack is no-op)
  for(let _i=0;_i<64;_i++)ctx.restore();
  ctx.setTransform(1,0,0,1,0,0);
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.setLineDash([]);

  ctx.fillStyle='#010306';ctx.fillRect(0,0,W,H);
  drawStars();drawNebulae(chunks);drawSolarSystem();drawEngineTrails();
  if(stormEffect>0.1){ctx.fillStyle=`rgba(0,140,240,${stormEffect*0.07})`;ctx.fillRect(0,0,W,H);}
  // Černé díry jako první — ostatní entity se kreslí NA NÍ, ne pod ní
  chunks.forEach(ch=>{if(ch.blackhole)drawBlackHole(ch.blackhole);});
  chunks.forEach(ch=>{
    ch.asteroids.forEach(drawAsteroid);
    if(ch.station)drawStation(ch.station);
    if(ch.wreck)drawWreck(ch.wreck);
    if(ch.anomaly)drawAnomaly(ch.anomaly);
    if(ch.storm)drawStorm(ch.storm);
  });
  freeAsteroids.forEach(drawAsteroid);
  loots.forEach(drawLoot);
  sosEvents.forEach(drawSOS);
  convoys.forEach(drawConvoy);
  enemies.forEach(drawEnemy);

  // Bullets
  bullets.forEach(b=>{
    const{x:sx,y:sy}=toScreen(b.x,b.y);
    if(sx<-30||sx>W+30||sy<-30||sy>H+30)return;
    const isP=b.owner==='player';
    ctx.save();ctx.globalAlpha=Math.min(1,b.life*1.2);ctx.translate(sx,sy);ctx.rotate(Math.atan2(b.vy,b.vx));
    if(isP){
      ctx.fillStyle='#8df';ctx.beginPath();ctx.ellipse(0,0,12,2,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(0,0,4,1,0,0,Math.PI*2);ctx.fill();
    } else {
      ctx.fillStyle='#f64';ctx.beginPath();ctx.ellipse(0,0,9,2,0,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  });

  // Particles
  particles_arr.forEach(p=>{
    const{x:sx,y:sy}=toScreen(p.x,p.y);
    ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(sx,sy,p.r,0,Math.PI*2);ctx.fill();
  });
  ctx.globalAlpha=1;

  drawVignette();

  // Player ship — absolutely last, guaranteed clean state
  ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.setLineDash([]);
  if(!player.dead){
    const{x:sx,y:sy}=toScreen(player.x,player.y);
    if(player.shield>0){
      const shA=player.invTimer>0?0.5:0.06+(player.shield/getShieldMax())*0.1;
      ctx.save();ctx.globalAlpha=shA;ctx.strokeStyle='#2060d8';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(sx,sy,20,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    drawShip(sx,sy,player.angle,1,'#5af',player._thrusting,player._boost,player.hull<player.hullMax*.4);
    ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.setLineDash([]);
    if(player.fuel<15){
      ctx.save();ctx.globalAlpha=0.4+Math.sin(Date.now()/200)*0.3;ctx.strokeStyle='#d07000';ctx.lineWidth=1;ctx.setLineDash([3,5]);
      ctx.beginPath();ctx.arc(sx,sy,25,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    if(player.invTimer>0&&Math.floor(player.invTimer*12)%2===0){
      ctx.save();ctx.globalAlpha=0.25;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(sx,sy,22,0,Math.PI*2);ctx.fill();ctx.restore();
    }
  }
  ctx.globalAlpha=1;

  if(frameCount%2===0)drawMinimap();
}

// --- Startup ---
(function init(){
  C=document.getElementById('c');
  ctx=C.getContext('2d');
  MM=document.getElementById('mm');
  mctx=MM.getContext('2d');
  OV=document.getElementById('overview-canvas');
  ovCtx=OV.getContext('2d');

  resize();
  window.addEventListener('resize',resize);
  buildScanlines();
  buildMenuStars();

  // Overview map interactions
  OV.addEventListener('wheel',e=>{e.preventDefault();ovZoom(e.deltaY<0?1:-1);},{passive:false});
  OV.addEventListener('mousedown',e=>{ovDragStart={x:e.clientX-ovPanX,y:e.clientY-ovPanY};OV.style.cursor='grabbing';});
  OV.addEventListener('mousemove',e=>{if(ovDragStart){ovPanX=e.clientX-ovDragStart.x;ovPanY=e.clientY-ovDragStart.y;drawOverviewMap();}});
  OV.addEventListener('mouseup',()=>{ovDragStart=null;OV.style.cursor='grab';});
  OV.addEventListener('mouseleave',()=>{ovDragStart=null;OV.style.cursor='grab';});
  OV.style.cursor='grab';

  document.getElementById('close-panel').addEventListener('click',()=>undock());

  requestAnimationFrame(loop);
})();
