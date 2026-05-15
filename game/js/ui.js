// --- Pause tabs ---
function switchPauseTab(tab){
  const tabs=['actions','graphics','hud','audio'];
  document.querySelectorAll('.pause-tab').forEach((t,i)=>t.classList.toggle('active',tabs[i]===tab));
  tabs.forEach(id=>{const el=document.getElementById('ptab-'+id);if(el)el.style.display=id===tab?'block':'none';});
}

function updateSetting(key,val){
  const v=Number(val);
  if(key==='sfxVol'){settings.sfxVol=v/100;document.getElementById('set-sfx-val').textContent=val;}
  if(key==='particleCount'){settings.particleCount=v;document.getElementById('set-particles-val').textContent=val;}
  if(key==='parallax'){settings.parallax=v;document.getElementById('set-parallax-val').textContent=val;}
  if(key==='minimapSize'){settings.minimapSize=v;document.getElementById('set-mmsize-val').textContent=val;}
  if(key==='hudOpacity'){settings.hudOpacity=v;document.getElementById('set-hudopa-val').textContent=val;applyHudOpacity();}
  if(key==='minimapRange'){settings.minimapRange=v;document.getElementById('set-mmrange-val').textContent=val;}
}

function toggleSetting(key,el){
  settings[key]=!settings[key];
  el.classList.toggle('on',settings[key]);
  const labels={shake:['VYP','ZAP'],trails:['VYP','ZAP'],nebulae:['VYP','ZAP'],stars:['VYP','ZAP'],
    scanlines:['VYP','ZAP'],vignette:['VYP','ZAP'],minimapLegend:['VYP','ZAP'],engineSound:['VYP','ZAP'],shootSound:['VYP','ZAP']};
  const valMap={shake:'set-shake-val',trails:'set-trails-val',nebulae:'set-nebulae-val',stars:'set-stars-val',
    scanlines:'set-scanlines-val',vignette:'set-vignette-val',minimapLegend:'set-mmlegend-val',
    engineSound:'set-enginesound-val',shootSound:'set-shotsound-val'};
  if(valMap[key])document.getElementById(valMap[key]).textContent=settings[key]?labels[key][1]:labels[key][0];
  if(key==='scanlines')document.getElementById('scanlines-canvas').style.opacity=settings.scanlines?'1':'0';
  if(key==='minimapLegend')document.getElementById('minimap-legend').style.display=settings.minimapLegend?'flex':'none';
}

function applyHudOpacity(){
  const op=settings.hudOpacity/100;
  document.querySelectorAll('.hud-block,.hud-block-r,#hud-xp,#boost-indicator').forEach(el=>el.style.opacity=op);
}

function buildScanlines(){
  const sc=document.getElementById('scanlines-canvas');
  sc.width=window.innerWidth;sc.height=window.innerHeight;
  const sctx=sc.getContext('2d');
  for(let y=0;y<sc.height;y+=4){sctx.fillStyle='rgba(0,0,0,0.18)';sctx.fillRect(0,y,sc.width,1);}
}

function buildMenuStars(){
  const bg=document.getElementById('menu-bg');bg.innerHTML='';
  for(let i=0;i<200;i++){
    const s=document.createElement('div');s.className='menu-star';
    const sz=Math.random()*2.5+.5;
    s.style.cssText=`width:${sz}px;height:${sz}px;top:${Math.random()*100}%;left:${Math.random()*100}%;opacity:${Math.random()*.8+.1};animation-delay:${Math.random()*3}s;animation-duration:${2+Math.random()*4}s`;
    bg.appendChild(s);
  }
}

// --- Menu actions ---
function showMenuControls(){
  const el=document.getElementById('menu-controls');
  el.style.display=el.style.display==='none'?'block':'none';
}
function startGame(){
  const m=document.getElementById('menu');m.classList.add('fade-out');playMenuClick();
  setTimeout(()=>{m.style.display='none';m.classList.remove('fade-out');initGame();},600);
}
function loadAndStart(){
  const m=document.getElementById('menu');m.classList.add('fade-out');playMenuClick();
  setTimeout(()=>{m.style.display='none';m.classList.remove('fade-out');initGame(true);},600);
}
function showMainMenu(){
  gameRunning=false;paused=false;
  hidePause();hideOverview();
  document.getElementById('death').style.display='none';
  document.getElementById('panel').style.display='none';
  document.getElementById('menu').style.display='flex';
}

