// ===== SPACE TRADER — Intro Cinematic =====
(function(){
'use strict';

// ---- Timing ----
const LG = {                 // Logo phase timings
  start:    0.3,
  typeEnd:  2.0,
  uviEnd:   2.6,
  hold:     4.6,             // 2s pause
  stEnd:    5.8,             // SPACE TRADER hold
  fadeEnd:  7.0,
};
const LO = LG.fadeEnd;       // Launch offset

const PH = {
  fadeIn:   [LO,       LO+1.2],
  pre:      [LO,       LO+2.6],
  ignition: [LO+2.6,   LO+3.8],
  ascent:   [LO+3.8,   LO+12.5],
  srbSep:   [LO+5.5,   LO+7.2],
  etSep:    [LO+11.5,  LO+12.5],
  orbit:    [LO+12.5,  LO+17.0],
  title:    [LO+17.0,  LO+23.5],
};
const TOTAL = LO + 24.0;

// ---- Utils ----
function lerp(a,b,t){return a+(b-a)*t;}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}
function eO(t){t=clamp(t,0,1);return 1-(1-t)*(1-t);}
function eI(t){t=clamp(t,0,1);return t*t;}
function pt(t,ph){return clamp((t-ph[0])/(ph[1]-ph[0]),0,1);}

// ---- Globals ----
let canvas,ctx,W,H;
let startTime=null,lastTs=0,dt=0,running=true;
let hotP=[],smokeP=[];

const STARS=Array.from({length:500},()=>({
  nx:Math.random(),ny:Math.random(),
  r:.2+Math.random()*1.4,
  b:.15+Math.random()*.85,
  tw:Math.random()*Math.PI*2,
  spd:.3+Math.random()*1.2,
}));
const CITY=Array.from({length:180},()=>({
  nx:Math.random(), oy:(Math.random()-.5)*.06,
  r:.6+Math.random()*2.2,
  col:Math.random()>.6?'#ffcc88':'#ffffcc',
  fl:.7+Math.random()*.3,
}));
const STREAKS=Array.from({length:55},()=>({
  nx:Math.random(),phase:Math.random(),
  len:.04+Math.random()*.14,alpha:.04+Math.random()*.18,
}));

// ---- Init ----
function init(){
  canvas=document.getElementById('intro-canvas');
  if(!canvas)return;
  ctx=canvas.getContext('2d');
  resize();
  window.addEventListener('resize',resize);
  canvas.addEventListener('click',onSkip);
  window.addEventListener('keydown',onSkip);
  canvas.style.cursor='pointer';
  requestAnimationFrame(frame);
}
function resize(){W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;}

function onSkip(){
  if(!startTime)return;
  const t=(performance.now()-startTime)/1000;
  if(t<LO){startTime=performance.now()-LO*1000;}
  else if(t<PH.title[0]){startTime=performance.now()-PH.title[0]*1000;}
  else{endIntro();}
}
function endIntro(){
  if(!running)return;running=false;
  canvas.style.transition='opacity .7s ease';canvas.style.opacity='0';
  setTimeout(()=>{
    canvas.style.display='none';canvas.style.opacity='1';canvas.style.transition='';
    canvas.removeEventListener('click',onSkip);window.removeEventListener('keydown',onSkip);
  },700);
}
function frame(ts){
  if(!running)return;
  requestAnimationFrame(frame);
  if(!startTime)startTime=ts;
  dt=Math.min((ts-lastTs)/1000,.05);lastTs=ts;
  const t=(ts-startTime)/1000;
  if(t>=TOTAL){endIntro();return;}
  drawFrame(t);
}

function getAlt(t){
  if(t<PH.ascent[0])return 0;
  if(t>=PH.orbit[0])return 1;
  return eI(pt(t,PH.ascent));
}
function drawFrame(t){
  ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;
  ctx.globalCompositeOperation='source-over';ctx.shadowBlur=0;
  ctx.clearRect(0,0,W,H);
  if(t<LO){drawLogoPhase(t);}
  else{
    const alt=getAlt(t);
    if(t<PH.orbit[0])drawLaunchScene(t,alt);
    else if(t<PH.title[0])drawOrbitScene(t);
    else drawTitleScene(t);
    if(t<PH.fadeIn[1]){
      ctx.globalAlpha=1-eO(pt(t,PH.fadeIn));
      ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
    }
  }
  // Skip hint
  if(t>.4&&t<TOTAL-2){
    ctx.globalAlpha=Math.min(1,(t-.4)*.5)*.28;
    ctx.fillStyle='#fff';
    ctx.font=`${Math.round(W*.0075)}px Courier New`;
    ctx.textAlign='right';
    ctx.fillText('KLIKNI PRO PŘESKOČENÍ',W-22,H-18);
    ctx.globalAlpha=1;
  }
}

// ================================================================
//  LOGO PHASE
// ================================================================
const LOGO_TXT='JILUKU Games';
function drawLogoPhase(t){
  ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
  const cx=W*.5,cy=H*.5,fs=Math.round(W*.038);
  // Vignette
  const vg=ctx.createRadialGradient(cx,cy,0,cx,cy,W*.65);
  vg.addColorStop(0,'rgba(8,8,8,0)');vg.addColorStop(1,'rgba(0,0,0,.7)');
  ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);

  const crossProg=clamp((t-LG.hold)/(LG.stEnd-LG.hold),0,1);
  const logoAlpha=1-crossProg;

  // "JILUKU Games" typewriter
  if(t>=LG.start&&logoAlpha>.01){
    const tp=clamp((t-LG.start)/(LG.typeEnd-LG.start),0,1);
    const chars=Math.floor(tp*LOGO_TXT.length);
    const blink=(tp<1)&&(Math.floor(t*2.8)%2===0);
    ctx.save();
    ctx.globalAlpha=logoAlpha;
    ctx.fillStyle='#ffffff';
    ctx.shadowColor='rgba(255,255,255,.25)';ctx.shadowBlur=22;
    ctx.font=`${fs}px Courier New`;
    ctx.textAlign='center';
    ctx.letterSpacing='3px';
    ctx.fillText(LOGO_TXT.slice(0,chars)+(blink?'█':''),cx,cy-fs*.35);
    ctx.restore();
  }

  // "uvádí"
  if(t>=LG.typeEnd&&logoAlpha>.01){
    const ua=eO(clamp((t-LG.typeEnd)/.55,0,1))*logoAlpha*.55;
    ctx.globalAlpha=ua;
    ctx.fillStyle='#aaaaaa';
    ctx.font=`${Math.round(fs*.38)}px Courier New`;
    ctx.textAlign='center';
    ctx.letterSpacing='10px';
    ctx.fillText('UVÁDÍ',cx,cy+fs*.42);
    const lw=W*.14;
    ctx.strokeStyle='rgba(170,170,170,.3)';ctx.lineWidth=.5;
    ctx.beginPath();ctx.moveTo(cx-lw,cy+fs*.75);ctx.lineTo(cx+lw,cy+fs*.75);ctx.stroke();
    ctx.letterSpacing='';ctx.globalAlpha=1;
  }

  // "SPACE TRADER" crossfade in
  if(crossProg>.01){
    ctx.save();
    ctx.globalAlpha=eO(crossProg);
    ctx.shadowColor='#ff9500';ctx.shadowBlur=Math.round(55*crossProg);
    ctx.fillStyle='#ff9500';
    ctx.font=`bold ${Math.round(W*.072)}px Courier New`;
    ctx.textAlign='center';
    ctx.letterSpacing='8px';
    ctx.fillText('SPACE TRADER',cx,cy+fs*.1);
    ctx.restore();
  }

  // Final fade to black
  if(t>=LG.stEnd){
    const fa=eI(clamp((t-LG.stEnd)/(LG.fadeEnd-LG.stEnd),0,1));
    ctx.globalAlpha=fa;ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
  }
}

