// ===== SPACE TRADER — rendering =====
// Každá funkce: ctx.save() + ctx.restore(), ŽÁDNÉ leaky

// Globální reference
let ctx,W,H,camX=0,camY=0,shakeX=0,shakeY=0;
let camZoom=1.0;

function toScreen(wx,wy){return{x:wx-camX+shakeX,y:wy-camY+shakeY};}
function inView(sx,sy,pad=200){
  const p=pad*Math.max(1,1/Math.max(camZoom,0.05));
  return sx>-p&&sx<W+p&&sy>-p&&sy<H+p;
}

// ---- Pozadí ----
function renderBackground(chunks,t){
  ctx.save();
  ctx.fillStyle='#000408';ctx.fillRect(0,0,W,H);
  ctx.restore();

  // Hvězdy s paralaxou
  const layers=[{p:0.08,scale:0.6},{p:0.18,scale:0.85},{p:0.32,scale:1.1}];
  layers.forEach(layer=>{
    ctx.save();
    chunks.forEach(ch=>{
      ch.stars.forEach(s=>{
        const ox=camX*layer.p, oy=camY*layer.p;
        const sx=s.x-ox, sy=s.y-oy;
        if(!inView(sx,sy,10))return;
        const twinkle=0.7+Math.sin(t*1.8+s.twinkle)*0.3;
        ctx.globalAlpha=s.bright*twinkle;
        if(s.hue===210) ctx.fillStyle='#90b8ff';
        else if(s.hue===30) ctx.fillStyle='#ffbb60';
        else if(s.hue===60) ctx.fillStyle='#ffeeaa';
        else ctx.fillStyle='#e8eeff';
        const r=s.r*layer.scale;
        ctx.beginPath();ctx.arc(sx,sy,r,0,Math.PI*2);ctx.fill();
        // Záře pro větší hvězdy
        if(r>0.85&&s.bright>0.65){
          ctx.globalAlpha=s.bright*twinkle*0.22;
          ctx.fillStyle='#ffffff';
          ctx.beginPath();ctx.arc(sx,sy,r*3,0,Math.PI*2);ctx.fill();
        }
        // Křížový záblesk pro nejjasnější hvězdy
        if(s.sparkle&&r>0.8){
          ctx.globalAlpha=s.bright*twinkle*0.55;
          ctx.strokeStyle='#ffffff';ctx.lineWidth=0.6;
          const sl=r*10;
          ctx.beginPath();ctx.moveTo(sx-sl,sy);ctx.lineTo(sx+sl,sy);ctx.stroke();
          ctx.beginPath();ctx.moveTo(sx,sy-sl);ctx.lineTo(sx,sy+sl);ctx.stroke();
          // Diagonála slabší
          ctx.globalAlpha=s.bright*twinkle*0.2;
          const sd=sl*0.5;
          ctx.beginPath();ctx.moveTo(sx-sd,sy-sd);ctx.lineTo(sx+sd,sy+sd);ctx.stroke();
          ctx.beginPath();ctx.moveTo(sx+sd,sy-sd);ctx.lineTo(sx-sd,sy+sd);ctx.stroke();
        }
      });
    });
    ctx.restore();
  });

  // Mlhoviny
  chunks.forEach(ch=>{
    if(!ch.nebula)return;
    const n=ch.nebula,{x:sx,y:sy}=toScreen(n.x,n.y);
    if(!inView(sx,sy,n.r))return;
    ctx.save();
    const gr=ctx.createRadialGradient(sx,sy,0,sx,sy,n.r);
    gr.addColorStop(0,n.col+(n.alpha*1.6).toFixed(3)+')');
    gr.addColorStop(0.4,n.col+(n.alpha*0.8).toFixed(3)+')');
    gr.addColorStop(1,n.col+'0)');
    ctx.fillStyle=gr;ctx.beginPath();ctx.arc(sx,sy,n.r,0,Math.PI*2);ctx.fill();
    ctx.restore();
  });
}