// --- Pause ---
function openPause(){
  if(!gameRunning||player.dead)return;
  paused=true;
  document.getElementById('pause-overlay').classList.add('active');
  document.getElementById('panel').style.display='none';
  dockedStation=null;
}
function hidePause(){paused=false;document.getElementById('pause-overlay').classList.remove('active');}
function resumeGame(){hidePause();}
function pauseSave(){saveGame();setMsg('Hra uložena!',2000);}
function pauseMenu(){hidePause();showMainMenu();}
function pauseRestart(){hidePause();restartGame();}
function openOverviewFromPause(){hidePause();openOverview();}

// --- Overview map controls ---
function ovZoom(dir){
  let idx=OV_ZOOM_STEPS.indexOf(ovZoomLevel);
  if(idx<0)idx=4;
  idx=Math.max(0,Math.min(OV_ZOOM_STEPS.length-1,idx+dir));
  ovZoomLevel=OV_ZOOM_STEPS[idx];
  document.getElementById('ov-zoom-val').textContent=ovZoomLevel+'×';
  drawOverviewMap();
}
function openOverview(){
  if(!gameRunning||!player)return;
  ovPanX=0;ovPanY=0;
  document.getElementById('overview-overlay').classList.add('active');
  document.getElementById('ov-sector-display').textContent=`sektor ${Math.round(player.x/100)}, ${Math.round(player.y/100)}`;
  drawOverviewMap();
}
function hideOverview(){document.getElementById('overview-overlay').classList.remove('active');}
function isOverviewOpen(){return document.getElementById('overview-overlay').classList.contains('active');}

