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
function initMapCanvas(){
  mapCanvas=document.getElementById('map-canvas');mapCtx=mapCanvas.getContext('2d');
  // Fullscreen canvas — celé okno minus header
  const hdr=document.getElementById('map-header');
  const hdrH=hdr?hdr.offsetHeight||48:48;
  mapCanvas.width=window.innerWidth;
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
  mapCanvas.addEventListener('mousemove',e=>{if(mapDragStart){mapPan.x=e.clientX-mapDragStart.x;mapPan.y=e.clientY-mapDragStart.y;drawBigMap();}});
  mapCanvas.addEventListener('mouseup',()=>{mapDragStart=null;mapCanvas.style.cursor='grab';});
  mapCanvas.addEventListener('mouseleave',()=>{mapDragStart=null;});
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

  // === LEGENDA — panel dole ===
  const legH=44,legY2=MH-legH;
  mapCtx.save();
  mapCtx.fillStyle='rgba(0,3,14,0.88)';mapCtx.fillRect(0,legY2,MW,legH);
  mapCtx.strokeStyle='rgba(255,149,0,0.2)';mapCtx.lineWidth=1;
  mapCtx.beginPath();mapCtx.moveTo(0,legY2);mapCtx.lineTo(MW,legY2);mapCtx.stroke();

  const legItems=[
    {icon:null,color:'#ffee88',  label:'☀ Hvězda / Slunce'},
    {icon:'hex',color:'#ff9500', label:'◆ Malá stanice (Transformer)'},
    {icon:'ring',color:'#00d4ff',label:'◎ Velká stanice (Coriolis)'},
    {icon:'ring',color:'#aa44ff',label:'◎ Coriolis — neobjeveno (55% průhlednost)'},
    {icon:null,color:'#ff9500',  label:'▶ Hráč'},
    {icon:null,color:'#00ff88',  label:'◈ Cílová navigace'},
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
    mapCtx.fillStyle='rgba(200,220,255,0.7)';mapCtx.textAlign='center';
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
    drawBigMap();
  }
}

// ---- Tab switching ----
function switchDockTab(tab){
  if(tab==='trade'){
    // Open full-screen trade overlay
    if(window.gameState?.dockStation)
      openTradeOverlay(window.gameState.player,window.gameState.dockStation);
    return;
  }
  document.querySelectorAll('.dtab').forEach(btn=>{
    const map={services:'SERVIS',trade:'OBCHOD',upgrades:'UPGRADY'};
    btn.classList.toggle('active',btn.textContent.trim()===map[tab]);
  });
  ['services','upgrades'].forEach(id=>{
    const el=document.getElementById('dtab-'+id);
    if(!el)return;
    el.style.display=id===tab?'block':'none';
  });
}

// ---- Dokovací panel ----
function renderDockPanel(player,station){
  const el=document.getElementById('dock-panel');if(!el)return;
  el.style.display='flex';
  // Reset na services tab
  switchDockTab('services');
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
  // Trade
  renderTradePanel(player,station);
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
  p.fuelMax=C.FUEL_MAX*(1+0.25*(p.upgrades.fuel||0));
  p.fuelReserveMax=p.fuelMax*0.1;
  p.shieldMax=100+30*(p.upgrades.shield||0);
  p.hullMax=100+25*(p.upgrades.hull||0);
}

// ===== GALAXY MAP =====
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
function getCargoMax(p){return 10+5*(p.upgrades.cargo||0);}
