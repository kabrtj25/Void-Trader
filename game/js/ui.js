// ===== SPACE TRADER — UI / HUD / Mapy =====

// ---- HUD ----
function renderHUD(player,nearStation,dockingState,t){
  const pad=16;
  const lx=pad,ly=pad,lw=228,lh=230;
  hudPanel(lx,ly,lw,lh);

  ctx.save();
  ctx.textAlign='left';
  const bx=lx+10, bw=lw-20;

  // Header
  ctx.font='8px "Courier New", monospace';
  ctx.fillStyle='rgba(0,200,200,0.62)';
  ctx.fillText('// SYSTÉMY LODI',bx,ly+14);
  ctx.strokeStyle='rgba(0,200,200,0.13)';ctx.lineWidth=0.5;
  ctx.beginPath();ctx.moveTo(bx,ly+19);ctx.lineTo(lx+lw-10,ly+19);ctx.stroke();

  // PALIVO
  const fuelPct=clamp(player.fuel/player.fuelMax,0,1);
  const fuelLow=fuelPct<0.15&&(player.fuelReserve||0)<1;
  ctx.font='7px "Courier New", monospace';
  ctx.fillStyle=fuelLow?'rgba(255,80,0,0.85)':'rgba(0,200,200,0.62)';
  ctx.fillText('PALIVO',bx,ly+29);
  hudBarColor(bx,ly+31,bw,8,fuelPct,
    fuelLow?'#ff4400':'#00d4ff',
    fuelLow?'rgba(255,68,0,0.1)':'rgba(0,212,255,0.07)');

  // ZÁLOHA
  const rsvMax=player.fuelReserveMax||C.FUEL_MAX*0.1;
  const rsvPct=clamp((player.fuelReserve||0)/rsvMax,0,1);
  ctx.font='7px "Courier New", monospace';
  ctx.fillStyle='rgba(60,100,200,0.6)';
  ctx.fillText('ZÁLOHA',bx,ly+48);
  hudBarColor(bx,ly+50,bw,4,rsvPct,'#5577ee','rgba(40,60,180,0.08)',false);
  ctx.font='7px "Courier New", monospace';ctx.fillStyle='rgba(100,140,230,0.65)';ctx.textAlign='right';
  ctx.fillText(Math.round(rsvPct*100)+'%',lx+lw-10,ly+54);ctx.textAlign='left';

  // POŠKOZENÍ (0% = zdravá loď, 100% = zničena)
  const dmgPct=clamp(1-(player.hull/player.hullMax),0,1);
  const dmgColor=dmgPct<0.25?'#00cc66':dmgPct<0.55?'#ff9500':'#ff2200';
  const dmgLabelCol=dmgPct<0.25?'rgba(0,200,100,0.65)':dmgPct<0.55?'rgba(255,149,0,0.65)':'rgba(255,50,0,0.85)';
  ctx.font='7px "Courier New", monospace';ctx.fillStyle=dmgLabelCol;
  ctx.fillText('POŠKOZENÍ',bx,ly+62);
  hudBarColor(bx,ly+64,bw,8,dmgPct,dmgColor,'rgba(50,0,0,0.1)');

  // Separator
  ctx.strokeStyle='rgba(0,200,200,0.08)';ctx.lineWidth=0.5;
  ctx.beginPath();ctx.moveTo(bx,ly+80);ctx.lineTo(lx+lw-10,ly+80);ctx.stroke();

  // RYCHLOST
  const spdRaw=Math.hypot(player.vx,player.vy);
  const spdKms=spdRaw*C.SPEED_KMS_FACTOR;
  const spdText=spdKms>=1000?Math.round(spdKms).toLocaleString('cs')+' km/s':spdKms.toFixed(1)+' km/s';
  ctx.font='7px "Courier New", monospace';ctx.fillStyle='rgba(180,210,240,0.5)';
  ctx.fillText('RYCHLOST',bx,ly+92);
  ctx.font='bold 14px "Courier New", monospace';ctx.fillStyle='#ddeeff';
  ctx.fillText(spdText,bx,ly+107);

  // Souřadnice
  ctx.font='7px "Courier New", monospace';ctx.fillStyle='rgba(100,150,190,0.45)';
  ctx.fillText(`${Math.round(player.x/100)}, ${Math.round(player.y/100)} AU`,bx,ly+120);

  // Level & XP
  const xpPct=clamp(player.xp/xpNeeded(player.level),0,1);
  ctx.font='7px "Courier New", monospace';ctx.fillStyle='rgba(255,200,0,0.55)';
  ctx.fillText(`CMDR LVL ${player.level}`,bx,ly+133);
  ctx.fillStyle='rgba(60,40,0,0.45)';ctx.fillRect(bx,ly+136,bw,3);
  ctx.fillStyle='#ffcc00';ctx.fillRect(bx,ly+136,bw*xpPct,3);

  // Separator
  ctx.strokeStyle='rgba(255,200,0,0.1)';ctx.lineWidth=0.5;
  ctx.beginPath();ctx.moveTo(bx,ly+146);ctx.lineTo(lx+lw-10,ly+146);ctx.stroke();

  // KREDITY
  ctx.font='7px "Courier New", monospace';ctx.fillStyle='rgba(255,200,0,0.5)';
  ctx.fillText('KREDITY',bx,ly+157);
  ctx.font='bold 17px "Courier New", monospace';
  ctx.fillStyle='#ffcc00';ctx.shadowColor='rgba(255,200,0,0.4)';ctx.shadowBlur=7;
  ctx.fillText(player.credits.toLocaleString('cs')+' Cr',bx,ly+174);
  ctx.shadowBlur=0;

  // NÁKLAD
  const cmax=getCargoMax(player);
  const cargoFill=player.cargoCount/Math.max(cmax,1);
  ctx.font='7px "Courier New", monospace';ctx.fillStyle='rgba(170,210,230,0.45)';
  ctx.fillText(`NÁKLAD  ${player.cargoCount} / ${cmax}`,bx,ly+189);
  ctx.fillStyle='rgba(0,212,255,0.06)';ctx.fillRect(bx,ly+192,bw,3);
  ctx.fillStyle=cargoFill>0.85?'#ff4400':'rgba(0,200,200,0.48)';
  ctx.fillRect(bx,ly+192,bw*cargoFill,3);

  // ŠTÍT (inline)
  const shldPct=clamp(player.shield/player.shieldMax,0,1);
  ctx.font='7px "Courier New", monospace';ctx.fillStyle='rgba(70,110,230,0.55)';
  ctx.fillText('ŠTÍT',bx,ly+204);
  ctx.fillStyle='rgba(0,0,50,0.3)';ctx.fillRect(bx+28,ly+197,bw-28,5);
  ctx.fillStyle='#4488ff';ctx.fillRect(bx+28,ly+197,Math.max(0,(bw-28)*shldPct),5);
  ctx.font='7px "Courier New", monospace';ctx.fillStyle='rgba(100,150,255,0.65)';ctx.textAlign='right';
  ctx.fillText(Math.round(shldPct*100)+'%',lx+lw-10,ly+202);ctx.textAlign='left';

  ctx.restore();

  // ── Centre indicators ──
  if(window.msgText&&window.msgTimer>0){
    ctx.save();const alpha=Math.min(1,window.msgTimer/500);ctx.globalAlpha=alpha;
    ctx.textAlign='center';ctx.font='13px "Courier New", monospace';
    ctx.fillStyle='#ffcc00';ctx.shadowColor='#ffcc00';ctx.shadowBlur=12;
    ctx.fillText(window.msgText,W/2,H-90);ctx.restore();
  }
  if(player.boosting&&player.fuel>0){
    ctx.save();ctx.textAlign='center';ctx.font='bold 13px "Courier New", monospace';
    ctx.fillStyle='#00ccff';ctx.shadowColor='#00ccff';ctx.shadowBlur=15;
    ctx.fillText('⚡ BOOST AKTIVNÍ',W/2,H-110);ctx.restore();
  }
  if(window.parkingMode){
    ctx.save();const pa=0.75+Math.sin(t*3)*0.25;ctx.globalAlpha=pa;
    ctx.textAlign='center';ctx.font='bold 14px "Courier New", monospace';
    ctx.fillStyle='#ffcc00';ctx.shadowColor='#ffcc00';ctx.shadowBlur=18;
    ctx.fillText('⚓ PARKOVACÍ REŽIM',W/2,H-130);ctx.restore();
  }
  if(player.fuel<1&&(player.fuelReserve||0)<1){
    ctx.save();const fa=0.5+Math.sin(t*6)*0.5;ctx.globalAlpha=fa;
    ctx.textAlign='center';ctx.font='bold 13px "Courier New", monospace';
    ctx.fillStyle='#ff2200';ctx.shadowColor='#ff2200';ctx.shadowBlur=15;
    ctx.fillText('⚠ KRITICKÁ HLADINA PALIVA',W/2,H-130);ctx.restore();
  }

  // ---- Varovný systém kolize ----
  const cw=window._collisionWarn;
  if(cw){
    ctx.save();
    // Pulsace: rychlejší a intenzivnější čím blíž
    const pFreq=4+cw.urgency*10;
    const pulse=0.55+Math.sin(t*pFreq)*0.45;
    const alpha=0.7+cw.urgency*0.3;
    ctx.globalAlpha=alpha*pulse;

    // Červený vignette-flash po krajích obrazovky při vysoké urgency
    if(cw.urgency>0.55){
      const flashA=(cw.urgency-0.55)/0.45*0.28*pulse;
      const grad=ctx.createRadialGradient(W/2,H/2,H*0.3,W/2,H/2,H*0.85);
      grad.addColorStop(0,'rgba(255,0,0,0)');
      grad.addColorStop(1,`rgba(255,0,0,${flashA})`);
      ctx.globalAlpha=1;ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
      ctx.globalAlpha=alpha*pulse;
    }

    // Hlavní varovný text
    const warnY=H/2-W*0.18;
    ctx.textAlign='center';
    ctx.font=`bold ${cw.urgency>0.7?15:13}px "Courier New", monospace`;
    ctx.fillStyle='#ff2200';ctx.shadowColor='#ff3300';ctx.shadowBlur=22;
    ctx.fillText(`⚠ RIZIKO KOLIZE — ${cw.label}`,W/2,warnY);

    // Vzdálenost + TTC
    ctx.font='11px "Courier New", monospace';
    ctx.fillStyle='#ff6644';ctx.shadowBlur=10;
    ctx.fillText(`${cw.dist} m  •  kolize za ${cw.ttc.toFixed(1)} s`,W/2,warnY+18);

    ctx.restore();
  }
}

function _roundRect(c,x,y,w,h,r){
  c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);
  c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);
  c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();
}

function hudPanel(x,y,w,h){
  ctx.save();
  ctx.fillStyle='rgba(0,4,22,0.86)';ctx.fillRect(x,y,w,h);
  ctx.strokeStyle='rgba(0,200,200,0.28)';ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);
  const cs=10;
  ctx.strokeStyle='rgba(0,212,255,0.65)';ctx.lineWidth=1.5;
  [[x,y],[x+w,y],[x,y+h],[x+w,y+h]].forEach(([cx,cy],i)=>{
    const sx=i%2===0?1:-1,sy=i<2?1:-1;
    ctx.beginPath();ctx.moveTo(cx+sx*cs,cy);ctx.lineTo(cx,cy);ctx.lineTo(cx,cy+sy*cs);ctx.stroke();
  });
  ctx.restore();
}

function hudBarColor(x,y,w,h,pct,fg,bg='rgba(255,255,255,0.05)',showPct=true){
  ctx.fillStyle=bg;ctx.fillRect(x,y,w,h);
  ctx.fillStyle=fg;ctx.fillRect(x,y,w*clamp(pct,0,1),h);
  ctx.strokeStyle='rgba(255,255,255,0.04)';ctx.lineWidth=0.5;ctx.strokeRect(x,y,w,h);
  if(showPct){
    ctx.font='7px "Courier New", monospace';ctx.fillStyle='rgba(255,255,255,0.65)';
    ctx.textAlign='right';
    ctx.fillText(Math.round(pct*100)+'%',x+w,y+h-1);
    ctx.textAlign='left';
  }
}

// Keep old hudBar for compatibility (unused by HUD but may be called elsewhere)
function hudBar(x,y,w,h,label,pct,color){
  ctx.font='8px "Courier New", monospace';ctx.fillStyle='rgba(0,200,200,0.5)';
  ctx.fillText(label,x,y-2);
  hudBarColor(x,y,w,h,pct,color,'rgba(0,212,255,0.07)');
}

