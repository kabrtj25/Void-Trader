// --- Coordinate helpers ---
function toScreen(wx,wy){return{x:wx-camX+shakeX,y:wy-camY+shakeY};}

// --- Ship & entities ---
function drawShip(x,y,angle,scale,color,thrusting,boost,damaged){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle+Math.PI/2);ctx.scale(scale,scale);
  if(thrusting){
    const fl=boost?24:14,flicker=0.75+Math.random()*0.25;
    const g2=ctx.createLinearGradient(0,12,0,12+fl*flicker);
    g2.addColorStop(0,boost?'rgba(0,220,255,0.95)':'rgba(60,160,255,0.9)');
    g2.addColorStop(.4,boost?'rgba(255,120,0,0.6)':'rgba(40,100,255,0.4)');
    g2.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g2;ctx.beginPath();ctx.moveTo(-4,12);ctx.lineTo(4,12);ctx.lineTo(0,12+fl*flicker);ctx.fill();
  }
  ctx.fillStyle=damaged?'rgba(40,10,5,0.95)':'rgba(5,10,30,0.92)';
  ctx.strokeStyle=color;ctx.lineWidth=1.3;
  ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(9,9);ctx.lineTo(3,6);ctx.lineTo(-3,6);ctx.lineTo(-9,9);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='rgba(80,180,255,0.5)';ctx.beginPath();ctx.ellipse(0,-3.5,3,5,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function drawEnemy(e){
  const{x:sx,y:sy}=toScreen(e.x,e.y);
  if(sx<-80||sx>W+80||sy<-80||sy>H+80)return;
  ctx.save();ctx.translate(sx,sy);ctx.rotate(e.angle+Math.PI/2);
  if(e.type==='pirate'){
    ctx.strokeStyle='#e53';ctx.fillStyle='rgba(35,5,5,0.92)';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(9,8);ctx.lineTo(4,5);ctx.lineTo(-4,5);ctx.lineTo(-9,8);ctx.closePath();ctx.fill();ctx.stroke();
  } else {
    ctx.strokeStyle='#e35';ctx.fillStyle='rgba(30,0,20,0.9)';ctx.lineWidth=1;
    ctx.beginPath();for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4;ctx.lineTo(Math.cos(a)*e.sz*1.1,Math.sin(a)*e.sz*1.1);}ctx.closePath();ctx.fill();ctx.stroke();
  }
  ctx.restore();
  if(e.hp<e.maxHp){
    const bw=e.sz*2.8,bh=3;
    ctx.fillStyle='#050c1e';ctx.fillRect(sx-bw/2,sy-e.sz-12,bw,bh);
    ctx.fillStyle=e.hp/e.maxHp>0.5?'#3a8':'#f42';
    ctx.fillRect(sx-bw/2,sy-e.sz-12,bw*(e.hp/e.maxHp),bh);
  }
}

function drawAsteroid(a){
  const{x:sx,y:sy}=toScreen(a.x,a.y);
  if(sx<-a.sz*2||sx>W+a.sz*2||sy<-a.sz*2||sy>H+a.sz*2)return;
  ctx.save();ctx.translate(sx,sy);ctx.rotate(a.angle);
  ctx.fillStyle=a.color||'#333';
  ctx.strokeStyle=`hsl(30,12%,${35+Math.floor(a.hp/a.maxHp*10)}%)`;ctx.lineWidth=0.7;
  ctx.beginPath();a.verts.forEach((v,i)=>i===0?ctx.moveTo(v.x,v.y):ctx.lineTo(v.x,v.y));ctx.closePath();ctx.fill();ctx.stroke();
  ctx.restore();
}

