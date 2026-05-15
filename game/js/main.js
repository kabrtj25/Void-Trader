// ===== SPACE TRADER — hlavní smyčka =====

// State machine
let gameState = null;  // hráč, entity, nav, atd.
let state = 'menu';    // 'menu' | 'playing' | 'docked' | 'map'
let canvas, W2, H2;    // W,H jsou v render.js
let last = 0, frameCount = 0;

// Globální zpráva
window.msgText=''; window.msgTimer=0;
function setMsg(txt,ms=3000){window.msgText=txt;window.msgTimer=ms;}

// Input
const keys={};
document.addEventListener('keydown',e=>{
  if(keys[e.code])return;
  keys[e.code]=true;
  if(state==='playing'){
    if(e.key===' '){e.preventDefault();tryShoot();}
    if(e.key==='m'||e.key==='M'){e.preventDefault();openMap();}
    if(e.key==='e'||e.key==='E'){e.preventDefault();tryDock();}
    if(e.key==='Escape'){e.preventDefault();openPause();}
    if(e.key==='n'||e.key==='N'){clearNav();}
  } else if(state==='paused'){
    if(e.key==='Escape'){e.preventDefault();closePause();}
  } else if(state==='map'){
    if(e.key==='m'||e.key==='M'||e.key==='Escape'){e.preventDefault();closeMap();}
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
  setMsg('Vítejte ve Space Trader! [WASD] let  [SHIFT+W] boost  [SPACE] střelba  [E] přistání  [M] mapa',6000);
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
    startDocking(gs.nearStation);
  }
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
  drawBigMap();
}
function closeMap(){
  state='playing';
  document.getElementById('map-overlay').style.display='none';
}
function clearNav(){
  if(gameState){gameState.navTarget=null;setMsg('Navigace zrušena.',1500);}
}

// ---- Pause ----
function openPause(){
  if(state!=='playing')return;
  state='paused';
  document.getElementById('pause-screen').style.display='flex';
}
function closePause(){
  state='playing';
  document.getElementById('pause-screen').style.display='none';
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
  if(state!=='playing'||!gameState)return;
  const gs=gameState;
  const p=gs.player;
  if(p.dead)return;

  gs.t+=dt;
  if(shootCd>0)shootCd=Math.max(0,shootCd-dt);
  if(window.msgTimer>0)window.msgTimer=Math.max(0,window.msgTimer-dt*1000);

  // Pohyb hráče
  const thrusting=isKey('KeyW','ArrowUp');
  const braking=isKey('KeyS','ArrowDown');
  const turnL=isKey('KeyA','ArrowLeft');
  const turnR=isKey('KeyD','ArrowRight');
  const boost=isKey('ShiftLeft','ShiftRight')&&thrusting&&p.fuel>0;

  if(turnL)p.angle-=C.ROT_SPD*dt;
  if(turnR)p.angle+=C.ROT_SPD*dt;

  const engMult=1+0.15*(p.upgrades.engine||0);
  if(thrusting){
    const thrust=(boost?C.BOOST_THRUST:C.THRUST)*engMult;
    p.vx+=Math.cos(p.angle)*thrust;p.vy+=Math.sin(p.angle)*thrust;
    p.fuel=Math.max(0,p.fuel-(boost?C.FUEL_BOOST:C.FUEL_THRUST));
    spawnTrail(p);
  }
  if(braking){
    // Retro trysky — zpomalení ke 0, loď necouvá
    const spd=Math.hypot(p.vx,p.vy);
    if(spd>0.01){
      const brakePow=C.THRUST*C.BRAKE_MULT*engMult;
      const newSpd=Math.max(0,spd-brakePow);
      p.vx=p.vx/spd*newSpd;p.vy=p.vy/spd*newSpd;
    }else{p.vx=0;p.vy=0;}
  }

  // Speed cap
  const spd=Math.hypot(p.vx,p.vy);
  const maxSpd=(boost?C.BOOST_SPD:C.MAX_SPD)*engMult;
  if(spd>maxSpd){p.vx*=maxSpd/spd;p.vy*=maxSpd/spd;}

  // Drag
  p.vx*=C.DRAG;p.vy*=C.DRAG;
  p.x+=p.vx;p.y+=p.vy;
  p.thrusting=thrusting;p.boosting=boost;

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
  if(state!=='paused')update(dt);
  render(dt,ts/1000);
}

function render(dt,t){
  if(!gameState)return;
  const gs=gameState;
  const p=gs.player;

  // Absolutní reset canvas
  ctx.setTransform(1,0,0,1,0,0);
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.setLineDash([]);ctx.shadowBlur=0;

  // Pozadí + hvězdy + mlhoviny
  renderBackground(gs.chunks,t);

  // Sluneční soustavy
  renderSystems(gs.chunks,t);

  // Asteroidy
  gs.chunks.forEach(ch=>ch.asteroids.forEach(a=>renderAsteroid(a,t)));

  // Engine trails (jako částice)
  const allParts=[...engineTrails,...gs.particles];
  renderParticles(allParts);

  // Loot
  gs.loots.forEach(l=>renderLoot(l));

  // Nepřátelé
  gs.enemies.forEach(e=>renderEnemy(e,t));

  // Stanice (systémové + planetární)
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

  // Střely
  gs.bullets.forEach(b=>renderBullet(b));

  // Hráč (vždy nahoře, čistý stav)
  ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.setLineDash([]);ctx.shadowBlur=0;
  if(!p.dead)renderPlayerShip(p,t);

  // Vigneta
  renderVignette();

  // HUD
  ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.setLineDash([]);ctx.shadowBlur=0;
  if(state==='playing'){
    renderHUD(p,gs.nearStation,gs.dockingState,t);

    // Dokovací indikátor
    if(gs.nearStation&&gs.dockingState?.approaching){
      renderDockingIndicator(gs.dockingState.align,gs.dockingState.speed,gs.dockingState.dockable);
    }

    // Navigační šipka
    if(gs.navTarget){
      renderNavArrow(gs.navTarget.x,gs.navTarget.y,p.x,p.y,gs.navTarget.name);
    }
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
  initMenuStars();

  // Menu tlačítka
  document.getElementById('btn-new').onclick=()=>startGame(false);
  document.getElementById('btn-load').onclick=()=>{if(hasSave())startGame(true);else setMsg('Žádná uložená hra',2000);};
  document.getElementById('btn-settings').onclick=()=>{document.getElementById('settings-panel').style.display=document.getElementById('settings-panel').style.display==='block'?'none':'block';};
  document.getElementById('btn-restart').onclick=()=>{document.getElementById('death-screen').style.display='none';startGame(false);};
  document.getElementById('btn-menu').onclick=()=>{document.getElementById('death-screen').style.display='none';document.getElementById('menu').style.display='flex';document.getElementById('hud').style.display='none';state='menu';gameState=null;initMenuStars();};
  document.getElementById('btn-close-map').onclick=()=>closeMap();
  document.getElementById('btn-undock').onclick=()=>undock();

  // Pause menu
  document.getElementById('btn-resume').onclick=()=>closePause();
  document.getElementById('btn-pause-save').onclick=()=>{saveGame();document.getElementById('btn-pause-save').textContent='✓ ULOŽENO';setTimeout(()=>document.getElementById('btn-pause-save').textContent='↓ ULOŽIT HRU',1500);};
  document.getElementById('btn-pause-menu').onclick=()=>{
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