// ================================================================
//  LAUNCH SCENE
// ================================================================
function drawLaunchScene(t,alt){
  drawSky(alt);
  drawStars(t,clamp(alt*2.8,0,1));
  const horizY=H*.72+alt*H*1.3;
  if(horizY<H+40){
    drawHorizon(horizY);
    drawCityLights(t,horizY,clamp(1-alt/.42,0,1));
  }
  const rx=W*.5,ry=H*.54;
  const sc=lerp(1,.83,alt);

  // Atmospheric heating
  if(t>PH.ascent[0]+3.5&&t<PH.orbit[0]){
    const hp=clamp((t-PH.ascent[0]-3.5)/2,0,1)*clamp((PH.orbit[0]-t)/2,0,1);
    if(hp>.01){
      ctx.save();
      const hg=ctx.createRadialGradient(rx,ry-sc*80,0,rx,ry-sc*80,sc*120);
      hg.addColorStop(0,`rgba(255,140,20,${hp*.5})`);
      hg.addColorStop(.4,`rgba(255,60,0,${hp*.28})`);
      hg.addColorStop(1,'transparent');
      ctx.fillStyle=hg;ctx.shadowColor='#ff4400';ctx.shadowBlur=50*hp;
      ctx.beginPath();ctx.arc(rx,ry-sc*80,sc*120,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
  }
  if(alt>.2&&alt<.92)drawSpeedLines(t,eO(clamp((alt-.2)/.35,0,1))*clamp((.92-alt)/.25,0,1));

  // SRB & ET separation progress
  const srbP=pt(t,PH.srbSep);
  const etP=pt(t,PH.etSep);

  // Exhaust — SRBs fire until separated, SSMEs always
  const hasSRBs=srbP<.9;
  if(t>=PH.ignition[0]){
    const fp=clamp((t-PH.ignition[0])/.8,0,1);
    if(hasSRBs){
      // Large SRB plumes (offset L/R)
      drawSRBFlame(rx-sc*66,ry+sc*55,sc,fp,t,alt);
      drawSRBFlame(rx+sc*66,ry+sc*55,sc,fp,t,alt);
    }
    // 3 clean SSMEs
    drawSSME(rx-sc*12,ry+sc*55,sc,fp*.8,t,alt);
    drawSSME(rx,       ry+sc*62,sc,fp*.8,t,alt);
    drawSSME(rx+sc*12,ry+sc*55,sc,fp*.8,t,alt);
    updateParticles();
  }

  // Separated SRBs drift away
  if(srbP>.01&&srbP<=1){
    const sepX=eO(srbP)*sc*130;
    const sepY=eO(srbP)*sc*90;
    const sepA=srbP*1.1;
    drawSRBPiece(rx-sc*66-sepX,ry+sc*12+sepY,-sepA,sc,1-srbP*.4);
    drawSRBPiece(rx+sc*66+sepX,ry+sc*12+sepY, sepA,sc,1-srbP*.4);
  }

  // ET separation
  const etAlpha=etP>0?clamp(1-etP*1.8,0,1):1;
  const etOffX=etP>0?eO(etP)*sc*55:0;
  const etOffY=etP>0?eO(etP)*sc*60:0;

  // Draw launch pad
  if(alt<.12)drawPad(rx,ry+sc*52,sc,clamp(1-alt/.12,0,1));

  // Draw full shuttle stack
  drawShuttleStack(rx,ry,sc,srbP,etAlpha,etOffX,etOffY);

  // Launch HUD
  drawLaunchHUD(t,alt);

  // Ignition flash
  if(t>=PH.ignition[0]&&t<PH.ignition[0]+.55){
    ctx.globalAlpha=(1-pt(t,[PH.ignition[0],PH.ignition[0]+.55]))*.72;
    ctx.fillStyle='#fff8ee';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
  }
}

// ================================================================
//  SHUTTLE STACK — draws orbiter + ET + SRBs together
// ================================================================
function drawShuttleStack(cx,cy,sc,srbP,etAlpha,etDx,etDy){
  // Draw ET behind orbiter
  if(etAlpha>.01){
    drawET(cx-etDx,cy+sc*14+etDy,sc,etAlpha);
  }
  // Attached SRBs (before separation)
  if(srbP<.01){
    drawSRB(cx-sc*66,cy+sc*12,sc,1);
    drawSRB(cx+sc*66,cy+sc*12,sc,1);
  }
  // Orbiter (always)
  drawOrbiter(cx,cy,sc);
  // Connection struts ET→orbiter hint
  if(etAlpha>.3&&srbP<.01){
    ctx.globalAlpha=etAlpha*.4;
    ctx.strokeStyle='#7a8a9a';ctx.lineWidth=sc*2;
    ctx.beginPath();ctx.moveTo(cx-sc*10,cy+sc*38);ctx.lineTo(cx-sc*5,cy+sc*38);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx-sc*10,cy+sc*18);ctx.lineTo(cx-sc*5,cy+sc*18);ctx.stroke();
    ctx.globalAlpha=1;
  }
}

// ---- Orbiter (Space Shuttle) ----
function drawOrbiter(cx,cy,sc){
  ctx.save();ctx.translate(cx,cy);
  const bh=sc*78,bw=sc*18;
  const bTop=-bh*.5;
  const wFY=-bh*.04,wRY=bh*.42,wTX=sc*60,wTY=bh*.35;

  // Delta wings
  ctx.beginPath();
  ctx.moveTo(-bw*.5,wFY);ctx.lineTo(-wTX,wTY);ctx.lineTo(-bw*.5,wRY);ctx.closePath();
  ctx.fillStyle='#dce4f4';ctx.fill();
  ctx.beginPath();
  ctx.moveTo(bw*.5,wFY);ctx.lineTo(wTX,wTY);ctx.lineTo(bw*.5,wRY);ctx.closePath();
  ctx.fill();

  // Wing leading edges (black thermal tiles)
  ctx.beginPath();
  ctx.moveTo(-bw*.5,wFY);ctx.lineTo(-wTX,wTY);ctx.lineTo(-wTX+sc*9,wTY);ctx.lineTo(-bw*.5+sc*5,wFY+sc*5);ctx.closePath();
  ctx.fillStyle='#252525';ctx.fill();
  ctx.beginPath();
  ctx.moveTo(bw*.5,wFY);ctx.lineTo(wTX,wTY);ctx.lineTo(wTX-sc*9,wTY);ctx.lineTo(bw*.5-sc*5,wFY+sc*5);ctx.closePath();
  ctx.fill();

  // Main fuselage
  ctx.fillStyle='#dce4f4';
  ctx.beginPath();
  if(ctx.roundRect)ctx.roundRect(-bw*.5,bTop,bw,bh,sc*3);
  else ctx.rect(-bw*.5,bTop,bw,bh);
  ctx.fill();

  // Belly tiles (black)
  ctx.fillStyle='#2a2a2a';
  ctx.fillRect(-bw*.5,wRY,bw,bh*.5-wRY+bh*.5);

  // Payload bay
  ctx.fillStyle='#c6d2e4';
  ctx.fillRect(-bw*.42,bTop+bh*.08,bw*.84,bh*.38);
  ctx.strokeStyle='rgba(120,140,170,.55)';ctx.lineWidth=sc*.7;
  ctx.beginPath();ctx.moveTo(0,bTop+bh*.08);ctx.lineTo(0,bTop+bh*.46);ctx.stroke();

  // Nose cone
  ctx.beginPath();
  ctx.moveTo(-bw*.5,bTop);
  ctx.quadraticCurveTo(-bw*.45,bTop-sc*10,0,bTop-sc*34);
  ctx.quadraticCurveTo(bw*.45,bTop-sc*10,bw*.5,bTop);
  ctx.closePath();ctx.fillStyle='#ccd4e8';ctx.fill();

  // Nose thermal cap
  ctx.beginPath();
  ctx.moveTo(-bw*.38,bTop-sc*3);
  ctx.quadraticCurveTo(0,bTop-sc*34,bw*.38,bTop-sc*3);
  ctx.closePath();ctx.fillStyle='#1a1a1a';ctx.fill();

  // Cockpit windows
  ctx.fillStyle='#88aadd';ctx.shadowColor='#aaccff';ctx.shadowBlur=5;
  [[-bw*.18,bTop+sc*4],[bw*.18,bTop+sc*4]].forEach(([wx,wy])=>{
    ctx.beginPath();ctx.ellipse(wx,wy,sc*3.5,sc*2.5,0,0,Math.PI*2);ctx.fill();
  });
  ctx.shadowBlur=0;

  // OMS pods
  ctx.fillStyle='#bbc8da';
  ctx.beginPath();ctx.ellipse(-bw*.68,wRY-sc*7,sc*6,sc*9,-0.18,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(bw*.68,wRY-sc*7,sc*6,sc*9,0.18,0,Math.PI*2);ctx.fill();

  // Vertical tail
  ctx.beginPath();
  ctx.moveTo(-sc*2,bTop+bh*.1);ctx.lineTo(sc*9,wRY+sc*4);
  ctx.lineTo(sc*9,wRY+sc*16);ctx.lineTo(-sc*2,wRY+sc*14);ctx.closePath();
  ctx.fillStyle='#c8d4e8';ctx.fill();

  // Engine section
  ctx.fillStyle='#6a7a8a';
  ctx.fillRect(-bw*.72,wRY,bw*1.44,sc*17);

  // 3 SSME bells
  [-bw*.3,0,bw*.3].forEach(ex=>{
    drawBell(ex,wRY+sc*8,sc*6.5,sc*14);
  });

  ctx.restore();
}

// ---- External Tank ----
function drawET(cx,cy,sc,alpha){
  ctx.save();ctx.globalAlpha=alpha||1;ctx.translate(cx,cy);
  const w=sc*25,h=sc*108;
  // Body gradient (orange)
  const g=ctx.createLinearGradient(-w*.5,0,w*.5,0);
  g.addColorStop(0,'#7a2e08');g.addColorStop(.28,'#c44c16');
  g.addColorStop(.6,'#d05a1e');g.addColorStop(1,'#6a2606');
  ctx.fillStyle=g;
  ctx.beginPath();
  if(ctx.roundRect)ctx.roundRect(-w*.5,-h*.5,w,h,sc*3);
  else ctx.rect(-w*.5,-h*.5,w,h);
  ctx.fill();
  // Ogive nose
  ctx.beginPath();
  ctx.moveTo(-w*.5,-h*.5);
  ctx.quadraticCurveTo(-w*.48,-h*.5-sc*15,0,-h*.5-sc*28);
  ctx.quadraticCurveTo(w*.48,-h*.5-sc*15,w*.5,-h*.5);
  ctx.closePath();
  ctx.fillStyle='#a03c10';ctx.fill();
  // Bottom dome
  ctx.beginPath();
  ctx.arc(0,h*.5,w*.5,0,Math.PI,false);
  ctx.fillStyle='#8a3410';ctx.fill();
  // Panel lines
  ctx.strokeStyle='rgba(100,40,10,.45)';ctx.lineWidth=sc*.5;ctx.setLineDash([sc*4,sc*5]);
  ctx.beginPath();ctx.moveTo(-w*.5,-h*.15);ctx.lineTo(w*.5,-h*.15);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-w*.5, h*.1); ctx.lineTo(w*.5, h*.1); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// ---- SRB (attached, pre-separation) ----
function drawSRB(cx,cy,sc,alpha){
  ctx.save();ctx.globalAlpha=alpha||1;ctx.translate(cx,cy);
  const w=sc*13,h=sc*98;
  const g=ctx.createLinearGradient(-w*.5,0,w*.5,0);
  g.addColorStop(0,'#999');g.addColorStop(.45,'#eee');g.addColorStop(1,'#888');
  ctx.fillStyle=g;
  ctx.beginPath();
  if(ctx.roundRect)ctx.roundRect(-w*.5,-h*.5,w,h,sc*2);
  else ctx.rect(-w*.5,-h*.5,w,h);
  ctx.fill();
  // Nose
  ctx.beginPath();
  ctx.moveTo(-w*.5,-h*.5);
  ctx.quadraticCurveTo(-w*.45,-h*.5-sc*18,0,-h*.5-sc*24);
  ctx.quadraticCurveTo(w*.45,-h*.5-sc*18,w*.5,-h*.5);
  ctx.closePath();ctx.fillStyle='#ccc';ctx.fill();
  // Nose cap
  ctx.beginPath();ctx.arc(0,-h*.5-sc*20,sc*3,0,Math.PI*2);
  ctx.fillStyle='#ff6622';ctx.fill();
  // Segment bands
  ctx.strokeStyle='rgba(100,100,100,.5)';ctx.lineWidth=sc*.5;
  [-h*.22,h*.05,h*.28].forEach(by=>{
    ctx.beginPath();ctx.moveTo(-w*.5,by);ctx.lineTo(w*.5,by);ctx.stroke();
  });
  // Skirt
  ctx.fillStyle='#aaa';
  ctx.beginPath();
  if(ctx.roundRect)ctx.roundRect(-w*.6,h*.5-sc*12,w*1.2,sc*12,sc*1);
  else ctx.rect(-w*.6,h*.5-sc*12,w*1.2,sc*12);
  ctx.fill();
  // Bell
  drawBell(0,h*.5-sc*2,sc*5.5,sc*12);
  ctx.restore();
}

// ---- Separated SRB (tumbling away) ----
function drawSRBPiece(cx,cy,angle,sc,alpha){
  ctx.save();ctx.globalAlpha=Math.max(0,alpha);
  ctx.translate(cx,cy);ctx.rotate(angle);
  drawSRB(0,0,sc,1);
  ctx.restore();
}

// ---- Engine bell shape ----
function drawBell(bx,by,topR,bellH){
  ctx.save();ctx.translate(bx,by);
  ctx.beginPath();
  ctx.moveTo(-topR,0);
  ctx.bezierCurveTo(-topR*1.55,bellH*.45,-topR*1.9,bellH*.8,-topR*1.35,bellH);
  ctx.lineTo(topR*1.35,bellH);
  ctx.bezierCurveTo(topR*1.9,bellH*.8,topR*1.55,bellH*.45,topR,0);
  ctx.closePath();
  const g=ctx.createLinearGradient(-topR,0,topR,0);
  g.addColorStop(0,'#5a6878');g.addColorStop(.5,'#8a9aa8');g.addColorStop(1,'#4a5868');
  ctx.fillStyle=g;ctx.fill();
  // Bell rim
  ctx.beginPath();ctx.ellipse(0,bellH,topR*1.35,topR*.4,0,0,Math.PI*2);
  ctx.fillStyle='#667788';ctx.fill();
  ctx.restore();
}

// ---- Launch pad ----
function drawPad(cx,padY,sc,alpha){
  ctx.globalAlpha=alpha;
  // Main tower
  ctx.strokeStyle='#3a5060';ctx.lineWidth=sc*3;
  ctx.beginPath();ctx.moveTo(cx+sc*10,padY);ctx.lineTo(cx+sc*10,padY+sc*90);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx+sc*10,padY-sc*30);ctx.lineTo(cx+sc*55,padY-sc*30);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx+sc*55,padY-sc*30);ctx.lineTo(cx+sc*55,padY+sc*90);ctx.stroke();
  // Pad base
  ctx.fillStyle='#2a3a48';ctx.fillRect(cx-sc*80,padY,sc*160,sc*12);
  // Ground
  ctx.fillStyle='#18221a';ctx.fillRect(0,padY+sc*12,W,H);
  ctx.globalAlpha=1;
}