// ---- Minimapa ----
let mmCanvas,mmCtx;
function initMinimap(){
  mmCanvas=document.getElementById('mm');mmCtx=mmCanvas.getContext('2d');
}
function renderMinimap(player,chunks,navTarget,t){
  if(!mmCanvas)return;
  const S=mmCanvas.width,cx=S/2,cy=S/2,sc=S/(C.MINIMAP_R*2);
  mmCtx.clearRect(0,0,S,S);
  // Pozadí
  mmCtx.fillStyle='rgba(0,4,14,0.88)';
  mmCtx.beginPath();mmCtx.arc(cx,cy,S/2,0,Math.PI*2);mmCtx.fill();
  // Border
  mmCtx.strokeStyle='rgba(255,149,0,0.4)';mmCtx.lineWidth=1.5;
  mmCtx.beginPath();mmCtx.arc(cx,cy,S/2-1,0,Math.PI*2);mmCtx.stroke();
  // Clip na kruh
  mmCtx.save();mmCtx.beginPath();mmCtx.arc(cx,cy,S/2-2,0,Math.PI*2);mmCtx.clip();

  // Hvězdičky pozadí
  mmCtx.fillStyle='rgba(200,210,255,0.4)';
  for(let i=0;i<80;i++){
    const hx=(Math.sin(i*137.5)*0.5+0.5)*S,hy=(Math.cos(i*97.3)*0.5+0.5)*S;
    mmCtx.beginPath();mmCtx.arc(hx,hy,0.6,0,Math.PI*2);mmCtx.fill();
  }

  // Stanice (systémové + planetární)
  const drawMmStation=(st,pulse)=>{
    if(!st)return;
    const px=cx+(st.x-player.x)*sc,py=cy+(st.y-player.y)*sc;
    if(Math.hypot(px-cx,py-cy)>S/2-4)return;
    mmCtx.save();
    if(st.type==='large'){
      // Velká Coriolis — prstencový symbol
      const sr2=7+pulse*1.5;
      mmCtx.globalAlpha=0.6+pulse*0.3;
      mmCtx.strokeStyle=st.color;mmCtx.lineWidth=1.8;
      mmCtx.shadowColor=st.color;mmCtx.shadowBlur=6;
      mmCtx.beginPath();mmCtx.arc(px,py,sr2,0,Math.PI*2);mmCtx.stroke();
      mmCtx.shadowBlur=0;
      // Kříž uvnitř
      mmCtx.lineWidth=1;mmCtx.strokeStyle=st.color+'99';
      const ch=sr2*0.55;
      mmCtx.beginPath();mmCtx.moveTo(px-ch,py);mmCtx.lineTo(px+ch,py);mmCtx.stroke();
      mmCtx.beginPath();mmCtx.moveTo(px,py-ch);mmCtx.lineTo(px,py+ch);mmCtx.stroke();
      // Vnitřní tečka
      mmCtx.fillStyle=st.color;mmCtx.beginPath();mmCtx.arc(px,py,2,0,Math.PI*2);mmCtx.fill();
    } else {
      mmCtx.fillStyle=st.color;mmCtx.globalAlpha=0.5+pulse*0.3;
      mmCtx.beginPath();
      for(let i=0;i<6;i++){const a=i*Math.PI/3;mmCtx.lineTo(px+Math.cos(a)*4,py+Math.sin(a)*4);}
      mmCtx.closePath();mmCtx.fill();
    }
    mmCtx.globalAlpha=1;
    mmCtx.restore();
  };
  chunks.forEach(ch=>{
    if(!ch.system)return;
    const pulse=0.6+Math.sin(t*3+ch.cx)*0.4;
    drawMmStation(ch.system.station,pulse);
    ch.system.planets?.forEach(pl=>drawMmStation(pl.station,pulse));
  });

  // Nepřátelé
  if(window.gameState?.enemies){
    window.gameState.enemies.forEach(e=>{
      const px=cx+(e.x-player.x)*sc,py=cy+(e.y-player.y)*sc;
      if(Math.hypot(px-cx,py-cy)>S/2-4)return;
      mmCtx.fillStyle='#ff3030';mmCtx.beginPath();mmCtx.arc(px,py,2.5,0,Math.PI*2);mmCtx.fill();
    });
  }

  // Loot
  if(window.gameState?.loots){
    window.gameState.loots.forEach(l=>{
      const px=cx+(l.x-player.x)*sc,py=cy+(l.y-player.y)*sc;
      if(Math.hypot(px-cx,py-cy)>S/2-4)return;
      mmCtx.fillStyle='#ffaa00';mmCtx.beginPath();mmCtx.arc(px,py,2,0,Math.PI*2);mmCtx.fill();
    });
  }

  // Nav target
  if(navTarget){
    const px=cx+(navTarget.x-player.x)*sc,py=cy+(navTarget.y-player.y)*sc;
    mmCtx.save();mmCtx.strokeStyle='#00ff88';mmCtx.lineWidth=1;mmCtx.setLineDash([3,4]);
    mmCtx.beginPath();mmCtx.moveTo(cx,cy);
    const edgePx=Math.hypot(px-cx,py-cy)<S/2-6?px:cx+Math.cos(Math.atan2(py-cy,px-cx))*(S/2-6);
    const edgePy=Math.hypot(px-cx,py-cy)<S/2-6?py:cy+Math.sin(Math.atan2(py-cy,px-cx))*(S/2-6);
    mmCtx.lineTo(edgePx,edgePy);mmCtx.stroke();mmCtx.setLineDash([]);mmCtx.restore();
  }

  // Hráč
  mmCtx.save();mmCtx.translate(cx,cy);mmCtx.rotate(player.angle+Math.PI/2);
  mmCtx.fillStyle='#ff9500';mmCtx.shadowColor='#ff9500';mmCtx.shadowBlur=6;
  mmCtx.beginPath();mmCtx.moveTo(0,-6);mmCtx.lineTo(4,4);mmCtx.lineTo(-4,4);mmCtx.closePath();mmCtx.fill();
  mmCtx.restore();

  mmCtx.restore();
  // Coordinates label
  mmCtx.fillStyle='rgba(255,149,0,0.55)';mmCtx.font='8px "Courier New", monospace';mmCtx.textAlign='center';
  mmCtx.fillText(`${Math.round(player.x/100)},${Math.round(player.y/100)}`,S/2,S-4);
}

// ---- Velká mapa ----
let mapCanvas,mapCtx,mapZoom=1,mapPan={x:0,y:0},mapDragStart=null;
function updateAutopilotUI(){
  const gs=window.gameState;
  const nameEl=document.getElementById('msp-target-name');
  const distEl=document.getElementById('msp-target-dist');
  const statusEl=document.getElementById('msp-ap-status');
  const btn=document.getElementById('btn-autopilot');
  const etaEl=document.getElementById('msp-ap-eta');
  if(!nameEl)return;
  if(gs?.navTarget){
    nameEl.textContent=gs.navTarget.name;
    const d=gs.player?Math.hypot(gs.navTarget.x-gs.player.x,gs.navTarget.y-gs.player.y):0;
    if(distEl)distEl.textContent=(d/1000).toFixed(1)+' AU';
    if(btn)btn.disabled=false;
    if(etaEl){
      const spd=gs.player?Math.hypot(gs.player.vx,gs.player.vy):0;
      etaEl.textContent=spd>3?'ETA: ~'+Math.round(d/(spd*60))+' min':'';
    }
  } else {
    if(nameEl)nameEl.textContent='— žádný cíl —';
    if(distEl)distEl.textContent='';
    if(btn)btn.disabled=true;
    if(etaEl)etaEl.textContent='';
    if(gs)gs.autopilot=false;
  }
  if(gs?.autopilot){
    if(btn){btn.textContent='■ VYPNOUT AUTOPILOT';btn.classList.add('active');}
    if(statusEl){statusEl.textContent='● AKTIVNÍ';statusEl.id='msp-ap-status';statusEl.className='on';}
  } else {
    if(btn){btn.textContent='⚡ ZAPNOUT AUTOPILOT';btn.classList.remove('active');}
    if(statusEl){statusEl.textContent='○ NEAKTIVNÍ';statusEl.className='';}
  }
}
function initMapCanvas(){
  mapCanvas=document.getElementById('map-canvas');mapCtx=mapCanvas.getContext('2d');
  const hdr=document.getElementById('map-header');
  const hdrH=hdr?hdr.offsetHeight||48:48;
  mapCanvas.width=Math.max(300,window.innerWidth-240);
  mapCanvas.height=Math.max(300,window.innerHeight-hdrH);
  mapCanvas.addEventListener('wheel',e=>{
    e.preventDefault();
    // Zoom centrovaný na pozici myši
    const rect=mapCanvas.getBoundingClientRect();
    const mx=e.clientX-rect.left-mapCanvas.width/2-mapPan.x;
    const my=e.clientY-rect.top-mapCanvas.height/2-mapPan.y;
    const factor=e.deltaY<0?1.25:0.80;
    mapPan.x-=mx*(factor-1);
    mapPan.y-=my*(factor-1);
    mapZoom=clamp(mapZoom*factor,0.002,500);
    drawBigMap();
  },{passive:false});
  mapCanvas.addEventListener('mousedown',e=>{mapDragStart={x:e.clientX-mapPan.x,y:e.clientY-mapPan.y};mapCanvas.style.cursor='grabbing';});
  mapCanvas.addEventListener('mousemove',e=>{
    if(mapDragStart){mapPan.x=e.clientX-mapDragStart.x;mapPan.y=e.clientY-mapDragStart.y;}
    const rect=mapCanvas.getBoundingClientRect();
    _mapHoverX=e.clientX-rect.left;_mapHoverY=e.clientY-rect.top;
    drawBigMap();
  });
  mapCanvas.addEventListener('mouseup',()=>{mapDragStart=null;mapCanvas.style.cursor='grab';});
  mapCanvas.addEventListener('mouseleave',()=>{mapDragStart=null;_mapHoverX=-999;_mapHoverY=-999;drawBigMap();});
  mapCanvas.addEventListener('click',e=>{handleMapClick(e);});
  mapCanvas.style.cursor='grab';
}