// --- Trading panel ---
function switchTab(tab){
  currentTab=tab;
  document.querySelectorAll('.ptab').forEach((t,i)=>t.classList.toggle('active',['trade','service','upgrades'][i]===tab));
  document.getElementById('tab-trade').style.display=tab==='trade'?'block':'none';
  document.getElementById('tab-service').style.display=tab==='service'?'block':'none';
  document.getElementById('tab-upgrades').style.display=tab==='upgrades'?'block':'none';
  if(tab==='service'&&dockedStation)updateServicePanel();
  if(tab==='upgrades')updateUpgradePanel();
}
function showPanel(st){
  document.getElementById('panel').style.display='block';
  document.getElementById('panel-title').textContent='⬡ '+st.name;
  renderTradeTab(st);
  if(currentTab==='service')updateServicePanel();
  if(currentTab==='upgrades')updateUpgradePanel();
}
function renderTradeTab(st){
  const buyEl=document.getElementById('buy-list');buyEl.innerHTML='';
  Object.entries(st.inv).forEach(([name,info])=>{
    if(info.buyPrice!==null&&info.qty>0){
      const g=GOODS.find(g=>g.name===name),cmax=getCargoMax(),canBuy=player.credits>=info.buyPrice&&player.cargoCount<cmax;
      const row=document.createElement('div');row.className='trade-row';
      row.innerHTML=`<span class="good-name" style="color:${g?g.color:'#bdf'}">${name}</span><span class="good-price">${info.buyPrice} cr</span><span class="good-stock">${info.qty}×</span>`;
      const btn=document.createElement('button');btn.className='tbtn';btn.textContent='Koupit';btn.disabled=!canBuy;
      btn.onclick=()=>{buyGood(st,name,info);renderTradeTab(st);};row.appendChild(btn);buyEl.appendChild(row);
    }
  });
  if(!buyEl.children.length)buyEl.innerHTML='<div style="color:#1a2030;font-size:11px;padding:6px 0">Nic k prodeji</div>';
  const sellEl=document.getElementById('sell-list');sellEl.innerHTML='';
  Object.entries(player.cargo).forEach(([name])=>{
    const info=st.inv[name];if(!info||!info.sellPrice)return;
    const g=GOODS.find(g=>g.name===name);
    const row=document.createElement('div');row.className='trade-row';
    row.innerHTML=`<span class="good-name" style="color:${g?g.color:'#bdf'}">${name}</span><span class="good-price">${info.sellPrice} cr</span><span class="good-stock">${player.cargo[name]}×</span>`;
    const btn=document.createElement('button');btn.className='tbtn sbtn';btn.textContent='Prodat';
    btn.onclick=()=>{sellGood(st,name,info);renderTradeTab(st);};row.appendChild(btn);sellEl.appendChild(row);
  });
  Object.entries(st.inv).forEach(([name,info])=>{
    if(info.sellPrice&&!player.cargo[name]){
      const g=GOODS.find(g=>g.name===name);
      const row=document.createElement('div');row.className='trade-row';
      row.innerHTML=`<span class="good-name" style="color:#1a2030">${name}</span><span class="good-price" style="color:#1a2838">${info.sellPrice} cr</span><span class="good-stock" style="color:#1a2030">hledají</span>`;
      sellEl.appendChild(row);
    }
  });
  if(!sellEl.children.length)sellEl.innerHTML='<div style="color:#1a2030;font-size:11px;padding:6px 0">Nic nekupují</div>';
}
function updateServicePanel(){
  const fm=100-player.fuel,fc=Math.ceil(fm*FUEL_COST_PER_PCT);
  document.getElementById('svc-fuel-bar').style.width=player.fuel+'%';
  document.getElementById('svc-fuel-val').textContent=Math.round(player.fuel)+'%';
  document.getElementById('svc-fuel-cost').textContent=fm<1?'Plná nádrž':`Cena: ${fc} cr`;
  const fb=document.getElementById('svc-fuel-btn');fb.disabled=fm<1||player.credits<fc;fb.textContent=fm<1?'Plná nádrž':'Doplnit palivo';
  const hm=player.hullMax-player.hull,hc=Math.ceil(hm*HULL_COST_PER_PCT);
  document.getElementById('svc-hull-bar').style.width=(player.hull/player.hullMax*100)+'%';
  document.getElementById('svc-hull-val').textContent=Math.round(player.hull)+'/'+player.hullMax;
  document.getElementById('svc-hull-cost').textContent=hm<1?'Trup OK':`Cena: ${hc} cr`;
  const hb=document.getElementById('svc-hull-btn');hb.disabled=hm<1||player.credits<hc;hb.textContent=hm<1?'Opraveno':'Opravit trup';
  const sm=getShieldMax(),smiss=sm-player.shield,sc=Math.ceil(smiss*SHIELD_COST_PER_PCT);
  document.getElementById('svc-shield-bar').style.width=(player.shield/sm*100)+'%';
  document.getElementById('svc-shield-val').textContent=Math.round(player.shield)+'/'+sm;
  document.getElementById('svc-shield-cost').textContent=smiss<1?'Štít nabit':`Cena: ${sc} cr`;
  const sb=document.getElementById('svc-shield-btn');sb.disabled=smiss<1||player.credits<sc;sb.textContent=smiss<1?'Nabit':'Dobít štít';
}
function updateUpgradePanel(){
  const ul=document.getElementById('upgrade-list');ul.innerHTML='';
  UPGRADES.forEach(upg=>{
    const lvl=player.upgrades[upg.id]||0,maxed=lvl>=upg.maxLvl;
    const cost=Math.ceil(upg.baseCost*Math.pow(1.6,lvl));
    const row=document.createElement('div');row.className='upgrade-row';
    const pips=Array.from({length:upg.maxLvl},(_,i)=>`<div class="upgrade-pip${i<lvl?' filled':''}"></div>`).join('');
    row.innerHTML=`<div style="flex:1"><div class="upgrade-name">${upg.name}</div><div style="color:#1a2838;font-size:10px;margin-top:2px">${upg.effect}</div><div class="upgrade-level" style="margin-top:4px">${pips}</div></div><div class="upgrade-cost">${maxed?'MAX':cost+' cr'}</div>`;
    if(!maxed){
      const btn=document.createElement('button');btn.className='tbtn';btn.style.marginLeft='8px';btn.textContent='↑';btn.disabled=player.credits<cost;
      btn.onclick=()=>{if(player.credits>=cost){player.credits-=cost;player.upgrades[upg.id]++;playSfxBuy();updateHUD();updateUpgradePanel();}};
      row.appendChild(btn);
    }
    ul.appendChild(row);
  });
}