// ---- Sky ----
function drawSky(alt){
  const top=[0,3,10],bot=[10,22,65];
  const t2=[0,0,2],b2=[0,0,10];
  const g=ctx.createLinearGradient(0,0,0,H);
  function ir(a,b,t){return [lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)].map(Math.round).join(',');}
  g.addColorStop(0,`rgb(${ir(top,t2,alt)})`);
  g.addColorStop(.5,`rgb(${ir([5,14,45],[0,0,5],alt)})`);
  g.addColorStop(1,`rgb(${ir(bot,b2,alt)})`);
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
}
function drawHorizon(horizY){
  const gg=ctx.createLinearGradient(0,horizY,0,horizY+H*.35);
  gg.addColorStop(0,'#07100a');gg.addColorStop(1,'#040906');
  ctx.fillStyle=gg;ctx.fillRect(0,horizY,W,H);
  const ag=ctx.createLinearGradient(0,horizY-H*.09,0,horizY+H*.05);
  ag.addColorStop(0,'transparent');
  ag.addColorStop(.4,'rgba(15,45,110,.5)');
  ag.addColorStop(1,'transparent');
  ctx.fillStyle=ag;ctx.fillRect(0,horizY-H*.09,W,H*.14);
}
function drawCityLights(t,horizY,alpha){
  if(alpha<=0)return;
  CITY.forEach(l=>{
    const fl=l.fl+Math.sin(t*3.5+l.nx*20)*.07;
    ctx.globalAlpha=alpha*fl*.68;
    ctx.fillStyle=l.col;ctx.shadowColor=l.col;ctx.shadowBlur=5;
    ctx.beginPath();ctx.arc(l.nx*W,horizY+l.oy*H,l.r,0,Math.PI*2);ctx.fill();
  });
  ctx.globalAlpha=1;ctx.shadowBlur=0;
}
function drawStars(t,alpha){
  if(alpha<=0)return;
  STARS.forEach(s=>{
    ctx.globalAlpha=alpha*s.b*(.6+Math.sin(t*s.spd+s.tw)*.4);
    ctx.fillStyle='#ddeeff';
    ctx.beginPath();ctx.arc(s.nx*W,s.ny*H,s.r,0,Math.PI*2);ctx.fill();
  });
  ctx.globalAlpha=1;
}
function drawSpeedLines(t,intensity){
  if(intensity<.01)return;
  STREAKS.forEach(s=>{
    const y=(((t*1.9+s.phase)%1))*H;
    const g=ctx.createLinearGradient(s.nx*W,y,s.nx*W,y+s.len*H);
    g.addColorStop(0,'transparent');
    g.addColorStop(.5,`rgba(180,210,255,${intensity*s.alpha})`);
    g.addColorStop(1,'transparent');
    ctx.fillStyle=g;ctx.fillRect(s.nx*W-.5,y,1.2,s.len*H);
  });
}