function drawBigMap(){
  if(!mapCtx||!window.gameState)return;
  const player=window.gameState.player;
  const MW=mapCanvas.width,MH=mapCanvas.height;
  const cx=MW/2+mapPan.x,cy=MH/2+mapPan.y;
  const baseScale=Math.min(MW,MH)/8000*mapZoom;
  mapCtx.clearRect(0,0,MW,MH);
  mapCtx.fillStyle=window.lightMode?'#d8e8ff':'#000408';mapCtx.fillRect(0,0,MW,MH);
  // Grid — hustota podle zoomu
  const gridSpacing=Math.max(8,Math.min(80,40*mapZoom));
  mapCtx.strokeStyle=window.lightMode?'rgba(0,40,160,0.08)':'rgba(255,149,0,0.05)';mapCtx.lineWidth=0.5;
  for(let x=0;x<MW;x+=gridSpacing){mapCtx.beginPath();mapCtx.moveTo(x,0);mapCtx.lineTo(x,MH);mapCtx.stroke();}
  for(let y=0;y<MH;y+=gridSpacing){mapCtx.beginPath();mapCtx.moveTo(0,y);mapCtx.lineTo(MW,y);mapCtx.stroke();}

  function wp(wx,wy){return{x:cx+wx*baseScale,y:cy+wy*baseScale};}

  // Mlhoviny
  chunkCache.forEach(ch=>{
    if(!ch.nebula)return;
    const{x:px,y:py}=wp(ch.nebula.x-player.x,ch.nebula.y-player.y);
    const pr=ch.nebula.r*baseScale;
    const gr=mapCtx.createRadialGradient(px,py,0,px,py,pr);
    gr.addColorStop(0,ch.nebula.col+'0.1)');gr.addColorStop(1,ch.nebula.col+'0)');
    mapCtx.fillStyle=gr;mapCtx.beginPath();mapCtx.arc(px,py,pr,0,Math.PI*2);mapCtx.fill();
  });

  // Hvězdné systémy & stanice
  chunkCache.forEach(ch=>{
    if(!ch.system)return;
    const sys=ch.system;
    const{x:px,y:py}=wp(sys.sx-player.x,sys.sy-player.y);
    // Hvězda
    mapCtx.save();
    const sr=Math.max(3,sys.r*baseScale*0.5);
    const gr=mapCtx.createRadialGradient(px,py,0,px,py,sr*2.5);
    gr.addColorStop(0,sys.glow+'0.6)');gr.addColorStop(1,sys.glow+'0)');
    mapCtx.fillStyle=gr;mapCtx.beginPath();mapCtx.arc(px,py,sr*2.5,0,Math.PI*2);mapCtx.fill();
    mapCtx.fillStyle=sys.color;mapCtx.beginPath();mapCtx.arc(px,py,sr,0,Math.PI*2);mapCtx.fill();
    mapCtx.restore();
    // Stanice
    if(sys.station){
      const st=sys.station;
      const{x:spx,y:spy}=wp(st.x-player.x,st.y-player.y);
      const isNav=window.gameState.navTarget===st;
      mapCtx.save();
      if(st.type==='large'){
        // Velká Coriolis — výrazný prstencový symbol
        const stR=14+st.tier*2;
        mapCtx.strokeStyle=isNav?'#00ff88':st.color;mapCtx.lineWidth=isNav?2.5:2;
        mapCtx.shadowColor=isNav?'#00ff88':st.color;mapCtx.shadowBlur=12;
        mapCtx.beginPath();mapCtx.arc(spx,spy,stR,0,Math.PI*2);mapCtx.stroke();
        mapCtx.shadowBlur=0;
        // Vnější záše
        mapCtx.globalAlpha=0.18;
        mapCtx.beginPath();mapCtx.arc(spx,spy,stR*1.6,0,Math.PI*2);
        mapCtx.fillStyle=st.color;mapCtx.fill();
        mapCtx.globalAlpha=1;
        // Diagonální výztuhy
        mapCtx.strokeStyle=(isNav?'#00ff88':st.color)+'88';mapCtx.lineWidth=1;
        for(let i=0;i<4;i++){
          const a=(i/4)*Math.PI*2+Math.PI/8;
          mapCtx.beginPath();
          mapCtx.moveTo(spx+Math.cos(a)*stR*0.35,spy+Math.sin(a)*stR*0.35);
          mapCtx.lineTo(spx+Math.cos(a)*stR*0.88,spy+Math.sin(a)*stR*0.88);
          mapCtx.stroke();
        }
        mapCtx.fillStyle=isNav?'#00ff88':st.color;mapCtx.beginPath();mapCtx.arc(spx,spy,3,0,Math.PI*2);mapCtx.fill();
        // Název — větší a výraznější
        mapCtx.font=`bold ${12+st.tier}px "Courier New", monospace`;mapCtx.textAlign='center';
        mapCtx.fillStyle=isNav?'#00ff88':st.color;
        mapCtx.shadowColor=isNav?'#00ff88':st.color;mapCtx.shadowBlur=8;
        mapCtx.fillText('◈ '+st.name,spx,spy-stR-8);
        mapCtx.shadowBlur=0;
        mapCtx.font='9px "Courier New",monospace';mapCtx.fillStyle=(isNav?'#00ff88':st.color)+'99';
        mapCtx.fillText('CORIOLIS CLASS',spx,spy-stR-20);
      } else {
        const stR=5+st.tier*2;
        mapCtx.strokeStyle=isNav?'#00ff88':st.color;mapCtx.lineWidth=isNav?2:1;
        mapCtx.fillStyle='rgba(0,4,14,0.9)';
        mapCtx.beginPath();
        for(let i=0;i<6;i++){const a=i*Math.PI/3;mapCtx.lineTo(spx+Math.cos(a)*stR,spy+Math.sin(a)*stR);}
        mapCtx.closePath();mapCtx.fill();mapCtx.stroke();
        mapCtx.fillStyle=isNav?'#00ff88':st.color;
        mapCtx.font=`${9+st.tier}px "Courier New", monospace`;mapCtx.textAlign='center';
        mapCtx.fillText(st.name,spx,spy-stR-5);
      }
      mapCtx.restore();
    }
  });

  // Hráč
  const{x:ppx,y:ppy}=wp(0,0);
  mapCtx.save();
  mapCtx.translate(ppx,ppy);mapCtx.rotate(player.angle+Math.PI/2);
  mapCtx.fillStyle='#ff9500';mapCtx.shadowColor='#ff9500';mapCtx.shadowBlur=12;
  mapCtx.beginPath();mapCtx.moveTo(0,-8);mapCtx.lineTo(5,6);mapCtx.lineTo(-5,6);mapCtx.closePath();mapCtx.fill();
  mapCtx.restore();
  // Hráčův dosah
  mapCtx.strokeStyle='rgba(255,149,0,0.15)';mapCtx.lineWidth=1;mapCtx.setLineDash([3,6]);
  mapCtx.beginPath();mapCtx.arc(ppx,ppy,C.MINIMAP_R*baseScale,0,Math.PI*2);mapCtx.stroke();mapCtx.setLineDash([]);

  // Nav linka
  if(window.gameState.navTarget){
    const nt=window.gameState.navTarget;
    const{x:nx,y:ny}=wp(nt.x-player.x,nt.y-player.y);
    mapCtx.save();
    mapCtx.strokeStyle='rgba(0,255,136,0.4)';mapCtx.lineWidth=1.5;mapCtx.setLineDash([6,8]);
    mapCtx.beginPath();mapCtx.moveTo(ppx,ppy);mapCtx.lineTo(nx,ny);mapCtx.stroke();mapCtx.setLineDash([]);
    mapCtx.restore();
  }

  // Planety sluneční soustavy (vždy — bez culling limitu)
  {
    const solCh=getChunk(C.SOLAR_CHUNK.cx,C.SOLAR_CHUNK.cy);
    if(solCh?.system){
      const sys=solCh.system;
      const gt=window.gameState.t||0;
      // Orbit kroužky (při dostatečném zoomu)
      if(mapZoom>0.05){
        const{x:sx2,y:sy2}=wp(sys.sx-player.x,sys.sy-player.y);
        mapCtx.save();
        mapCtx.strokeStyle='rgba(255,149,0,0.06)';mapCtx.lineWidth=0.5;
        solCh.system.planets.forEach(pl=>{
          mapCtx.beginPath();mapCtx.arc(sx2,sy2,pl.orbit*baseScale,0,Math.PI*2);mapCtx.stroke();
        });
        mapCtx.restore();
      }
      solCh.system.planets.forEach(pl=>{
        const pos=getPlanetPos(pl,sys.sx,sys.sy,gt);
        const{x:ppx,y:ppy}=wp(pos.x-player.x,pos.y-player.y);
        // Zobraz i když je mimo canvas (při velkém zoomu) — ale ušetři výkon
        if(ppx<-200||ppx>MW+200||ppy<-200||ppy>MH+200)return;
        const pr=Math.max(3,pl.r*baseScale*0.6);
        mapCtx.save();
        const pg=mapCtx.createRadialGradient(ppx-pr*0.3,ppy-pr*0.3,0,ppx,ppy,pr);
        pg.addColorStop(0,'#ffffff88');pg.addColorStop(0.3,pl.color);pg.addColorStop(1,pl.color+'88');
        mapCtx.fillStyle=pg;mapCtx.beginPath();mapCtx.arc(ppx,ppy,pr,0,Math.PI*2);mapCtx.fill();
        // Název — jen při dostatečné velikosti
        if(pr>3){
          const fs=clamp(8+Math.floor(pr*0.3),8,16);
          mapCtx.font=`bold ${fs}px "Courier New", monospace`;
          mapCtx.textAlign='center';mapCtx.fillStyle='#ffd080';mapCtx.globalAlpha=0.85;
          mapCtx.fillText(pl.name,ppx,ppy-Math.max(pr,5)-3);
        }
        // Stanice hexagon
        if(pl.station&&pr>2){
          const isNav=window.gameState.navTarget===pl.station;
          const stx=ppx+Math.max(pr,5)+6,sty=ppy;
          mapCtx.strokeStyle=isNav?'#00ff88':pl.color;mapCtx.lineWidth=isNav?2:1;
          mapCtx.fillStyle='rgba(0,4,14,0.9)';mapCtx.globalAlpha=0.9;
          const sr=Math.max(3,4+pl.station.tier*1.5);
          mapCtx.beginPath();
          for(let i=0;i<6;i++){const a=i*Math.PI/3;mapCtx.lineTo(stx+Math.cos(a)*sr,sty+Math.sin(a)*sr);}
          mapCtx.closePath();mapCtx.fill();mapCtx.stroke();
        }
        mapCtx.restore();
      });
    }
  }

  // SOL — střed sluneční soustavy (vždy viditelný)
  {
    const solSys=getChunk(C.SOLAR_CHUNK.cx,C.SOLAR_CHUNK.cy)?.system;
    if(solSys){
      const{x:spx,y:spy}=wp(solSys.sx-player.x,solSys.sy-player.y);
      mapCtx.save();
      const solR=Math.max(8,155*baseScale);
      const sg=mapCtx.createRadialGradient(spx,spy,0,spx,spy,solR*3);
      sg.addColorStop(0,'rgba(255,240,100,0.55)');sg.addColorStop(1,'rgba(255,240,100,0)');
      mapCtx.fillStyle=sg;mapCtx.beginPath();mapCtx.arc(spx,spy,solR*3,0,Math.PI*2);mapCtx.fill();
      mapCtx.fillStyle='#fff8c0';mapCtx.beginPath();mapCtx.arc(spx,spy,Math.max(5,solR),0,Math.PI*2);mapCtx.fill();
      mapCtx.font='bold 11px "Courier New", monospace';mapCtx.textAlign='center';
      mapCtx.fillStyle='#ffee88';mapCtx.fillText('☀ SOL',spx,spy-Math.max(14,solR+5));
      mapCtx.restore();
    }
  }

  // === VŽDY VIDITELNÉ VELKÉ STANICE (z LARGE_STATIONS pole, i neobjevené) ===
  if(typeof LARGE_STATIONS!=='undefined'&&window.currentGalaxy==='sol'){
    LARGE_STATIONS.forEach(ls=>{
      const chKey=chunkKey(ls.cx,ls.cy);
      let stx,sty;
      if(chunkCache.has(chKey)){
        const ch=chunkCache.get(chKey);
        if(ch.system?.station?.type==='large'){stx=ch.system.station.x;sty=ch.system.station.y;}
        else{stx=ls.cx*C.CHUNK+C.CHUNK*0.65;sty=ls.cy*C.CHUNK+C.CHUNK*0.65;}
      } else {
        stx=ls.cx*C.CHUNK+C.CHUNK*0.65;sty=ls.cy*C.CHUNK+C.CHUNK*0.65;
      }
      const{x:spx,y:spy}=wp(stx-player.x,sty-player.y);
      if(spx<-60||spx>MW+60||spy<-60||spy>MH+60)return;
      const discovered=chunkCache.has(chKey);
      const stR=13;
      mapCtx.save();
      mapCtx.globalAlpha=discovered?1:0.55;
      mapCtx.strokeStyle=ls.color;mapCtx.lineWidth=2;
      mapCtx.shadowColor=ls.color;mapCtx.shadowBlur=discovered?12:5;
      mapCtx.beginPath();mapCtx.arc(spx,spy,stR,0,Math.PI*2);mapCtx.stroke();
      mapCtx.shadowBlur=0;
      // Glow
      mapCtx.globalAlpha=discovered?0.18:0.08;
      mapCtx.fillStyle=ls.color;mapCtx.beginPath();mapCtx.arc(spx,spy,stR*1.65,0,Math.PI*2);mapCtx.fill();
      mapCtx.globalAlpha=discovered?1:0.55;
      // Diagonály
      mapCtx.strokeStyle=ls.color+'88';mapCtx.lineWidth=1;
      for(let i=0;i<4;i++){
        const a=(i/4)*Math.PI*2+Math.PI/8;
        mapCtx.beginPath();
        mapCtx.moveTo(spx+Math.cos(a)*stR*0.35,spy+Math.sin(a)*stR*0.35);
        mapCtx.lineTo(spx+Math.cos(a)*stR*0.88,spy+Math.sin(a)*stR*0.88);
        mapCtx.stroke();
      }
      mapCtx.fillStyle=ls.color;mapCtx.beginPath();mapCtx.arc(spx,spy,2.5,0,Math.PI*2);mapCtx.fill();
      mapCtx.font='bold 11px "Courier New",monospace';mapCtx.textAlign='center';
      mapCtx.fillStyle=ls.color;mapCtx.shadowColor=ls.color;mapCtx.shadowBlur=discovered?6:0;
      mapCtx.fillText('◈ '+ls.name,spx,spy-stR-7);
      mapCtx.shadowBlur=0;
      if(!discovered){
        mapCtx.font='8px "Courier New",monospace';mapCtx.fillStyle=ls.color+'88';
        mapCtx.fillText('[ NEOBJEVENO ]',spx,spy-stR-18);
      } else {
        mapCtx.font='8px "Courier New",monospace';mapCtx.fillStyle=ls.color+'88';
        mapCtx.fillText('CORIOLIS CLASS',spx,spy-stR-19);
      }
      mapCtx.restore();
    });
  }

  // === DEALERS & GARAGES na mapě — ikony + přiletové okno na hover ===
  {
    const gid=window.currentGalaxy||'sol';
    const dealers=(typeof DEALERS_DATA!=='undefined'?DEALERS_DATA[gid]:null)||[];
    const garages=(typeof GARAGES_DATA!=='undefined'?GARAGES_DATA[gid]:null)||[];
    const p2=window.gameState?.player;
    let _hoveredPOI=null;

    // --- Loděnice (dealer) ---
    dealers.forEach(dl=>{
      const chKey=chunkKey(dl.cx,dl.cy);
      let stx,sty;
      if(chunkCache.has(chKey)){const ch=chunkCache.get(chKey);stx=ch.system?.station?.x||(dl.cx*C.CHUNK+C.CHUNK*.65);sty=ch.system?.station?.y||(dl.cy*C.CHUNK+C.CHUNK*.65);}
      else{stx=dl.cx*C.CHUNK+C.CHUNK*.65;sty=dl.cy*C.CHUNK+C.CHUNK*.65;}
      const{x:spx,y:spy}=wp(stx-player.x,sty-player.y);
      if(spx<-20||spx>MW+20||spy<-20||spy>MH+20)return;
      const hovered=Math.hypot(_mapHoverX-spx,_mapHoverY-spy)<14;
      if(hovered)_hoveredPOI={x:spx,y:spy,name:dl.name,type:'dealer',sub:'Loděnice — prodej lodí',extra:`20 lodí v katalogu`,col:'#ffaa00'};
      mapCtx.save();
      mapCtx.globalAlpha=hovered?1:0.8;
      // Diamond icon
      const r=hovered?9:6;
      mapCtx.strokeStyle='#ffaa00';mapCtx.lineWidth=hovered?2:1.5;
      mapCtx.shadowColor='#ffaa00';mapCtx.shadowBlur=hovered?14:6;
      mapCtx.fillStyle='rgba(255,170,0,0.15)';
      mapCtx.beginPath();mapCtx.moveTo(spx,spy-r);mapCtx.lineTo(spx+r*0.75,spy);mapCtx.lineTo(spx,spy+r);mapCtx.lineTo(spx-r*0.75,spy);mapCtx.closePath();
      mapCtx.fill();mapCtx.stroke();
      mapCtx.shadowBlur=0;
      // Small 🚀 text center
      mapCtx.font=`${hovered?9:8}px "Courier New",monospace`;mapCtx.textAlign='center';mapCtx.fillStyle='#ffdd88';
      mapCtx.fillText('🚀',spx,spy+3);
      mapCtx.restore();
    });

    // --- Garáže ---
    garages.forEach(gr=>{
      const chKey=chunkKey(gr.cx,gr.cy);
      let stx,sty;
      if(chunkCache.has(chKey)){const ch=chunkCache.get(chKey);stx=ch.system?.station?.x||(gr.cx*C.CHUNK+C.CHUNK*.65);sty=ch.system?.station?.y||(gr.cy*C.CHUNK+C.CHUNK*.65);}
      else{stx=gr.cx*C.CHUNK+C.CHUNK*.65;sty=gr.cy*C.CHUNK+C.CHUNK*.65;}
      const{x:spx,y:spy}=wp(stx-player.x,sty-player.y);
      if(spx<-20||spx>MW+20||spy<-20||spy>MH+20)return;
      const owned=p2?.ownedGarages?.includes(garageKey(gid,gr.cx,gr.cy));
      const hovered=Math.hypot(_mapHoverX-spx,_mapHoverY-spy)<14;
      const hexCol=owned?'#00ff88':'#00ccff';
      if(hovered)_hoveredPOI={x:spx,y:spy,name:gr.name,type:'garage',sub:owned?'Garáž — vlastníš':'Garáž — zakoupit',extra:owned?'Kapacita 3–6 lodí':`Cena: ${gr.cost.toLocaleString('cs')} Cr`,col:hexCol,owned};
      mapCtx.save();
      mapCtx.globalAlpha=hovered?1:0.8;
      const r=hovered?8:6;
      mapCtx.strokeStyle=hexCol;mapCtx.lineWidth=hovered?2:1.5;
      mapCtx.shadowColor=hexCol;mapCtx.shadowBlur=hovered?14:6;
      mapCtx.fillStyle=owned?'rgba(0,255,136,0.12)':'rgba(0,200,255,0.1)';
      mapCtx.beginPath();
      for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/6;mapCtx.lineTo(spx+Math.cos(a)*r,spy+Math.sin(a)*r);}
      mapCtx.closePath();mapCtx.fill();mapCtx.stroke();
      mapCtx.shadowBlur=0;
      mapCtx.font=`${hovered?9:7}px sans-serif`;mapCtx.textAlign='center';mapCtx.fillStyle=hexCol;
      mapCtx.fillText(owned?'✓':'H',spx,spy+3);
      mapCtx.restore();
    });

    // --- Přiletové okno (hover tooltip) ---
    if(_hoveredPOI){
      const {x:hx,y:hy,name,type,sub,extra,col}=_hoveredPOI;
      const tw=200,th=72,pad=10;
      // Position: prefer right/below cursor, avoid edges
      let bx=hx+18,by=hy-th/2;
      if(bx+tw>MW-10)bx=hx-tw-18;
      if(by<10)by=10;
      if(by+th>MH-60)by=MH-60-th;
      mapCtx.save();
      // Panel
      mapCtx.fillStyle=window.lightMode?'rgba(240,248,255,0.97)':'rgba(4,8,24,0.97)';
      mapCtx.strokeStyle=col;mapCtx.lineWidth=1.5;
      mapCtx.shadowColor=col;mapCtx.shadowBlur=12;
      _roundRect(mapCtx,bx,by,tw,th,4);mapCtx.fill();mapCtx.stroke();
      mapCtx.shadowBlur=0;
      // Top accent line
      mapCtx.fillStyle=col;mapCtx.fillRect(bx+1.5,by+1.5,tw-3,2);
      // Name
      mapCtx.font='bold 11px "Courier New",monospace';mapCtx.textAlign='left';
      mapCtx.fillStyle=window.lightMode?'#000022':col;
      mapCtx.fillText(name,bx+pad,by+pad+10);
      // Type line
      mapCtx.font='9px "Courier New",monospace';
      mapCtx.fillStyle=window.lightMode?'rgba(0,30,80,0.55)':'rgba(200,220,255,0.55)';
      mapCtx.fillText(sub,bx+pad,by+pad+26);
      // Extra info
      mapCtx.fillStyle=window.lightMode?'rgba(0,0,0,0.4)':'rgba(200,220,255,0.4)';
      mapCtx.fillText(extra,bx+pad,by+pad+42);
      // Type badge top right
      mapCtx.font='bold 8px "Courier New",monospace';mapCtx.textAlign='right';
      mapCtx.fillStyle=col;
      mapCtx.fillText(type==='dealer'?'◇ LODĚNICE':'⬡ GARÁŽ',bx+tw-pad,by+pad+10);
      mapCtx.restore();
    }
  }

  // === LEGENDA — panel dole ===
  const legH=44,legY2=MH-legH;
  mapCtx.save();
  mapCtx.fillStyle=window.lightMode?'rgba(220,235,255,0.93)':'rgba(0,3,14,0.88)';mapCtx.fillRect(0,legY2,MW,legH);
  mapCtx.strokeStyle=window.lightMode?'rgba(0,40,160,0.15)':'rgba(255,149,0,0.2)';mapCtx.lineWidth=1;
  mapCtx.beginPath();mapCtx.moveTo(0,legY2);mapCtx.lineTo(MW,legY2);mapCtx.stroke();

  const legItems=[
    {icon:null,   color:'#ffee88', label:'☀ Hvězda'},
    {icon:'hex',  color:'#ff9500', label:'◆ Stanice'},
    {icon:'ring', color:'#00d4ff', label:'◎ Coriolis'},
    {icon:'diamond',color:'#ffaa00',label:'◇ Loděnice'},
    {icon:'hexagon',color:'#00ccff',label:'⬡ Garáž'},
    {icon:null,   color:'#ff9500', label:'▶ Hráč'},
    {icon:null,   color:'#00ff88', label:'◈ Navigace'},
  ];
  const legPad=16,legSpacing=MW/legItems.length;
  mapCtx.font='10px "Courier New",monospace';mapCtx.textAlign='center';

  legItems.forEach((li,i)=>{
    const lx=legPad+i*legSpacing+legSpacing*0.5;
    const ly=legY2+16;
    mapCtx.save();
    // Ikona
    if(li.icon==='hex'){
      mapCtx.strokeStyle=li.color;mapCtx.lineWidth=1.2;
      mapCtx.fillStyle='rgba(0,4,14,0.9)';mapCtx.beginPath();
      for(let j=0;j<6;j++){const a=j*Math.PI/3;mapCtx.lineTo(lx+Math.cos(a)*6,ly+Math.sin(a)*6);}
      mapCtx.closePath();mapCtx.fill();mapCtx.stroke();
    } else if(li.icon==='ring'){
      mapCtx.strokeStyle=li.color;mapCtx.lineWidth=1.5;
      mapCtx.shadowColor=li.color;mapCtx.shadowBlur=5;
      mapCtx.beginPath();mapCtx.arc(lx,ly,6,0,Math.PI*2);mapCtx.stroke();
      mapCtx.shadowBlur=0;
      mapCtx.strokeStyle=li.color+'55';mapCtx.lineWidth=0.8;
      for(let j=0;j<4;j++){const a=(j/4)*Math.PI*2+Math.PI/8;
        mapCtx.beginPath();mapCtx.moveTo(lx+Math.cos(a)*2.5,ly+Math.sin(a)*2.5);
        mapCtx.lineTo(lx+Math.cos(a)*5.2,ly+Math.sin(a)*5.2);mapCtx.stroke();}
    } else if(li.icon==='diamond'){
      mapCtx.strokeStyle=li.color;mapCtx.lineWidth=1.5;
      mapCtx.shadowColor=li.color;mapCtx.shadowBlur=4;
      mapCtx.beginPath();mapCtx.moveTo(lx,ly-6);mapCtx.lineTo(lx+5,ly);mapCtx.lineTo(lx,ly+6);mapCtx.lineTo(lx-5,ly);mapCtx.closePath();mapCtx.stroke();
      mapCtx.shadowBlur=0;
    } else if(li.icon==='hexagon'){
      mapCtx.strokeStyle=li.color;mapCtx.lineWidth=1.5;
      mapCtx.shadowColor=li.color;mapCtx.shadowBlur=4;
      mapCtx.beginPath();
      for(let j=0;j<6;j++){const a=j*Math.PI/3-Math.PI/6;mapCtx.lineTo(lx+Math.cos(a)*6,ly+Math.sin(a)*6);}
      mapCtx.closePath();mapCtx.stroke();mapCtx.shadowBlur=0;
    } else {
      mapCtx.fillStyle=li.color;
      if(li.label.startsWith('▶')){
        mapCtx.save();mapCtx.translate(lx,ly);mapCtx.rotate(-Math.PI/2);
        mapCtx.beginPath();mapCtx.moveTo(0,-6);mapCtx.lineTo(4,4);mapCtx.lineTo(-4,4);mapCtx.closePath();
        mapCtx.fill();mapCtx.restore();
      } else {
        mapCtx.beginPath();mapCtx.arc(lx,ly,5,0,Math.PI*2);mapCtx.fill();
      }
    }
    // Text
    mapCtx.fillStyle=window.lightMode?'rgba(0,20,60,0.65)':'rgba(200,220,255,0.7)';mapCtx.textAlign='center';
    mapCtx.fillText(li.label,lx,ly+18);
    mapCtx.restore();
  });

  // Zoom + souřadnice vpravo dole
  mapCtx.font='9px "Courier New", monospace';mapCtx.textAlign='right';
  mapCtx.fillStyle='rgba(255,149,0,0.5)';
  mapCtx.fillText(`ZOOM: ${mapZoom.toFixed(1)}×  |  ${Math.round(player.x/100)}, ${Math.round(player.y/100)} AU  |  [KLIK] = Nastavit navigaci`,MW-8,legY2-6);

  mapCtx.restore();
}