function drawStation(s){
  const{x:sx,y:sy}=toScreen(s.x,s.y);
  const scale=0.9+s.tier*0.2;
  const cullR=(s.ring+120)*scale;
  if(sx<-cullR||sx>W+cullR||sy<-cullR||sy>H+cullR)return;
  const near=s===nearStation,t=Date.now()/1000;
  ctx.save();ctx.translate(sx,sy);
  if(near){
    const glGr=ctx.createRadialGradient(0,0,0,0,0,s.ring*2.2);
    glGr.addColorStop(0,s.color+'18');glGr.addColorStop(1,'transparent');
    ctx.fillStyle=glGr;ctx.beginPath();ctx.arc(0,0,s.ring*2.2,0,Math.PI*2);ctx.fill();
  }
  const ringPulse=0.35+Math.sin(t*0.7)*0.15;
  ctx.strokeStyle=near?s.color+Math.round(ringPulse*255).toString(16).padStart(2,'0'):'rgba(50,90,180,0.12)';
  ctx.lineWidth=near?1.2:0.6;ctx.setLineDash([6,10]);
  ctx.beginPath();ctx.arc(0,0,s.ring,0,Math.PI*2);ctx.stroke();
  if(s.tier>=2){ctx.globalAlpha=0.5;ctx.beginPath();ctx.arc(0,0,s.ring*1.5,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
  if(s.tier>=3){ctx.globalAlpha=0.28;ctx.beginPath();ctx.arc(0,0,s.ring*2.0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
  ctx.setLineDash([]);
  ctx.rotate(s.angle);ctx.scale(scale,scale);
  const armCount=s.tier>=3?4:2;
  for(let arm=0;arm<armCount;arm++){
    ctx.save();ctx.rotate(arm*(Math.PI*2/armCount)+(s.armRot[arm%2]||0));
    ctx.strokeStyle=s.color+'70';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.moveTo(24,0);ctx.lineTo(52,0);ctx.stroke();
    const panW=36,panH=14;
    ctx.fillStyle='rgba(8,16,50,0.94)';ctx.strokeStyle=s.color+'80';ctx.lineWidth=1;
    ctx.fillRect(52,-panH/2,panW,panH);ctx.strokeRect(52,-panH/2,panW,panH);
    for(let ci=0;ci<4;ci++){ctx.strokeStyle=s.color+'30';ctx.lineWidth=0.5;ctx.strokeRect(52+ci*(panW/4),-panH/2,panW/4,panH);}
    const panGlow=0.08+Math.sin(t*0.4+arm*1.3)*0.05;
    ctx.globalAlpha=panGlow;ctx.fillStyle=s.color;ctx.fillRect(52,-panH/2,panW,panH);ctx.globalAlpha=1;
    const blinkA=Math.sin(t*2.5+arm*2.1)>0.3?0.9:0.15;
    ctx.globalAlpha=blinkA;ctx.fillStyle=arm%2===0?'#ff4444':'#44ffcc';
    ctx.beginPath();ctx.arc(52+panW+3,0,2.5,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    ctx.restore();
  }
  ctx.fillStyle='rgba(3,8,28,0.97)';ctx.strokeStyle=s.color+'aa';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(0,0,24,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.strokeStyle=s.color+'55';ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.strokeStyle=s.color+'25';ctx.lineWidth=0.7;ctx.beginPath();ctx.moveTo(Math.cos(a)*10,Math.sin(a)*10);ctx.lineTo(Math.cos(a)*24,Math.sin(a)*24);ctx.stroke();}
  for(let i=0;i<6;i++){
    const la=i*Math.PI/3+t*0.25,blink=Math.sin(t*3+i*1.05)>0?0.95:0.1;
    ctx.globalAlpha=blink*0.75;ctx.fillStyle=i%2===0?'#ff3030':'#30aaff';
    ctx.beginPath();ctx.arc(Math.cos(la)*20,Math.sin(la)*20,1.8,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
  const corePulse=0.55+Math.sin(t*1.4)*0.35;
  const cGr=ctx.createRadialGradient(0,0,0,0,0,10);
  cGr.addColorStop(0,near?'rgba(255,255,255,0.9)':s.color+'dd');
  cGr.addColorStop(0.5,s.color+'66');cGr.addColorStop(1,'transparent');
  ctx.fillStyle=cGr;ctx.globalAlpha=corePulse;ctx.beginPath();ctx.arc(0,0,10,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;ctx.fillStyle=near?'#fff':s.color;ctx.beginPath();ctx.arc(0,0,3.5,0,Math.PI*2);ctx.fill();
  ctx.restore();
  ctx.globalAlpha=1;ctx.setLineDash([]);
  const labelY=sy-(s.ring*scale)-14;
  ctx.textAlign='center';
  if(near){
    ctx.font='bold 13px Share Tech Mono';ctx.fillStyle='rgba(180,220,255,0.95)';ctx.fillText(s.name,sx,labelY);
    ctx.font='10px Share Tech Mono';ctx.fillStyle='rgba(60,140,220,0.8)';ctx.fillText('[E] přistát',sx,labelY-17);
    const tierStr='★'.repeat(s.tier)+'☆'.repeat(3-s.tier);
    ctx.font='10px Share Tech Mono';ctx.fillStyle=s.color+'bb';ctx.fillText(tierStr,sx,labelY+14);
  } else {
    ctx.font='10px Share Tech Mono';ctx.fillStyle='rgba(80,110,180,0.5)';ctx.fillText(s.name,sx,labelY);
  }
}

function drawBlackHole(bh){
  const{x:sx,y:sy}=toScreen(bh.x,bh.y);
  if(sx<-bh.pullRadius||sx>W+bh.pullRadius||sy<-bh.pullRadius||sy>H+bh.pullRadius)return;
  for(let r=0;r<4;r++){
    const ringR=bh.r*1.3+(r*bh.r*0.5),alpha=0.25-r*0.05;
    ctx.save();ctx.translate(sx,sy);ctx.rotate(bh.angle+r*0.7);
    ctx.strokeStyle=`hsla(${20+r*15},90%,60%,${alpha})`;ctx.lineWidth=6-r;
    ctx.beginPath();ctx.ellipse(0,0,ringR,ringR*0.35,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  const gr=ctx.createRadialGradient(sx,sy,0,sx,sy,bh.r*1.2);
  gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(0.7,'rgba(0,0,0,0.95)');gr.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=gr;ctx.beginPath();ctx.arc(sx,sy,bh.r*1.5,0,Math.PI*2);ctx.fill();
}

function drawWreck(w){
  const{x:sx,y:sy}=toScreen(w.x,w.y);
  if(sx<-150||sx>W+150||sy<-150||sy>H+150)return;
  ctx.save();ctx.translate(sx,sy);ctx.rotate(w.angle);ctx.globalAlpha=w.looted?0.25:0.75;
  if(w.type==='fighter'){
    ctx.strokeStyle=w.looted?'#333':'#668';ctx.fillStyle='rgba(5,10,25,0.8)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(8,8);ctx.lineTo(-8,8);ctx.closePath();ctx.fill();ctx.stroke();
  } else {
    ctx.strokeStyle=w.looted?'#333':'#568';ctx.fillStyle='rgba(5,12,28,0.85)';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.rect(-18,-10,36,20);ctx.fill();ctx.stroke();
  }
  ctx.restore();ctx.globalAlpha=1;
  if(!w.looted){
    ctx.fillStyle='rgba(100,140,200,0.7)';ctx.font='9px Share Tech Mono';ctx.textAlign='center';
    const d=dist2(player,w);ctx.fillText(d<150?'[E] Prohledat vrak':'VRAK',sx,sy-28);
  }
}

function drawAnomaly(an){
  const{x:sx,y:sy}=toScreen(an.x,an.y);
  if(sx<-200||sx>W+200||sy<-200||sy>H+200||!an.active)return;
  const pulse=0.7+Math.sin(an.phase)*0.3;
  ctx.save();ctx.translate(sx,sy);
  const gr=ctx.createRadialGradient(0,0,0,0,0,an.r*2.5);
  gr.addColorStop(0,`rgba(160,80,255,${0.3*pulse})`);gr.addColorStop(0.5,`rgba(80,0,200,${0.15*pulse})`);gr.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,0,an.r*2.5,0,Math.PI*2);ctx.fill();
  for(let i=0;i<3;i++){
    ctx.rotate(an.phase*0.5+i*Math.PI*2/3);
    ctx.strokeStyle=`rgba(180,100,255,${0.5*pulse})`;ctx.lineWidth=1.5;
    ctx.beginPath();ctx.ellipse(0,0,an.r*(1+i*0.2),an.r*0.4*(1+i*0.2),0,0,Math.PI*2);ctx.stroke();
  }
  ctx.fillStyle=`rgba(200,150,255,${0.8*pulse})`;ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.fill();
  ctx.restore();ctx.globalAlpha=1;
  if(dist2(player,an)<an.r*3){
    document.getElementById('anomaly-bar').style.opacity='1';
    document.getElementById('anomaly-bar').style.color='#b0f';
    document.getElementById('anomaly-bar').textContent='◈ VESMÍRNÁ ANOMÁLIE — SBĚR VZORKŮ MOŽNÝ ◈';
  }
}

function drawStorm(st){
  const{x:sx,y:sy}=toScreen(st.x,st.y);
  if(sx<-st.r*1.5||sx>W+st.r*1.5||sy<-st.r*1.5||sy>H+st.r*1.5)return;
  ctx.save();ctx.translate(sx,sy);ctx.rotate(st.angle);
  const gr=ctx.createRadialGradient(0,0,0,0,0,st.r);
  gr.addColorStop(0,`rgba(0,180,255,${0.15*st.intensity})`);
  gr.addColorStop(0.5,`rgba(0,80,200,${0.1*st.intensity})`);gr.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,0,st.r,0,Math.PI*2);ctx.fill();
  ctx.restore();ctx.globalAlpha=1;
}

function drawConvoy(cv){
  const{x:sx,y:sy}=toScreen(cv.x,cv.y);
  if(sx<-100||sx>W+100||sy<-100||sy>H+100)return;
  ctx.save();ctx.translate(sx,sy);ctx.rotate(cv.angle+Math.PI/2);
  ctx.fillStyle='rgba(5,15,35,0.9)';ctx.strokeStyle='#5a9';ctx.lineWidth=1.2;
  ctx.beginPath();ctx.rect(-10,-18,20,36);ctx.fill();ctx.stroke();
  ctx.restore();
  ctx.fillStyle='rgba(80,200,120,0.7)';ctx.font='9px Share Tech Mono';ctx.textAlign='center';ctx.fillText('KONVOJ',sx,sy-24);
}

function drawSOS(s){
  const{x:sx,y:sy}=toScreen(s.x,s.y);
  if(sx<-200||sx>W+200||sy<-200||sy>H+200)return;
  const alpha=0.5+Math.sin(s.blink*3)*0.5;
  ctx.save();ctx.translate(sx,sy);ctx.globalAlpha=alpha;
  ctx.strokeStyle='#ff4';ctx.lineWidth=1.2;
  for(let r=20;r<=60;r+=20){ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=alpha*(1-r/80);}
  ctx.globalAlpha=alpha;ctx.fillStyle='#ffa';ctx.font='bold 12px Share Tech Mono';ctx.textAlign='center';ctx.fillText('SOS',0,4);
  ctx.font='9px Share Tech Mono';ctx.fillStyle='#fa4';ctx.fillText(`+${s.reward} cr`,0,20);
  ctx.restore();ctx.globalAlpha=1;
}

function drawLoot(l){
  const{x:sx,y:sy}=toScreen(l.x,l.y);
  const alpha=0.55+Math.sin(l.blink)*0.45,g=GOODS.find(g=>g.name===l.name),col=g?g.color:'#fa8';
  ctx.save();ctx.translate(sx,sy);ctx.globalAlpha=alpha;
  ctx.strokeStyle=col;ctx.lineWidth=1.2;ctx.fillStyle=col+'33';
  ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(7,0);ctx.lineTo(0,9);ctx.lineTo(-7,0);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.globalAlpha=alpha;ctx.fillStyle=col;ctx.font='9px Share Tech Mono';ctx.textAlign='center';ctx.fillText(l.name,0,20);
  ctx.restore();ctx.globalAlpha=1;
}

// --- Engine trails ---
let engineTrails=[];
function spawnEngineTrail(x,y,vx,vy,angle,boost){
  if(!settings.trails)return;
  const n=boost?4:2;
  for(let i=0;i<n;i++){
    const spread=(Math.random()-.5)*.4,spd=boost?rnd(1.5,3.5):rnd(.6,1.8);
    const backAngle=angle+Math.PI+spread;
    engineTrails.push({x:x+Math.cos(angle+Math.PI)*14+rnd(-3,3),y:y+Math.sin(angle+Math.PI)*14+rnd(-3,3),
      vx:Math.cos(backAngle)*spd+vx*.15,vy:Math.sin(backAngle)*spd+vy*.15,
      life:boost?rnd(.25,.55):rnd(.15,.35),maxLife:boost?.55:.35,r:rnd(1.5,boost?4:2.5),boost});
  }
}

function drawEngineTrails(){
  engineTrails.forEach(t=>{
    const{x:sx,y:sy}=toScreen(t.x,t.y);const a=t.life/t.maxLife;
    ctx.globalAlpha=a*0.7;
    const col=t.boost?`rgba(0,${180+Math.floor(a*75)},255,${a})`:`rgba(40,${80+Math.floor(a*100)},255,${a})`;
    ctx.fillStyle=col;ctx.beginPath();ctx.arc(sx,sy,t.r*a,0,Math.PI*2);ctx.fill();
  });ctx.globalAlpha=1;
}

// --- Background ---
function drawStars(){
  if(!settings.stars)return;
  const parallaxFactor=settings.parallax/100;
  STAR_LAYERS.forEach((parallax,layer)=>{
    const offX=camX*parallax*parallaxFactor,offY=camY*parallax*parallaxFactor;
    const startCX=Math.floor(offX/STAR_CELL)-1,startCY=Math.floor(offY/STAR_CELL)-1;
    const endCX=startCX+Math.ceil(W/STAR_CELL)+2,endCY=startCY+Math.ceil(H/STAR_CELL)+2;
    for(let cx=startCX;cx<=endCX;cx++){
      for(let cy=startCY;cy<=endCY;cy++){
        const rng=makeRng(chunkSeed(cx*37+layer*997|0,cy*53+layer*1337|0));
        const n=rng()<0.6?1:2;
        for(let i=0;i<n;i++){
          const sx=(cx+rng())*STAR_CELL-offX,sy=(cy+rng())*STAR_CELL-offY;
          if(sx<0||sx>W||sy<0||sy>H)continue;
          const r=0.2+rng()*1.4*(1-layer*0.3),b=0.2+rng()*0.8;
          ctx.globalAlpha=b;ctx.fillStyle='#b0c8f8';ctx.beginPath();ctx.arc(sx,sy,r,0,Math.PI*2);ctx.fill();
        }
      }
    }
  });ctx.globalAlpha=1;
}

function drawNebulae(chunks){
  if(!settings.nebulae)return;
  ctx.save();
  chunks.forEach(ch=>{
    if(!ch.nebula)return;
    const n=ch.nebula,{x:sx,y:sy}=toScreen(n.x,n.y);
    if(sx<-n.r||sx>W+n.r||sy<-n.r||sy>H+n.r)return;
    ctx.globalAlpha=n.alpha;
    const g2=ctx.createRadialGradient(sx,sy,0,sx,sy,n.r);
    g2.addColorStop(0,n.color);g2.addColorStop(1,'transparent');
    ctx.fillStyle=g2;ctx.beginPath();ctx.arc(sx,sy,n.r,0,Math.PI*2);ctx.fill();
  });
  ctx.restore();ctx.globalAlpha=1;
}

function drawVignette(){
  if(!settings.vignette)return;
  const vg=ctx.createRadialGradient(W/2,H/2,H*0.3,W/2,H/2,H*0.8);
  vg.addColorStop(0,'transparent');vg.addColorStop(1,'rgba(0,1,8,0.45)');
  ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
}

// --- Solar system ---
function drawSolarSystem(){
  SOLAR_SYSTEM.forEach(p=>{
    const pos=getPlanetPos(p,solarTime);
    const{x:sx,y:sy}=toScreen(pos.x,pos.y);
    const pad=p.r*3+120;
    if(sx<-pad||sx>W+pad||sy<-pad||sy>H+pad)return;
    ctx.save();
    if(p.isSun){
      const t=Date.now()/1000;
      for(let gi=1;gi>=0;gi--){
        const glowR=Math.min(p.r*(1.6+gi*0.7),380);
        const gr=ctx.createRadialGradient(sx,sy,0,sx,sy,glowR);
        gr.addColorStop(0,`rgba(255,180,0,${0.022-gi*0.008})`);gr.addColorStop(1,'transparent');
        ctx.fillStyle=gr;ctx.beginPath();ctx.arc(sx,sy,glowR,0,Math.PI*2);ctx.fill();
      }
      const gr=ctx.createRadialGradient(sx-p.r*0.25,sy-p.r*0.25,0,sx,sy,p.r);
      gr.addColorStop(0,'#fffef0');gr.addColorStop(0.3,'#ffe880');gr.addColorStop(0.7,'#ff9900');gr.addColorStop(1,'#cc4400');
      ctx.fillStyle=gr;ctx.beginPath();ctx.arc(sx,sy,p.r,0,Math.PI*2);ctx.fill();
      const pulse=0.7+Math.sin(t*1.8)*0.15+Math.sin(t*2.9)*0.08;
      ctx.globalAlpha=pulse*0.18;ctx.strokeStyle='#ffcc00';ctx.lineWidth=6;
      ctx.beginPath();ctx.arc(sx,sy,p.r*1.08,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
    } else {
      const glGr=ctx.createRadialGradient(sx,sy,0,sx,sy,p.r*1.4);
      glGr.addColorStop(0,p.glowColor);glGr.addColorStop(1,'transparent');
      ctx.fillStyle=glGr;ctx.beginPath();ctx.arc(sx,sy,p.r*1.4,0,Math.PI*2);ctx.fill();
      if(p.ring){
        ctx.globalAlpha=0.55;ctx.strokeStyle=p.innerColor;ctx.lineWidth=p.r*0.22;
        ctx.beginPath();ctx.ellipse(sx,sy,p.r*2.1,p.r*0.45,0.42,0,Math.PI*2);ctx.stroke();
        ctx.globalAlpha=0.35;ctx.lineWidth=p.r*0.1;
        ctx.beginPath();ctx.ellipse(sx,sy,p.r*2.5,p.r*0.52,0.42,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
      }
      if(p.stripes){
        ctx.save();ctx.beginPath();ctx.arc(sx,sy,p.r,0,Math.PI*2);ctx.clip();
        const gr=ctx.createRadialGradient(sx-p.r*0.3,sy-p.r*0.3,0,sx,sy,p.r);
        gr.addColorStop(0,p.innerColor);gr.addColorStop(1,p.outerColor);
        ctx.fillStyle=gr;ctx.fillRect(sx-p.r,sy-p.r,p.r*2,p.r*2);
        const stripeColors=['rgba(0,0,0,0.13)','rgba(255,255,255,0.07)','rgba(0,0,0,0.10)','rgba(255,220,160,0.08)'];
        const bands=[0.18,0.32,0.48,0.65,0.78,0.90];
        bands.forEach((frac,bi)=>{const yo=sy-p.r+frac*p.r*2;const hw=Math.sqrt(Math.max(0,p.r*p.r-(yo-sy)*(yo-sy)))*0.95;ctx.fillStyle=stripeColors[bi%stripeColors.length];ctx.fillRect(sx-hw,yo,hw*2,p.r*0.13);});
        ctx.restore();
      } else {
        const gr=ctx.createRadialGradient(sx-p.r*0.32,sy-p.r*0.32,p.r*0.05,sx,sy,p.r);
        gr.addColorStop(0,p.innerColor);gr.addColorStop(0.6,p.outerColor);gr.addColorStop(1,'#000814');
        ctx.fillStyle=gr;ctx.beginPath();ctx.arc(sx,sy,p.r,0,Math.PI*2);ctx.fill();
        if(p.hasOcean){
          ctx.save();ctx.beginPath();ctx.arc(sx,sy,p.r,0,Math.PI*2);ctx.clip();
          ctx.globalAlpha=0.45;ctx.fillStyle='#1a6020';
          ctx.beginPath();ctx.ellipse(sx-p.r*0.1,sy-p.r*0.15,p.r*0.38,p.r*0.28,0.6,0,Math.PI*2);ctx.fill();
          ctx.beginPath();ctx.ellipse(sx+p.r*0.2,sy+p.r*0.1,p.r*0.22,p.r*0.16,-0.4,0,Math.PI*2);ctx.fill();
          ctx.globalAlpha=0.25;ctx.fillStyle='#eeeeee';
          ctx.beginPath();ctx.ellipse(sx-p.r*0.05,sy-p.r*0.7,p.r*0.5,p.r*0.15,0.2,0,Math.PI*2);ctx.fill();
          ctx.restore();
        }
        ctx.globalAlpha=0.35;
        const shineGr=ctx.createRadialGradient(sx-p.r*0.35,sy-p.r*0.35,0,sx,sy,p.r);
        shineGr.addColorStop(0,'rgba(255,255,255,0.5)');shineGr.addColorStop(0.4,'rgba(255,255,255,0.05)');shineGr.addColorStop(1,'transparent');
        ctx.fillStyle=shineGr;ctx.beginPath();ctx.arc(sx,sy,p.r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
      }
      if(p.ring){
        ctx.save();ctx.beginPath();ctx.arc(sx,sy,p.r,0,Math.PI*2);ctx.clip();
        const gr2=ctx.createRadialGradient(sx-p.r*0.32,sy-p.r*0.32,p.r*0.05,sx,sy,p.r);
        gr2.addColorStop(0,p.innerColor);gr2.addColorStop(0.6,p.outerColor);gr2.addColorStop(1,'#000814');
        ctx.fillStyle=gr2;ctx.fillRect(sx-p.r,sy-p.r,p.r*2,p.r*2);ctx.restore();
        ctx.globalAlpha=0.35;
        const sh=ctx.createRadialGradient(sx-p.r*0.35,sy-p.r*0.35,0,sx,sy,p.r);
        sh.addColorStop(0,'rgba(255,255,255,0.45)');sh.addColorStop(0.4,'rgba(255,255,255,0.04)');sh.addColorStop(1,'transparent');
        ctx.fillStyle=sh;ctx.beginPath();ctx.arc(sx,sy,p.r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
      }
    }
    const dist=dist2(player,pos);
    if(dist<(p.isSun?2000:p.r*18)){
      ctx.fillStyle=p.isSun?'rgba(255,220,80,0.9)':'rgba(160,200,255,0.75)';
      ctx.font=`${Math.max(10,p.r*0.4)}px Share Tech Mono`;ctx.textAlign='center';
      ctx.fillText(p.name,sx,sy-p.r-8);
    }
    ctx.restore();
    ctx.globalAlpha=1;ctx.setLineDash([]);
  });
}

// --- Minimap ---
function drawMinimap(){
  const mmSize=settings.minimapSize;
  const dpr=window.devicePixelRatio||1;
  if(MM.width!==Math.round(mmSize*dpr)||MM.height!==Math.round(mmSize*dpr)){
    MM.width=Math.round(mmSize*dpr);MM.height=Math.round(mmSize*dpr);
    MM.style.width=mmSize+'px';MM.style.height=mmSize+'px';
  }
  mctx.setTransform(dpr,0,0,dpr,0,0);
  const S=mmSize,cx=S/2,cy=S/2;
  const outerOrbit=24500,sc=(S/2*0.88)/outerOrbit;
  mctx.fillStyle='#010210';mctx.fillRect(0,0,S,S);
  mctx.fillStyle='rgba(255,255,255,0.35)';
  for(let i=0;i<55;i++){
    const hx=(Math.sin(i*137.5)*0.5+0.5)*S,hy=(Math.cos(i*97.3)*0.5+0.5)*S;
    mctx.beginPath();mctx.arc(hx,hy,0.5,0,Math.PI*2);mctx.fill();
  }
  SOLAR_SYSTEM.forEach(p=>{
    if(p.orbit===0||p.parentIdx!==undefined)return;
    mctx.strokeStyle='rgba(25,50,110,0.35)';mctx.lineWidth=0.6;mctx.setLineDash([2,5]);
    mctx.beginPath();mctx.arc(cx,cy,p.orbit*sc,0,Math.PI*2);mctx.stroke();mctx.setLineDash([]);
  });
  SOLAR_SYSTEM.forEach(p=>{
    const pos=getPlanetPos(p,solarTime);
    const px=cx+pos.x*sc,py=cy+pos.y*sc;
    mctx.save();
    if(p.isSun){
      const pulse=0.65+Math.sin(Date.now()/800)*0.35;
      const gr=mctx.createRadialGradient(cx,cy,0,cx,cy,9);
      gr.addColorStop(0,`rgba(255,220,60,${pulse})`);gr.addColorStop(0.5,'rgba(255,140,0,0.6)');gr.addColorStop(1,'transparent');
      mctx.fillStyle=gr;mctx.beginPath();mctx.arc(cx,cy,9,0,Math.PI*2);mctx.fill();
      mctx.fillStyle='#ffee55';mctx.beginPath();mctx.arc(cx,cy,3.8,0,Math.PI*2);mctx.fill();
    } else if(p.parentIdx!==undefined){
      mctx.fillStyle='#888';mctx.beginPath();mctx.arc(px,py,1.2,0,Math.PI*2);mctx.fill();
    } else {
      const r=Math.max(1.8,p.r*sc*0.55);
      if(p.ring){mctx.globalAlpha=0.5;mctx.strokeStyle=p.innerColor;mctx.lineWidth=Math.max(0.8,r*0.4);mctx.beginPath();mctx.ellipse(px,py,r*2.0,r*0.38,0.42,0,Math.PI*2);mctx.stroke();mctx.globalAlpha=1;}
      const gr=mctx.createRadialGradient(px-r*0.3,py-r*0.3,0,px,py,r);
      gr.addColorStop(0,p.innerColor);gr.addColorStop(1,p.outerColor);
      mctx.fillStyle=gr;mctx.beginPath();mctx.arc(px,py,r,0,Math.PI*2);mctx.fill();
      mctx.globalAlpha=0.3;
      const sh=mctx.createRadialGradient(px-r*0.35,py-r*0.35,0,px,py,r);
      sh.addColorStop(0,'rgba(255,255,255,0.6)');sh.addColorStop(0.5,'transparent');sh.addColorStop(1,'transparent');
      mctx.fillStyle=sh;mctx.beginPath();mctx.arc(px,py,r,0,Math.PI*2);mctx.fill();mctx.globalAlpha=1;
      mctx.fillStyle='rgba(120,170,220,0.7)';mctx.font='6px Share Tech Mono';mctx.textAlign='center';mctx.fillText(p.name,px,py-r-2);
    }
    mctx.restore();
  });
  const ppx=cx+player.x*sc,ppy=cy+player.y*sc;
  const inMap=ppx>4&&ppx<S-4&&ppy>4&&ppy<S-4;
  if(inMap){
    const pulse=0.5+Math.sin(Date.now()/500)*0.3;
    mctx.strokeStyle=`rgba(80,200,255,${pulse})`;mctx.lineWidth=1;
    mctx.beginPath();mctx.arc(ppx,ppy,5,0,Math.PI*2);mctx.stroke();
    mctx.save();mctx.translate(ppx,ppy);mctx.rotate(player.angle+Math.PI/2);
    mctx.fillStyle='#5af';mctx.beginPath();mctx.moveTo(0,-4.5);mctx.lineTo(3,3);mctx.lineTo(-3,3);mctx.closePath();mctx.fill();mctx.restore();
  } else {
    const ang=Math.atan2(ppy-cy,ppx-cx);
    const ex=cx+Math.cos(ang)*(S/2-7),ey=cy+Math.sin(ang)*(S/2-7);
    mctx.save();mctx.translate(ex,ey);mctx.rotate(ang);
    mctx.fillStyle='rgba(80,200,255,0.85)';
    mctx.beginPath();mctx.moveTo(6,0);mctx.lineTo(-4,-3);mctx.lineTo(-4,3);mctx.closePath();mctx.fill();mctx.restore();
  }
  const playerDist=Math.hypot(player.x,player.y),pdPx=playerDist*sc;
  if(pdPx>3&&pdPx<S/2*1.1){
    mctx.strokeStyle='rgba(40,100,200,0.18)';mctx.lineWidth=0.5;mctx.setLineDash([1,4]);
    mctx.beginPath();mctx.arc(cx,cy,Math.min(pdPx,S/2-2),0,Math.PI*2);mctx.stroke();mctx.setLineDash([]);
  }
  const vg=mctx.createRadialGradient(cx,cy,cx*0.5,cx,cy,cx*1.05);
  vg.addColorStop(0,'transparent');vg.addColorStop(1,'rgba(0,1,12,0.55)');
  mctx.fillStyle=vg;mctx.fillRect(0,0,S,S);
  FORCED_STATIONS.forEach(preset=>{
    const ch=getChunk(preset.cx,preset.cy);if(!ch.station)return;
    const spx=cx+ch.station.x*sc,spy=cy+ch.station.y*sc;
    if(spx<2||spx>S-2||spy<2||spy>S-2)return;
    mctx.save();
    const pulse=0.5+Math.sin(Date.now()/700+preset.cx)*0.4;
    mctx.globalAlpha=0.55+pulse*0.25;
    mctx.strokeStyle=ch.station.color;mctx.lineWidth=0.8;
    const sr=2.8;mctx.fillStyle='rgba(2,8,28,0.9)';
    mctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;mctx.lineTo(spx+Math.cos(a)*sr,spy+Math.sin(a)*sr);}mctx.closePath();mctx.fill();mctx.stroke();
    mctx.fillStyle=ch.station.color;mctx.beginPath();mctx.arc(spx,spy,1,0,Math.PI*2);mctx.fill();
    mctx.globalAlpha=1;mctx.restore();
  });
  chunkCache.forEach(ch=>{
    if(!ch.station)return;
    if(FORCED_STATIONS.some(p=>p.cx===ch.cx&&p.cy===ch.cy))return;
    const spx=cx+ch.station.x*sc,spy=cy+ch.station.y*sc;
    if(spx<2||spx>S-2||spy<2||spy>S-2)return;
    mctx.fillStyle=ch.station.color;mctx.globalAlpha=0.6;
    mctx.beginPath();mctx.arc(spx,spy,1.5,0,Math.PI*2);mctx.fill();mctx.globalAlpha=1;
  });
  if(nearStation){mctx.strokeStyle='rgba(255,220,60,0.2)';mctx.lineWidth=1.5;mctx.strokeRect(0,0,S,S);}
}

// --- Overview map ---
function drawOverviewMap(){
  if(!player)return;
  const canvas=OV,c=ovCtx,S=OV_SIZE;
  c.clearRect(0,0,S,S);c.fillStyle='#01020e';c.fillRect(0,0,S,S);
  c.strokeStyle='rgba(20,40,80,0.25)';c.lineWidth=0.5;
  for(let x=0;x<S;x+=40){c.beginPath();c.moveTo(x,0);c.lineTo(x,S);c.stroke();}
  for(let y=0;y<S;y+=40){c.beginPath();c.moveTo(0,y);c.lineTo(S,y);c.stroke();}
  const baseRange=4000,range=baseRange/ovZoomLevel,sc=S/range;
  const ox=player.x-range/2-ovPanX/sc,oy=player.y-range/2-ovPanY/sc;
  function wp(wx,wy){return{x:(wx-ox)*sc,y:(wy-oy)*sc};}
  function inBounds(x,y,pad=20){return x>-pad&&x<S+pad&&y>-pad&&y<S+pad;}
  SOLAR_SYSTEM.forEach(p=>{
    if(p.orbit>0){
      const oc=wp(0,0),orPx=p.orbit*sc;
      if(inBounds(oc.x,oc.y,orPx+20)){
        c.strokeStyle='rgba(40,60,120,0.22)';c.lineWidth=0.7;c.setLineDash([3,5]);
        c.beginPath();c.arc(oc.x,oc.y,orPx,0,Math.PI*2);c.stroke();c.setLineDash([]);
      }
    }
  });
  SOLAR_SYSTEM.forEach(p=>{
    const pos=getPlanetPos(p,solarTime);const pp2=wp(pos.x,pos.y);
    if(!inBounds(pp2.x,pp2.y,p.r*sc+30))return;
    c.save();
    if(p.isSun){
      const sunR=Math.max(5,p.r*sc*0.7);const pulse=0.7+Math.sin(Date.now()/800)*0.3;
      const glGr=c.createRadialGradient(pp2.x,pp2.y,0,pp2.x,pp2.y,sunR*2.8);
      glGr.addColorStop(0,`rgba(255,160,0,${0.35*pulse})`);glGr.addColorStop(1,'transparent');
      c.fillStyle=glGr;c.beginPath();c.arc(pp2.x,pp2.y,sunR*2.8,0,Math.PI*2);c.fill();
      const gr=c.createRadialGradient(pp2.x-sunR*0.2,pp2.y-sunR*0.2,0,pp2.x,pp2.y,sunR);
      gr.addColorStop(0,'#fffce0');gr.addColorStop(0.4,'#ffdd00');gr.addColorStop(0.8,'#ff8800');gr.addColorStop(1,'#cc3300');
      c.fillStyle=gr;c.beginPath();c.arc(pp2.x,pp2.y,sunR,0,Math.PI*2);c.fill();
    } else {
      const pR=Math.max(2.5,p.r*sc*0.65);
      const glGr=c.createRadialGradient(pp2.x,pp2.y,0,pp2.x,pp2.y,pR*2.5);
      glGr.addColorStop(0,p.glowColor);glGr.addColorStop(1,'transparent');
      c.fillStyle=glGr;c.beginPath();c.arc(pp2.x,pp2.y,pR*2.5,0,Math.PI*2);c.fill();
      if(p.ring){c.globalAlpha=0.5;c.strokeStyle=p.innerColor;c.lineWidth=Math.max(1,pR*0.3);c.beginPath();c.ellipse(pp2.x,pp2.y,pR*2.0,pR*0.42,0.42,0,Math.PI*2);c.stroke();c.globalAlpha=1;}
      const gr=c.createRadialGradient(pp2.x-pR*0.3,pp2.y-pR*0.3,0,pp2.x,pp2.y,pR);
      gr.addColorStop(0,p.innerColor);gr.addColorStop(1,p.outerColor);
      c.fillStyle=gr;c.beginPath();c.arc(pp2.x,pp2.y,pR,0,Math.PI*2);c.fill();
      c.globalAlpha=0.28;const sh=c.createRadialGradient(pp2.x-pR*0.32,pp2.y-pR*0.32,0,pp2.x,pp2.y,pR);
      sh.addColorStop(0,'rgba(255,255,255,0.5)');sh.addColorStop(0.45,'rgba(255,255,255,0.04)');sh.addColorStop(1,'transparent');
      c.fillStyle=sh;c.beginPath();c.arc(pp2.x,pp2.y,pR,0,Math.PI*2);c.fill();c.globalAlpha=1;
      c.fillStyle='rgba(160,200,255,0.75)';c.font=`${Math.max(8,9*Math.sqrt(ovZoomLevel)*0.55)}px Share Tech Mono`;c.textAlign='center';c.fillText(p.name,pp2.x,pp2.y-pR-4);
    }
    c.restore();
  });
  getVisibleChunksForOv(ox,oy,range).forEach(ch=>{
    if(ch.nebula&&settings.nebulae){const p=wp(ch.nebula.x,ch.nebula.y);if(!inBounds(p.x,p.y,200))return;const r=ch.nebula.r*sc*0.8;const gr=c.createRadialGradient(p.x,p.y,0,p.x,p.y,r);gr.addColorStop(0,ch.nebula.color.replace(')',`,${ch.nebula.alpha*3})`).replace('rgb','rgba'));gr.addColorStop(1,'transparent');c.fillStyle=gr;c.globalAlpha=0.6;c.beginPath();c.arc(p.x,p.y,r,0,Math.PI*2);c.fill();c.globalAlpha=1;}
    ch.asteroids.forEach(a=>{const p=wp(a.x,a.y);if(!inBounds(p.x,p.y))return;c.fillStyle='rgba(60,55,50,0.35)';c.beginPath();c.arc(p.x,p.y,Math.max(0.6,a.sz*sc*0.15),0,Math.PI*2);c.fill();});
    if(ch.storm){const p=wp(ch.storm.x,ch.storm.y);if(inBounds(p.x,p.y,ch.storm.r*sc)){const r=ch.storm.r*sc;const gr=c.createRadialGradient(p.x,p.y,0,p.x,p.y,r);gr.addColorStop(0,`rgba(0,180,255,${0.18*ch.storm.intensity})`);gr.addColorStop(1,'transparent');c.fillStyle=gr;c.beginPath();c.arc(p.x,p.y,r,0,Math.PI*2);c.fill();}}
    if(ch.blackhole){const bh=ch.blackhole,p=wp(bh.x,bh.y);if(inBounds(p.x,p.y)){const r=Math.max(5,bh.r*sc);const gr=c.createRadialGradient(p.x,p.y,0,p.x,p.y,r*1.5);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(0.6,'rgba(60,0,120,0.8)');gr.addColorStop(1,'transparent');c.fillStyle=gr;c.beginPath();c.arc(p.x,p.y,r*1.5,0,Math.PI*2);c.fill();c.strokeStyle='rgba(200,80,255,0.7)';c.lineWidth=1.2;c.beginPath();c.arc(p.x,p.y,r,0,Math.PI*2);c.stroke();}}
    if(ch.anomaly&&ch.anomaly.active){const p=wp(ch.anomaly.x,ch.anomaly.y);if(inBounds(p.x,p.y)){const pulse=0.6+Math.sin(Date.now()/600)*0.4;c.fillStyle=`rgba(160,80,255,${0.8*pulse})`;c.beginPath();c.arc(p.x,p.y,Math.max(3,5*ovZoomLevel*0.3),0,Math.PI*2);c.fill();}}
    if(ch.wreck&&!ch.wreck.looted){const p=wp(ch.wreck.x,ch.wreck.y);if(inBounds(p.x,p.y)){c.strokeStyle='rgba(100,140,200,0.6)';c.lineWidth=1;const s=Math.max(4,6*ovZoomLevel*0.3);c.beginPath();c.moveTo(p.x,p.y-s);c.lineTo(p.x+s,p.y+s);c.lineTo(p.x-s,p.y+s);c.closePath();c.stroke();}}
    if(ch.station){
      const p=wp(ch.station.x,ch.station.y);if(inBounds(p.x,p.y)){
        const r=Math.max(5,8*Math.sqrt(ovZoomLevel)*0.5);
        const gr=c.createRadialGradient(p.x,p.y,0,p.x,p.y,r*2.5);gr.addColorStop(0,ch.station.color+'88');gr.addColorStop(1,'transparent');
        c.fillStyle=gr;c.beginPath();c.arc(p.x,p.y,r*2.5,0,Math.PI*2);c.fill();
        c.strokeStyle=ch.station.color;c.fillStyle='rgba(5,10,30,0.9)';c.lineWidth=1.2;
        c.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;const x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r;i===0?c.moveTo(x,y):c.lineTo(x,y);}c.closePath();c.fill();c.stroke();
        c.fillStyle='#ffe050';c.beginPath();c.arc(p.x,p.y,Math.max(1.5,r*0.3),0,Math.PI*2);c.fill();
        c.fillStyle=ch.station===nearStation?'rgba(255,240,100,0.95)':'rgba(160,200,255,0.7)';
        c.font=`${Math.max(9,10*Math.sqrt(ovZoomLevel)*0.6)}px Share Tech Mono`;c.textAlign='center';c.fillText(ch.station.name,p.x,p.y-r-6);
      }
    }
  });
  c.fillStyle='rgba(255,100,60,0.85)';
  enemies.forEach(e=>{const p=wp(e.x,e.y);if(!inBounds(p.x,p.y))return;const r=Math.max(2.5,3.5*ovZoomLevel*0.3);c.beginPath();c.arc(p.x,p.y,r,0,Math.PI*2);c.fill();});
  c.fillStyle='rgba(255,200,80,0.7)';
  loots.forEach(l=>{const p=wp(l.x,l.y);if(!inBounds(p.x,p.y))return;c.beginPath();c.arc(p.x,p.y,2,0,Math.PI*2);c.fill();});
  const pp=wp(player.x,player.y);
  const pPulse=0.4+Math.sin(Date.now()/400)*0.3;
  c.strokeStyle=`rgba(80,200,255,${pPulse})`;c.lineWidth=1;c.beginPath();c.arc(pp.x,pp.y,12,0,Math.PI*2);c.stroke();
  c.save();c.translate(pp.x,pp.y);c.rotate(player.angle+Math.PI/2);
  c.fillStyle='rgba(5,10,30,0.95)';c.strokeStyle='#5af';c.lineWidth=1.3;
  const ps=Math.max(5,7*ovZoomLevel*0.25);
  c.beginPath();c.moveTo(0,-ps*1.5);c.lineTo(ps,ps);c.lineTo(ps*0.4,ps*0.6);c.lineTo(-ps*0.4,ps*0.6);c.lineTo(-ps,ps);c.closePath();c.fill();c.stroke();c.restore();
  c.strokeStyle='rgba(80,200,255,0.2)';c.lineWidth=0.5;c.setLineDash([3,6]);
  c.beginPath();c.moveTo(pp.x,0);c.lineTo(pp.x,S);c.stroke();c.beginPath();c.moveTo(0,pp.y);c.lineTo(S,pp.y);c.stroke();c.setLineDash([]);
  const vgr=c.createRadialGradient(S/2,S/2,S*0.35,S/2,S/2,S*0.72);vgr.addColorStop(0,'transparent');vgr.addColorStop(1,'rgba(0,1,10,0.6)');c.fillStyle=vgr;c.fillRect(0,0,S,S);
}