// ---- Exhaust ----
function drawSRBFlame(cx,cy,sc,fp,t,alt){
  if(fp<=0)return;
  ctx.save();
  const fl=sc*55+alt*H*.5;
  const wb=Math.sin(t*20)*sc*3;
  // Smoke (SRBs produce white smoke)
  const sg=ctx.createLinearGradient(cx,cy,cx,cy+fl);
  sg.addColorStop(0,`rgba(220,210,200,${fp*.45})`);
  sg.addColorStop(.35,`rgba(180,175,170,${fp*.25})`);
  sg.addColorStop(.7,`rgba(140,140,140,${fp*.12})`);
  sg.addColorStop(1,'transparent');
  ctx.fillStyle=sg;
  const sw=sc*(18+alt*28);
  ctx.beginPath();
  ctx.moveTo(cx-sc*7,cy);
  ctx.bezierCurveTo(cx-sw+wb,cy+fl*.4,cx-sw*1.6+wb*1.5,cy+fl*.8,cx-sw*.3+wb*2,cy+fl);
  ctx.bezierCurveTo(cx,cy+fl*1.03,cx,cy+fl*1.03,cx+sw*.3+wb*2,cy+fl);
  ctx.bezierCurveTo(cx+sw*1.6+wb*1.5,cy+fl*.8,cx+sw+wb,cy+fl*.4,cx+sc*7,cy);
  ctx.closePath();ctx.fill();
  // Flame core (orange)
  const fc=ctx.createLinearGradient(cx,cy,cx,cy+sc*40);
  fc.addColorStop(0,`rgba(255,200,80,${fp*.9})`);
  fc.addColorStop(.5,`rgba(255,100,10,${fp*.7})`);
  fc.addColorStop(1,'transparent');
  ctx.fillStyle=fc;ctx.shadowColor='#ff6600';ctx.shadowBlur=30*fp;
  ctx.beginPath();ctx.ellipse(cx+wb*.3,cy+sc*18,sc*(9+fp*4),sc*22,0,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
  if(fp>.4&&Math.random()<.75)spawnSmoke(cx,cy+sc*30,sc*1.5);
  ctx.restore();
}
function drawSSME(cx,cy,sc,fp,t,alt){
  if(fp<=0)return;
  ctx.save();
  const fl=sc*28+alt*H*.22;
  // SSMEs burn LH2/LOX — nearly transparent blue-white
  const bg=ctx.createRadialGradient(cx,cy,0,cx,cy+fl*.5,fl*.55);
  bg.addColorStop(0,`rgba(220,240,255,${fp*.85})`);
  bg.addColorStop(.3,`rgba(160,210,255,${fp*.55})`);
  bg.addColorStop(.7,`rgba(80,160,220,${fp*.2})`);
  bg.addColorStop(1,'transparent');
  ctx.fillStyle=bg;ctx.shadowColor='#88ccff';ctx.shadowBlur=20*fp;
  ctx.beginPath();ctx.ellipse(cx,cy+fl*.4,sc*(5+fp*3),fl*.5,0,0,Math.PI*2);ctx.fill();
  // Hot core
  ctx.shadowColor='#fff';ctx.shadowBlur=15;
  const ic=ctx.createRadialGradient(cx,cy,0,cx,cy+sc*5,sc*6);
  ic.addColorStop(0,`rgba(255,255,255,${fp})`);
  ic.addColorStop(.5,`rgba(200,230,255,${fp*.8})`);
  ic.addColorStop(1,'transparent');
  ctx.fillStyle=ic;ctx.beginPath();ctx.arc(cx,cy+sc*4,sc*6,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
  if(fp>.5&&Math.random()<.55)spawnHot(cx,cy,sc,fp);
  ctx.restore();
}
function spawnHot(cx,cy,sc,fp){
  const spd=(1+Math.random()*3.5)*sc*.22*fp;
  hotP.push({x:cx+(Math.random()-.5)*sc*4,y:cy,
    vx:(Math.random()-.5)*spd*.7,vy:spd*.85+Math.random()*spd,
    life:1,max:.2+Math.random()*.3,r:(1+Math.random()*2.2)*sc*.2,
    col:Math.random()>.5?'#ffcc00':'#88ccff'});
}
function spawnSmoke(cx,cy,sc){
  smokeP.push({x:cx+(Math.random()-.5)*sc*10,y:cy,
    vx:(Math.random()-.5)*1.2,vy:.5+Math.random()*.9,
    life:1,max:.7+Math.random()*1,r:(3+Math.random()*5)*sc*.28});
}
function updateParticles(){
  hotP=hotP.filter(p=>{
    p.x+=p.vx;p.y+=p.vy;p.vx*=.93;p.vy*=.97;
    p.life-=dt/p.max;if(p.life<=0)return false;
    ctx.globalAlpha=p.life*p.life*.7;ctx.fillStyle=p.col;
    ctx.shadowColor=p.col;ctx.shadowBlur=4;
    ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
    return true;
  });
  smokeP=smokeP.filter(p=>{
    p.x+=p.vx;p.y+=p.vy;p.r+=dt*4.5;p.life-=dt/p.max;if(p.life<=0)return false;
    ctx.globalAlpha=Math.min(p.life,.38)*.28;ctx.shadowBlur=0;
    const v=35+Math.floor(18*p.life);ctx.fillStyle=`rgb(${v},${v},${v})`;
    ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
    return true;
  });
  ctx.globalAlpha=1;ctx.shadowBlur=0;
}

// ---- Launch HUD ----
function drawLaunchHUD(t,alt){
  ctx.textAlign='left';
  // Countdown
  if(t<PH.ignition[0]&&t>LO+.8){
    const secs=Math.ceil(PH.ignition[0]-t);
    ctx.save();
    ctx.globalAlpha=.55+Math.sin(t*10)*.45;
    ctx.shadowColor='#ff4400';ctx.shadowBlur=25;ctx.fillStyle='#ff6622';
    ctx.font=`bold ${Math.round(W*.055)}px Courier New`;ctx.textAlign='center';
    ctx.fillText(`T − ${secs}`,W*.5,H*.2);ctx.restore();
    const sa=clamp((t-LO-.8)/.6,0,1)*.65;
    ctx.globalAlpha=sa;ctx.fillStyle='#88aacc';
    ctx.font=`${Math.round(W*.009)}px Courier New`;
    ctx.fillText('▸ MISE: ZEMSKÁ OBĚŽNÁ DRÁHA LEO — 408 KM',W*.04,H*.11);
    ctx.fillText('▸ SYSTÉMY: NOMINAL  ·  5 MOTORŮ ONLINE',W*.04,H*.155);
    ctx.globalAlpha=1;
  }
  // IGNITION
  if(t>=PH.ignition[0]&&t<PH.ignition[0]+1.2){
    const f=eO(clamp((t-PH.ignition[0])/.22,0,1))*(1-clamp((t-PH.ignition[0]-.82)/.38,0,1));
    ctx.save();ctx.globalAlpha=f;ctx.shadowColor='#ff8800';ctx.shadowBlur=50;
    ctx.fillStyle='#ffaa00';ctx.font=`bold ${Math.round(W*.062)}px Courier New`;
    ctx.textAlign='center';ctx.fillText('IGNITION',W*.5,H*.2);ctx.restore();
  }
  // Ascent telemetry
  if(t>PH.ascent[0]+.8&&alt<.86){
    const ap=pt(t,PH.ascent);
    const altKm=Math.round(eI(ap)*420);
    const vel=(ap*7.3+.3).toFixed(1);
    const mach=Math.round(ap*26+.8);
    const ha=clamp((t-PH.ascent[0]-.8)/.6,0,1)*clamp((.86-alt)/.22,0,1)*.75;
    ctx.globalAlpha=ha;ctx.fillStyle='rgba(0,220,190,.8)';
    ctx.font=`${Math.round(W*.009)}px Courier New`;
    ctx.fillText(`ALT: ${altKm} KM`,W*.04,H*.11);
    ctx.fillText(`V: ${vel} KM/S  ·  MACH ${mach}`,W*.04,H*.155);
    if(altKm>80)ctx.fillText('▸ HRANICE KÁRMÁNOVY LINIE',W*.04,H*.2);
    if(altKm>200)ctx.fillText('▸ ORBITÁLNÍ PŘECHOD',W*.04,H*.245);
    ctx.globalAlpha=1;
  }
  // SRB separation
  if(pt(t,PH.srbSep)>.05&&pt(t,PH.srbSep)<.95){
    const sp=pt(t,PH.srbSep);const sa=1-Math.abs(sp-.5)/.5;
    ctx.save();ctx.globalAlpha=sa;ctx.shadowColor='#ffcc00';ctx.shadowBlur=16;
    ctx.fillStyle='#ffcc00';ctx.font=`${Math.round(W*.011)}px Courier New`;
    ctx.textAlign='center';ctx.fillText('◈  ODPOJENÍ SRB',W*.5,H*.18);ctx.restore();
  }
  // ET separation
  if(pt(t,PH.etSep)>.05){
    const ep=pt(t,PH.etSep);const ea=1-Math.abs(ep-.5)/.5;
    ctx.save();ctx.globalAlpha=ea;ctx.shadowColor='#ff9900';ctx.shadowBlur=16;
    ctx.fillStyle='#ff9900';ctx.font=`${Math.round(W*.011)}px Courier New`;
    ctx.textAlign='center';ctx.fillText('◈  ODPOJENÍ HLAVNÍ NÁDRŽE',W*.5,H*.18);ctx.restore();
  }
}

// ================================================================
//  ORBIT SCENE
// ================================================================
function drawOrbitScene(t){
  ctx.fillStyle='#000204';ctx.fillRect(0,0,W,H);
  drawStars(t,1);
  drawEarth(t);
  const op=pt(t,PH.orbit);
  const oa=eO(clamp(op/.3,0,1));
  const rx=W*.12+op*W*.76;
  const ry=H*.40+Math.sin(t*.9)*12;
  ctx.globalAlpha=oa;
  drawOrbiter(rx,ry,.52);  // Just the orbiter alone in orbit
  ctx.globalAlpha=1;
  if(op>.28){
    const ta=eO(clamp((op-.28)/.25,0,1))*(1-clamp((op-.86)/.14,0,1));
    ctx.save();ctx.globalAlpha=ta;
    ctx.shadowColor='#00d4ff';ctx.shadowBlur=22;ctx.fillStyle='#00d4ff';
    ctx.font=`${Math.round(W*.012)}px Courier New`;ctx.textAlign='center';
    ctx.fillText('◈  ZEMSKÁ OBĚŽNÁ DRÁHA DOSAŽENA  ◈',W*.5,H*.24);
    ctx.shadowBlur=0;ctx.fillStyle='rgba(0,200,200,.45)';
    ctx.font=`${Math.round(W*.0085)}px Courier New`;
    ctx.fillText('VÝŠKA: 408 KM  ·  RYCHLOST: 7.7 KM/S  ·  INKLINACE: 51.6°',W*.5,H*.30);
    ctx.restore();
  }
  if(op>.82){
    ctx.globalAlpha=eI(clamp((op-.82)/.18,0,1));
    ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
  }
}

function drawEarth(t){
  const op=pt(t,PH.orbit);const ea=eO(clamp(op/.35,0,1));
  const eR=H*1.25,eCY=H+eR*.32;
  ctx.save();ctx.globalAlpha=ea;
  // Outer atmosphere glow
  const ao=ctx.createRadialGradient(W*.5,eCY,eR-H*.04,W*.5,eCY,eR+H*.12);
  ao.addColorStop(0,'rgba(60,140,255,0)');ao.addColorStop(.3,'rgba(60,165,255,.42)');
  ao.addColorStop(.75,'rgba(30,80,200,.15)');ao.addColorStop(1,'transparent');
  ctx.fillStyle=ao;ctx.beginPath();ctx.arc(W*.5,eCY,eR+H*.12,0,Math.PI*2);ctx.fill();
  // Surface
  const eg=ctx.createRadialGradient(W*.32,eCY-eR*.3,0,W*.5,eCY,eR);
  eg.addColorStop(0,'#1e4478');eg.addColorStop(.35,'#1a3a6a');
  eg.addColorStop(.7,'#0d2850');eg.addColorStop(1,'#050f25');
  ctx.fillStyle=eg;ctx.beginPath();ctx.arc(W*.5,eCY,eR,0,Math.PI*2);ctx.fill();
  // Ocean shimmer
  const os=ctx.createRadialGradient(W*.35,eCY-eR*.4,0,W*.35,eCY-eR*.4,eR*.5);
  os.addColorStop(0,'rgba(100,180,255,.1)');os.addColorStop(1,'transparent');
  ctx.fillStyle=os;ctx.beginPath();ctx.arc(W*.5,eCY,eR,0,Math.PI*2);ctx.fill();
  // Clouds
  [{a:-.28,d:.93},{a:.12,d:.945},{a:.52,d:.915},{a:-.62,d:.935},{a:.82,d:.95},{a:1.15,d:.92}].forEach(c=>{
    const ang=Math.PI+c.a;
    const ccx=W*.5+Math.cos(ang)*eR*c.d,ccy=eCY+Math.sin(ang)*eR*c.d;
    const cg=ctx.createRadialGradient(ccx,ccy,0,ccx,ccy,eR*.075);
    cg.addColorStop(0,'rgba(210,225,255,.22)');cg.addColorStop(1,'transparent');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(ccx,ccy,eR*.075,0,Math.PI*2);ctx.fill();
  });
  // Rim
  const ar=ctx.createRadialGradient(W*.5,eCY,eR-H*.025,W*.5,eCY,eR+H*.04);
  ar.addColorStop(0,'rgba(80,190,255,0)');ar.addColorStop(.35,'rgba(80,200,255,.55)');
  ar.addColorStop(.75,'rgba(40,120,220,.2)');ar.addColorStop(1,'transparent');
  ctx.fillStyle=ar;ctx.beginPath();ctx.arc(W*.5,eCY,eR+H*.04,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

// ================================================================
//  TITLE SCENE
// ================================================================
function drawTitleScene(t){
  const tp=pt(t,PH.title);
  ctx.fillStyle='#000204';ctx.fillRect(0,0,W,H);
  // Nebula
  const ng=ctx.createRadialGradient(W*.5,H*.42,0,W*.5,H*.42,W*.65);
  ng.addColorStop(0,`rgba(25,50,130,${tp*.18})`);ng.addColorStop(.5,`rgba(18,8,55,${tp*.12})`);ng.addColorStop(1,'transparent');
  ctx.fillStyle=ng;ctx.fillRect(0,0,W,H);
  const lg=ctx.createRadialGradient(W*.08,H*.5,0,W*.08,H*.5,W*.3);
  lg.addColorStop(0,`rgba(0,212,255,${tp*.06})`);lg.addColorStop(1,'transparent');
  ctx.fillStyle=lg;ctx.fillRect(0,0,W,H);
  const rg=ctx.createRadialGradient(W*.92,H*.5,0,W*.92,H*.5,W*.3);
  rg.addColorStop(0,`rgba(255,149,0,${tp*.07})`);rg.addColorStop(1,'transparent');
  ctx.fillStyle=rg;ctx.fillRect(0,0,W,H);
  drawStars(t,1);
  if(tp>.18){
    const la=eO(clamp((tp-.18)/.3,0,1));
    ctx.globalAlpha=la*.32;ctx.strokeStyle='rgba(255,149,0,.5)';ctx.lineWidth=.5;ctx.setLineDash([6,8]);
    ctx.beginPath();ctx.moveTo(W*.1,H*.38);ctx.lineTo(W*.9,H*.38);ctx.stroke();
    ctx.beginPath();ctx.moveTo(W*.1,H*.66);ctx.lineTo(W*.9,H*.66);ctx.stroke();
    ctx.setLineDash([]);ctx.globalAlpha=1;
  }
  const sa=eO(clamp(tp/.32,0,1));
  if(sa>.01){
    ctx.save();ctx.globalAlpha=sa;ctx.shadowColor='#00d4ff';ctx.shadowBlur=Math.round(35*sa);
    ctx.fillStyle='#00d4ff';ctx.font=`bold ${Math.round(W*.028)}px Courier New`;
    ctx.textAlign='center';ctx.letterSpacing=`${Math.round(W*.013)}px`;
    ctx.fillText('SPACE',W*.5,H*.44);ctx.restore();
  }
  const tra=eO(clamp((tp-.13)/.32,0,1));
  if(tra>.01){
    ctx.save();ctx.globalAlpha=tra;ctx.shadowColor='#ff9500';ctx.shadowBlur=Math.round(70*tra);
    ctx.fillStyle='#ff9500';ctx.font=`bold ${Math.round(W*.1)}px Courier New`;
    ctx.textAlign='center';ctx.letterSpacing=`${Math.round(W*.005)}px`;
    ctx.fillText('TRADER',W*.5,H*.61);
    ctx.shadowBlur=Math.round(140*tra*tra);ctx.globalAlpha=tra*.32;ctx.fillStyle='#ffcc44';
    ctx.fillText('TRADER',W*.5,H*.61);ctx.restore();
  }
  if(tp>.52){
    const sub=eO(clamp((tp-.52)/.28,0,1));
    ctx.globalAlpha=sub*.6;ctx.fillStyle='#88bbdd';
    ctx.font=`${Math.round(W*.012)}px Courier New`;ctx.textAlign='center';ctx.letterSpacing='3px';
    ctx.fillText('Elite vesmírný obchod a průzkum · v1.0',W*.5,H*.69);ctx.globalAlpha=1;
  }
  if(tp>.65){
    const va=eO(clamp((tp-.65)/.22,0,1));
    ctx.globalAlpha=va*.3;ctx.fillStyle='#e8a060';
    ctx.font=`${Math.round(W*.0075)}px Courier New`;ctx.textAlign='center';ctx.letterSpacing='2px';
    ctx.fillText('JILUKU GAMES  ·  2025',W*.5,H*.75);ctx.globalAlpha=1;
  }
  if(tp>.72){
    const ca=eO(clamp((tp-.72)/.22,0,1))*(0.4+Math.sin(t*2.8)*.28);
    ctx.globalAlpha=ca;ctx.fillStyle='#e8a060';
    ctx.font=`${Math.round(W*.009)}px Courier New`;ctx.textAlign='center';ctx.letterSpacing='3px';
    ctx.fillText('[ Klikni nebo stiskni klávesu ]',W*.5,H*.85);ctx.globalAlpha=1;
  }
  if(tp>.93){
    ctx.globalAlpha=eI(clamp((tp-.93)/.07,0,1));
    ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
  }
}

// ================================================================
document.addEventListener('DOMContentLoaded',init);
})();