function handleMapClick(e){
  if(!window.gameState)return;
  const player=window.gameState.player;
  const rect=mapCanvas.getBoundingClientRect();
  const mx=e.clientX-rect.left,my=e.clientY-rect.top;
  const MW=mapCanvas.width,MH=mapCanvas.height,baseScale=Math.min(MW,MH)/8000*mapZoom;
  const cx=MW/2+mapPan.x,cy=MH/2+mapPan.y;
  let closest=null,closestD=30;
  chunkCache.forEach(ch=>{
    if(!ch.system)return;
    const checkSt=(st)=>{
      if(!st)return;
      const px=cx+(st.x-player.x)*baseScale,py=cy+(st.y-player.y)*baseScale;
      const d=Math.hypot(mx-px,my-py);
      if(d<closestD){closestD=d;closest=st;}
    };
    checkSt(ch.system.station);
    // Planetární stanice — hledej i v solárním chunku
    ch.system.planets?.forEach(pl=>{
      if(!pl.station)return;
      const pos=getPlanetPos(pl,ch.system.sx,ch.system.sy,window.gameState.t||0);
      const stx=pos.x+(pl.r+pl.station.r)*1.9, sty=pos.y;
      const spx=cx+(stx-player.x)*baseScale,spy=cy+(sty-player.y)*baseScale;
      const d=Math.hypot(mx-spx,my-spy);
      if(d<closestD+10){closestD=d;closest=pl.station;}
    });
  });
  // Kliknutí na vždy-viditelné velké stanice (i neobjevené)
  if(!closest&&typeof LARGE_STATIONS!=='undefined'&&window.currentGalaxy==='sol'){
    LARGE_STATIONS.forEach(ls=>{
      const chKey=chunkKey(ls.cx,ls.cy);
      let stx,sty;
      if(chunkCache.has(chKey)){
        const ch=chunkCache.get(chKey);
        if(ch.system?.station?.type==='large'){stx=ch.system.station.x;sty=ch.system.station.y;}
        else{stx=ls.cx*C.CHUNK+C.CHUNK*0.65;sty=ls.cy*C.CHUNK+C.CHUNK*0.65;}
      } else {stx=ls.cx*C.CHUNK+C.CHUNK*0.65;sty=ls.cy*C.CHUNK+C.CHUNK*0.65;}
      const px2=cx+(stx-player.x)*baseScale,py2=cy+(sty-player.y)*baseScale;
      if(Math.hypot(mx-px2,my-py2)<22&&!closest){
        closest={x:stx,y:sty,name:ls.name+(chunkCache.has(chKey)?'':' [neobjeveno]')};
      }
    });
  }
  // Kliknutí na SOL (střed slunce)
  if(!closest){
    const solSys=getChunk(C.SOLAR_CHUNK.cx,C.SOLAR_CHUNK.cy)?.system;
    if(solSys){
      const px2=cx+(solSys.sx-player.x)*baseScale,py2=cy+(solSys.sy-player.y)*baseScale;
      if(Math.hypot(mx-px2,my-py2)<35){
        closest={x:solSys.sx,y:solSys.sy,name:'SOL — Sluneční soustava'};
      }
    }
  }
  if(closest){
    window.gameState.navTarget=closest;
    setMsg(`NAVIGACE: ${closest.name}  (${(dist2(player,closest)/1000).toFixed(1)} AU)`,4000);
    updateAutopilotUI();
    drawBigMap();
  }
}

// ---- Tab switching ----
function switchDockTab(tab){
  document.querySelectorAll('.dtab').forEach(btn=>{
    const txt=btn.textContent.trim();
    const match=(tab==='services'&&(txt==='SERVIS'||txt.includes('SERVIS')))||
                 (tab==='contracts'&&(txt==='ZAKÁZKY'||txt.includes('ZAKÁZKY')))||
                 (tab==='upgrades'&&(txt==='UPGRADY'||txt.includes('UPGRADY')))||
                 (tab==='dealer'&&txt.includes('LODĚNICE'))||
                 (tab==='garage'&&(txt.includes('HANGÁR')||txt.includes('KOUPIT')))||
                 (tab==='tuning'&&txt.includes('TUNING'))||
                 (tab==='vylepšení'&&txt.includes('VYLEPŠENÍ'));
    btn.classList.toggle('active',match);
  });
  ['services','contracts','upgrades'].forEach(id=>{
    const el=document.getElementById('dtab-'+id);
    if(!el)return;
    el.style.display=id===tab?'block':'none';
  });
  // Dynamický obsah
  const body=document.getElementById('dock-body');
  ['dtab-dealer','dtab-garage','dtab-tuning','dtab-vylepšení'].forEach(id=>{
    const old=document.getElementById(id);if(old)old.remove();
  });
  if(tab==='dealer'){
    const div=document.createElement('div');div.id='dtab-dealer';
    div.innerHTML='<div class="dock-fullscreen-hint">🚀 <b>Loděnice</b> — katalog 20 lodí<br><button class="svc-btn" style="margin-top:16px;width:100%;font-size:14px;padding:14px" onclick="openShipShop()">OTEVŘÍT KATALOG LODÍ →</button></div>';
    body.appendChild(div);
  } else if(tab==='garage'){
    const gs=window.gameState;if(!gs)return;
    const st=gs.dockStation;const p=gs.player;
    if(!st||st.type!=='garage')return;
    const gKey=garageKey(st.garageGalaxy,st.garageCx,st.garageCy);
    const owned=p.ownedGarages.includes(gKey);
    const div=document.createElement('div');div.id='dtab-garage';
    if(!owned){
      div.innerHTML=`<div class="dock-fullscreen-hint">
        <div style="font-size:32px;margin-bottom:12px">🏭</div>
        <div style="font-size:18px;font-weight:bold;color:#00ccff;margin-bottom:8px">${st.name}</div>
        <div style="color:rgba(200,220,255,0.7);margin-bottom:20px">Kapacita: 3–6 lodí · Expandovatelný hangár</div>
        <div style="font-size:24px;font-weight:bold;color:#ffcc00;margin-bottom:8px">${st.garageCost.toLocaleString('cs')} Cr</div>
        <button class="svc-btn" style="margin-top:8px;width:100%;font-size:14px;padding:14px;background:rgba(0,200,255,0.2);border-color:#00ccff;color:#00ccff"
          onclick="buyGarage(window.gameState?.dockStation)">💰 KOUPIT HANGÁR</button>
        <div style="margin-top:12px;color:rgba(150,170,200,0.6);font-size:11px">Máš ${p.credits.toLocaleString('cs')} Cr</div>
      </div>`;
    } else {
      const ships=getGarageShips(p,gKey);
      const cap=getGarageCapacity(p,gKey);
      div.innerHTML=`<div class="dock-fullscreen-hint">
        <button class="svc-btn" style="margin-top:8px;width:100%;font-size:13px;padding:12px" onclick="openGarageMenu()">🏭 SPRÁVA HANGÁRU (${ships.length}/${cap} lodí) →</button>
      </div>`;
    }
    body.appendChild(div);
  } else if(tab==='vylepšení'){
    const gs=window.gameState;if(!gs)return;
    const p=gs.player;
    const div=document.createElement('div');div.id='dtab-vylepšení';
    div.style.cssText='overflow-y:auto;max-height:calc(100vh - 200px);padding:2px 0';
    // Upgrades
    let html='<div style="font-size:10px;color:rgba(255,150,40,0.6);letter-spacing:1.5px;margin:6px 0 6px;text-transform:uppercase">Upgrady</div>';
    const upgRows=[];
    UPGRADES.forEach(upg=>{
      const lvl=p.upgrades[upg.id]||0,maxed=lvl>=upg.max;
      const cost=Math.ceil(upg.cost*Math.pow(1.7,lvl));
      const pips=Array.from({length:upg.max},(_,i)=>`<span class="pip${i<lvl?' on':''}"></span>`).join('');
      const btnId=`vyl-btn-${upg.id}`;
      html+=`<div class="upgrade-row"><span class="uname">${upg.name}</span><span class="udesc">${upg.desc}</span><div class="upips">${pips}</div><span class="ucost">${maxed?'MAX':cost+' Cr'}</span>${!maxed?`<button id="${btnId}" class="ubtn" ${p.credits<cost?'disabled':''}>↑</button>`:''}</div>`;
      if(!maxed)upgRows.push({upg,cost,btnId});
    });
    // Visual tuning
    const hc=p.shipColor||getShipDef(p.shipType||'viper').color||'#99bbff';
    const tc=p.thrusterColor||getShipDef(p.shipType||'viper').thruster||'#ff7700';
    const hSwatches=HULL_COLORS.map(c=>`<span class="tun-swatch${c===hc?' selected':''}" style="background:${c};width:16px;height:16px;display:inline-block;cursor:pointer" onclick="window._vylHull('${c}')"></span>`).join('');
    const tSwatches=THRUST_COLORS.map(c=>`<span class="tun-swatch${c===tc?' selected':''}" style="background:${c};width:16px;height:16px;display:inline-block;cursor:pointer" onclick="window._vylThrust('${c}')"></span>`).join('');
    html+=`<div style="font-size:10px;color:rgba(255,150,40,0.6);letter-spacing:1.5px;margin:10px 0 6px;text-transform:uppercase">Vizuál lodi</div>
      <div style="font-size:10px;color:rgba(180,200,255,0.6);margin-bottom:4px">Barva trupu</div>
      <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:8px">${hSwatches}</div>
      <div style="font-size:10px;color:rgba(180,200,255,0.6);margin-bottom:4px">Barva trysek</div>
      <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:8px">${tSwatches}</div>
      <div style="font-size:10px;color:rgba(180,200,255,0.6);margin-bottom:4px">Název lodi</div>
      <input id="vyl-name" class="tun-input" style="width:100%;box-sizing:border-box;margin-bottom:8px" value="${p.shipCustomName||''}" placeholder="${getShipDef(p.shipType||'viper').name}">
      <button class="svc-btn" style="width:100%;font-size:12px;padding:8px" onclick="window._vylSave()">✓ ULOŽIT VIZUÁL</button>`;
    div.innerHTML=html;
    body.appendChild(div);
    // Wire upgrade buttons
    upgRows.forEach(({upg,cost,btnId})=>{
      const btn=document.getElementById(btnId);
      if(btn)btn.onclick=()=>{
        if(p.credits>=cost){p.credits-=cost;p.upgrades[upg.id]=(p.upgrades[upg.id]||0)+1;applyUpgrades(p);
          if(typeof saveGame==='function')saveGame();switchDockTab('vylepšení');setMsg(`${upg.name} vylepšen!`,2000);}
      };
    });
    window._vylHull=(c)=>{p.shipColor=c;if(typeof saveGame==='function')saveGame();switchDockTab('vylepšení');};
    window._vylThrust=(c)=>{p.thrusterColor=c;if(typeof saveGame==='function')saveGame();switchDockTab('vylepšení');};
    window._vylSave=()=>{p.shipCustomName=document.getElementById('vyl-name')?.value.trim()||null;if(typeof saveGame==='function')saveGame();setMsg('Vizuál uložen!',2000);};
  }
  if(tab==='contracts'&&window.gameState?.dockStation){
    renderContractsTab(window.gameState.player,window.gameState.dockStation);
  }
}

