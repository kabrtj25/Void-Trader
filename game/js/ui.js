// ===== SPACE TRADER — UI / HUD / Mapy =====

// ---- HUD ----
function renderHUD(player,nearStation,dockingState,t){
  const pad=16;

  // === Levý panel — systémy lodi ===
  const lx=pad,ly=pad,lw=200,lh=180;
  hudPanel(lx,ly,lw,lh);

  ctx.save();
  ctx.font='9px "Courier New", monospace';ctx.fillStyle='rgba(255,149,0,0.5)';ctx.textAlign='left';
  ctx.fillText('// SYSTÉMY LODI',lx+10,ly+14);

  // HP bar
  const hullPct=player.hull/player.hullMax;
  hudBar(lx+10,ly+26,lw-20,10,'HULL',hullPct,hullPct<0.3?'#ff2200':'#ff9500');

  // Štít bar
  const shldPct=player.shield/player.shieldMax;
  hudBar(lx+10,ly+50,lw-20,10,'ŠTÍT',shldPct,'#4080ff');

  // Palivo bar
  const fuelPct=player.fuel/player.fuelMax;
  hudBar(lx+10,ly+74,lw-20,10,'PALIVO',fuelPct,fuelPct<0.2?'#ff4400':'#ff9500');

  // Rychlost v km/s
  const spdRaw=Math.hypot(player.vx,player.vy);
  const spdKms=spdRaw*C.SPEED_KMS_FACTOR;
  const spdText=spdKms>=1000?Math.round(spdKms).toLocaleString('cs')+' km/s':spdKms.toFixed(1)+' km/s';
  ctx.font='10px "Courier New", monospace';ctx.fillStyle='rgba(255,149,0,0.7)';
  ctx.fillText('RYCHLOST',lx+10,ly+102);
  ctx.font='bold 16px "Courier New", monospace';ctx.fillStyle='#ffaa00';
  ctx.fillText(spdText,lx+10,ly+120);

  // Souřadnice
  ctx.font='9px "Courier New", monospace';ctx.fillStyle='rgba(255,149,0,0.5)';
  ctx.fillText(`${Math.round(player.x/100)}, ${Math.round(player.y/100)} AU`,lx+10,ly+140);

  // Level
  ctx.font='9px "Courier New", monospace';ctx.fillStyle='rgba(255,149,0,0.5)';
  ctx.fillText(`CMDR LVL ${player.level}`,lx+10,ly+158);
  // XP bar
  const xpPct=player.xp/xpNeeded(player.level);
  ctx.fillStyle='#1a0800';ctx.fillRect(lx+10,ly+162,lw-20,4);
  ctx.fillStyle='#ff9500';ctx.fillRect(lx+10,ly+162,(lw-20)*xpPct,4);

  ctx.restore();

  // === Pravý panel — kredity & náklad ===
  const rw=200,rh=140,rx=W-pad-rw,ry=pad;
  hudPanel(rx,ry,rw,rh);
  ctx.save();
  ctx.font='9px "Courier New", monospace';ctx.fillStyle='rgba(255,149,0,0.5)';ctx.textAlign='left';
  ctx.fillText('// EKONOMIKA',rx+10,ry+14);
  ctx.font='bold 22px "Courier New", monospace';ctx.fillStyle='#ffcc00';ctx.shadowColor='#ffcc00';ctx.shadowBlur=10;
  ctx.fillText(player.credits.toLocaleString('cs')+' Cr',rx+10,ry+42);
  ctx.shadowBlur=0;
  ctx.font='9px "Courier New", monospace';ctx.fillStyle='rgba(255,149,0,0.5)';
  const cmax=getCargoMax(player);
  ctx.fillText(`NÁKLAD: ${player.cargoCount}/${cmax}`,rx+10,ry+60);
  // Cargo bar
  ctx.fillStyle='#1a0800';ctx.fillRect(rx+10,ry+66,rw-20,6);
  ctx.fillStyle=player.cargoCount/cmax>0.85?'#ff4400':'#ff9500';
  ctx.fillRect(rx+10,ry+66,(rw-20)*player.cargoCount/cmax,6);
  // Náklad seznam
  ctx.font='9px "Courier New", monospace';ctx.fillStyle='rgba(255,149,0,0.7)';
  let cy2=ry+82;
  Object.entries(player.cargo).slice(0,4).forEach(([name,qty])=>{
    ctx.fillText(`${name} ×${qty}`,rx+10,cy2);cy2+=13;
  });
  ctx.restore();

  // === Dolní střed — zprávy ===
  if(window.msgText&&window.msgTimer>0){
    ctx.save();
    const alpha=Math.min(1,window.msgTimer/500);
    ctx.globalAlpha=alpha;
    ctx.textAlign='center';ctx.font='13px "Courier New", monospace';
    ctx.fillStyle='#ffcc00';ctx.shadowColor='#ffcc00';ctx.shadowBlur=12;
    ctx.fillText(window.msgText,W/2,H-90);
    ctx.restore();
  }

  // Boost indikátor
  if(player.boosting&&player.fuel>0){
    ctx.save();
    ctx.textAlign='center';ctx.font='bold 13px "Courier New", monospace';
    ctx.fillStyle='#00ccff';ctx.shadowColor='#00ccff';ctx.shadowBlur=15;
    ctx.fillText('⚡ BOOST AKTIVNÍ',W/2,H-110);
    ctx.restore();
  }

  // Parkovací režim indikátor
  if(window.parkingMode){
    ctx.save();
    const pa=0.75+Math.sin(t*3)*0.25;
    ctx.globalAlpha=pa;ctx.textAlign='center';ctx.font='bold 14px "Courier New", monospace';
    ctx.fillStyle='#ffcc00';ctx.shadowColor='#ffcc00';ctx.shadowBlur=18;
    ctx.fillText('⚓ PARKOVACÍ REŽIM',W/2,H-130);
    ctx.restore();
  }
  if(player.fuel<10){
    ctx.save();
    const fa=0.5+Math.sin(t*6)*0.5;
    ctx.globalAlpha=fa;ctx.textAlign='center';ctx.font='bold 13px "Courier New", monospace';
    ctx.fillStyle='#ff2200';ctx.shadowColor='#ff2200';ctx.shadowBlur=15;
    ctx.fillText('⚠ KRITICKÁ HLADINA PALIVA',W/2,H-130);
    ctx.restore();
  }
}