// --- Services ---
function serviceFuel(){const m=100-player.fuel,c=Math.ceil(m*FUEL_COST_PER_PCT);if(player.credits<c||m<1)return;player.credits-=c;player.fuel=100;updateHUD();updateServicePanel();setMsg(`Palivo doplněno! (-${c} cr)`,2000);playSfxBuy();}
function serviceHull(){const m=player.hullMax-player.hull,c=Math.ceil(m*HULL_COST_PER_PCT);if(player.credits<c||m<1)return;player.credits-=c;player.hull=player.hullMax;updateHUD();updateServicePanel();setMsg(`Trup opraven! (-${c} cr)`,2000);playSfxBuy();}
function serviceShield(){const sm=getShieldMax(),m=sm-player.shield,c=Math.ceil(m*SHIELD_COST_PER_PCT);if(player.credits<c||m<1)return;player.credits-=c;player.shield=sm;updateHUD();updateServicePanel();setMsg(`Štít nabit! (-${c} cr)`,2000);playSfxBuy();}
function buyGood(st,name,info){const cmax=getCargoMax();if(player.credits<info.buyPrice||player.cargoCount>=cmax||info.qty<=0)return;player.credits-=info.buyPrice;info.qty--;player.cargo[name]=(player.cargo[name]||0)+1;player.cargoCount++;playSfxBuy();addXP(2);updateHUD();}
function sellGood(st,name,info){if(!player.cargo[name])return;const profit=info.sellPrice;player.credits+=profit;totalEarned+=profit;player.cargo[name]--;if(!player.cargo[name])delete player.cargo[name];player.cargoCount--;playSfxBuy();addXP(Math.ceil(profit/5));updateHUD();}

// --- HUD ---
let _hudPrev={hull:-1,shield:-1,fuel:-1,credits:-1,cargoCount:-1,xp:-1,level:-1};
function updateHUD(){
  if(!player)return;
  const hullPct=player.hull/player.hullMax*100;
  const shieldPct=player.shield/getShieldMax()*100;
  document.getElementById('hull-fill').style.width=hullPct+'%';
  document.getElementById('shield-fill').style.width=shieldPct+'%';
  document.getElementById('fuel-fill').style.width=player.fuel+'%';
  document.getElementById('hull-val').textContent=Math.round(player.hull);
  document.getElementById('shield-val').textContent=Math.round(player.shield);
  document.getElementById('fuel-val').textContent=Math.round(player.fuel);
  if(hullPct>60)document.getElementById('hull-fill').style.background='linear-gradient(90deg,#c43020,#f06030)';
  else if(hullPct>30)document.getElementById('hull-fill').style.background='linear-gradient(90deg,#c07010,#e0a020)';
  else document.getElementById('hull-fill').style.background='linear-gradient(90deg,#c01010,#f03020)';
  if(player.fuel<20)document.getElementById('fuel-fill').style.background='linear-gradient(90deg,#8a4000,#e08000)';
  else document.getElementById('fuel-fill').style.background='linear-gradient(90deg,#0a8a8a,#20d0d0)';
  const sx=Math.round(player.x/100),sy=Math.round(player.y/100);
  document.getElementById('pos').textContent=`${sx}, ${sy}`;
  document.getElementById('minimap-coords').textContent=`${sx},${sy}`;
  document.getElementById('spd').textContent=(Math.hypot(player.vx,player.vy)*10).toFixed(0);
  document.getElementById('credits-big').textContent=player.credits.toLocaleString('cs');
  document.getElementById('credits-earned').textContent='vydělano: '+totalEarned.toLocaleString('cs')+' cr';
  const cmax=getCargoMax();
  document.getElementById('cargo-title').textContent=`NÁKLAD (${player.cargoCount}/${cmax})`;
  document.getElementById('cargo-bar-fill').style.width=(player.cargoCount/cmax*100)+'%';
  if(player.cargoCount/cmax>0.85)document.getElementById('cargo-bar-fill').style.background='linear-gradient(90deg,#6a2000,#e04010)';
  else document.getElementById('cargo-bar-fill').style.background='linear-gradient(90deg,#1a5a30,#30c060)';
  const cl=document.getElementById('cargo-list');
  cl.innerHTML=Object.entries(player.cargo).map(([n,q])=>{
    const g=GOODS.find(g=>g.name===n);return `<span style="color:${g?g.color:'#adf'}">${n} ×${q}</span><br>`;
  }).join('');
  const xpNeeded=getXpForLevel(player.level),xpPct=Math.min(100,player.xp/xpNeeded*100);
  document.getElementById('xp-level').textContent=player.level;
  document.getElementById('xp-bar-fill').style.width=xpPct+'%';
  document.getElementById('xp-next').textContent=`${player.xp} / ${xpNeeded} XP`;
}