// ---- Dokovací panel ----
function renderDockPanel(player,station){
  const el=document.getElementById('dock-panel');if(!el)return;
  el.style.display='flex';

  // Speciální tapy dle typu stanice
  const isDealer=station.type==='dealer';
  const isGarage=station.type==='garage';
  const dockTabs=document.getElementById('dock-tabs');
  if(isDealer){
    dockTabs.innerHTML=`
      <button class="dtab active" onclick="switchDockTab('dealer')">🚀 LODĚNICE</button>
      <button class="dtab" onclick="switchDockTab('services')">SERVIS</button>
      <button class="dtab" onclick="switchDockTab('vylepšení')">⚙ VYLEPŠENÍ</button>`;
    switchDockTab('dealer');
  } else if(isGarage){
    const gKey=garageKey(station.garageGalaxy,station.garageCx,station.garageCy);
    const owned=player.ownedGarages.includes(gKey);
    dockTabs.innerHTML=`
      <button class="dtab active" onclick="switchDockTab('garage')">${owned?'🏭 HANGÁR':'💰 KOUPIT'}</button>
      <button class="dtab" onclick="switchDockTab('services')">SERVIS</button>
      ${owned?`<button class="dtab" onclick="switchDockTab('vylepšení')">⚙ VYLEPŠENÍ</button>`:''}`;
    switchDockTab('garage');
  } else {
    dockTabs.innerHTML=`
      <button class="dtab active" onclick="switchDockTab('services')">SERVIS</button>
      <button class="dtab" onclick="switchDockTab('contracts')">ZAKÁZKY</button>`;
    switchDockTab('services');
  }

  document.getElementById('dock-name').textContent=station.name;
  document.getElementById('dock-tier').textContent='◆'.repeat(station.tier)+'◇'.repeat(3-station.tier);
  // Services
  const fm=player.fuelMax-player.fuel;
  const fr=(player.fuelReserveMax||0)-(player.fuelReserve||0);
  const fc=Math.ceil((fm+fr)*C.FUEL_PRICE);
  document.getElementById('fuel-cost').textContent=(fm<1&&fr<1)?'Plná nádrž':`${fc} Cr`;
  document.getElementById('fuel-btn').disabled=(fm<1&&fr<1)||player.credits<fc;
  document.getElementById('fuel-btn').onclick=()=>{
    if(player.credits>=fc&&(fm>=1||fr>=1)){
      player.credits-=fc;player.fuel=player.fuelMax;
      player.fuelReserve=player.fuelReserveMax;
      renderDockPanel(player,station);setMsg('Palivo a záloha doplněny!',2000);
    }
  };
  const hm=player.hullMax-player.hull,hc=Math.ceil(hm*C.HULL_PRICE);
  document.getElementById('hull-cost').textContent=hm<1?'Trup OK':`${hc} Cr`;
  document.getElementById('hull-btn').disabled=hm<1||player.credits<hc;
  document.getElementById('hull-btn').onclick=()=>{
    if(player.credits>=hc&&hm>=1){player.credits-=hc;player.hull=player.hullMax;renderDockPanel(player,station);setMsg('Trup opraven!',2000);}
  };
  const sm=player.shieldMax-player.shield,sc2=Math.ceil(sm*C.SHIELD_PRICE);
  document.getElementById('shield-cost').textContent=sm<1?'Nabit':`${sc2} Cr`;
  document.getElementById('shield-btn').disabled=sm<1||player.credits<sc2;
  document.getElementById('shield-btn').onclick=()=>{
    if(player.credits>=sc2&&sm>=1){player.credits-=sc2;player.shield=player.shieldMax;renderDockPanel(player,station);setMsg('Štít nabit!',2000);}
  };
  // Upgrades
  const ul=document.getElementById('upgrade-list');ul.innerHTML='';
  UPGRADES.forEach(upg=>{
    const lvl=player.upgrades[upg.id]||0,maxed=lvl>=upg.max;
    const cost=Math.ceil(upg.cost*Math.pow(1.7,lvl));
    const row=document.createElement('div');row.className='upgrade-row';
    const pips=Array.from({length:upg.max},(_,i)=>`<span class="pip${i<lvl?' on':''}"></span>`).join('');
    row.innerHTML=`<span class="uname">${upg.name}</span><span class="udesc">${upg.desc}</span><div class="upips">${pips}</div><span class="ucost">${maxed?'MAX':cost+' Cr'}</span>`;
    if(!maxed){const btn=document.createElement('button');btn.className='ubtn';btn.textContent='↑';btn.disabled=player.credits<cost;
      btn.onclick=()=>{if(player.credits>=cost){player.credits-=cost;player.upgrades[upg.id]=lvl+1;applyUpgrades(player);renderDockPanel(player,station);setMsg(`${upg.name} vylepšen!`,2000);}};
      row.appendChild(btn);}
    ul.appendChild(row);
  });
}


// ================================================================
//  ZAKÁZKY (Contract System)
// ================================================================
let _currentContracts=[];

function generateContracts(station,galaxyId){
  const daySeed=Math.floor(Date.now()/(1000*60*30)); // refresh every 30 min
  const stSeed=station.name.split('').reduce((s,c)=>s+c.charCodeAt(0),0);
  const rng=makeRng(((stSeed*997+daySeed*1009)>>>0));
  const ALL_DEST=[...FIXED_STATIONS,...LARGE_STATIONS].filter(s=>s.name!==station.name);
  const OTHER_GALAXIES=GALAXIES.filter(g=>g.id!==galaxyId&&g.fuelCost>0);
  const contracts=[];
  for(let i=0;i<5;i++){
    const c=CONTRACT_CARGO[Math.floor(rng()*CONTRACT_CARGO.length)];
    const crossGal=OTHER_GALAXIES.length>0&&rng()<0.38;
    let to,toGalaxy,toIsGalaxy,reward;
    if(crossGal){
      const gal=OTHER_GALAXIES[Math.floor(rng()*OTHER_GALAXIES.length)];
      to=gal.name; toGalaxy=gal.id; toIsGalaxy=true;
      reward=Math.round((c.base*50+gal.lightYears*7000)*(0.85+rng()*0.3));
    } else {
      const dest=ALL_DEST[Math.floor(rng()*ALL_DEST.length)];
      const scx=station.cx!==undefined?station.cx:0;
      const scy=station.cy!==undefined?station.cy:0;
      const chD=Math.max(1,Math.hypot(dest.cx-scx,dest.cy-scy));
      reward=Math.round((c.base*7+chD*1100)*(0.85+rng()*0.3));
      to=dest.name; toGalaxy=galaxyId; toIsGalaxy=false;
    }
    contracts.push({
      id:`${station.name}_${i}_${daySeed}`,
      cargo:c.name, cargoIcon:c.icon,
      fromStation:station.name, fromGalaxy:galaxyId,
      to, toGalaxy, toIsGalaxy,
      reward:Math.max(500,reward),
      xp:Math.round(Math.max(500,reward)/140),
      danger:c.danger,
    });
  }
  return contracts;
}

function renderContractsTab(player,station){
  const el=document.getElementById('dtab-contracts');
  if(!el)return;
  const galaxyId=window.currentGalaxy||'sol';
  _currentContracts=generateContracts(station,galaxyId);
  const active=player.activeContract;
  const DCOL=['#00d480','#ffaa00','#ff6600','#ff2244'];
  const DLBL=['Bezpečné','Mírné riziko','Nebezpečné','Extrémní'];
  let html='';

  if(active){
    const gal=GALAXIES.find(g=>g.id===active.toGalaxy);
    const gc=gal?.color||'#ff9500';
    const destLabel=active.toIsGalaxy?(gal?.name||active.toGalaxy):active.to;
    html+=`<div class="contract-active">
      <div class="ca-header"><span class="ca-badge">◈ AKTIVNÍ ZAKÁZKA</span>
        <button class="ca-cancel-btn" onclick="cancelContract()">✕ Zrušit</button></div>
      <div class="ca-body">
        <span class="ca-icon">${active.cargoIcon}</span>
        <div class="ca-info">
          <div class="ca-cargo">${active.cargo}</div>
          <div class="ca-route">${active.fromStation} <span class="ca-arr">→</span>
            <span style="color:${gc}">${destLabel}</span>
            ${active.toIsGalaxy?`<span class="cc-warp-badge">WARP</span>`:''}
          </div>
        </div>
        <div class="ca-reward-block"><div class="ca-rew">${active.reward.toLocaleString('cs')} Cr</div>
          <div class="ca-xp">+${active.xp} XP</div></div>
      </div>
      <div class="ca-hint">${active.toIsGalaxy
        ?`Warpuj do galaxie <b>${gal?.name||active.toGalaxy}</b> a přistaň na jakékoliv stanici`
        :`Doručit na: <b>${active.to}</b>${active.toGalaxy!==galaxyId?' (jiná galaxie)':''}`
      }</div>
    </div>
    <div class="contracts-sep">Dostupné zakázky ${active?'— přijetí nové zruší aktivní':''}</div>`;
  } else {
    html+='<div class="contracts-sep">Dostupné zakázky na stanici '+station.name+'</div>';
  }

  _currentContracts.forEach((c,i)=>{
    const gal=GALAXIES.find(g=>g.id===c.toGalaxy);
    const gc=gal?.color||'#ff9500';
    const destLabel=c.toIsGalaxy?(gal?.name||c.to):c.to;
    const isAct=active?.id===c.id;
    html+=`<div class="contract-card${isAct?' cc-taken':''}">
      <div class="cc-top">
        <span class="cc-icon">${c.cargoIcon}</span>
        <div class="cc-main">
          <div class="cc-cargo">${c.cargo}</div>
          <div class="cc-route">
            <span class="cc-from">${c.fromStation}</span>
            <span class="cc-arr">→</span>
            <span class="cc-to" style="color:${gc}">${destLabel}</span>
            ${c.toIsGalaxy?`<span class="cc-warp-badge">WARP</span>`:''}
          </div>
          <div class="cc-danger" style="color:${DCOL[c.danger]}">${DLBL[c.danger]}</div>
        </div>
        <div class="cc-right">
          <div class="cc-reward">${c.reward.toLocaleString('cs')} Cr</div>
          <div class="cc-xp">+${c.xp} XP</div>
        </div>
      </div>
      ${isAct
        ?'<div class="cc-active-lbl">✓ PŘIJATO</div>'
        :`<button class="cc-accept-btn" onclick="acceptContract(${i})">Přijmout zakázku</button>`
      }
    </div>`;
  });
  el.innerHTML=html;
}

function _setContractNav(contract){
  if(!contract||!window.gameState)return;
  const gs=window.gameState;
  gs.navTarget=null;
  const galaxyId=window.currentGalaxy||'sol';

  if(contract.toIsGalaxy){
    // Cross-galaxy: nastav warpTarget na cílovou galaxii
    const gal=GALAXIES.find(g=>g.id===contract.toGalaxy);
    if(gal&&gal.id!==galaxyId){
      window.warpTarget=gal;
      setMsg(`Zakázka přijata! Warp kurz nastaven: ${gal.name} — stiskni [R]`,6000);
    }
    return;
  }

  // Same-galaxy: hledej stanici podle jména v chunkcache
  let found=null;
  if(typeof chunkCache!=='undefined'){
    chunkCache.forEach(ch=>{
      if(found)return;
      if(ch.system?.station?.name===contract.to) found=ch.system.station;
      ch.system?.planets?.forEach(pl=>{
        if(pl.station?.name===contract.to) found=pl.station;
      });
    });
  }
  if(!found){
    // Stanice ještě není v cache — odhadni z FIXED/LARGE_STATIONS definic
    const def=[...FIXED_STATIONS,...LARGE_STATIONS].find(s=>s.name===contract.to);
    if(def) found={x:def.cx*C.CHUNK+C.CHUNK*0.5, y:def.cy*C.CHUNK+C.CHUNK*0.5, name:def.name};
  }
  if(found){
    gs.navTarget=found;
    const dist=(Math.hypot(found.x-gs.player.x,found.y-gs.player.y)/1000).toFixed(1);
    setMsg(`Zakázka přijata! Navigace: ${found.name}  (${dist} AU)`,5000);
  } else {
    setMsg(`Zakázka přijata: ${contract.cargo} → ${contract.to}`,4000);
  }
}

function acceptContract(idx){
  const c=_currentContracts[idx];
  if(!c||!window.gameState)return;
  window.gameState.player.activeContract=c;
  updateContractHUD(c);
  _setContractNav(c);
  const st=window.gameState.dockStation;
  if(st) renderContractsTab(window.gameState.player,st);
}

function cancelContract(){
  if(!window.gameState)return;
  window.gameState.player.activeContract=null;
  updateContractHUD(null);
  const st=window.gameState.dockStation;
  if(st) renderContractsTab(window.gameState.player,st);
  setMsg('Zakázka zrušena.',2000);
}