function hudPanel(x,y,w,h){
  ctx.save();
  ctx.fillStyle='rgba(0,4,14,0.82)';ctx.fillRect(x,y,w,h);
  ctx.strokeStyle='rgba(255,149,0,0.35)';ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);
  // Corner accents
  const cs=10;
  ctx.strokeStyle='rgba(255,149,0,0.7)';ctx.lineWidth=1.5;
  [[x,y],[x+w,y],[x,y+h],[x+w,y+h]].forEach(([cx,cy],i)=>{
    const sx=i%2===0?1:-1,sy=i<2?1:-1;
    ctx.beginPath();ctx.moveTo(cx+sx*cs,cy);ctx.lineTo(cx,cy);ctx.lineTo(cx,cy+sy*cs);ctx.stroke();
  });
  ctx.restore();
}

function hudBar(x,y,w,h,label,pct,color){
  ctx.font='8px "Courier New", monospace';ctx.fillStyle='rgba(255,149,0,0.5)';
  ctx.fillText(label,x,y-2);
  ctx.fillStyle='rgba(255,149,0,0.1)';ctx.fillRect(x,y,w,h);
  ctx.fillStyle=color;ctx.fillRect(x,y,w*clamp(pct,0,1),h);
  ctx.strokeStyle='rgba(255,149,0,0.2)';ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);
  ctx.fillStyle='rgba(255,255,255,0.7)';
  ctx.fillText(Math.round(pct*100)+'%',x+w+4,y+h-1);
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
    mmCtx.fillStyle=st.color;mmCtx.globalAlpha=0.5+pulse*0.3;
    mmCtx.beginPath();
    for(let i=0;i<6;i++){const a=i*Math.PI/3;mmCtx.lineTo(px+Math.cos(a)*4,py+Math.sin(a)*4);}
    mmCtx.closePath();mmCtx.fill();mmCtx.globalAlpha=1;
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
  mapCtx.fillStyle='#000408';mapCtx.fillRect(0,0,MW,MH);
  // Grid — hustota podle zoomu
  const gridSpacing=Math.max(8,Math.min(80,40*mapZoom));
  mapCtx.strokeStyle='rgba(255,149,0,0.05)';mapCtx.lineWidth=0.5;
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
      mapCtx.strokeStyle=isNav?'#00ff88':st.color;mapCtx.lineWidth=isNav?2:1;
      mapCtx.fillStyle='rgba(0,4,14,0.9)';
      const stR=5+st.tier*2;
      mapCtx.beginPath();
      for(let i=0;i<6;i++){const a=i*Math.PI/3;mapCtx.lineTo(spx+Math.cos(a)*stR,spy+Math.sin(a)*stR);}
      mapCtx.closePath();mapCtx.fill();mapCtx.stroke();
      mapCtx.fillStyle=isNav?'#00ff88':st.color;
      mapCtx.font=`${9+st.tier}px "Courier New", monospace`;mapCtx.textAlign='center';
      mapCtx.fillText(st.name,spx,spy-stR-5);
      // Klikací oblast — data-attr pro klik
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

  // Zoom label
  mapCtx.fillStyle='rgba(255,149,0,0.5)';mapCtx.font='9px "Courier New", monospace';mapCtx.textAlign='left';
  mapCtx.fillText(`ZOOM: ${mapZoom.toFixed(1)}×  |  ${Math.round(player.x/100)}, ${Math.round(player.y/100)} AU`,8,MH-8);
  // Legenda
  mapCtx.textAlign='right';
  mapCtx.fillText('● Hvězda  ◆ Stanice  ☀ Sol  [KLIK] = Nastavit navigaci',MW-8,MH-8);
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
  document.querySelectorAll('.dtab').forEach(btn=>{
    const map={services:'SERVIS',trade:'OBCHOD',upgrades:'UPGRADY'};
    btn.classList.toggle('active',btn.textContent.trim()===map[tab]);
  });
  ['services','trade','upgrades'].forEach(id=>{
    const el=document.getElementById('dtab-'+id);
    if(!el)return;
    if(id==='trade') el.style.display=id===tab?'flex':'none';
    else el.style.display=id===tab?'block':'none';
  });
  if(tab==='trade'&&window.gameState?.dockStation)
    renderTradePanel(window.gameState.player,window.gameState.dockStation);
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
  const fm=player.fuelMax-player.fuel,fc=Math.ceil(fm*C.FUEL_PRICE);
  document.getElementById('fuel-cost').textContent=fm<1?'Plná nádrž':`${fc} Cr`;
  document.getElementById('fuel-btn').disabled=fm<1||player.credits<fc;
  document.getElementById('fuel-btn').onclick=()=>{
    if(player.credits>=fc&&fm>=1){player.credits-=fc;player.fuel=player.fuelMax;renderDockPanel(player,station);setMsg('Palivo doplněno!',2000);}
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

function renderTradePanel(player,station){
  const inv=station.inv;
  const bl=document.getElementById('buy-list');bl.innerHTML='';
  const sl=document.getElementById('sell-list');sl.innerHTML='';
  Object.entries(inv).forEach(([name,info])=>{
    if(info.buy&&info.qty>0){
      const cmax=getCargoMax(player);
      const row=document.createElement('div');row.className='trade-row';
      row.innerHTML=`<span class="tname">${name}</span><span class="tprice">${info.buy} Cr</span><span class="tqty">${info.qty}×</span>`;
      const btn=document.createElement('button');btn.className='tbtn';btn.textContent='Koupit';
      btn.disabled=player.credits<info.buy||player.cargoCount>=cmax;
      btn.onclick=()=>{if(player.credits>=info.buy&&player.cargoCount<cmax){player.credits-=info.buy;info.qty--;player.cargo[name]=(player.cargo[name]||0)+1;player.cargoCount++;renderTradePanel(player,station);setMsg(`Zakoupeno: ${name}`,1500);}};
      row.appendChild(btn);bl.appendChild(row);
    }
    if(info.sell){
      const qty=player.cargo[name]||0;if(!qty)return;
      const row=document.createElement('div');row.className='trade-row';
      row.innerHTML=`<span class="tname">${name}</span><span class="tprice sell">${info.sell} Cr</span><span class="tqty">${qty}×</span>`;
      const btn=document.createElement('button');btn.className='tbtn sbtn';btn.textContent='Prodat';
      btn.onclick=()=>{player.credits+=info.sell;player.cargo[name]--;if(!player.cargo[name])delete player.cargo[name];player.cargoCount--;renderTradePanel(player,station);setMsg(`Prodáno: ${name} za ${info.sell} Cr`,1500);};
      row.appendChild(btn);sl.appendChild(row);
    }
  });
  if(!bl.children.length)bl.innerHTML='<div class="empty">Nic k prodeji</div>';
  if(!sl.children.length)sl.innerHTML='<div class="empty">Nic k prodeji ve skladu</div>';
}

function applyUpgrades(p){
  p.fuelMax=C.FUEL_MAX*(1+0.25*(p.upgrades.fuel||0));
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
  g2.fillStyle='#00000e';g2.fillRect(0,0,GW,GH);

  // Vzdálené pozadí galaxií (dekorativní)
  const bgRng=makeRng(77331);
  for(let i=0;i<80;i++){
    const bx=bgRng()*GW,by=bgRng()*GH;
    const br=15+bgRng()*70,ba=bgRng()*0.06+0.01;
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
    g2.globalAlpha=sa;g2.fillStyle='#e8eeff';
    g2.beginPath();g2.arc(sx,sy,stRng()*0.8+0.1,0,Math.PI*2);g2.fill();
  }
  g2.globalAlpha=1;

  const currentGid=window.currentGalaxy||'sol';

  // Slabé spojovací čáry mezi galaxiemi
  g2.save();
  g2.strokeStyle='rgba(255,149,0,0.04)';g2.lineWidth=1;g2.setLineDash([4,12]);
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