// ---- Sluneční soustava ----
function renderSystems(chunks,t){
  chunks.forEach(ch=>{
    if(!ch.system)return;
    const sys=ch.system;
    const{x:sx,y:sy}=toScreen(sys.sx,sys.sy);

    // Oběžné dráhy (tenké kroužky)
    ctx.save();
    ctx.strokeStyle='rgba(255,150,40,0.08)';ctx.lineWidth=1;ctx.setLineDash([4,8]);
    sys.planets.forEach(p=>{
      if(!inView(sx,sy,p.orbit+50))return;
      ctx.beginPath();ctx.arc(sx,sy,p.orbit,0,Math.PI*2);ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.restore();

    // Hvězda
    if(inView(sx,sy,sys.r*4)){
      ctx.save();
      // Záře
      const glowR=sys.r*3.5;
      const gr=ctx.createRadialGradient(sx,sy,0,sx,sy,glowR);
      gr.addColorStop(0,sys.glow+'0.12)');gr.addColorStop(0.4,sys.glow+'0.04)');gr.addColorStop(1,sys.glow+'0)');
      ctx.fillStyle=gr;ctx.beginPath();ctx.arc(sx,sy,glowR,0,Math.PI*2);ctx.fill();
      // Corona pulzace
      const pulse=0.6+Math.sin(t*1.4)*0.2+Math.sin(t*2.3)*0.1;
      ctx.globalAlpha=pulse*0.15;ctx.strokeStyle=sys.color;ctx.lineWidth=sys.r*0.4;
      ctx.beginPath();ctx.arc(sx,sy,sys.r*1.15,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
      // Tělo
      const bodyGr=ctx.createRadialGradient(sx-sys.r*0.3,sy-sys.r*0.3,1,sx,sy,sys.r);
      bodyGr.addColorStop(0,'#ffffff');bodyGr.addColorStop(0.25,sys.color);bodyGr.addColorStop(0.7,darken(sys.color,30));bodyGr.addColorStop(1,'#1a0800');
      ctx.fillStyle=bodyGr;ctx.beginPath();ctx.arc(sx,sy,sys.r,0,Math.PI*2);ctx.fill();
      // Název hvězdy (jen u velké — Slunce má r>=100)
      if(sys.r>=100&&inView(sx,sy,sys.r)){
        ctx.globalAlpha=0.55;ctx.textAlign='center';
        ctx.font='bold 11px "Courier New", monospace';ctx.fillStyle='#ffee88';
        ctx.fillText('SOL',sx,sy+sys.r+18);
        ctx.globalAlpha=1;
      }
      ctx.restore();
    }

    // Planety
    sys.planets.forEach(p=>{
      const pos=getPlanetPos(p,sys.sx,sys.sy,t);
      const{x:px,y:py}=toScreen(pos.x,pos.y);
      if(!inView(px,py,p.r*(p.rings?4.5:2.5)))return;
      ctx.save();

      // Prstence — vrstva pod planetou
      if(p.rings){
        ctx.save();ctx.translate(px,py);
        ctx.strokeStyle=p.color+'35';ctx.lineWidth=p.r*0.5;
        ctx.beginPath();ctx.ellipse(0,0,p.r*2.9,p.r*0.52,0.3,0,Math.PI*2);ctx.stroke();
        ctx.strokeStyle=p.color+'20';ctx.lineWidth=p.r*0.28;
        ctx.beginPath();ctx.ellipse(0,0,p.r*3.6,p.r*0.68,0.3,0,Math.PI*2);ctx.stroke();
        ctx.restore();
      }

      // Atmosféra
      if(p.atmo){
        const atGr=ctx.createRadialGradient(px,py,p.r*0.75,px,py,p.r*1.7);
        atGr.addColorStop(0,p.color+'38');atGr.addColorStop(1,p.color+'00');
        ctx.fillStyle=atGr;ctx.beginPath();ctx.arc(px,py,p.r*1.7,0,Math.PI*2);ctx.fill();
      }

      // Tělo planety se clip — povrch nepřetéká ven
      ctx.save();
      ctx.beginPath();ctx.arc(px,py,p.r,0,Math.PI*2);ctx.clip();

      // Základní gradient
      const pg=ctx.createRadialGradient(px-p.r*0.32,py-p.r*0.28,p.r*0.05,px,py,p.r);
      pg.addColorStop(0,lighten(p.color,50));pg.addColorStop(0.5,p.color);pg.addColorStop(1,darken(p.color,50));
      ctx.fillStyle=pg;ctx.fillRect(px-p.r,py-p.r,p.r*2,p.r*2);

      // Povrchové detaily podle jména planety
      if(p.name==='Země'){
        // Oceán (modrý základ je v gradientu)
        // Kontinenty
        ctx.globalAlpha=0.55;ctx.fillStyle='#2e8b30';
        ctx.beginPath();ctx.ellipse(px-p.r*0.18,py-p.r*0.15,p.r*0.42,p.r*0.32,0.5,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.ellipse(px+p.r*0.28,py+p.r*0.05,p.r*0.28,p.r*0.38,-0.3,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.ellipse(px-p.r*0.05,py+p.r*0.38,p.r*0.35,p.r*0.2,0.8,0,Math.PI*2);ctx.fill();
        // Mraky
        ctx.globalAlpha=0.38;ctx.fillStyle='#ffffff';
        ctx.beginPath();ctx.ellipse(px-p.r*0.25,py+p.r*0.28,p.r*0.42,p.r*0.11,0.7,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.ellipse(px+p.r*0.1,py-p.r*0.42,p.r*0.38,p.r*0.1,-0.4,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.ellipse(px-p.r*0.4,py-p.r*0.05,p.r*0.22,p.r*0.08,0.2,0,Math.PI*2);ctx.fill();
      } else if(p.name==='Mars'){
        // Tmavé skvrny / kaňony
        ctx.globalAlpha=0.38;ctx.fillStyle='#7a1808';
        ctx.beginPath();ctx.ellipse(px-p.r*0.12,py+p.r*0.08,p.r*0.55,p.r*0.38,-0.4,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.ellipse(px+p.r*0.3,py-p.r*0.2,p.r*0.22,p.r*0.18,0.6,0,Math.PI*2);ctx.fill();
        // Polární čepičky
        ctx.globalAlpha=0.82;ctx.fillStyle='#f0f0f0';
        ctx.beginPath();ctx.ellipse(px,py-p.r*0.82,p.r*0.28,p.r*0.11,0,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=0.5;
        ctx.beginPath();ctx.ellipse(px,py+p.r*0.84,p.r*0.14,p.r*0.07,0,0,Math.PI*2);ctx.fill();
      } else if(p.name==='Jupiter'){
        // Horizontální pásma
        ctx.globalAlpha=0.32;
        const jBands=[['#d4a068',0.18],['#b87040',0.28],['#d4a870',0.16],['#c07840',0.24],['#d09060',0.14]];
        let jy=py-p.r;
        jBands.forEach(([col,frac])=>{
          ctx.fillStyle=col;
          ctx.fillRect(px-p.r,jy,p.r*2,p.r*2*frac);
          jy+=p.r*2*frac;
        });
        // Velká červená skvrna
        ctx.globalAlpha=0.55;ctx.fillStyle='#bb2808';
        ctx.beginPath();ctx.ellipse(px+p.r*0.22,py+p.r*0.18,p.r*0.28,p.r*0.16,0.1,0,Math.PI*2);ctx.fill();
      } else if(p.name==='Saturn'){
        // Jemná pásma
        ctx.globalAlpha=0.22;
        for(let i=0;i<5;i++){
          ctx.fillStyle=i%2===0?'#c0a038':'#d4b860';
          ctx.fillRect(px-p.r,py-p.r+p.r*0.4*i,p.r*2,p.r*0.4);
        }
      } else if(p.name==='Venuše'){
        // Oblačný závoj
        ctx.globalAlpha=0.3;ctx.fillStyle='#f0e090';
        ctx.beginPath();ctx.ellipse(px,py-p.r*0.2,p.r*0.8,p.r*0.5,0.3,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.ellipse(px-p.r*0.1,py+p.r*0.3,p.r*0.7,p.r*0.35,-0.4,0,Math.PI*2);ctx.fill();
      }
      ctx.globalAlpha=1;

      // Lesk (highlight)
      const sg=ctx.createRadialGradient(px-p.r*0.38,py-p.r*0.38,0,px-p.r*0.1,py-p.r*0.1,p.r*1.1);
      sg.addColorStop(0,'rgba(255,255,255,0.45)');sg.addColorStop(0.4,'rgba(255,255,255,0.08)');sg.addColorStop(1,'transparent');
      ctx.fillStyle=sg;ctx.fillRect(px-p.r,py-p.r,p.r*2,p.r*2);

      ctx.restore(); // Konec clip

      // Prstence — vrstva nad planetou (jen polovina efektu)
      if(p.rings){
        ctx.save();ctx.translate(px,py);
        ctx.strokeStyle=p.color+'22';ctx.lineWidth=p.r*0.32;
        ctx.beginPath();ctx.ellipse(0,0,p.r*2.9,p.r*0.52,0.3,0,Math.PI*2);ctx.stroke();
        ctx.restore();
      }

      // Název planety
      if(p.name){
        ctx.globalAlpha=0.75;
        ctx.font=`bold ${Math.max(9,Math.min(14,p.r*0.75))}px "Courier New", monospace`;
        ctx.fillStyle='#ffd080';ctx.textAlign='center';ctx.shadowColor='#000';ctx.shadowBlur=4;
        ctx.fillText(p.name,px,py-p.r*(p.rings?4.0:1.85)-2);
        ctx.shadowBlur=0;
      }
      ctx.restore();
    });

    // Měsíce — oběžné dráhy + tělesa (samostatný průchod)
    sys.planets.forEach(p=>{
      if(!p.moons?.length)return;
      const pos=getPlanetPos(p,sys.sx,sys.sy,t);
      const{x:px,y:py}=toScreen(pos.x,pos.y);
      const maxOrb=p.moons.reduce((m,mn)=>Math.max(m,mn.orbit),0);
      if(!inView(px,py,maxOrb+60))return;
      // Oběžné dráhy měsíců (pohybují se s planetou)
      ctx.save();
      ctx.strokeStyle='rgba(160,170,220,0.18)';ctx.lineWidth=0.6;ctx.setLineDash([3,7]);
      p.moons.forEach(mn=>{ctx.beginPath();ctx.arc(px,py,mn.orbit,0,Math.PI*2);ctx.stroke();});
      ctx.setLineDash([]);ctx.restore();
      // Tělesa měsíců
      p.moons.forEach(mn=>{
        const mwp=getMoonPos(mn,pos.x,pos.y,t);
        const{x:mx,y:my}=toScreen(mwp.x,mwp.y);
        if(!inView(mx,my,mn.r+15))return;
        ctx.save();
        ctx.beginPath();ctx.arc(mx,my,mn.r,0,Math.PI*2);
        const mg=ctx.createRadialGradient(mx-mn.r*0.3,my-mn.r*0.3,0.5,mx,my,mn.r);
        mg.addColorStop(0,lighten(mn.color,25));mg.addColorStop(1,darken(mn.color,30));
        ctx.fillStyle=mg;ctx.fill();
        ctx.strokeStyle=mn.color+'44';ctx.lineWidth=0.5;ctx.stroke();
        ctx.globalAlpha=0.55;ctx.font='8px "Courier New",monospace';
        ctx.fillStyle='#cccccc';ctx.textAlign='center';ctx.shadowColor='#000';ctx.shadowBlur=3;
        ctx.fillText(mn.name,mx,my-mn.r-3);ctx.shadowBlur=0;ctx.globalAlpha=1;
        ctx.restore();
      });
    });
  });
}

// ---- Stanice (ISS styl) ----
function stationRoundRect(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);
  ctx.closePath();
}

function renderStation(st,t,nearDock,dockable){
  const{x:sx,y:sy}=toScreen(st.x,st.y);
  const R=st.r;
  if(!inView(sx,sy,R*6))return;

  ctx.save();
  ctx.translate(sx,sy);
  ctx.rotate(st.angle);

  // Záře
  const gGr=ctx.createRadialGradient(0,0,0,0,0,R*4.5);
  gGr.addColorStop(0,st.color+'14');gGr.addColorStop(1,st.color+'00');
  ctx.fillStyle=gGr;ctx.beginPath();ctx.arc(0,0,R*4.5,0,Math.PI*2);ctx.fill();

  // ===== HLAVNÍ TRUSS (horizontální nosník) =====
  const tL=R*3.6, tH=R*0.13;
  ctx.fillStyle='#1a2535';ctx.strokeStyle=st.color+'55';ctx.lineWidth=0.8;
  ctx.fillRect(-tL/2,-tH/2,tL,tH);ctx.strokeRect(-tL/2,-tH/2,tL,tH);
  // Segmenty nosníku
  ctx.strokeStyle=st.color+'25';ctx.lineWidth=0.5;
  for(let i=1;i<10;i++){const x=-tL/2+i*(tL/10);ctx.beginPath();ctx.moveTo(x,-tH/2);ctx.lineTo(x,tH/2);ctx.stroke();}
  // Diagonální výztuhy
  ctx.strokeStyle=st.color+'18';
  for(let i=0;i<5;i++){
    const x0=-tL/2+i*(tL/5),x1=x0+tL/5;
    ctx.beginPath();ctx.moveTo(x0,-tH/2);ctx.lineTo(x1,tH/2);ctx.stroke();
  }

  // ===== SOLÁRNÍ PANELY =====
  const drawPanelSet=(tx,mH,pW,pH)=>{
    // Vertikální masty od truss
    ctx.strokeStyle=st.color+'55';ctx.lineWidth=R*0.042;
    ctx.beginPath();ctx.moveTo(tx,-tH/2);ctx.lineTo(tx,-mH);ctx.stroke();
    ctx.beginPath();ctx.moveTo(tx,tH/2);ctx.lineTo(tx,mH);ctx.stroke();
    // Koncová lišta mast
    ctx.strokeStyle=st.color+'40';ctx.lineWidth=R*0.06;
    ctx.beginPath();ctx.moveTo(tx-pW*0.1,-mH);ctx.lineTo(tx+pW*0.1,-mH);ctx.stroke();
    ctx.beginPath();ctx.moveTo(tx-pW*0.1,mH);ctx.lineTo(tx+pW*0.1,mH);ctx.stroke();

    const drawPanel=(py2,flip)=>{
      // Panel tělo
      ctx.fillStyle='#0c1d32';ctx.strokeStyle='#2460a8';ctx.lineWidth=0.8;
      ctx.fillRect(tx-pW/2,py2,pW,pH*flip);ctx.strokeRect(tx-pW/2,py2,pW,pH*flip);
      // Buňky (7 sloupců × 2 řady)
      ctx.strokeStyle='#1a4a8880';ctx.lineWidth=0.35;
      for(let c=1;c<7;c++){const px2=tx-pW/2+c*(pW/7);ctx.beginPath();ctx.moveTo(px2,py2);ctx.lineTo(px2,py2+pH*flip);ctx.stroke();}
      ctx.beginPath();ctx.moveTo(tx-pW/2,py2+pH*flip*0.5);ctx.lineTo(tx+pW/2,py2+pH*flip*0.5);ctx.stroke();
      // Odlesk panelu
      ctx.globalAlpha=0.12;
      const pg=ctx.createLinearGradient(tx-pW/2,py2,tx+pW/2,py2);
      pg.addColorStop(0,'#4499ff');pg.addColorStop(0.5,'transparent');pg.addColorStop(1,'#2266cc');
      ctx.fillStyle=pg;ctx.fillRect(tx-pW/2,py2,pW,pH*flip);
      ctx.globalAlpha=1;
    };
    drawPanel(-mH,-1);  // horní panel (roste nahoru)
    drawPanel(mH,1);    // dolní panel (roste dolů)
  };

  const outerMH=R*0.72, outerPW=R*1.1, outerPH=R*0.33;
  const innerMH=R*0.58, innerPW=R*0.88, innerPH=R*0.27;

  // Outer sety
  drawPanelSet(-tL*0.42,outerMH,outerPW,outerPH);
  drawPanelSet(tL*0.42,outerMH,outerPW,outerPH);
  // Inner sety (tier 2+)
  if(R>=38){
    drawPanelSet(-tL*0.16,innerMH,innerPW,innerPH);
    drawPanelSet(tL*0.16,innerMH,innerPW,innerPH);
  }
  // Extra inner sety (tier 3 / velké stanice)
  if(R>=55){
    drawPanelSet(-tL*0.29,innerMH*0.9,innerPW*0.8,innerPH*0.9);
    drawPanelSet(tL*0.29,innerMH*0.9,innerPW*0.8,innerPH*0.9);
  }

  // ===== CENTRÁLNÍ MODULY (vertikální sada válců) =====
  const nMods=Math.max(3,Math.min(6,Math.round(R/12)));
  const mW=R*0.35, mH2=R*0.44;
  const totH=nMods*mH2;

  for(let i=0;i<nMods;i++){
    const my=-totH/2+i*mH2;
    const isFirst=i===0, isLast=i===nMods-1;
    const mc=isFirst||isLast?'#14202e':'#182538';
    ctx.fillStyle=mc;
    ctx.strokeStyle=st.color+(isFirst||isLast?'55':'88');
    ctx.lineWidth=1.1;
    stationRoundRect(-mW/2,my,mW,mH2,mW*0.28);
    ctx.fill();ctx.stroke();

    // Přepážka mezi moduly
    if(!isFirst){
      ctx.strokeStyle=st.color+'35';ctx.lineWidth=0.5;
      ctx.beginPath();ctx.moveTo(-mW/2,my);ctx.lineTo(mW/2,my);ctx.stroke();
    }

    // Okna (2 na modul, mírně pulzující)
    if(!isFirst&&!isLast){
      const wa=0.28+Math.sin(t*0.7+i*1.8)*0.08;
      ctx.globalAlpha=wa;ctx.fillStyle='#88d8ff';
      const wy2=my+mH2*0.32;
      ctx.beginPath();ctx.ellipse(-mW*0.22,wy2,mW*0.1,mW*0.075,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(mW*0.22,wy2,mW*0.1,mW*0.075,0,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;
    }

    // Radiátor (boční chladič) na každém druhém modulu
    if(i%2===1){
      const radW=mW*0.55, radH=mH2*0.5, radY=my+mH2*0.25;
      ctx.fillStyle='#0e1a28';ctx.strokeStyle=st.color+'30';ctx.lineWidth=0.5;
      ctx.fillRect(-mW/2-radW,radY,radW,radH);ctx.strokeRect(-mW/2-radW,radY,radW,radH);
      ctx.fillRect(mW/2,radY,radW,radH);ctx.strokeRect(mW/2,radY,radW,radH);
    }
  }

  // Spojovací uzel (Node) uprostřed
  ctx.fillStyle='#1c2d42';ctx.strokeStyle=st.color+'80';ctx.lineWidth=1.4;
  ctx.beginPath();ctx.arc(0,0,R*0.24,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.strokeStyle=st.color+'35';ctx.lineWidth=0.8;
  ctx.beginPath();ctx.arc(0,0,R*0.15,0,Math.PI*2);ctx.stroke();

  // ===== DOKOVACÍ PORT (pravá strana, na úrovni node) =====
  const dpX=R*0.88, dpW=R*0.26, dpH=R*0.42;
  // Hrdlo (krátký tunýlek)
  ctx.fillStyle='#0e1820';ctx.strokeStyle=st.color+'60';ctx.lineWidth=0.8;
  ctx.fillRect(R*0.22,-tH*0.9,dpX-R*0.22,tH*1.8);ctx.strokeRect(R*0.22,-tH*0.9,dpX-R*0.22,tH*1.8);
  // Port
  ctx.fillStyle='#050810';
  ctx.strokeStyle=dockable?'#00ff88':'rgba(255,150,0,0.8)';
  ctx.lineWidth=2;
  ctx.fillRect(dpX,-dpH/2,dpW,dpH);ctx.strokeRect(dpX,-dpH/2,dpW,dpH);
  // Vnitřní světlo
  ctx.globalAlpha=dockable?0.65:0.22;
  ctx.fillStyle=dockable?'#00ff88':st.color;
  ctx.fillRect(dpX+1.5,-dpH/2+1.5,dpW-3,dpH-3);
  ctx.globalAlpha=1;
  // Blikající vodící světla portu
  const dlB=0.4+Math.sin(t*4.5)*0.6;
  ctx.save();
  ctx.globalAlpha=dlB;ctx.fillStyle=dockable?'#00ff88':'#ffaa00';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=8;
  ctx.beginPath();ctx.arc(dpX+dpW/2,-dpH/2,R*0.045,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(dpX+dpW/2,dpH/2,R*0.045,0,Math.PI*2);ctx.fill();
  ctx.restore();

  // ===== NAVIGAČNÍ SVĚTLA =====
  const navLights=[
    {x:-tL/2,y:0,c:'#ff2020',freq:1.9},
    {x:tL/2, y:0,c:'#00dd44',freq:1.9+Math.PI},
    {x:0,y:-totH/2-R*0.15,c:'#ffffff',freq:3.1},
    {x:0,y:totH/2+R*0.15, c:'#ffffff',freq:3.1+1.2},
  ];
  navLights.forEach(l=>{
    const b=Math.sin(t*l.freq)*0.5+0.5;
    ctx.save();
    ctx.globalAlpha=0.2+b*0.8;
    ctx.fillStyle=l.c;ctx.shadowColor=l.c;ctx.shadowBlur=10;
    ctx.beginPath();ctx.arc(l.x,l.y,R*0.058,0,Math.PI*2);ctx.fill();
    if(b>0.7){ctx.globalAlpha=(b-0.7)*0.5;ctx.beginPath();ctx.arc(l.x,l.y,R*0.15,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  });

  ctx.restore();

  // ===== LABEL (bez rotace) =====
  ctx.save();
  ctx.textAlign='center';
  const labelY=sy-R*3.8;
  if(nearDock){
    ctx.font='bold 14px "Courier New", monospace';
    ctx.fillStyle=st.color;ctx.shadowColor=st.color;ctx.shadowBlur=8;
    ctx.fillText(st.name,sx,labelY);ctx.shadowBlur=0;
    ctx.font='11px "Courier New", monospace';
    ctx.fillStyle=dockable?'#00ff88':'rgba(255,150,40,0.85)';
    ctx.fillText(dockable?'▶ DOKOVACÍ PORT — VOLNÝ':'▷ Přiblíž se k dokovacímu portu',sx,labelY-18);
    ctx.fillStyle=st.color+'80';ctx.font='10px "Courier New", monospace';
    ctx.fillText('◆'.repeat(st.tier)+'◇'.repeat(Math.max(0,3-st.tier)),sx,sy+R*3.8+12);
  } else {
    ctx.font='10px "Courier New", monospace';ctx.fillStyle='rgba(255,150,40,0.5)';
    ctx.fillText(st.name,sx,sy-R*2.8);
  }
  ctx.restore();
}

// ---- Cinematická sekvence přistávání ----
function renderDockingSequence(gs,t){
  const anim=gs.dockAnim;
  if(!anim)return;
  const prog=anim.progress,p=gs.player,st=anim.station;
  // Zoom kvadratický — pomalu začíná, rychle zrychluje ke konci
  const zoom=1+prog*prog*3;

  // Svět + loď se zoomem — kamera je na stanici (nastaveno v updateDocking)
  ctx.save();
  ctx.translate(W/2,H/2);ctx.scale(zoom,zoom);ctx.translate(-W/2,-H/2);
  renderBackground(gs.chunks,t);
  renderSystems(gs.chunks,t);
  gs.chunks.forEach(ch=>ch.asteroids.forEach(a=>renderAsteroid(a,t)));
  renderParticles([...engineTrails,...gs.particles]);
  renderStation(st,t,true,false);
  // Loď na skutečné pozici — viditelná jak letí do dokovacího portu
  const{x:shipSX,y:shipSY}=toScreen(p.x,p.y);
  renderPlayerShip(p,t,shipSX,shipSY);
  ctx.restore();

  renderVignette();

  // Letterbox — filmové pruhy
  const lbH=H*0.105;
  ctx.fillStyle='#000000';
  ctx.fillRect(0,0,W,lbH);
  ctx.fillRect(0,H-lbH,W,lbH);
  ctx.save();
  let gr=ctx.createLinearGradient(0,lbH,0,lbH+55);
  gr.addColorStop(0,'rgba(0,0,0,0.55)');gr.addColorStop(1,'transparent');
  ctx.fillStyle=gr;ctx.fillRect(0,lbH,W,55);
  gr=ctx.createLinearGradient(0,H-lbH-55,0,H-lbH);
  gr.addColorStop(0,'transparent');gr.addColorStop(1,'rgba(0,0,0,0.55)');
  ctx.fillStyle=gr;ctx.fillRect(0,H-lbH-55,W,55);
  ctx.restore();

  // HUD overlay
  const phase=prog<0.35?'PŘIBLIŽOVÁNÍ':prog<0.72?'PŘISTÁVÁNÍ':'DOKOVÁNÍ';
  ctx.save();ctx.textAlign='center';
  // Název stanice — nahoře v letterboxu
  ctx.font='11px "Courier New",monospace';
  ctx.fillStyle='rgba(255,150,40,0.65)';
  ctx.fillText(anim.station.name,W/2,lbH*0.55);
  // Fáze — dole
  ctx.font='bold 15px "Courier New",monospace';
  ctx.fillStyle='#ff9500';ctx.shadowColor='#ff9500';ctx.shadowBlur=12;
  ctx.fillText(phase,W/2,H-lbH*0.62);ctx.shadowBlur=0;
  // Progress bar
  const bw=180,bh=3,by=H-lbH*0.26;
  ctx.fillStyle='rgba(255,150,40,0.16)';ctx.fillRect(W/2-90,by,bw,bh);
  ctx.fillStyle='#ff9500';ctx.shadowColor='#ff9500';ctx.shadowBlur=6;
  ctx.fillRect(W/2-90,by,bw*prog,bh);ctx.shadowBlur=0;
  ctx.restore();

  // Bílý záblesk při přistání
  if(prog>0.85){
    const fa=Math.pow((prog-0.85)/0.15,1.5);
    ctx.globalAlpha=fa;ctx.fillStyle='#ffffff';
    ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
  }
}

// ---- Asteroidy ----
function renderAsteroid(a,t){
  const{x:sx,y:sy}=toScreen(a.x,a.y);
  if(!inView(sx,sy,a.sz))return;
  ctx.save();
  ctx.translate(sx,sy);ctx.rotate(a.angle);
  const dmgFrac=a.hp/a.maxHp;
  ctx.fillStyle=a.color;
  ctx.strokeStyle=`hsl(30,${8+Math.floor(dmgFrac*12)}%,${18+Math.floor(dmgFrac*16)}%)`;
  ctx.lineWidth=0.8;
  ctx.beginPath();a.verts.forEach((v,i)=>i===0?ctx.moveTo(v.x,v.y):ctx.lineTo(v.x,v.y));ctx.closePath();ctx.fill();ctx.stroke();
  ctx.restore();
}

// ---- Nepřátelské lodě ----
function renderEnemy(e,t){
  const{x:sx,y:sy}=toScreen(e.x,e.y);
  if(!inView(sx,sy,60))return;
  ctx.save();
  ctx.translate(sx,sy);ctx.rotate(e.angle+Math.PI/2);
  // Engine trail
  if(e.thrusting){
    ctx.globalAlpha=0.5+Math.random()*0.3;
    const eg=ctx.createLinearGradient(0,12,0,28);
    eg.addColorStop(0,'rgba(255,80,0,0.8)');eg.addColorStop(1,'transparent');
    ctx.fillStyle=eg;ctx.beginPath();ctx.moveTo(-4,10);ctx.lineTo(4,10);ctx.lineTo(0,26+Math.random()*6);ctx.fill();
    ctx.globalAlpha=1;
  }
  // Trup
  ctx.fillStyle='#1a0508';ctx.strokeStyle='#cc2020';ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(10,8);ctx.lineTo(5,5);ctx.lineTo(-5,5);ctx.lineTo(-10,8);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='rgba(255,40,40,0.35)';ctx.beginPath();ctx.ellipse(0,-3,3,5,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
  // HP bar
  if(e.hp<e.maxHp){
    ctx.save();
    const bw=30,bh=4,bx=sx-bw/2,by=sy-22;
    ctx.fillStyle='#200000';ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle=e.hp/e.maxHp>0.5?'#cc4400':'#ff2200';
    ctx.fillRect(bx,by,bw*e.hp/e.maxHp,bh);
    ctx.restore();
  }
}

// ---- Loď hráče (s bočními tryskami) ----
function renderPlayerShip(player,t,sx,sy){
  if(sx===undefined)sx=W/2;
  if(sy===undefined)sy=H/2;

  const strafeL=window._strafeL||false;
  const strafeR=window._strafeR||false;

  ctx.save();
  ctx.translate(sx,sy);ctx.rotate(player.angle+Math.PI/2);

  // === BOČNÍ TRYSKY — plameny ===
  // Strafe vlevo → pravá tryska (výfuk doprava = loď jde doleva)
  if(strafeL){
    const fl=7+Math.random()*5;
    ctx.globalAlpha=0.75+Math.random()*0.2;
    const eg=ctx.createLinearGradient(14,2,14+fl,2);
    eg.addColorStop(0,'rgba(80,200,255,0.95)');eg.addColorStop(0.5,'rgba(40,100,255,0.5)');eg.addColorStop(1,'transparent');
    ctx.fillStyle=eg;
    ctx.beginPath();ctx.moveTo(14,-3);ctx.lineTo(14,5);ctx.lineTo(14+fl,1);ctx.fill();
    ctx.globalAlpha=1;
  }
  // Strafe vpravo → levá tryska (výfuk doleva = loď jde doprava)
  if(strafeR){
    const fl=7+Math.random()*5;
    ctx.globalAlpha=0.75+Math.random()*0.2;
    const eg=ctx.createLinearGradient(-14,2,-14-fl,2);
    eg.addColorStop(0,'rgba(80,200,255,0.95)');eg.addColorStop(0.5,'rgba(40,100,255,0.5)');eg.addColorStop(1,'transparent');
    ctx.fillStyle=eg;
    ctx.beginPath();ctx.moveTo(-14,-3);ctx.lineTo(-14,5);ctx.lineTo(-14-fl,1);ctx.fill();
    ctx.globalAlpha=1;
  }

  // === HLAVNÍ MOTOR ===
  if(player.thrusting||player.boosting){
    const isBst=player.boosting;
    const fl=isBst?34:20;
    const flicker=0.8+Math.random()*0.2;
    ctx.globalAlpha=0.88;
    const eg=ctx.createLinearGradient(0,14,0,14+fl*flicker);
    eg.addColorStop(0,isBst?'rgba(0,180,255,0.98)':'rgba(255,150,0,0.92)');
    eg.addColorStop(0.35,isBst?'rgba(0,80,255,0.55)':'rgba(255,60,0,0.55)');
    eg.addColorStop(1,'transparent');
    ctx.fillStyle=eg;ctx.beginPath();ctx.moveTo(-5,12);ctx.lineTo(5,12);ctx.lineTo(0,14+fl*flicker);ctx.fill();
    ctx.globalAlpha=0.5;
    const eg2=ctx.createLinearGradient(0,12,0,22);
    eg2.addColorStop(0,isBst?'rgba(150,230,255,0.85)':'rgba(255,200,60,0.8)');eg2.addColorStop(1,'transparent');
    ctx.fillStyle=eg2;ctx.beginPath();ctx.moveTo(-2,12);ctx.lineTo(2,12);ctx.lineTo(0,22);ctx.fill();
    ctx.globalAlpha=1;
  }

  // === TRUP ===
  ctx.fillStyle='#060e22';ctx.strokeStyle='#ff9500';ctx.lineWidth=1.5;
  ctx.shadowColor='rgba(255,149,0,0.4)';ctx.shadowBlur=4;
  ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(10,10);ctx.lineTo(5,7);ctx.lineTo(-5,7);ctx.lineTo(-10,10);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.shadowBlur=0;

  // Detaily na trupu — žebra
  ctx.strokeStyle='rgba(255,149,0,0.25)';ctx.lineWidth=0.7;
  ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(5,5);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(-5,5);ctx.stroke();

  // Přední okno — svítí modře
  ctx.shadowColor='rgba(100,200,255,0.8)';ctx.shadowBlur=5;
  ctx.fillStyle='rgba(100,200,255,0.5)';ctx.beginPath();ctx.ellipse(0,-5,3,5,0,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;

  // === WINGTIPY ===
  ctx.strokeStyle='#ff9500';ctx.lineWidth=1.1;
  ctx.beginPath();ctx.moveTo(-10,10);ctx.lineTo(-14,14);ctx.stroke();
  ctx.beginPath();ctx.moveTo(10,10);ctx.lineTo(14,14);ctx.stroke();
  // Wingtip navigační světla (červená/zelená)
  ctx.fillStyle='#ff2020';ctx.shadowColor='#ff4040';ctx.shadowBlur=4;
  ctx.beginPath();ctx.arc(-14,14,1.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#00cc44';ctx.shadowColor='#00ff66';
  ctx.beginPath();ctx.arc(14,14,1.5,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;

  // === BOČNÍ TRYSKOVÉ PODY ===
  ctx.strokeStyle='rgba(255,149,0,0.45)';ctx.lineWidth=0.8;
  ctx.fillStyle='rgba(10,20,40,0.9)';
  // Pravý pod (vystupuje ze zádi pravého křídla)
  ctx.beginPath();ctx.rect(11,-4,8,7);ctx.fill();ctx.stroke();
  // Levý pod
  ctx.beginPath();ctx.rect(-19,-4,8,7);ctx.fill();ctx.stroke();
  // Výfukový otvor — bílá tečka
  ctx.fillStyle='rgba(200,220,255,0.3)';
  ctx.beginPath();ctx.arc(19,0,1.5,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(-19,0,1.5,0,Math.PI*2);ctx.fill();

  ctx.restore();

  // === ŠTÍT (v screen coords) ===
  if(player.shield>0){
    const shA=player.invTimer>0?0.5:0.04+player.shield/player.shieldMax*0.14;
    ctx.save();ctx.globalAlpha=shA;ctx.strokeStyle='#4080ff';ctx.lineWidth=1.5;
    ctx.shadowColor='#4080ff';ctx.shadowBlur=8;
    ctx.beginPath();ctx.arc(sx,sy,24,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  // Blikání při zásahu
  if(player.invTimer>0&&Math.floor(player.invTimer*10)%2===0){
    ctx.save();ctx.globalAlpha=0.2;ctx.fillStyle='#ffffff';
    ctx.beginPath();ctx.arc(sx,sy,24,0,Math.PI*2);ctx.fill();ctx.restore();
  }
}

// ---- Střely ----
function renderBullet(b){
  const{x:sx,y:sy}=toScreen(b.x,b.y);
  if(!inView(sx,sy,20))return;
  ctx.save();
  ctx.translate(sx,sy);ctx.rotate(Math.atan2(b.vy,b.vx));
  ctx.globalAlpha=Math.min(1,b.life*2);
  ctx.fillStyle=b.owner==='player'?'#ffaa00':'#ff2020';
  ctx.shadowColor=b.owner==='player'?'#ffaa00':'#ff2020';ctx.shadowBlur=8;
  ctx.beginPath();ctx.ellipse(0,0,10,2,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

// ---- Částice ----
function renderParticles(particles){
  particles.forEach(p=>{
    const{x:sx,y:sy}=toScreen(p.x,p.y);
    if(!inView(sx,sy,p.r))return;
    ctx.save();
    ctx.globalAlpha=p.life/p.maxLife;
    ctx.fillStyle=p.color;
    if(p.glow){ctx.shadowColor=p.color;ctx.shadowBlur=p.r*3;}
    ctx.beginPath();ctx.arc(sx,sy,p.r*(0.3+p.life/p.maxLife*0.7),0,Math.PI*2);ctx.fill();
    ctx.restore();
  });
}

// ---- Vigneta ----
function renderVignette(){
  ctx.save();
  const vg=ctx.createRadialGradient(W/2,H/2,H*0.25,W/2,H/2,H*0.8);
  vg.addColorStop(0,'transparent');vg.addColorStop(1,'rgba(0,2,8,0.55)');
  ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
  ctx.restore();
}

// ---- Warp warm-up: engine stream při odpočtu ----
function renderWarpWarmup(p,pct,t){
  ctx.save();
  ctx.translate(W/2,H/2);
  ctx.rotate(p.angle+Math.PI/2);

  const streamLen=40+pct*200+Math.sin(t*16)*14;

  // Hlavní plazmový proud (modrý)
  ctx.globalAlpha=0.5+pct*0.5;
  const g1=ctx.createLinearGradient(0,14,0,14+streamLen);
  g1.addColorStop(0,'rgba(40,180,255,1)');
  g1.addColorStop(0.25,'rgba(0,110,255,0.7)');
  g1.addColorStop(0.7,'rgba(0,50,200,0.25)');
  g1.addColorStop(1,'transparent');
  ctx.fillStyle=g1;
  ctx.beginPath();ctx.moveTo(-7,12);ctx.lineTo(7,12);ctx.lineTo(0,14+streamLen);ctx.fill();

  // Širší záře kolem
  ctx.globalAlpha=(0.2+pct*0.3);
  const g2=ctx.createLinearGradient(0,10,0,10+streamLen*1.7);
  g2.addColorStop(0,'rgba(0,140,255,0.6)');g2.addColorStop(1,'transparent');
  ctx.fillStyle=g2;
  ctx.beginPath();ctx.moveTo(-22,10);ctx.lineTo(22,10);ctx.lineTo(0,10+streamLen*1.7);ctx.fill();

  // Pulzující aura u motoru
  ctx.globalAlpha=1;
  const aR=18+pct*50+Math.sin(t*11)*8;
  const ag=ctx.createRadialGradient(0,18,0,0,18,aR);
  ag.addColorStop(0,'rgba(40,160,255,'+(0.45*pct)+')');ag.addColorStop(1,'transparent');
  ctx.fillStyle=ag;ctx.beginPath();ctx.arc(0,18,aR,0,Math.PI*2);ctx.fill();

  ctx.restore();
}

// ---- Warp flicker: problikávání planet při vysoké rychlosti ----
function renderWarpFlicker(intensity,t){
  ctx.save();
  const frame=Math.floor(t*22);
  const r=makeRng(frame*4919+333);

  // Horizontální rychlostní pruhy
  const streaks=Math.floor(intensity*70);
  for(let i=0;i<streaks;i++){
    const x1=r()*W,y=r()*H;
    const len=20+r()*W*0.7;
    ctx.globalAlpha=r()*intensity*0.55;
    ctx.strokeStyle='rgba(230,240,255,'+(r()*0.6)+')';
    ctx.lineWidth=0.3+r()*1.8;
    ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x1+len,y);ctx.stroke();
  }

  // Občasný záblesk celé obrazovky
  const flash=Math.max(0,Math.sin(t*9.1)*Math.sin(t*4.3)*intensity*0.22);
  if(flash>0){ctx.globalAlpha=flash;ctx.fillStyle='rgba(180,220,255,1)';ctx.fillRect(0,0,W,H);}

  ctx.globalAlpha=1;
  ctx.restore();
}

// ---- Warp vizuál (hyperspace) — zachováno pro případ potřeby ----
function renderWarp(elapsed,duration,destName,t){
  const progress=Math.min(1,elapsed/duration);
  ctx.save();
  ctx.setTransform(1,0,0,1,0,0);
  ctx.globalAlpha=1;ctx.shadowBlur=0;

  // Pozadí — tmavě modré
  ctx.fillStyle=`rgb(0,0,${Math.floor(6+progress*10)})`;
  ctx.fillRect(0,0,W,H);

  const cx=W/2,cy=H/2;

  // Hvězdné pruhy z centra (hyperspace efekt)
  const frame=Math.floor(t*20);
  const sr=makeRng(frame*7919+99);
  const numLines=160+Math.floor(progress*120);
  for(let i=0;i<numLines;i++){
    const angle=sr()*Math.PI*2;
    const startD=18+sr()*28;
    const len=(50+sr()*380)*(0.15+progress*0.85)*(0.4+sr()*0.6);
    const bright=0.25+sr()*0.75;
    const isBlue=sr()<0.4, isOrange=sr()<0.08;
    const x1=cx+Math.cos(angle)*startD, y1=cy+Math.sin(angle)*startD;
    const x2=cx+Math.cos(angle)*(startD+len), y2=cy+Math.sin(angle)*(startD+len);
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);
    ctx.lineWidth=0.4+sr()*1.8;
    if(isOrange)     ctx.strokeStyle=`rgba(255,149,0,${bright*0.55})`;
    else if(isBlue)  ctx.strokeStyle=`rgba(100,180,255,${bright*0.65})`;
    else             ctx.strokeStyle=`rgba(220,235,255,${bright*0.38})`;
    ctx.stroke();
  }

  // Centrální záře
  const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,70+progress*50);
  cg.addColorStop(0,'rgba(200,230,255,0.85)');
  cg.addColorStop(0.4,'rgba(80,150,255,0.3)');
  cg.addColorStop(1,'transparent');
  ctx.fillStyle=cg;ctx.beginPath();ctx.arc(cx,cy,120+progress*60,0,Math.PI*2);ctx.fill();

  // Pulzující barevné bliknutí
  const flash=Math.max(0,Math.sin(t*4.1)*0.13+Math.sin(t*7.7)*0.07+Math.sin(t*13.3)*0.04);
  if(flash>0){ctx.globalAlpha=flash;ctx.fillStyle='rgba(140,200,255,1)';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}

  // Bílý záblesk při příjezdu
  if(progress>0.88){
    const af=Math.sin((progress-0.88)/0.12*Math.PI)*0.7;
    ctx.globalAlpha=af;ctx.fillStyle='rgba(255,255,255,1)';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
  }

  // Text HUD
  ctx.textAlign='center';
  ctx.font='bold 11px "Courier New", monospace';
  ctx.fillStyle=`rgba(130,200,255,${0.7+Math.sin(t*5)*0.3})`;
  ctx.shadowColor='rgba(100,200,255,0.6)';ctx.shadowBlur=16;
  ctx.fillText('WARP DRIVE ACTIVE',cx,cy-110);

  ctx.font='bold 38px "Courier New", monospace';
  ctx.fillStyle='#ffffff';ctx.shadowColor='rgba(200,230,255,0.5)';ctx.shadowBlur=24;
  ctx.fillText('100 000 km/s',cx,cy-62);

  ctx.font='13px "Courier New", monospace';
  ctx.fillStyle='rgba(255,149,0,0.9)';ctx.shadowColor='rgba(255,149,0,0.5)';ctx.shadowBlur=10;
  ctx.fillText(`KURZ: ${destName.toUpperCase()}`,cx,cy+62);

  // Progress bar
  const bw=400,bh=3,bx=cx-bw/2,by=cy+84;
  ctx.shadowBlur=0;ctx.globalAlpha=0.18;ctx.fillStyle='#ff9500';ctx.fillRect(bx,by,bw,bh);
  ctx.globalAlpha=1;ctx.fillStyle='#ff9500';ctx.shadowColor='rgba(255,149,0,0.7)';ctx.shadowBlur=6;
  ctx.fillRect(bx,by,bw*progress,bh);

  const rem=Math.max(0,duration-elapsed);
  ctx.font='10px "Courier New", monospace';ctx.shadowBlur=0;
  ctx.fillStyle='rgba(255,149,0,0.45)';
  ctx.fillText(`PŘÍLET ZA: ${rem.toFixed(1)} s`,cx,cy+108);

  ctx.restore();
}

// ---- Navigační šipka ----
function renderNavArrow(targetX,targetY,playerX,playerY,label){
  const wx=targetX-playerX,wy=targetY-playerY;
  const angle=Math.atan2(wy,wx);
  const d=Math.hypot(wx,wy);
  const margin=60;
  const ex=W/2+Math.cos(angle)*(Math.min(d*0.1,W/2-margin));
  const ey=H/2+Math.sin(angle)*(Math.min(d*0.1,H/2-margin));
  // Arrow on screen edge if target not visible
  const sx=W/2+Math.cos(angle)*(W/2-margin),sy=H/2+Math.sin(angle)*Math.min(Math.abs((H/2-margin)/Math.sin(angle)),Math.abs((W/2-margin)/Math.cos(angle)));
  ctx.save();
  ctx.translate(sx,sy);ctx.rotate(angle);
  ctx.fillStyle='#ffaa00';ctx.globalAlpha=0.85;ctx.shadowColor='#ffaa00';ctx.shadowBlur=10;
  ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-6,-7);ctx.lineTo(-6,7);ctx.closePath();ctx.fill();
  ctx.restore();
  // Distance label
  const au=(d/1000).toFixed(1);
  ctx.save();
  ctx.textAlign='center';ctx.font='bold 11px "Courier New", monospace';
  ctx.fillStyle='#ffaa00';ctx.shadowColor='#ffaa00';ctx.shadowBlur=6;
  ctx.fillText(`${label}  ${au} au`,sx,sy-18);
  ctx.restore();
}

// ---- Dokovací indikátor ----
function renderDockingIndicator(align,speed,dockable){
  ctx.save();
  const x=W/2,y=H-60;
  ctx.textAlign='center';
  // Rám
  ctx.strokeStyle=dockable?'#00ff88':'rgba(255,150,40,0.6)';ctx.lineWidth=1.5;
  ctx.strokeRect(x-120,y-16,240,32);
  // Výplň
  ctx.globalAlpha=0.15;ctx.fillStyle=dockable?'#00ff88':'#ff8800';
  ctx.fillRect(x-120,y-16,240,32);ctx.globalAlpha=1;
  ctx.font='12px "Courier New", monospace';ctx.fillStyle=dockable?'#00ff88':'#ffaa00';
  const txt=dockable?'[ ZAROVNÁNO — PŘISTÁT: E ]':`KORIDOR: ${Math.round(align)}°  SPD: ${Math.round(speed)}`;
  ctx.fillText(txt,x,y+5);
  ctx.restore();
}

// ---- Loot diamond ----
function renderLoot(l){
  const{x:sx,y:sy}=toScreen(l.x,l.y);
  if(!inView(sx,sy,20))return;
  const alpha=0.6+Math.sin(l.blink)*0.4;
  ctx.save();
  ctx.translate(sx,sy);ctx.globalAlpha=alpha;
  ctx.strokeStyle='#ffaa00';ctx.fillStyle='rgba(255,150,0,0.2)';ctx.lineWidth=1.5;
  ctx.shadowColor='#ffaa00';ctx.shadowBlur=8;
  ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(8,0);ctx.lineTo(0,10);ctx.lineTo(-8,0);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.restore();
}

// ---- Helper color ----
function lighten(hex,pct){
  let r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  r=Math.min(255,r+pct);g=Math.min(255,g+pct);b=Math.min(255,b+pct);
  return`#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}
function darken(hex,pct){
  let r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  r=Math.max(0,r-pct);g=Math.max(0,g-pct);b=Math.max(0,b-pct);
  return`#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}