function updateContractHUD(contract){
  const el=document.getElementById('contract-hud');
  if(!el)return;
  if(!contract){el.style.display='none';el.innerHTML='';return;}
  const gal=GALAXIES.find(g=>g.id===contract.toGalaxy);
  const gc=gal?.color||'#ff9500';
  const dest=contract.toIsGalaxy?(gal?.name||contract.toGalaxy):contract.to;
  el.style.display='block';
  el.innerHTML=`<span class="chud-icon">${contract.cargoIcon}</span>`+
    `<span class="chud-label">${contract.cargo}</span>`+
    `<span class="chud-arr">→</span>`+
    `<span class="chud-dest" style="color:${gc}">${dest}</span>`+
    `<span class="chud-rew">${contract.reward.toLocaleString('cs')} Cr</span>`;
}

// ---- Delivery Summary Screen ----
function showDeliveryScreen(contract, reward, xp, totalEarned){
  const ov=document.getElementById('delivery-overlay');
  if(!ov)return;

  const gal=GALAXIES.find(g=>g.id===contract.toGalaxy);
  const gc=gal?.color||'#ff9500';
  const destLabel=contract.toIsGalaxy?(gal?.name||contract.toGalaxy):contract.to;

  // Plnit statický obsah
  document.getElementById('delivery-galaxy').textContent=
    (gal?.name||'Sluneční soustava').toUpperCase();
  document.getElementById('delivery-icon').textContent=contract.cargoIcon;
  document.getElementById('delivery-cargo-name').textContent=contract.cargo;
  document.getElementById('delivery-from').textContent=contract.fromStation;
  document.getElementById('delivery-to').style.color=gc;
  document.getElementById('delivery-to').textContent=destLabel;

  // Hodnocení (5 hvězd vždy — v budoucnu lze rozlišovat)
  document.getElementById('delivery-stars').textContent='★★★★★';

  // Reset číselníků
  document.getElementById('delivery-reward-val').textContent='0 Cr';
  document.getElementById('delivery-xp-val').textContent='+0 XP';
  document.getElementById('delivery-total-val').textContent=
    (totalEarned-reward).toLocaleString('cs')+' Cr';

  ov.style.display='flex';

  // Animace počítání peněz
  const dur=1800; // ms
  const start=performance.now();
  function tick(now){
    const p=Math.min(1,(now-start)/dur);
    // easeOutExpo
    const e=p===1?1:1-Math.pow(2,-10*p);
    const cur=Math.round(reward*e);
    document.getElementById('delivery-reward-val').textContent=
      cur.toLocaleString('cs')+' Cr';
    document.getElementById('delivery-xp-val').textContent=
      '+'+Math.round(xp*e)+' XP';
    document.getElementById('delivery-total-val').textContent=
      Math.round((totalEarned-reward)+reward*e).toLocaleString('cs')+' Cr';
    if(p<1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // Tlačítko Další zakázky
  document.getElementById('delivery-next-btn').onclick=()=>{
    ov.style.display='none';
    // Přepni tab na zakázky
    if(typeof switchDockTab==='function') switchDockTab('contracts');
  };
}

// ---- Full-screen Trade Overlay ----
let _tradeSelected=null; // {name, info, mode:'buy'|'sell'}
let _tradeQty=1;
let _tradePlayer=null, _tradeStation=null;

function openTradeOverlay(player,station){
  _tradePlayer=player;_tradeStation=station;
  _tradeSelected=null;_tradeQty=1;
  document.getElementById('trade-overlay').style.display='flex';
  document.getElementById('btn-trade-close').onclick=closeTradeOverlay;
  document.getElementById('tq-minus').onclick=()=>{_tradeQty=Math.max(1,_tradeQty-1);_updateTradeDetail();};
  document.getElementById('tq-plus').onclick=()=>{_tradeQty++;_updateTradeDetail();};
  _renderTradeOverlay();
}

function closeTradeOverlay(){
  document.getElementById('trade-overlay').style.display='none';
  // Reset dock panel to services tab
  if(_tradeStation)renderDockPanel(_tradePlayer,_tradeStation);
}

function _renderTradeOverlay(){
  if(!_tradePlayer||!_tradeStation)return;
  const p=_tradePlayer,st=_tradeStation,inv=st.inv;
  const cmax=getCargoMax(p);
  document.getElementById('trade-station-name').textContent=st.name;
  document.getElementById('trade-cargo-badge').textContent=`NÁKLAD ${p.cargoCount}/${cmax}`;
  document.getElementById('trade-credits-hdr').textContent=p.credits.toLocaleString('cs')+' Cr';

  // Buy list
  const bl=document.getElementById('trade-buy-list');bl.innerHTML='';
  Object.entries(inv).forEach(([name,info])=>{
    if(!info.buy)return;
    const g=GOODS.find(x=>x.name===name)||{icon:'📦'};
    const avail=info.qty>0;
    const div=document.createElement('div');
    div.className='trade-item-row'+((!avail)||p.credits<info.buy||p.cargoCount>=cmax?' tir-na':'')+
      (_tradeSelected?.name===name&&_tradeSelected?.mode==='buy'?' trow-selected':'');
    div.innerHTML=`<span class="tir-icon">${g.icon}</span><span class="tir-name">${name}</span>`+
      `<span class="tir-price">${info.buy} Cr</span><span class="tir-qty">${info.qty}×</span>`;
    if(avail)div.onclick=()=>_selectTradeItem(name,info,'buy');
    bl.appendChild(div);
  });
  if(!bl.children.length)bl.innerHTML='<div class="trade-empty">Stanice nemá zboží</div>';

  // Sell list (player cargo)
  const sl=document.getElementById('trade-sell-list');sl.innerHTML='';
  Object.entries(p.cargo).forEach(([name,qty])=>{
    if(!qty)return;
    const info=inv[name];
    if(!info?.sell)return;
    const g=GOODS.find(x=>x.name===name)||{icon:'📦'};
    const div=document.createElement('div');
    div.className='trade-item-row'+(_tradeSelected?.name===name&&_tradeSelected?.mode==='sell'?' trow-selected':'');
    div.innerHTML=`<span class="tir-icon">${g.icon}</span><span class="tir-name">${name}</span>`+
      `<span class="tir-price sell">${info.sell} Cr</span><span class="tir-qty">${qty}×</span>`;
    div.onclick=()=>_selectTradeItem(name,info,'sell');
    sl.appendChild(div);
  });
  if(!sl.children.length)sl.innerHTML='<div class="trade-empty">Náklad prázdný</div>';

  _updateTradeDetail();
}

function _selectTradeItem(name,info,mode){
  _tradeSelected={name,info,mode};
  _tradeQty=1;
  _updateTradeDetail();
  _renderTradeOverlay(); // refresh selection highlight
}

function _updateTradeDetail(){
  const content=document.getElementById('trade-detail-content');
  const empty=document.getElementById('trade-detail-empty');
  if(!_tradeSelected){content.style.display='none';empty.style.display='';return;}
  content.style.display='flex';empty.style.display='none';

  const {name,info,mode}=_tradeSelected;
  const p=_tradePlayer;
  const g=GOODS.find(x=>x.name===name)||{icon:'📦',desc:''};
  const cmax=getCargoMax(p);

  document.getElementById('trade-icon').textContent=g.icon;
  document.getElementById('trade-detail-name').textContent=name.toUpperCase();
  document.getElementById('trade-detail-desc').textContent=g.desc||'';

  const buyCell=document.getElementById('tdp-buy');
  const sellCell=document.getElementById('tdp-sell');
  document.getElementById('tdp-buy-val').textContent=info.buy?info.buy+' Cr':'—';
  document.getElementById('tdp-sell-val').textContent=info.sell?info.sell+' Cr':'—';
  buyCell.classList.toggle('tpc-inactive',!info.buy);
  sellCell.classList.toggle('tpc-inactive',!info.sell);

  // Clamp qty
  const maxQty=mode==='buy'
    ?Math.max(0,Math.min(info.qty,cmax-p.cargoCount,Math.floor(p.credits/(info.buy||1))))
    :(p.cargo[name]||0);
  _tradeQty=clamp(_tradeQty,1,Math.max(1,maxQty));
  document.getElementById('tq-num').textContent=_tradeQty;

  const btn=document.getElementById('trade-action-btn');
  if(mode==='buy'){
    const cost=_tradeQty*(info.buy||0);
    const canBuy=info.buy&&info.qty>=_tradeQty&&p.cargoCount+_tradeQty<=cmax&&p.credits>=cost;
    btn.disabled=!canBuy;
    btn.className='buy-btn';
    btn.textContent=`KOUPIT ${_tradeQty}× — ${cost.toLocaleString('cs')} Cr`;
    document.getElementById('trade-stock-info').textContent=
      `Na skladě: ${info.qty}×  |  V nákladu: ${p.cargoCount}/${cmax}  |  Kredity: ${p.credits.toLocaleString('cs')} Cr`;
  } else {
    const earn=_tradeQty*(info.sell||0);
    const have=p.cargo[name]||0;
    btn.disabled=!info.sell||have<_tradeQty;
    btn.className='sell-btn';
    btn.textContent=`PRODAT ${_tradeQty}× — +${earn.toLocaleString('cs')} Cr`;
    document.getElementById('trade-stock-info').textContent=
      `Máš: ${have}×  |  Cena/ks: ${info.sell} Cr  |  Celkem: +${earn.toLocaleString('cs')} Cr`;
  }
  btn.onclick=_executeTrade;
}

function _executeTrade(){
  if(!_tradeSelected||!_tradePlayer||!_tradeStation)return;
  const {name,info,mode}=_tradeSelected;
  const p=_tradePlayer;
  const cmax=getCargoMax(p);
  if(mode==='buy'){
    const cost=_tradeQty*(info.buy||0);
    if(!info.buy||info.qty<_tradeQty||p.cargoCount+_tradeQty>cmax||p.credits<cost)return;
    p.credits-=cost;info.qty-=_tradeQty;
    p.cargo[name]=(p.cargo[name]||0)+_tradeQty;p.cargoCount+=_tradeQty;
    setMsg(`Zakoupeno: ${_tradeQty}× ${name} za ${cost.toLocaleString('cs')} Cr`,2000);
  } else {
    const earn=_tradeQty*(info.sell||0);
    const have=p.cargo[name]||0;
    if(!info.sell||have<_tradeQty)return;
    p.credits+=earn;p.cargoCount-=_tradeQty;
    p.cargo[name]-=_tradeQty;
    if(!p.cargo[name])delete p.cargo[name];
    if(window.gameState)window.gameState.totalEarned=(window.gameState.totalEarned||0)+earn;
    setMsg(`Prodáno: ${_tradeQty}× ${name} za ${earn.toLocaleString('cs')} Cr`,2000);
    if(_tradeSelected.mode==='sell'&&!(p.cargo[name])){_tradeSelected=null;_tradeQty=1;}
  }
  _tradeQty=1;
  _renderTradeOverlay();
}

function setTradeMaxQty(){
  if(!_tradeSelected||!_tradePlayer)return;
  const {name,info,mode}=_tradeSelected;
  const p=_tradePlayer;const cmax=getCargoMax(p);
  if(mode==='buy'){
    _tradeQty=Math.max(1,Math.min(info.qty||0,cmax-p.cargoCount,Math.floor(p.credits/(info.buy||1))));
  } else {
    _tradeQty=Math.max(1,p.cargo[name]||1);
  }
  _updateTradeDetail();
}

// Legacy renderTradePanel (kept for compatibility — dock panel no longer uses inline trade)
function renderTradePanel(player,station){}


function applyUpgrades(p){
  const ship=getShipDef(p.shipType||'viper');
  p.fuelMax=C.FUEL_MAX*(1+0.25*(p.upgrades.fuel||0));
  p.fuelReserveMax=p.fuelMax*0.1;
  p.shieldMax=Math.round(100*ship.shieldMult+30*(p.upgrades.shield||0));
  p.hullMax=Math.round(100*ship.hullMult+25*(p.upgrades.hull||0));
  // Klamp na aktuální hodnoty
  p.hull=Math.min(p.hull||p.hullMax,p.hullMax);
  p.shield=Math.min(p.shield||p.shieldMax,p.shieldMax);
}
function getCargoMax(p){
  const ship=getShipDef(p.shipType||'viper');
  return ship.cargoBase+5*(p.upgrades.cargo||0);
}

// ===== GALAXY MAP =====
let _mapHoverX=-999,_mapHoverY=-999;
let galaxyCanvas,galaxyCtx,selectedGalaxyId=null,_galaxyAnimId=null;

function initGalaxyCanvas(){
  galaxyCanvas=document.getElementById('galaxy-canvas');
  if(!galaxyCanvas)return;
  galaxyCtx=galaxyCanvas.getContext('2d');
  galaxyCanvas.addEventListener('click',handleGalaxyClick);
}

function resizeGalaxyCanvas(){
  const hdr=document.getElementById('galaxy-header');
  const hdrH=hdr?hdr.offsetHeight||48:48;
  galaxyCanvas.width=Math.max(200,window.innerWidth-300);
  galaxyCanvas.height=Math.max(200,window.innerHeight-hdrH);
}

function startGalaxyAnim(){
  if(_galaxyAnimId)return;
  function frame(ts){drawGalaxyMap(ts/1000);_galaxyAnimId=requestAnimationFrame(frame);}
  _galaxyAnimId=requestAnimationFrame(frame);
}

function stopGalaxyAnim(){
  if(_galaxyAnimId){cancelAnimationFrame(_galaxyAnimId);_galaxyAnimId=null;}
}

function drawGalaxyMap(t){
  if(!galaxyCanvas||!galaxyCtx)return;
  const GW=galaxyCanvas.width,GH=galaxyCanvas.height;
  const gcx=GW/2,gcy=GH/2;
  const g2=galaxyCtx;

  g2.clearRect(0,0,GW,GH);
  g2.fillStyle=window.lightMode?'#d0deff':'#00000e';g2.fillRect(0,0,GW,GH);

  // Vzdálené pozadí galaxií (dekorativní)
  const bgRng=makeRng(77331);
  for(let i=0;i<80;i++){
    const bx=bgRng()*GW,by=bgRng()*GH;
    const br=15+bgRng()*70,ba=(bgRng()*0.06+0.01)*(window.lightMode?0.4:1);
    const bAngle=bgRng()*Math.PI;
    const bCols=['rgba(255,200,100,','rgba(150,180,255,','rgba(180,255,200,','rgba(255,160,180,'];
    const bcol=bCols[Math.floor(bgRng()*bCols.length)];
    g2.save();
    const bgr=g2.createRadialGradient(bx,by,0,bx,by,br);
    bgr.addColorStop(0,bcol+ba+')');bgr.addColorStop(1,'transparent');
    g2.fillStyle=bgr;
    g2.beginPath();g2.ellipse(bx,by,br,br*0.38,bAngle,0,Math.PI*2);g2.fill();
    g2.restore();
  }

  // Hvězdy pozadí
  const stRng=makeRng(12345);
  for(let i=0;i<300;i++){
    const sx=stRng()*GW,sy=stRng()*GH;
    const sa=stRng()*0.4+0.05+Math.sin(t*stRng()*2+i)*0.05;
    g2.globalAlpha=sa;g2.fillStyle=window.lightMode?'#000000':'#e8eeff';
    g2.beginPath();g2.arc(sx,sy,stRng()*0.8+0.1,0,Math.PI*2);g2.fill();
  }
  g2.globalAlpha=1;

  const currentGid=window.currentGalaxy||'sol';

  // Slabé spojovací čáry mezi galaxiemi
  g2.save();
  g2.strokeStyle=window.lightMode?'rgba(0,40,180,0.08)':'rgba(255,149,0,0.04)';g2.lineWidth=1;g2.setLineDash([4,12]);
  GALAXIES.forEach(ga=>{
    GALAXIES.forEach(gb=>{
      if(ga.id>=gb.id)return;
      const ax=gcx+ga.mapX,ay=gcy+ga.mapY;
      const bx2=gcx+gb.mapX,by2=gcy+gb.mapY;
      g2.beginPath();g2.moveTo(ax,ay);g2.lineTo(bx2,by2);g2.stroke();
    });
  });
  g2.setLineDash([]);g2.restore();

  // Kreslení každé galaxie
  GALAXIES.forEach(ga=>{
    const gx=gcx+ga.mapX,gy=gcy+ga.mapY;
    const isCurrent=currentGid===ga.id;
    const isSelected=selectedGalaxyId===ga.id;
    const baseR=isCurrent?88:isSelected?78:62;
    const pulse=0.85+Math.sin(t*1.5+ga.mapX*0.008)*0.15;

    g2.save();
    g2.translate(gx,gy);
    g2.rotate(t*0.06+ga.mapX*0.002);

    // Vnější záře
    const gr1=g2.createRadialGradient(0,0,0,0,0,baseR*2.8);
    gr1.addColorStop(0,ga.glow+'0.10)');gr1.addColorStop(1,'transparent');
    g2.fillStyle=gr1;g2.beginPath();g2.ellipse(0,0,baseR*2.8,baseR*1.2,0,0,Math.PI*2);g2.fill();

    // Střed
    const gr2=g2.createRadialGradient(0,0,0,0,0,baseR);
    gr2.addColorStop(0,ga.glow+'0.95)');
    gr2.addColorStop(0.25,ga.glow+'0.55)');
    gr2.addColorStop(0.65,ga.glow+'0.18)');
    gr2.addColorStop(1,'transparent');
    g2.fillStyle=gr2;g2.globalAlpha=pulse;
    g2.beginPath();g2.ellipse(0,0,baseR,baseR*0.48,0,0,Math.PI*2);g2.fill();
    g2.globalAlpha=1;

    // Spirální ramena (3 elipsy otočené)
    [0,Math.PI*0.6,Math.PI*1.2].forEach(offset=>{
      const ar=g2.createRadialGradient(0,0,0,0,0,baseR*0.9);
      ar.addColorStop(0,'transparent');ar.addColorStop(0.4,ga.glow+'0.12)');ar.addColorStop(1,'transparent');
      g2.fillStyle=ar;g2.globalAlpha=0.5;
      g2.beginPath();g2.ellipse(0,0,baseR*0.9,baseR*0.22,offset,0,Math.PI*2);g2.fill();
      g2.globalAlpha=1;
    });

    g2.restore();

    // Rámečky (mimo rotaci)
    if(isCurrent){
      const ra=0.5+Math.sin(t*2)*0.25;
      g2.save();g2.strokeStyle=`rgba(255,149,0,${ra})`;g2.lineWidth=2;
      g2.shadowColor='rgba(255,149,0,0.7)';g2.shadowBlur=12;
      g2.beginPath();g2.arc(gx,gy,baseR+14,0,Math.PI*2);g2.stroke();
      g2.restore();
    }
    if(isSelected&&!isCurrent){
      const ra=0.6+Math.sin(t*3)*0.4;
      g2.save();g2.strokeStyle=`rgba(0,255,136,${ra})`;g2.lineWidth=2;
      g2.shadowColor='rgba(0,255,136,0.8)';g2.shadowBlur=16;
      g2.setLineDash([8,5]);
      g2.beginPath();g2.arc(gx,gy,baseR+22,0,Math.PI*2);g2.stroke();
      g2.setLineDash([]);g2.restore();
    }

    // Název galaxie
    g2.save();
    g2.textAlign='center';
    g2.font=`bold ${isCurrent||isSelected?13:11}px "Courier New", monospace`;
    g2.fillStyle=isCurrent?'#ff9500':isSelected?'#00ff88':ga.color;
    g2.shadowColor=isCurrent?'rgba(255,149,0,0.6)':isSelected?'rgba(0,255,136,0.5)':ga.glow+'0.4)';
    g2.shadowBlur=8;
    g2.fillText(ga.name,gx,gy+baseR*1.15+18);
    if(isCurrent){
      g2.font='10px "Courier New", monospace';
      g2.fillStyle='rgba(255,149,0,0.55)';
      g2.fillText('⊙ AKTUÁLNÍ POLOHA',gx,gy+baseR*1.15+33);
    }
    g2.restore();
  });

  // Legenda
  g2.textAlign='left';g2.font='9px "Courier New", monospace';
  g2.fillStyle='rgba(255,149,0,0.3)';
  g2.fillText('[ KLIKNI NA GALAXII PRO DETAILY ]',8,GH-8);
}

function handleGalaxyClick(e){
  const rect=galaxyCanvas.getBoundingClientRect();
  const mx=e.clientX-rect.left,my=e.clientY-rect.top;
  const GW=galaxyCanvas.width,GH=galaxyCanvas.height;
  let hit=null;
  GALAXIES.forEach(ga=>{
    const gx=GW/2+ga.mapX,gy=GH/2+ga.mapY;
    if(Math.hypot(mx-gx,my-gy)<90)hit=ga;
  });
  if(!hit)return;
  selectedGalaxyId=hit.id;
  updateGalaxyInfoPanel(hit);
}

function updateGalaxyInfoPanel(ga){
  const isCurrent=(window.currentGalaxy||'sol')===ga.id;
  document.getElementById('galaxy-info-name').textContent=ga.name;
  document.getElementById('galaxy-info-desc').textContent=ga.desc;

  let html='';
  if(!isCurrent){
    const p=window.gameState?.player;
    const fuelPct=p?Math.floor(p.fuel/p.fuelMax*100):0;
    const hullPct=p?Math.floor(p.hull/p.hullMax*100):0;
    const fuelOK=fuelPct>=ga.fuelCost;
    const hullOK=hullPct>=ga.intReq;
    html+=`<div class="gstat-row"><span class="gstat-label">Vzdálenost</span><span class="gstat-val">${ga.lightYears} ly</span></div>`;
    html+=`<div class="gstat-row"><span class="gstat-label">Palivo</span><span class="gstat-val" style="color:${fuelOK?'var(--orange)':'#ff4444'}">${ga.fuelCost}% nádrže (máš ${fuelPct}%)</span></div>`;
    html+=`<div class="gstat-row"><span class="gstat-label">Min. trup</span><span class="gstat-val" style="color:${hullOK?'var(--orange)':'#ff4444'}">${ga.intReq}% (máš ${hullPct}%)</span></div>`;
    html+=`<div class="gstat-row"><span class="gstat-label">Warp čas</span><span class="gstat-val">${ga.warpSecs} s</span></div>`;
  } else {
    html='<div class="gstat-row"><span class="gstat-label">Status</span><span class="gstat-val">⊙ Aktuální poloha</span></div>';
  }
  document.getElementById('galaxy-info-stats').innerHTML=html;

  const btn=document.getElementById('btn-set-warp');
  btn.disabled=isCurrent;
  btn.onclick=isCurrent?null:()=>{
    window.warpTarget=ga;
    if(typeof closeGalaxyMap==='function')closeGalaxyMap();
    setMsg(`Kurz nastaven: ${ga.name}. Stiskni [R] pro spuštění warpových motorů.`,6000);
  };
}

// ================================================================
//  SHIP SHOP
// ================================================================
let _ssSelectedShip=null;

function openShipShop(){
  const ov=document.getElementById('ship-shop-overlay');
  if(!ov||!window.gameState)return;
  const p=window.gameState.player;
  document.getElementById('ss-dealer-name').textContent=window.gameState.dockStation?.name||'Loděnice';
  document.getElementById('ss-credits-hdr').textContent=p.credits.toLocaleString('cs')+' Cr';
  _ssSelectedShip=null;
  _renderShipShopList(p);
  _updateShipShopDetail(p);
  ov.style.display='flex';
}

function closeShipShop(){
  const ov=document.getElementById('ship-shop-overlay');
  if(ov)ov.style.display='none';
}

function _renderShipShopList(p){
  const list=document.getElementById('ss-ship-list');
  list.innerHTML='';
  SHIPS.forEach(ship=>{
    const active=p.shipType===ship.id;
    const canAfford=ship.cost===0||p.credits>=ship.cost;
    const div=document.createElement('div');
    div.className='ss-ship-row'+(_ssSelectedShip?.id===ship.id?' ss-selected':'')+(active?' ss-owned':'');
    div.innerHTML=`<span class="ss-icon">${ship.icon}</span>
      <div class="ss-row-info">
        <div class="ss-row-name">${ship.name}</div>
        <div class="ss-row-price">${ship.cost===0?'ZÁKLADNÍ':ship.cost.toLocaleString('cs')+' Cr'}</div>
      </div>
      <span class="ss-row-tag">${active?'✓ AKT.':canAfford?'':'💸'}</span>`;
    div.onclick=()=>{_ssSelectedShip=ship;_renderShipShopList(p);_updateShipShopDetail(p);};
    list.appendChild(div);
  });
}

function _updateShipShopDetail(p){
  const empty=document.getElementById('ss-detail-empty');
  const content=document.getElementById('ss-detail-content');
  if(!_ssSelectedShip){empty.style.display='';content.style.display='none';return;}
  empty.style.display='none';content.style.display='flex';
  const ship=_ssSelectedShip;
  document.getElementById('ss-ship-name').textContent=ship.name.toUpperCase();
  document.getElementById('ss-price').textContent=ship.cost===0?'ZÁKLADNÍ LOĎ':ship.cost.toLocaleString('cs')+' Cr';
  const stats=document.getElementById('ss-ship-stats');
  const bp=(v,max)=>Math.min(100,Math.round(v/max*100));
  stats.innerHTML=`
    <div class="ss-stat-row"><span class="ss-stat-label">TRUP</span><div class="ss-stat-bar"><div class="ss-stat-fill hull" style="width:${bp(ship.hullMult,2.5)}%"></div></div><span class="ss-stat-val">${ship.hullMult}×</span></div>
    <div class="ss-stat-row"><span class="ss-stat-label">ŠTÍT</span><div class="ss-stat-bar"><div class="ss-stat-fill shield" style="width:${bp(ship.shieldMult,2.5)}%"></div></div><span class="ss-stat-val">${ship.shieldMult}×</span></div>
    <div class="ss-stat-row"><span class="ss-stat-label">RYCHLOST</span><div class="ss-stat-bar"><div class="ss-stat-fill speed" style="width:${bp(ship.speedMult,2)}%"></div></div><span class="ss-stat-val">${ship.speedMult}×</span></div>
    <div class="ss-stat-row"><span class="ss-stat-label">NÁKLAD</span><div class="ss-stat-bar"><div class="ss-stat-fill cargo" style="width:${bp(ship.cargoBase,100)}%"></div></div><span class="ss-stat-val">${ship.cargoBase}t</span></div>`;
  const active=p.shipType===ship.id;
  const btn=document.getElementById('ss-buy-btn');
  const hint=document.getElementById('ss-buy-hint');
  if(active){
    btn.disabled=true;btn.textContent='✓ AKTUÁLNÍ LOĎ';hint.textContent='Tuto loď právě pilotujete.';
  } else if(ship.cost>0&&p.credits<ship.cost){
    btn.disabled=true;btn.textContent='NEDOSTATEK KREDITŮ';hint.textContent=`Chybí ${(ship.cost-p.credits).toLocaleString('cs')} Cr.`;
  } else {
    btn.disabled=false;
    btn.textContent=ship.cost===0?'PŘESEDNOUT DO VIPER MK.I →':`KOUPIT ${ship.name} →`;
    hint.textContent=ship.cost>0?`Zbyde: ${(p.credits-ship.cost).toLocaleString('cs')} Cr.`:'Základní loď — zdarma.';
  }
  btn.onclick=()=>{
    if(typeof buyShip==='function')buyShip(ship,p.shipColor,p.thrusterColor,null);
    document.getElementById('ss-credits-hdr').textContent=p.credits.toLocaleString('cs')+' Cr';
    _renderShipShopList(p);_updateShipShopDetail(p);
  };
  _drawShipPreview('ss-ship-canvas',ship,p.shipColor||ship.color,p.thrusterColor||ship.thruster);
}

function _drawShipPreview(canvasId,shipDef,hullColor,thrusterColor){
  const canvas=document.getElementById(canvasId);
  if(!canvas||typeof drawGameShuttle!=='function')return;
  const c2=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  c2.clearRect(0,0,W,H);
  c2.fillStyle=window.lightMode?'rgba(200,210,240,0.4)':'rgba(0,0,20,0.7)';
  c2.fillRect(0,0,W,H);
  const rng2=makeRng((shipDef.id.charCodeAt(0)||1)*17+31);
  for(let i=0;i<25;i++){
    c2.fillStyle=`rgba(200,220,255,${0.08+rng2()*0.15})`;
    c2.beginPath();c2.arc(rng2()*W,rng2()*H,rng2()*1.2+0.3,0,Math.PI*2);c2.fill();
  }
  c2.save();
  c2.translate(W/2,H/2);
  c2.scale((shipDef.scale||1)*3.2,(shipDef.scale||1)*3.2);
  const _savedCtx=ctx;ctx=c2;
  drawGameShuttle(hullColor||shipDef.color,shipDef.id);
  ctx=_savedCtx;
  c2.restore();
}

// ================================================================
//  TUNING STUDIO
// ================================================================
const HULL_COLORS=['#99bbff','#ff8844','#00ee88','#ffdd00','#ff4466','#aa88ff',
  '#ffffff','#ff6600','#44ccff','#00ff44','#cccccc','#ff2200','#0066ff','#ffaa44'];
const THRUST_COLORS=['#ff7700','#00ddff','#ff44aa','#44ff88','#ffffff','#ffff00',
  '#ff0000','#0088ff','#ff88ff','#00ffff','#ff4400','#44ff00','#8800ff','#ff8800'];

let _tunHullColor='#99bbff';
let _tunThrustColor='#ff7700';
let _tunAnimId=null;

function openTuningMenu(){
  const ov=document.getElementById('tuning-overlay');
  if(!ov||!window.gameState)return;
  const p=window.gameState.player;
  const shipDef=getShipDef(p.shipType||'viper');
  _tunHullColor=p.shipColor||shipDef.color||'#99bbff';
  _tunThrustColor=p.thrusterColor||shipDef.thruster||'#ff7700';
  document.getElementById('tun-ship-type').textContent=shipDef.name.toUpperCase();
  const nameInput=document.getElementById('tun-name-input');
  nameInput.value=p.shipCustomName||'';
  nameInput.oninput=()=>_tunRefreshPreview();
  _buildSwatches('tun-hull-colors',HULL_COLORS,'hull');
  _buildSwatches('tun-thrust-colors',THRUST_COLORS,'thrust');
  document.getElementById('btn-tun-apply').onclick=()=>{
    p.shipColor=_tunHullColor;p.thrusterColor=_tunThrustColor;
    p.shipCustomName=document.getElementById('tun-name-input').value.trim()||null;
    if(typeof saveGame==='function')saveGame();
    setMsg('Tuning uložen!',2000);
    closeTuningMenu();
  };
  _tunRefreshPreview();
  ov.style.display='flex';
}

function closeTuningMenu(){
  const ov=document.getElementById('tuning-overlay');
  if(ov)ov.style.display='none';
  if(_tunAnimId){cancelAnimationFrame(_tunAnimId);_tunAnimId=null;}
}

function _buildSwatches(containerId,colors,type){
  const cont=document.getElementById(containerId);
  cont.innerHTML='';
  const current=type==='hull'?_tunHullColor:_tunThrustColor;
  colors.forEach(col=>{
    const div=document.createElement('div');
    div.className='tun-swatch'+(col===current?' selected':'');
    div.style.background=col;
    div.title=col;
    div.onclick=()=>{
      if(type==='hull')_tunHullColor=col;
      else _tunThrustColor=col;
      _buildSwatches(containerId,colors,type);
      _tunRefreshPreview();
    };
    cont.appendChild(div);
  });
}

function _tunRefreshPreview(){
  const canvas=document.getElementById('tun-canvas');
  if(!canvas||typeof drawGameShuttle!=='function')return;
  const c2=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  c2.clearRect(0,0,W,H);
  c2.fillStyle=window.lightMode?'rgba(210,200,235,0.6)':'rgba(0,0,20,0.7)';
  c2.fillRect(0,0,W,H);
  const rng2=makeRng(4219);
  for(let i=0;i<35;i++){
    c2.fillStyle=`rgba(200,220,255,${0.07+rng2()*0.12})`;
    c2.beginPath();c2.arc(rng2()*W,rng2()*H,rng2()*1.5+0.3,0,Math.PI*2);c2.fill();
  }
  c2.save();
  c2.translate(W/2,H/2);
  const shipDef=getShipDef(window.gameState?.player?.shipType||'viper');
  c2.scale((shipDef.scale||1)*4,(shipDef.scale||1)*4);
  const _savedCtx=ctx;ctx=c2;
  drawGameShuttle(_tunHullColor,window.gameState?.player?.shipType||'viper');
  ctx=_savedCtx;
  c2.restore();
  const customName=document.getElementById('tun-name-input')?.value.trim();
  document.getElementById('tun-preview-name').textContent=customName||shipDef.name;
}

// ================================================================
//  GARAGE MENU (for docked garage)
// ================================================================
let _gmGarageKey=null;

function openGarageMenu(){
  const ov=document.getElementById('garage-menu-overlay');
  if(!ov||!window.gameState)return;
  const p=window.gameState.player;
  const st=window.gameState.dockStation;
  if(!st||st.type!=='garage')return;
  _gmGarageKey=garageKey(st.garageGalaxy,st.garageCx,st.garageCy);
  document.getElementById('gm-garage-name').textContent=st.name;
  _renderGarageMenuContent(p);
  ov.style.display='flex';
}

function closeGarageMenu(){
  const ov=document.getElementById('garage-menu-overlay');
  if(ov)ov.style.display='none';
}

function _renderGarageMenuContent(p){
  if(!_gmGarageKey)return;
  const ships=getGarageShips(p,_gmGarageKey);
  const cap=getGarageCapacity(p,_gmGarageKey);
  const capVal=document.getElementById('gm-cap-val');
  if(capVal)capVal.textContent=`${ships.length}/${cap}`;
  const upgBtn=document.getElementById('btn-gm-upgrade');
  if(upgBtn){
    const upgCost=200000+(cap-3)*150000;
    const canUpg=cap<6&&p.credits>=upgCost;
    upgBtn.textContent=cap>=6?'MAX KAPACITA':`⬆ ROZŠÍŘIT (+1 SLOT) — ${upgCost.toLocaleString('cs')} Cr`;
    upgBtn.disabled=cap>=6;
    upgBtn.onclick=()=>{
      if(typeof upgradeGarageCapacity==='function')upgradeGarageCapacity(_gmGarageKey);
      _renderGarageMenuContent(p);
    };
  }
  const parkBtn=document.getElementById('btn-gm-park');
  if(parkBtn){
    const full=ships.length>=cap;
    parkBtn.disabled=full;
    parkBtn.title=full?'Hangár je plný':'Zaparkovat aktivní loď';
    parkBtn.onclick=()=>{
      if(ships.length>=cap){setMsg('Hangár je plný!',2500);return;}
      p.fleet=p.fleet||[];
      p.fleet.push({shipType:p.shipType,shipColor:p.shipColor||'#aaccff',thrusterColor:p.thrusterColor||'#ff7700',shipCustomName:p.shipCustomName||null,garageKey:_gmGarageKey,earns:p.shipEarns||0,boughtAt:Date.now()});
      p.shipType='viper';p.shipColor=getShipDef('viper').color;p.thrusterColor=getShipDef('viper').thruster;p.shipCustomName=null;p.shipEarns=0;
      applyUpgrades(p);
      if(typeof saveGame==='function')saveGame();
      setMsg('Loď zaparkována. Pilotujete Viper Mk.I.',3000);
      _renderGarageMenuContent(p);
    };
  }
  const grid=document.getElementById('gm-ships-grid');
  grid.innerHTML='';
  // Active ship card
  {
    const shipDef=getShipDef(p.shipType||'viper');
    const card=document.createElement('div');
    card.className='gm-ship-card gm-active';
    card.innerHTML=`<div class="gmc-name">${p.shipCustomName||shipDef.name}</div>
      <div class="gmc-type">${shipDef.icon} ${shipDef.name} — AKTIVNÍ LOĎ</div>
      <div class="gmc-color-strip" style="background:${p.shipColor||shipDef.color}"></div>
      <div class="gmc-earn">Vydělala: ${(p.shipEarns||0).toLocaleString('cs')} Cr</div>
      <button class="gmc-btn" onclick="openTuningMenu()">🎨 TUNING →</button>`;
    grid.appendChild(card);
  }
  // Fleet ships in this garage
  ships.forEach((fs,i)=>{
    const fleetIdx=(p.fleet||[]).findIndex(s=>s===fs);
    const shipDef=getShipDef(fs.shipType||'viper');
    const card=document.createElement('div');
    card.className='gm-ship-card';
    card.innerHTML=`<div class="gmc-name">${fs.shipCustomName||shipDef.name}</div>
      <div class="gmc-type">${shipDef.icon} ${shipDef.name}</div>
      <div class="gmc-color-strip" style="background:${fs.shipColor||shipDef.color}"></div>
      <div class="gmc-earn">Vydělala: ${(fs.earns||0).toLocaleString('cs')} Cr</div>
      <button class="gmc-btn gmc-activate" data-idx="${fleetIdx}">⚡ AKTIVOVAT →</button>`;
    card.querySelector('.gmc-activate').onclick=()=>{
      if(typeof activateShipFromFleet==='function')activateShipFromFleet(fleetIdx);
      _renderGarageMenuContent(window.gameState.player);
      setMsg(`Loď aktivována!`,2500);
    };
    grid.appendChild(card);
  });
  // Empty slots
  for(let i=ships.length+1;i<cap;i++){
    const slot=document.createElement('div');
    slot.className='gmc-empty-slot';
    slot.textContent='[ PRÁZDNÝ SLOT ]';
    grid.appendChild(slot);
  }
}

// ================================================================
//  FLEET MANAGER (pause menu)
// ================================================================
function openFleetManager(){
  const ov=document.getElementById('fleet-manager-overlay');
  if(!ov||!window.gameState)return;
  const p=window.gameState.player;
  _renderFleetManager(p);
  ov.style.display='flex';
}

function closeFleetManager(){
  const ov=document.getElementById('fleet-manager-overlay');
  if(ov)ov.style.display='none';
}

function _renderFleetManager(p){
  const fleet=p.fleet||[];
  const total=fleet.length+1; // +1 for active ship
  document.getElementById('fm-count').textContent=`${total} ${total===1?'loď':'lodi'}`;
  const grid=document.getElementById('fm-ships-grid');
  grid.innerHTML='';
  if(total===0){
    grid.innerHTML='<div class="fmc-no-ships">Žádné lodi — nakup loď v loděnici nebo garáži.</div>';
    return;
  }
  // Active ship
  const activeShip=getShipDef(p.shipType||'viper');
  const activeCard=_buildFleetCard(
    {shipType:p.shipType,shipColor:p.shipColor,thrusterColor:p.thrusterColor,shipCustomName:p.shipCustomName,earns:p.shipEarns||0,garageKey:null},
    activeShip,true,-1
  );
  grid.appendChild(activeCard);
  // Fleet ships
  fleet.forEach((fs,idx)=>{
    const shipDef=getShipDef(fs.shipType||'viper');
    const card=_buildFleetCard(fs,shipDef,false,idx);
    grid.appendChild(card);
  });
}

function _resolveGarageName(gKey){
  if(!gKey)return'—';
  const parts=gKey.split('_');
  const gid=parts[0];
  const cx2=parseInt(parts[1]),cy2=parseInt(parts[2]);
  const gDef=(typeof GARAGES_DATA!=='undefined'?GARAGES_DATA[gid]||[]:null||[]).find(g=>g.cx===cx2&&g.cy===cy2);
  const galDef=(typeof GALAXIES!=='undefined'?GALAXIES:null||[]).find(g=>g.id===gid);
  return (gDef?.name||gKey)+' ('+(galDef?.name||gid)+')';
}

function _buildFleetCard(fs,shipDef,isActive,fleetIdx){
  const card=document.createElement('div');
  card.className='fm-ship-card'+(isActive?' fm-active':'');
  const locLabel=isActive?'Aktivní loď':'Garáž: '+_resolveGarageName(fs.garageKey);
  card.innerHTML=`
    <div class="fmc-header">
      <span class="fmc-icon">${shipDef.icon}</span>
      <div class="fmc-title">
        <div class="fmc-name">${fs.shipCustomName||shipDef.name}</div>
        <div class="fmc-type">${shipDef.name}${isActive?'':''}</div>
      </div>
      ${isActive?'<span class="fmc-active-badge">● AKTIVNÍ</span>':''}
    </div>
    <div class="fmc-color-row">
      <div class="fmc-hull-sw" style="background:${fs.shipColor||shipDef.color}"></div>
      <div class="fmc-thrust-sw" style="background:${fs.thrusterColor||shipDef.thruster}"></div>
      <span class="fmc-color-label">TRUP / TRYSKA</span>
    </div>
    <div class="fmc-stats">
      <span class="fmc-stat">TRUP <span>${shipDef.hullMult}×</span></span>
      <span class="fmc-stat">ŠTÍT <span>${shipDef.shieldMult}×</span></span>
      <span class="fmc-stat">RYCHLOST <span>${shipDef.speedMult}×</span></span>
      <span class="fmc-stat">NÁKLAD <span>${shipDef.cargoBase}t</span></span>
    </div>
    <div class="fmc-earn">Vydělala: ${(fs.earns||0).toLocaleString('cs')} Cr</div>
    <div class="fmc-loc">${locLabel}</div>
    ${!isActive?'<button class="fmc-btn" data-idx="'+fleetIdx+'">⚡ AKTIVOVAT LOĎ →</button>':''}`;
  if(!isActive){
    card.querySelector('.fmc-btn').onclick=()=>{
      if(typeof activateShipFromFleet==='function')activateShipFromFleet(fleetIdx);
      _renderFleetManager(window.gameState.player);
    };
  }
  return card;
}

// ================================================================
//  GARAGE MANAGER (pause menu)
// ================================================================
function openGarageManager(){
  const ov=document.getElementById('garage-manager-overlay');
  if(!ov||!window.gameState)return;
  const p=window.gameState.player;
  _renderGarageManager(p);
  ov.style.display='flex';
}

function closeGarageManager(){
  const ov=document.getElementById('garage-manager-overlay');
  if(ov)ov.style.display='none';
}

function _renderGarageManager(p){
  const owned=p.ownedGarages||[];
  document.getElementById('gmgr-count').textContent=`${owned.length} ${owned.length===1?'garáž':owned.length<5?'garáže':'garází'}`;
  const list=document.getElementById('gmgr-list');
  list.innerHTML='';
  if(!owned.length){
    list.innerHTML='<div class="gmgr-no-garages">Žádné garáže — kup hangár v kteroukoli galaxii.</div>';
    return;
  }
  owned.forEach(gKey=>{
    const parts=gKey.split('_');
    const gid=parts[0];
    const cx2=parseInt(parts[1]),cy2=parseInt(parts[2]);
    const gDef=(GARAGES_DATA[gid]||[]).find(g=>g.cx===cx2&&g.cy===cy2);
    const galDef=GALAXIES?.find(g=>g.id===gid);
    const ships=getGarageShips(p,gKey);
    const cap=getGarageCapacity(p,gKey);
    const card=document.createElement('div');
    card.className='gmgr-card';
    const fillPct=cap>0?Math.round(ships.length/cap*100):0;
    let shipsHtml='';
    ships.forEach(fs=>{
      const sd=getShipDef(fs.shipType||'viper');
      shipsHtml+=`<div class="gmgr-ship-item"><div class="gmgr-ship-dot" style="background:${fs.shipColor||sd.color}"></div>${fs.shipCustomName||sd.name}</div>`;
    });
    for(let i=ships.length;i<cap;i++)shipsHtml+=`<div class="gmgr-empty-slot">— prázdný slot —</div>`;
    card.innerHTML=`
      <div class="gmgr-card-header">
        <span class="gmgr-icon">🏭</span>
        <span class="gmgr-name">${gDef?.name||gKey}</span>
        <span class="gmgr-gal-badge">${galDef?.name||gid.toUpperCase()}</span>
      </div>
      <div class="gmgr-cap-row">
        <span class="gmgr-cap-label">Kapacita</span>
        <div class="gmgr-cap-track"><div class="gmgr-cap-fill" style="width:${fillPct}%"></div></div>
        <span class="gmgr-cap-val">${ships.length}/${cap}</span>
      </div>
      <div class="gmgr-ship-list">${shipsHtml}</div>`;
    list.appendChild(card);
  });
}