function updatePlanetNav(){
  const el=document.getElementById('planet-nav');
  if(!el)return;
  el.style.display=showPlanetNav?'block':'none';
  if(!showPlanetNav||!player)return;
  const DIRS=['→','↗','↑','↖','←','↙','↓','↘'];
  let html='';
  SOLAR_SYSTEM.forEach(p=>{
    const pos=getPlanetPos(p,solarTime);
    const d=Math.hypot(player.x-pos.x,player.y-pos.y),sl=(d/1000).toFixed(1);
    const worldAngle=Math.atan2(pos.y-player.y,pos.x-player.x);
    const relAngle=((worldAngle-player.angle+Math.PI*2.5)%(Math.PI*2));
    const dirIdx=Math.round(relAngle/(Math.PI/4))%8;
    const nearest=d<3000;
    html+=`<div class="pnav-row${nearest?' nearest':''}">
      <span class="pnav-dot" style="background:${p.innerColor}"></span>
      <span class="pnav-name">${p.name}</span>
      <span class="pnav-arrow">${DIRS[dirIdx]}</span>
      <span class="pnav-dist">${sl} sl</span>
    </div>`;
  });
  document.getElementById('planet-nav-list').innerHTML=html;
}

function updateStationArrow(chunks){
  const el=document.getElementById('station-arrow');
  let bestSt=null,bestD=Infinity;
  chunks.forEach(ch=>{if(ch.station){const d=dist2(player,ch.station);if(d<bestD){bestD=d;bestSt=ch.station;}}});
  if(!bestSt||bestD<180){el.style.opacity='0';return;}
  const angle=Math.atan2(bestSt.y-player.y,bestSt.x-player.x);
  const margin=40,cx=W/2,cy=H/2,halfW=W/2-margin,halfH=H/2-margin;
  const tx=Math.cos(angle),ty=Math.sin(angle);let ex,ey;
  if(Math.abs(ty/tx)<halfH/halfW){ex=Math.sign(tx)*halfW;ey=ty/tx*halfW;}else{ey=Math.sign(ty)*halfH;ex=tx/ty*halfH;}
  el.style.opacity='0.85';el.style.left=(cx+ex-20)+'px';el.style.top=(cy+ey-12)+'px';
  document.getElementById('station-arrow-icon').style.transform=`rotate(${angle*(180/Math.PI)+90}deg)`;
  document.getElementById('station-arrow-dist').textContent=Math.round(bestD/100)+' AU';
}

// --- Messages ---
function setMsg(txt,ms=3000){
  const el=document.getElementById('msg');el.textContent=txt;el.style.opacity='1';msgTimer=ms;
}
function showEventNotif(txt){
  const el=document.getElementById('event-notif');el.textContent=txt;el.style.opacity='1';eventNotifTimer=4000;
}
function addKill(txt){
  const el=document.createElement('div');el.className='kf-entry';el.textContent=txt;
  document.getElementById('killfeed').appendChild(el);
  setTimeout(()=>{el.style.opacity='0';setTimeout(()=>el.remove(),1000);},2500);
}
function showXpPopup(txt){
  const el=document.getElementById('xp-popup');
  el.textContent=txt;el.style.opacity='1';el.style.transition='none';el.style.transform='translate(-50%,-50%) scale(1)';
  setTimeout(()=>{el.style.transition='opacity 1.2s ease, transform 1.2s ease';el.style.opacity='0';el.style.transform='translate(-50%,-120%) scale(1.3)';},800);
}
function showSaveNotif(){const el=document.getElementById('save-notif');el.style.opacity='1';setTimeout(()=>el.style.opacity='0',2000);}
function showDeath(){
  const d=document.getElementById('death');d.style.display='flex';
  document.getElementById('death-score').textContent=`Celkově vydělali: ${totalEarned.toLocaleString('cs')} cr · Level: ${player.level}`;
}
