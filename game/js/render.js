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
  ctx.fillStyle=window.lightMode?'#dde8ff':'#000408';ctx.fillRect(0,0,W,H);
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
        const r=s.r*layer.scale;
        if(window.lightMode){
          // Světlý režim — černé hvězdy, plná viditelnost
          ctx.globalAlpha=Math.min(1,s.bright*twinkle*1.8);
          ctx.fillStyle='#000000';
          ctx.beginPath();ctx.arc(sx,sy,Math.max(r,0.5),0,Math.PI*2);ctx.fill();
        } else {
          ctx.globalAlpha=s.bright*twinkle;
          if(s.hue===210) ctx.fillStyle='#90b8ff';
          else if(s.hue===30) ctx.fillStyle='#ffbb60';
          else if(s.hue===60) ctx.fillStyle='#ffeeaa';
          else ctx.fillStyle='#e8eeff';
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
            ctx.globalAlpha=s.bright*twinkle*0.2;
            const sd=sl*0.5;
            ctx.beginPath();ctx.moveTo(sx-sd,sy-sd);ctx.lineTo(sx+sd,sy+sd);ctx.stroke();
            ctx.beginPath();ctx.moveTo(sx+sd,sy-sd);ctx.lineTo(sx-sd,sy+sd);ctx.stroke();
          }
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

// ---- Stanice (Transformers mechanický styl) ----
function renderStation(st,t,nearDock,dockable,lo){
  const{x:sx,y:sy}=toScreen(st.x,st.y);
  const R=st.r;
  if(!inView(sx,sy,R*5))return;

  ctx.save();
  ctx.translate(sx,sy);
  ctx.rotate(st.angle);

  // Záře
  const gGr=ctx.createRadialGradient(0,0,0,0,0,R*3.8);
  gGr.addColorStop(0,st.color+'18');gGr.addColorStop(1,st.color+'00');
  ctx.fillStyle=gGr;ctx.beginPath();ctx.arc(0,0,R*3.8,0,Math.PI*2);ctx.fill();

  // ===== SWEPT-BACK WINGS (levá strana — záporné X) =====
  const wL=R*1.75,wW=R*0.62; // délka a šířka křídel
  // Vrchní křídlo (sweepback nahoru-doleva)
  ctx.fillStyle='#0b1622';ctx.strokeStyle=st.color+'66';ctx.lineWidth=1;
  ctx.beginPath();
  ctx.moveTo(-R*0.38,-R*0.22);
  ctx.lineTo(-wL,        -wW*0.38);
  ctx.lineTo(-wL,        -wW);
  ctx.lineTo(-R*0.38,    -R*0.68);
  ctx.closePath();ctx.fill();ctx.stroke();
  // Dolní křídlo
  ctx.beginPath();
  ctx.moveTo(-R*0.38, R*0.22);
  ctx.lineTo(-wL,      wW*0.38);
  ctx.lineTo(-wL,      wW);
  ctx.lineTo(-R*0.38,  R*0.68);
  ctx.closePath();ctx.fill();ctx.stroke();
  // Energetické pruhy na křídlech
  ctx.strokeStyle=st.color+'33';ctx.lineWidth=0.55;
  for(let i=1;i<6;i++){
    const f=i/6,wx=-R*0.38+f*(-wL+R*0.38);
    const wyt=-R*0.22+f*(-wW*0.38+R*0.22),wyb=R*0.22+f*(wW*0.38-R*0.22);
    ctx.beginPath();ctx.moveTo(wx,wyt);ctx.lineTo(wx,wyb);ctx.stroke();
  }
  // Energetické uzly na špičkách křídel
  for(const iy of[-1,1]){
    const gx=-wL*0.78,gy=iy*wW*0.72;
    const wp=0.3+Math.sin(t*1.9+iy*2.1)*0.55;
    ctx.save();ctx.globalAlpha=wp;
    ctx.fillStyle=st.color;ctx.shadowColor=st.color;ctx.shadowBlur=8;
    ctx.beginPath();ctx.arc(gx,gy,R*0.065,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;ctx.restore();
  }
  // Výztuha mezi křídly
  ctx.strokeStyle=st.color+'28';ctx.lineWidth=R*0.02;
  ctx.beginPath();ctx.moveTo(-R*0.38,-R*0.22);ctx.lineTo(-R*0.38,R*0.22);ctx.stroke();

  // ===== DOKOVACÍ RAMENO (pravá strana) =====
  const armX=R*0.28, armW=R*0.62,armH=R*0.28;
  ctx.fillStyle='#0a1520';ctx.strokeStyle=st.color+'44';ctx.lineWidth=0.8;
  // Hlavní rameno — zkosený obdélník
  ctx.beginPath();
  ctx.moveTo(armX,     -armH/2);
  ctx.lineTo(armX+armW,-armH/2*0.6);
  ctx.lineTo(armX+armW, armH/2*0.6);
  ctx.lineTo(armX,      armH/2);
  ctx.closePath();ctx.fill();ctx.stroke();
  // Armaturní segmenty
  ctx.strokeStyle=st.color+'22';ctx.lineWidth=0.5;
  for(let i=1;i<4;i++){
    const ax=armX+i*(armW/4);
    ctx.beginPath();ctx.moveTo(ax,-armH/2*(1-i*0.1));ctx.lineTo(ax,armH/2*(1-i*0.1));ctx.stroke();
  }

  // ===== CENTRÁLNÍ ARMORED CORE (oktagonální) =====
  const cR=R*0.44;
  ctx.fillStyle='#050c18';ctx.strokeStyle=st.color+'99';ctx.lineWidth=1.6;
  ctx.shadowColor=st.color;ctx.shadowBlur=10;
  ctx.beginPath();
  for(let i=0;i<=8;i++){
    const a=(i/8)*Math.PI*2+Math.PI/8;
    i===0?ctx.moveTo(Math.cos(a)*cR,Math.sin(a)*cR):ctx.lineTo(Math.cos(a)*cR,Math.sin(a)*cR);
  }
  ctx.fill();ctx.stroke();ctx.shadowBlur=0;

  // Vnější dekorační panel (druhý kroužek)
  ctx.strokeStyle=st.color+'44';ctx.lineWidth=0.9;
  ctx.beginPath();
  for(let i=0;i<=8;i++){
    const a=(i/8)*Math.PI*2+Math.PI/8;
    i===0?ctx.moveTo(Math.cos(a)*cR*0.78,Math.sin(a)*cR*0.78):ctx.lineTo(Math.cos(a)*cR*0.78,Math.sin(a)*cR*0.78);
  }
  ctx.stroke();

  // Vnitřní prstence
  ctx.strokeStyle=st.color+'55';ctx.lineWidth=0.8;
  ctx.beginPath();ctx.arc(0,0,cR*0.55,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle=st.color+'30';
  ctx.beginPath();ctx.arc(0,0,cR*0.28,0,Math.PI*2);ctx.stroke();

  // Pulsující jádro
  const cp=0.5+Math.sin(t*2.8)*0.5;
  ctx.save();ctx.globalAlpha=0.45+cp*0.45;
  ctx.fillStyle=st.color;ctx.shadowColor=st.color;ctx.shadowBlur=14;
  ctx.beginPath();ctx.arc(0,0,cR*0.18,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;ctx.restore();

  // 4 mechanická žebra na core
  ctx.strokeStyle=st.color+'44';ctx.lineWidth=0.9;
  for(let i=0;i<4;i++){
    const a=(i/4)*Math.PI*2+Math.PI/8;
    ctx.beginPath();ctx.moveTo(Math.cos(a)*cR*0.3,Math.sin(a)*cR*0.3);
    ctx.lineTo(Math.cos(a)*cR*0.72,Math.sin(a)*cR*0.72);ctx.stroke();
    ctx.fillStyle='#060e1a';ctx.strokeStyle=st.color+'66';ctx.lineWidth=0.7;
    ctx.beginPath();ctx.arc(Math.cos(a)*cR*0.55,Math.sin(a)*cR*0.55,cR*0.06,0,Math.PI*2);
    ctx.fill();ctx.stroke();
  }

  // ===== VELITELSKÝ MODUL (nahoře) =====
  const headY=-cR*0.95,headW=R*0.48,headH=R*0.3;
  ctx.fillStyle='#08121e';ctx.strokeStyle=st.color+'66';ctx.lineWidth=1;
  // Zkosený profil
  ctx.beginPath();
  ctx.moveTo(-headW/2,headY);ctx.lineTo(headW/2,headY);
  ctx.lineTo(headW*0.42,headY-headH);ctx.lineTo(-headW*0.42,headY-headH);
  ctx.closePath();ctx.fill();ctx.stroke();
  // Sensor okno
  const wa=0.22+Math.sin(t*0.9)*0.1;
  ctx.globalAlpha=wa;ctx.fillStyle='#88d8ff';
  ctx.fillRect(-headW*0.35,headY-headH*0.72,headW*0.7,headH*0.28);
  ctx.globalAlpha=1;
  // Anténa
  ctx.strokeStyle=st.color+'88';ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(0,headY-headH);ctx.lineTo(R*0.07,headY-headH-R*0.32);ctx.stroke();
  const apulse=0.35+Math.sin(t*3.8)*0.65;
  ctx.save();ctx.globalAlpha=apulse;ctx.fillStyle=st.color;ctx.shadowColor=st.color;ctx.shadowBlur=6;
  ctx.beginPath();ctx.arc(R*0.07,headY-headH-R*0.32,R*0.042,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;ctx.restore();

  // ===== PODPŮRNÉ NOHY (dole) =====
  const legY=cR*0.78;
  for(const ls of[-1,1]){
    const lx0=ls*R*0.14,lx1=ls*R*0.42,lx2=ls*R*0.54;
    const ly0=legY,ly1=legY+R*0.48;
    ctx.fillStyle='#0a1520';ctx.strokeStyle=st.color+'44';ctx.lineWidth=0.8;
    ctx.beginPath();
    ctx.moveTo(lx0,ly0);ctx.lineTo(lx2,ly1);ctx.lineTo(lx1,ly1);ctx.lineTo(ls*R*0.08,ly0);
    ctx.closePath();ctx.fill();ctx.stroke();
    const fx=Math.min(lx1,lx2)-R*0.02,fw=Math.abs(lx2-lx1)+R*0.04;
    ctx.fillStyle='#0e1825';ctx.strokeStyle=st.color+'44';
    ctx.fillRect(fx,ly1,fw,R*0.1);ctx.strokeRect(fx,ly1,fw,R*0.1);
  }

  // ===== ENERGETICKÉ KONDUITY (od core k křídlům) =====
  ctx.strokeStyle=st.color+'28';ctx.lineWidth=0.7;
  [[0,-cR*0.3,-wL*0.55,-wW*0.62],[0,cR*0.3,-wL*0.55,wW*0.62]].forEach(([x0,y0,x1,y1])=>{
    ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
  });

  // ===== DOKOVACÍ PORT (pravá strana) =====
  const dpX=R*0.88,dpW=R*0.26,dpH=R*0.42;
  ctx.fillStyle='#050810';
  ctx.strokeStyle=dockable?'#00ff88':'rgba(255,150,0,0.82)';
  ctx.lineWidth=2;
  ctx.fillRect(dpX,-dpH/2,dpW,dpH);ctx.strokeRect(dpX,-dpH/2,dpW,dpH);
  // Mechanická iris — kříž uvnitř
  ctx.strokeStyle=dockable?'rgba(0,255,136,0.38)':'rgba(255,150,0,0.25)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(dpX,0);ctx.lineTo(dpX+dpW,0);ctx.stroke();
  ctx.beginPath();ctx.moveTo(dpX+dpW/2,-dpH/2);ctx.lineTo(dpX+dpW/2,dpH/2);ctx.stroke();
  // Vnitřní záře
  ctx.globalAlpha=dockable?0.62:0.18;
  ctx.fillStyle=dockable?'#00ff88':st.color;
  ctx.fillRect(dpX+2,-dpH/2+2,dpW-4,dpH-4);ctx.globalAlpha=1;
  // Blikající světla
  const dlB=0.4+Math.sin(t*4.5)*0.6;
  ctx.save();ctx.globalAlpha=dlB;ctx.fillStyle=dockable?'#00ff88':'#ffaa00';
  ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=8;
  ctx.beginPath();ctx.arc(dpX+dpW/2,-dpH/2,R*0.045,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(dpX+dpW/2,dpH/2,R*0.045,0,Math.PI*2);ctx.fill();
  ctx.restore();

  // ===== NAVIGAČNÍ SVĚTLA =====
  const navLights=[
    {x:-wL,y:-wW*0.72,c:'#ff2020',freq:1.9},
    {x:-wL,y:wW*0.72, c:'#00dd44',freq:1.9+Math.PI},
    {x:R*0.07,y:headY-headH-R*0.32,c:'#ffffff',freq:3.1},
    {x:0,y:legY+R*0.5,c:'#ffffff',freq:3.1+1.2},
  ];
  navLights.forEach(l=>{
    const b=Math.sin(t*l.freq)*0.5+0.5;
    ctx.save();ctx.globalAlpha=0.2+b*0.8;
    ctx.fillStyle=l.c;ctx.shadowColor=l.c;ctx.shadowBlur=10;
    ctx.beginPath();ctx.arc(l.x,l.y,R*0.055,0,Math.PI*2);ctx.fill();
    if(b>0.7){ctx.globalAlpha=(b-0.7)*0.5;ctx.beginPath();ctx.arc(l.x,l.y,R*0.14,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  });

  ctx.restore();

  // ===== LABEL (bez rotace) =====
  ctx.save();ctx.textAlign='center';
  const labelY=sy-R*2.8;
  const _lc=lo?.color||st.color;
  if(nearDock){
    ctx.font='bold 14px "Courier New", monospace';
    ctx.fillStyle=_lc;ctx.shadowColor=_lc;ctx.shadowBlur=8;
    ctx.fillText((lo?.prefix||'')+st.name,sx,labelY);ctx.shadowBlur=0;
    ctx.font='11px "Courier New", monospace';
    const _hint=lo?.dockHint||(dockable?'▶ DOKOVACÍ PORT — VOLNÝ':'▷ Přiblíž se k dokovacímu portu');
    ctx.fillStyle=dockable?'#00ff88':'rgba(255,150,40,0.85)';
    ctx.fillText(_hint,sx,labelY-18);
    ctx.fillStyle=_lc+'80';ctx.font='10px "Courier New", monospace';
    const tier=st.tier||1;
    ctx.fillText('◆'.repeat(tier)+'◇'.repeat(Math.max(0,3-tier)),sx,sy+R*2.8+12);
  } else {
    ctx.font='10px "Courier New", monospace';ctx.fillStyle=lo?.farColor||'rgba(255,150,40,0.5)';
    ctx.fillText((lo?.farPrefix||'')+st.name,sx,sy-R*2.0);
  }
  ctx.restore();
}

// ---- Dealerská stanice (loděnice) — drydock s rails ----
function renderDealer(st,t,nearDock,dockable){
  const{x:sx,y:sy}=toScreen(st.x,st.y);
  const R=st.r;
  if(!inView(sx,sy,R*4))return;
  const col=st.color||'#ffaa00';

  ctx.save();ctx.translate(sx,sy);ctx.rotate(st.angle);

  // Outer glow
  const gg=ctx.createRadialGradient(0,0,0,0,0,R*3.5);
  gg.addColorStop(0,col+'18');gg.addColorStop(1,col+'00');
  ctx.fillStyle=gg;ctx.beginPath();ctx.arc(0,0,R*3.5,0,Math.PI*2);ctx.fill();

  // === HORIZONTAL DRYDOCK RAILS ===
  const armLen=R*1.75,railH=R*0.17,railGap=R*0.52;
  ctx.fillStyle='#0b1520';ctx.strokeStyle=col+'55';ctx.lineWidth=1.2;
  ctx.fillRect(-armLen,-railGap-railH/2,armLen*2,railH);ctx.strokeRect(-armLen,-railGap-railH/2,armLen*2,railH);
  ctx.fillRect(-armLen,railGap-railH/2,armLen*2,railH);ctx.strokeRect(-armLen,railGap-railH/2,armLen*2,railH);
  // Rail energy stripes
  ctx.strokeStyle=col+'22';ctx.lineWidth=0.7;
  for(let i=-4;i<=4;i++){
    const px=i*(armLen*0.44);
    ctx.beginPath();ctx.moveTo(px,-railGap-railH/2);ctx.lineTo(px,-railGap+railH/2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(px,railGap-railH/2);ctx.lineTo(px,railGap+railH/2);ctx.stroke();
  }

  // === RAIL END CLAMPS ===
  for(const side of[-1,1]){
    const ex=side*armLen;
    ctx.fillStyle='#0e1c2a';ctx.strokeStyle=col+'88';ctx.lineWidth=1.5;ctx.shadowColor=col;ctx.shadowBlur=8;
    ctx.fillRect(ex-R*0.11,-railGap-railH,R*0.22,railGap*2+railH*2);
    ctx.strokeRect(ex-R*0.11,-railGap-railH,R*0.22,railGap*2+railH*2);ctx.shadowBlur=0;
    const cp=0.35+Math.sin(t*1.8+side*2)*0.65;
    ctx.save();ctx.globalAlpha=cp;ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=10;
    ctx.beginPath();ctx.arc(ex,0,R*0.06,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.restore();
  }

  // === CROSS BEAMS ===
  ctx.strokeStyle=col+'22';ctx.lineWidth=R*0.038;
  for(const px of[-armLen*0.62,-armLen*0.3,0,armLen*0.3,armLen*0.62]){
    ctx.beginPath();ctx.moveTo(px,-railGap);ctx.lineTo(px,railGap);ctx.stroke();
  }

  // === CENTRAL HEX CORE ===
  const cR=R*0.40;
  ctx.fillStyle='#060e18';ctx.strokeStyle=col+'aa';ctx.lineWidth=1.8;ctx.shadowColor=col;ctx.shadowBlur=14;
  ctx.beginPath();
  for(let i=0;i<=6;i++){const a=(i/6)*Math.PI*2;i===0?ctx.moveTo(Math.cos(a)*cR,Math.sin(a)*cR):ctx.lineTo(Math.cos(a)*cR,Math.sin(a)*cR);}
  ctx.fill();ctx.stroke();ctx.shadowBlur=0;
  ctx.strokeStyle=col+'44';ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(0,0,cR*0.64,0,Math.PI*2);ctx.stroke();
  const cp2=0.5+Math.sin(t*2.2)*0.5;
  ctx.save();ctx.globalAlpha=0.5+cp2*0.5;ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=16;
  ctx.beginPath();ctx.arc(0,0,cR*0.21,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.restore();
  ctx.strokeStyle=col+'33';ctx.lineWidth=0.9;
  for(let i=0;i<6;i++){const a=(i/6)*Math.PI*2;ctx.beginPath();ctx.moveTo(Math.cos(a)*cR*0.27,Math.sin(a)*cR*0.27);ctx.lineTo(Math.cos(a)*cR*0.74,Math.sin(a)*cR*0.74);ctx.stroke();}

  // === SHIP CRADLE (below) ===
  const crdY=railGap+railH+R*0.08;
  ctx.fillStyle='#0a1825';ctx.strokeStyle=col+'44';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(-R*0.48,crdY);ctx.lineTo(-R*0.33,crdY+R*0.26);ctx.lineTo(R*0.33,crdY+R*0.26);ctx.lineTo(R*0.48,crdY);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.save();ctx.globalAlpha=0.22;ctx.fillStyle=col;
  ctx.beginPath();ctx.ellipse(0,crdY+R*0.13,R*0.26,R*0.065,0,0,Math.PI*2);ctx.fill();ctx.restore();
  for(const lx of[-R*0.28,0,R*0.28]){
    const lp=0.4+Math.sin(t*3.1+lx)*0.6;
    ctx.save();ctx.globalAlpha=lp*0.8;ctx.fillStyle='#ffee88';ctx.shadowColor='#ffcc00';ctx.shadowBlur=6;
    ctx.beginPath();ctx.arc(lx,crdY+R*0.04,R*0.033,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.restore();
  }

  // === COMM TOWER ===
  ctx.strokeStyle=col+'77';ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(0,-cR*0.85);ctx.lineTo(0,-cR*0.85-R*0.46);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-R*0.17,-cR*0.85-R*0.22);ctx.lineTo(R*0.17,-cR*0.85-R*0.22);ctx.stroke();
  const tp=0.3+Math.sin(t*4.1)*0.7;
  ctx.save();ctx.globalAlpha=tp;ctx.fillStyle='#ff4444';ctx.shadowColor='#ff2222';ctx.shadowBlur=8;
  ctx.beginPath();ctx.arc(0,-cR*0.85-R*0.46,R*0.038,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.restore();

  // === DOCKING PORT ===
  const dpX=R*1.08,dpW=R*0.27,dpH=R*0.36;
  ctx.fillStyle='#040810';ctx.strokeStyle=dockable?'#00ff88':'rgba(255,150,0,0.8)';ctx.lineWidth=2;
  ctx.fillRect(dpX,-dpH/2,dpW,dpH);ctx.strokeRect(dpX,-dpH/2,dpW,dpH);
  ctx.strokeStyle=dockable?'rgba(0,255,136,0.35)':'rgba(255,150,0,0.22)';ctx.lineWidth=0.8;
  ctx.beginPath();ctx.moveTo(dpX,0);ctx.lineTo(dpX+dpW,0);ctx.stroke();
  ctx.beginPath();ctx.moveTo(dpX+dpW/2,-dpH/2);ctx.lineTo(dpX+dpW/2,dpH/2);ctx.stroke();
  ctx.globalAlpha=dockable?0.6:0.15;ctx.fillStyle=dockable?'#00ff88':col;
  ctx.fillRect(dpX+2,-dpH/2+2,dpW-4,dpH-4);ctx.globalAlpha=1;
  const dlB=0.4+Math.sin(t*4.5)*0.6;
  ctx.save();ctx.globalAlpha=dlB;ctx.fillStyle=dockable?'#00ff88':'#ffaa00';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=8;
  ctx.beginPath();ctx.arc(dpX+dpW/2,-dpH/2,R*0.04,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(dpX+dpW/2,dpH/2,R*0.04,0,Math.PI*2);ctx.fill();ctx.restore();

  ctx.restore();

  // === LABEL ===
  ctx.save();ctx.textAlign='center';
  if(nearDock){
    ctx.font='bold 14px "Courier New",monospace';ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=8;
    ctx.fillText('⧈ '+st.name,sx,sy-R*3.1);ctx.shadowBlur=0;
    ctx.font='11px "Courier New",monospace';ctx.fillStyle=dockable?'#00ff88':'rgba(255,150,40,0.85)';
    ctx.fillText(dockable?'▶ LODEŇNICE — VSTUP':'▷ LODEŇNICE — přiblíž se',sx,sy-R*3.1-18);
  } else {
    ctx.font='10px "Courier New",monospace';ctx.fillStyle=col+'88';
    ctx.fillText('⚙ '+st.name,sx,sy-R*2.4);
  }
  ctx.restore();
}

// ---- Garážová stanice — hranaté průmyslové moduly ----
function renderGarage(st,t,nearDock,dockable){
  const{x:sx,y:sy}=toScreen(st.x,st.y);
  const R=st.r;
  if(!inView(sx,sy,R*4))return;
  const col=st.color||'#00ccff';
  const owned=window.gameState?.player?.ownedGarages?.includes(garageKey(st.garageGalaxy,st.garageCx,st.garageCy));
  const dispCol=owned?col:col;
  const dA=owned?1.0:0.5;

  ctx.save();ctx.translate(sx,sy);ctx.rotate(st.angle);ctx.globalAlpha=dA;

  // Outer glow
  const gg=ctx.createRadialGradient(0,0,0,0,0,R*3.2);
  gg.addColorStop(0,col+'1a');gg.addColorStop(1,col+'00');
  ctx.fillStyle=gg;ctx.beginPath();ctx.arc(0,0,R*3.2,0,Math.PI*2);ctx.fill();

  // === MAIN RECTANGULAR HULL ===
  const hW=R*2.0,hH=R*1.0;
  ctx.fillStyle='#080f1a';ctx.strokeStyle=col+(owned?'88':'44');ctx.lineWidth=1.8;ctx.shadowColor=col;ctx.shadowBlur=owned?10:4;
  ctx.fillRect(-hW/2,-hH/2,hW,hH);ctx.strokeRect(-hW/2,-hH/2,hW,hH);ctx.shadowBlur=0;
  // Hull inner border
  ctx.strokeStyle=col+'22';ctx.lineWidth=0.8;
  ctx.strokeRect(-hW/2+4,-hH/2+4,hW-8,hH-8);

  // === BAY DOORS (3 doors on top half) ===
  const bW=hW*0.24,bH=hH*0.62,bY=-hH/2;
  const bXs=[-hW*0.3,0,hW*0.3];
  bXs.forEach((bx,i)=>{
    // Door frame
    ctx.fillStyle=owned?'#020608':'#0c1824';
    ctx.strokeStyle=col+(owned?'55':'22');ctx.lineWidth=1;
    ctx.fillRect(bx-bW/2,bY+3,bW,bH-3);ctx.strokeRect(bx-bW/2,bY+3,bW,bH-3);
    if(owned){
      // Sliding door gap (open)
      const openH=bH*0.35;
      ctx.globalAlpha=dA*0.55;ctx.fillStyle=col;
      ctx.fillRect(bx-bW/2+3,bY+3,bW-6,openH);
      ctx.globalAlpha=dA;
      // Inner glow
      const igr=ctx.createLinearGradient(bx,bY+3,bx,bY+3+openH);
      igr.addColorStop(0,col+'44');igr.addColorStop(1,col+'00');
      ctx.fillStyle=igr;ctx.fillRect(bx-bW/2+3,bY+3,bW-6,bH-6);
    }
    // Bay number
    ctx.fillStyle=col+(owned?'66':'33');
    ctx.font=`bold ${Math.round(R*0.15)}px "Courier New",monospace`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(i+1,bx,bY+bH*0.78);
    ctx.textBaseline='alphabetic';
  });

  // === HULL PANEL LINES ===
  ctx.strokeStyle=col+'18';ctx.lineWidth=R*0.013;
  ctx.beginPath();ctx.moveTo(-hW/2,0);ctx.lineTo(hW/2,0);ctx.stroke();
  for(let i=1;i<4;i++){const px=-hW/2+i*(hW/4);ctx.beginPath();ctx.moveTo(px,-hH/2);ctx.lineTo(px,hH/2);ctx.stroke();}

  // === ROOF SUPERSTRUCTURE ===
  ctx.fillStyle='#0a1422';ctx.strokeStyle=col+'55';ctx.lineWidth=1;
  ctx.fillRect(-hW*0.32,-hH/2-R*0.26,hW*0.64,R*0.26);ctx.strokeRect(-hW*0.32,-hH/2-R*0.26,hW*0.64,R*0.26);
  // Sensor dome
  ctx.strokeStyle=col+'77';ctx.lineWidth=1.2;
  ctx.beginPath();ctx.arc(0,-hH/2-R*0.26,R*0.15,Math.PI,Math.PI*2);ctx.stroke();

  // === ANTENNA ===
  ctx.strokeStyle=col+'88';ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(0,-hH/2-R*0.41);ctx.lineTo(0,-hH/2-R*0.41-R*0.38);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-R*0.14,-hH/2-R*0.59);ctx.lineTo(R*0.14,-hH/2-R*0.59);ctx.stroke();
  const bp=0.3+Math.sin(t*3.5)*0.7;
  ctx.save();ctx.globalAlpha=bp;ctx.fillStyle='#ff3333';ctx.shadowColor='#ff2200';ctx.shadowBlur=8;
  ctx.beginPath();ctx.arc(0,-hH/2-R*0.79,R*0.038,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.restore();

  // === SIDE ENGINE PODS ===
  for(const ly of[-hH*0.22,hH*0.22]){
    ctx.fillStyle='#060f1c';ctx.strokeStyle=col+(owned?'55':'28');ctx.lineWidth=1;
    ctx.fillRect(hW/2,ly-R*0.1,R*0.28,R*0.2);ctx.strokeRect(hW/2,ly-R*0.1,R*0.28,R*0.2);
    const ep=0.35+Math.sin(t*1.4+ly)*0.4;
    ctx.save();ctx.globalAlpha=ep*(owned?0.7:0.3);ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=8;
    ctx.beginPath();ctx.arc(hW/2+R*0.28,ly,R*0.06,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.restore();
  }

  // === DOCKING PORT (bottom center) ===
  const dpW2=R*0.36,dpH2=R*0.24,dpY=hH/2;
  ctx.fillStyle='#040810';ctx.strokeStyle=dockable?'#00ff88':'rgba(255,150,0,0.8)';ctx.lineWidth=2;
  ctx.fillRect(-dpW2/2,dpY,dpW2,dpH2);ctx.strokeRect(-dpW2/2,dpY,dpW2,dpH2);
  ctx.strokeStyle=dockable?'rgba(0,255,136,0.35)':'rgba(255,150,0,0.22)';ctx.lineWidth=0.8;
  ctx.beginPath();ctx.moveTo(0,dpY);ctx.lineTo(0,dpY+dpH2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-dpW2/2,dpY+dpH2/2);ctx.lineTo(dpW2/2,dpY+dpH2/2);ctx.stroke();
  ctx.globalAlpha=dA*(dockable?0.6:0.15);ctx.fillStyle=dockable?'#00ff88':col;
  ctx.fillRect(-dpW2/2+2,dpY+2,dpW2-4,dpH2-4);ctx.globalAlpha=dA;
  const dlB=0.4+Math.sin(t*4.5)*0.6;
  ctx.save();ctx.globalAlpha=dlB*dA;ctx.fillStyle=dockable?'#00ff88':col;ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=8;
  ctx.beginPath();ctx.arc(-dpW2/2,dpY+dpH2/2,R*0.038,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(dpW2/2,dpY+dpH2/2,R*0.038,0,Math.PI*2);ctx.fill();ctx.restore();

  // === STATUS LIGHTS along bottom (owned only) ===
  if(owned){
    for(let i=0;i<5;i++){
      const lx=-hW*0.33+i*(hW*0.66/4);
      const lp=0.3+Math.sin(t*1.9+i*0.85)*0.7;
      ctx.save();ctx.globalAlpha=lp;ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=6;
      ctx.beginPath();ctx.arc(lx,hH/2-R*0.08,R*0.033,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.restore();
    }
  }

  ctx.restore();

  // === LABEL ===
  ctx.save();ctx.textAlign='center';
  const buyHint=st.garageCost?`▶ KOUPIT HANGÁŘ (${st.garageCost.toLocaleString('cs')} Cr)`:'▶ KOUPIT HANGÁŘ';
  if(nearDock){
    ctx.font='bold 14px "Courier New",monospace';ctx.fillStyle=dispCol;ctx.shadowColor=dispCol;ctx.shadowBlur=owned?8:3;
    ctx.fillText((owned?'◈ ':'⊘ ')+st.name,sx,sy-R*2.9);ctx.shadowBlur=0;
    ctx.font='11px "Courier New",monospace';ctx.fillStyle=dockable?'#00ff88':'rgba(255,150,40,0.85)';
    ctx.fillText(dockable?(owned?'▶ HANGÁR — VSTUP':buyHint):(owned?'▷ HANGÁR — přiblíž se':'▷ HANGÁR — přiblíž se pro koupi'),sx,sy-R*2.9-18);
  } else {
    ctx.font='10px "Courier New",monospace';ctx.fillStyle=dispCol+(owned?'88':'55');
    ctx.fillText((owned?'🏭 ':'🔒 ')+st.name,sx,sy-R*2.3);
  }
  ctx.restore();
}
// ---- Velká stanice — Coriolis / Transformers styl ----
function renderLargeStation(st,t,nearDock,dockable){
  const{x:sx,y:sy}=toScreen(st.x,st.y);
  const R=st.r;
  if(!inView(sx,sy,R*2.5))return;

  ctx.save();
  ctx.translate(sx,sy);
  ctx.rotate(st.angle);

  const slotGap=0.22; // half-angle of mail slot gap (~12.6°)

  // Outer nebula glow
  const gg=ctx.createRadialGradient(0,0,R*0.3,0,0,R*2.2);
  gg.addColorStop(0,st.color+'00');
  gg.addColorStop(0.55,st.color+'0a');
  gg.addColorStop(1,st.color+'00');
  ctx.fillStyle=gg;ctx.beginPath();ctx.arc(0,0,R*2.2,0,Math.PI*2);ctx.fill();

  // === OUTER RING (gap at angle 0 = mail slot) ===
  ctx.lineWidth=R*0.07;
  ctx.strokeStyle=st.color+'cc';
  ctx.shadowColor=st.color;ctx.shadowBlur=16;
  ctx.beginPath();ctx.arc(0,0,R,slotGap,Math.PI*2-slotGap);
  ctx.stroke();ctx.shadowBlur=0;

  // Inner ring accent
  ctx.lineWidth=R*0.022;ctx.strokeStyle=st.color+'44';
  ctx.beginPath();ctx.arc(0,0,R*0.88,slotGap,Math.PI*2-slotGap);ctx.stroke();

  // === TRANSFORMERS DIAMOND SPIKES on ring ===
  for(let i=0;i<8;i++){
    const a=(i/8)*Math.PI*2+Math.PI/8;
    if(Math.abs(angleDiff(a,0))<slotGap*2.2)continue;
    const rx=Math.cos(a)*R,ry=Math.sin(a)*R;
    ctx.save();ctx.translate(rx,ry);ctx.rotate(a);
    ctx.fillStyle='#04090f';ctx.strokeStyle=st.color+'bb';ctx.lineWidth=1.2;
    ctx.beginPath();
    ctx.moveTo(0,R*0.13);ctx.lineTo(-R*0.055,0);
    ctx.lineTo(0,-R*0.05);ctx.lineTo(R*0.055,0);
    ctx.closePath();ctx.fill();ctx.stroke();
    const tipPulse=0.35+Math.sin(t*2.1+i*0.85)*0.45;
    ctx.globalAlpha=tipPulse*0.9;
    ctx.fillStyle=st.color;ctx.shadowColor=st.color;ctx.shadowBlur=8;
    ctx.beginPath();ctx.arc(0,R*0.09,R*0.024,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;ctx.globalAlpha=1;
    ctx.restore();
  }

  // === MAIL SLOT FRAME ===
  const slotOuter=R+R*0.16,slotInner=R-R*0.52;
  const topX0=Math.cos(slotGap)*slotInner,  topY0=Math.sin(slotGap)*slotInner;
  const topX1=Math.cos(slotGap)*slotOuter,  topY1=Math.sin(slotGap)*slotOuter;
  const botX0=Math.cos(-slotGap)*slotInner, botY0=Math.sin(-slotGap)*slotInner;
  const botX1=Math.cos(-slotGap)*slotOuter, botY1=Math.sin(-slotGap)*slotOuter;

  ctx.strokeStyle=dockable?'#00ff88':'rgba(255,136,0,0.88)';
  ctx.lineWidth=3;ctx.shadowColor=dockable?'#00ff88':'#ff8800';ctx.shadowBlur=14;
  ctx.beginPath();ctx.moveTo(topX0,topY0);ctx.lineTo(topX1,topY1);ctx.stroke();
  ctx.beginPath();ctx.moveTo(botX0,botY0);ctx.lineTo(botX1,botY1);ctx.stroke();
  ctx.shadowBlur=0;

  // Slot fill (fanshape)
  ctx.save();
  ctx.beginPath();
  ctx.arc(0,0,slotOuter,-slotGap,slotGap);
  ctx.arc(0,0,slotInner,slotGap,-slotGap,true);
  ctx.closePath();
  ctx.globalAlpha=dockable?0.38:0.1;
  ctx.fillStyle=dockable?'#00ff88':'#ff8800';
  ctx.fill();ctx.globalAlpha=1;
  ctx.restore();

  // Guide lights — blinking corners
  const blink=0.4+Math.sin(t*5.8)*0.6;
  ctx.globalAlpha=blink;
  ctx.fillStyle=dockable?'#00ff88':'#ffaa00';
  ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=10;
  [[topX0,topY0],[topX1,topY1],[botX0,botY0],[botX1,botY1]].forEach(([lx,ly])=>{
    ctx.beginPath();ctx.arc(lx,ly,R*0.032,0,Math.PI*2);ctx.fill();
  });
  ctx.shadowBlur=0;ctx.globalAlpha=1;

  // Guide arrows inside slot (pointing inward)
  if(nearDock){
    const aDir=dockable?0.85+Math.sin(t*3)*0.15:0.45;
    ctx.globalAlpha=aDir;
    ctx.fillStyle=dockable?'#00ff88':'#ffaa00';
    const ax=R*0.72,ay=0,asz=R*0.04;
    ctx.beginPath();ctx.moveTo(ax-asz*1.6,ay);ctx.lineTo(ax+asz*0.4,ay+asz);ctx.lineTo(ax+asz*0.4,-asz);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(ax-asz*3.2,ay);ctx.lineTo(ax-asz,ay+asz);ctx.lineTo(ax-asz,-asz);ctx.closePath();ctx.fill();
    ctx.globalAlpha=1;
  }

  // === STRUTS ===
  const innerR=R*0.42;
  for(let i=0;i<4;i++){
    const a=(i/4)*Math.PI*2+Math.PI/4+Math.PI/8;
    ctx.strokeStyle=st.color+'44';ctx.lineWidth=R*0.022;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a)*R*0.86,Math.sin(a)*R*0.86);
    ctx.lineTo(Math.cos(a)*innerR,Math.sin(a)*innerR);
    ctx.stroke();
    // Cross brace
    const mid=(R*0.86+innerR)/2,cl=R*0.065;
    ctx.strokeStyle=st.color+'28';ctx.lineWidth=R*0.012;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a)*mid-Math.sin(a)*cl,Math.sin(a)*mid+Math.cos(a)*cl);
    ctx.lineTo(Math.cos(a)*mid+Math.sin(a)*cl,Math.sin(a)*mid-Math.cos(a)*cl);
    ctx.stroke();
  }

  // === INNER RING — counter-rotating ===
  ctx.save();
  ctx.rotate(-st.angle*1.7); // net: outer+inner rotations → counter-rotation

  ctx.strokeStyle=st.color+'99';ctx.lineWidth=R*0.038;
  ctx.shadowColor=st.color;ctx.shadowBlur=8;
  ctx.beginPath();ctx.arc(0,0,innerR,0,Math.PI*2);ctx.stroke();
  ctx.shadowBlur=0;

  ctx.strokeStyle=st.color+'44';ctx.lineWidth=R*0.018;
  ctx.beginPath();
  for(let i=0;i<=6;i++){
    const a=(i/6)*Math.PI*2;
    i===0?ctx.moveTo(Math.cos(a)*innerR*0.87,Math.sin(a)*innerR*0.87)
         :ctx.lineTo(Math.cos(a)*innerR*0.87,Math.sin(a)*innerR*0.87);
  }
  ctx.stroke();

  for(let i=0;i<6;i++){
    const a=(i/6)*Math.PI*2;
    const pulse=0.4+Math.sin(t*2+i*1.15)*0.6;
    ctx.save();
    ctx.globalAlpha=0.25+pulse*0.55;
    ctx.fillStyle=st.color;ctx.shadowColor=st.color;ctx.shadowBlur=12;
    ctx.beginPath();ctx.arc(Math.cos(a)*innerR,Math.sin(a)*innerR,R*0.028,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;ctx.restore();
  }
  ctx.restore(); // end counter-rotate

  // === CENTRAL HUB ===
  const hubR=R*0.2;

  const hgr=ctx.createRadialGradient(0,0,0,0,0,hubR*2.2);
  hgr.addColorStop(0,st.color+'1a');hgr.addColorStop(1,st.color+'00');
  ctx.fillStyle=hgr;ctx.beginPath();ctx.arc(0,0,hubR*2.2,0,Math.PI*2);ctx.fill();

  // Hub rotates at half speed of outer (different speed = Transformers feel)
  ctx.save();
  ctx.rotate(-st.angle*0.5);

  ctx.fillStyle='#03070d';ctx.strokeStyle=st.color+'dd';ctx.lineWidth=2;
  ctx.shadowColor=st.color;ctx.shadowBlur=14;
  ctx.beginPath();
  for(let i=0;i<=8;i++){const a=(i/8)*Math.PI*2;i===0?ctx.moveTo(Math.cos(a)*hubR,Math.sin(a)*hubR):ctx.lineTo(Math.cos(a)*hubR,Math.sin(a)*hubR);}
  ctx.fill();ctx.stroke();ctx.shadowBlur=0;

  ctx.strokeStyle=st.color+'55';ctx.lineWidth=1.2;
  ctx.beginPath();ctx.arc(0,0,hubR*0.63,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.arc(0,0,hubR*0.32,0,Math.PI*2);ctx.stroke();

  // Mechanical arms
  for(let i=0;i<4;i++){
    const a=(i/4)*Math.PI*2;
    ctx.strokeStyle=st.color+'66';ctx.lineWidth=R*0.016;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a)*hubR*0.34,Math.sin(a)*hubR*0.34);
    ctx.lineTo(Math.cos(a)*hubR*0.88,Math.sin(a)*hubR*0.88);
    ctx.stroke();
    ctx.fillStyle='#060e1a';ctx.strokeStyle=st.color+'88';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(Math.cos(a)*hubR*0.65,Math.sin(a)*hubR*0.65,R*0.02,0,Math.PI*2);ctx.fill();ctx.stroke();
  }
  ctx.restore(); // end hub rotation

  // Center pulse core
  const core=0.5+Math.sin(t*4.2)*0.5;
  ctx.save();
  ctx.globalAlpha=0.65+core*0.35;
  ctx.fillStyle=st.color;ctx.shadowColor=st.color;ctx.shadowBlur=22;
  ctx.beginPath();ctx.arc(0,0,hubR*0.18,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;ctx.globalAlpha=1;
  ctx.restore();

  // Nav lights (no rotation — added after ctx.restore of station)
  ctx.restore(); // end station rotate+translate

  // Nav lights at fixed world positions (outside the station transform)
  {
    const nlAngs=[0,Math.PI/2,Math.PI,Math.PI*1.5];
    const nlCols=['#ff2020','#00dd44','#ff2020','#00dd44'];
    nlAngs.forEach((na,i)=>{
      const lx=sx+Math.cos(st.angle+na)*R*1.06;
      const ly=sy+Math.sin(st.angle+na)*R*1.06;
      const b=0.2+Math.sin(t*1.9+i*1.57)*0.8;
      ctx.save();ctx.globalAlpha=b;
      ctx.fillStyle=nlCols[i];ctx.shadowColor=nlCols[i];ctx.shadowBlur=10;
      ctx.beginPath();ctx.arc(lx,ly,R*0.038,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;ctx.restore();
    });
  }

  // === LABEL ===
  ctx.save();ctx.textAlign='center';
  const labelY=sy-R*1.72;
  if(nearDock){
    ctx.font='bold 15px "Courier New",monospace';
    ctx.fillStyle=st.color;ctx.shadowColor=st.color;ctx.shadowBlur=10;
    ctx.fillText(st.name,sx,labelY);ctx.shadowBlur=0;
    ctx.font='12px "Courier New",monospace';
    ctx.fillStyle=dockable?'#00ff88':'rgba(255,150,40,0.92)';
    ctx.fillText(dockable?'▶ MAIL SLOT ZAROVNÁN — PŘISTÁT: F':'▷ Zarovnej loď s mail slotem',sx,labelY-24);
    ctx.font='10px "Courier New",monospace';
    ctx.fillStyle=st.color+'80';
    ctx.fillText('◆ CORIOLIS CLASS ◆',sx,sy+R*1.72+12);
  } else {
    ctx.font='11px "Courier New",monospace';
    ctx.fillStyle=st.color+'aa';ctx.shadowColor=st.color;ctx.shadowBlur=5;
    ctx.fillText('◈ '+st.name,sx,sy-R*1.12);ctx.shadowBlur=0;
  }
  ctx.restore();
}

// ---- Parkovacia loď v hangáru ----
function _renderParkedShip(ctx,x,y,size,side,t,LM){
  const sc=size*0.38;
  const flipY=side==='top'?1:-1;
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(sc,-sc*flipY);
  ctx.globalAlpha=0.7+Math.sin(t*1.3)*0.1;
  ctx.fillStyle=LM?'#2a3a4a':'#445566';ctx.strokeStyle=LM?'#334466':'#7799bb';ctx.lineWidth=0.04;
  ctx.beginPath();ctx.moveTo(0,-1.1);ctx.lineTo(0.35,0.2);ctx.lineTo(0.15,0.6);ctx.lineTo(-0.15,0.6);ctx.lineTo(-0.35,0.2);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(0.32,0.1);ctx.lineTo(0.9,0.7);ctx.lineTo(0.6,0.75);ctx.lineTo(0.15,0.55);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(-0.32,0.1);ctx.lineTo(-0.9,0.7);ctx.lineTo(-0.6,0.75);ctx.lineTo(-0.15,0.55);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=LM?'#111d2e':'#223355';ctx.strokeStyle=LM?'#2255aa':'#4488cc';ctx.lineWidth=0.06;
  ctx.beginPath();ctx.ellipse(0,-0.5,0.16,0.3,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle=LM?'rgba(20,60,180,0.5)':'rgba(80,140,255,0.4)';ctx.shadowColor=LM?'#2244cc':'#4488ff';ctx.shadowBlur=0.3;
  ctx.beginPath();ctx.ellipse(0,0.65,0.12,0.08,0,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
  ctx.restore();
}

// ---- Vnitřek stanice (Elite Dangerous style rectangular hangar) ----
function renderInterior(data,t){
  const LM=window.lightMode;
  const st=data.station;
  const{x:sx,y:sy}=toScreen(st.x,st.y);
  const iW=data.iW,iH=data.iH;
  const col=st.color;

  // Main space background
  ctx.save();
  ctx.fillStyle=LM?'#c0ccd8':'#00020e';
  ctx.fillRect(sx-iW*0.5,sy-iH*0.5,iW,iH);
  ctx.restore();

  // Ambient gradient from ceiling lights
  const amb=ctx.createLinearGradient(sx,sy-iH*0.5,sx,sy+iH*0.5);
  if(LM){
    amb.addColorStop(0,'rgba(40,60,120,0.10)');
    amb.addColorStop(0.5,'rgba(20,30,60,0.04)');
    amb.addColorStop(1,'rgba(40,60,120,0.10)');
  } else {
    amb.addColorStop(0,'rgba(60,90,160,0.08)');
    amb.addColorStop(0.5,'rgba(20,30,60,0.03)');
    amb.addColorStop(1,'rgba(60,90,160,0.08)');
  }
  ctx.save();ctx.fillStyle=amb;
  ctx.fillRect(sx-iW*0.5,sy-iH*0.5,iW,iH);
  ctx.restore();

  // Thick structural ceiling, floor, and side walls
  ctx.save();
  ctx.fillStyle=LM?'#7a8a9a':'#0a0e1a';
  ctx.fillRect(sx-iW*0.5,sy-iH*0.5,iW,iH*0.085);
  ctx.fillRect(sx-iW*0.5,sy+iH*0.415,iW,iH*0.085);
  ctx.fillRect(sx-iW*0.5,sy-iH*0.5,iW*0.045,iH);
  ctx.fillRect(sx+iW*0.455,sy-iH*0.5,iW*0.045,iH);
  ctx.restore();

  // Wall accent glow border
  ctx.save();
  ctx.strokeStyle=col+(LM?'99':'66');ctx.lineWidth=3;
  ctx.shadowColor=col;ctx.shadowBlur=LM?6:14;
  ctx.strokeRect(sx-iW*0.5+2,sy-iH*0.5+2,iW-4,iH-4);
  ctx.shadowBlur=0;
  ctx.strokeStyle=col+(LM?'55':'22');ctx.lineWidth=1.5;
  ctx.strokeRect(sx-iW*0.48,sy-iH*0.42,iW*0.96,iH*0.84);
  ctx.restore();

  // Vertical structural girders
  ctx.save();
  for(let i=1;i<=4;i++){
    const gx=sx-iW*0.5+i*(iW/5);
    ctx.strokeStyle=col+(LM?'55':'28');ctx.lineWidth=iH*0.022;
    ctx.beginPath();ctx.moveTo(gx,sy-iH*0.5);ctx.lineTo(gx,sy+iH*0.5);ctx.stroke();
    ctx.lineWidth=1;ctx.strokeStyle=col+(LM?'99':'44');
    const by1=sy-iH*0.32,by2=sy+iH*0.32;
    ctx.beginPath();
    ctx.moveTo(gx-iH*0.025,by1);ctx.lineTo(gx+iH*0.025,by1);
    ctx.moveTo(gx-iH*0.025,by2);ctx.lineTo(gx+iH*0.025,by2);
    ctx.stroke();
  }
  ctx.lineWidth=iH*0.012;ctx.strokeStyle=col+(LM?'44':'18');
  ctx.beginPath();ctx.moveTo(sx-iW*0.5,sy-iH*0.18);ctx.lineTo(sx+iW*0.5,sy-iH*0.18);ctx.stroke();
  ctx.beginPath();ctx.moveTo(sx-iW*0.5,sy+iH*0.18);ctx.lineTo(sx+iW*0.5,sy+iH*0.18);ctx.stroke();
  ctx.restore();

  // Overhead lights
  ctx.save();
  const nLights=9;
  for(let i=0;i<nLights;i++){
    const lx=sx-iW*0.42+i*(iW*0.84/(nLights-1));
    const flicker=0.75+Math.sin(t*6.7+i*1.9)*0.12+Math.sin(t*2.3+i*0.7)*0.13;
    const ly=sy-iH*0.45;
    if(LM){
      // Dark housing visible on light wall
      ctx.fillStyle=`rgba(30,50,90,${0.7*flicker})`;
      ctx.fillRect(lx-iW*0.02,ly,iW*0.04,iH*0.022);
      ctx.fillStyle=`rgba(10,20,60,${0.9*flicker})`;
      ctx.shadowColor='rgba(20,50,160,0.8)';ctx.shadowBlur=8*flicker;
      ctx.fillRect(lx-iW*0.013,ly+iH*0.005,iW*0.026,iH*0.012);
      ctx.shadowBlur=0;
      const coneGrad=ctx.createLinearGradient(lx,ly+iH*0.02,lx,sy+iH*0.05);
      coneGrad.addColorStop(0,`rgba(60,100,200,${0.10*flicker})`);
      coneGrad.addColorStop(1,'rgba(60,100,200,0)');
      ctx.fillStyle=coneGrad;
    } else {
      ctx.fillStyle=`rgba(120,160,220,${0.5*flicker})`;
      ctx.fillRect(lx-iW*0.02,ly,iW*0.04,iH*0.022);
      ctx.fillStyle=`rgba(200,220,255,${0.8*flicker})`;
      ctx.shadowColor='rgba(160,200,255,0.9)';ctx.shadowBlur=12*flicker;
      ctx.fillRect(lx-iW*0.013,ly+iH*0.005,iW*0.026,iH*0.012);
      ctx.shadowBlur=0;
      const coneGrad=ctx.createLinearGradient(lx,ly+iH*0.02,lx,sy+iH*0.05);
      coneGrad.addColorStop(0,`rgba(160,200,255,${0.07*flicker})`);
      coneGrad.addColorStop(1,'rgba(160,200,255,0)');
      ctx.fillStyle=coneGrad;
    }
    ctx.beginPath();
    ctx.moveTo(lx-iW*0.013,ly+iH*0.02);ctx.lineTo(lx+iW*0.013,ly+iH*0.02);
    ctx.lineTo(lx+iW*0.11,sy+iH*0.05);ctx.lineTo(lx-iW*0.11,sy+iH*0.05);
    ctx.fill();
  }
  ctx.restore();

  // Floor center line
  ctx.save();
  ctx.strokeStyle=col+(LM?'44':'18');ctx.lineWidth=1.5;ctx.setLineDash([iW*0.012,iW*0.018]);
  ctx.beginPath();ctx.moveTo(sx-iW*0.46,sy);ctx.lineTo(sx+iW*0.46,sy);ctx.stroke();
  ctx.setLineDash([]);ctx.restore();

  // Entry port (left wall) indicator lights
  {
    const blink=0.4+Math.sin(t*5.5)*0.6;
    const entCol=LM?'#00aa55':'#00ff88';
    const ex=sx-iW*0.495;
    const dotR=iH*0.022;
    ctx.save();ctx.globalAlpha=blink;
    ctx.fillStyle=entCol;ctx.shadowColor=entCol;ctx.shadowBlur=LM?8:14;
    ctx.beginPath();ctx.arc(ex+dotR,sy-iH*0.11,dotR,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(ex+dotR,sy+iH*0.11,dotR,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();
    ctx.save();ctx.strokeStyle=LM?'#00aa5566':'#00ff8844';ctx.lineWidth=2;
    ctx.strokeRect(ex,sy-iH*0.18,iW*0.035,iH*0.36);ctx.restore();
  }

  // Bay pads
  data.bays.forEach(bay=>{
    const{x:bsx,y:bsy}=toScreen(bay.x,bay.y);
    const isNear=bay===data.nearBay;
    const isDocking=!!(data.dockAnim&&data.dockAnim.bay===bay);
    const freeCol=LM?(isNear||isDocking?'#008855':col):(isNear||isDocking?'#00ff88':col);
    const bcol=bay.occupied?(LM?'#cc2200':'#ff4400'):freeCol;
    const pulse=isNear?0.7+Math.sin(t*4)*0.3:1;
    const bW=bay.w,bH=bay.h;
    const dirY=bay.side==='top'?1:-1;

    ctx.save();
    ctx.fillStyle=bay.occupied?(LM?'#c89080':'#1a0400'):(LM?'#90b4a8':'#001510');
    ctx.fillRect(bsx-bW*0.5,bsy-bH*0.5,bW,bH);

    if(!bay.occupied&&!isDocking){
      ctx.globalAlpha=(isNear?0.85:0.3)*pulse;
      ctx.strokeStyle=bcol;ctx.lineWidth=1.5;
      for(let ci=1;ci<=3;ci++){
        const chevy=bsy+dirY*(bH*0.65+ci*bH*0.5);
        const cw=bW*(0.42-ci*0.06);
        ctx.beginPath();
        ctx.moveTo(bsx-cw,chevy);ctx.lineTo(bsx,chevy-dirY*bH*0.18);ctx.lineTo(bsx+cw,chevy);
        ctx.stroke();
      }
      ctx.globalAlpha=1;
    }

    ctx.globalAlpha=pulse;
    ctx.strokeStyle=bcol+(bay.occupied?'99':'cc');
    ctx.lineWidth=2.5;ctx.shadowColor=bcol;ctx.shadowBlur=LM?8:(isNear||isDocking?20:8);
    ctx.strokeRect(bsx-bW*0.5,bsy-bH*0.5,bW,bH);
    ctx.shadowBlur=0;

    if(!bay.occupied&&!isDocking){
      ctx.globalAlpha=0.55*pulse;
      ctx.strokeStyle=bcol+'99';ctx.lineWidth=1.5;
      ctx.beginPath();
      ctx.moveTo(bsx-bW*0.36,bsy);ctx.lineTo(bsx+bW*0.36,bsy);
      ctx.moveTo(bsx,bsy-bH*0.36);ctx.lineTo(bsx,bsy+bH*0.36);
      ctx.stroke();
      const cm=bW*0.14;
      ctx.globalAlpha=0.8*pulse;ctx.strokeStyle=bcol;ctx.lineWidth=2;
      [[-0.5,-0.5],[0.5,-0.5],[0.5,0.5],[-0.5,0.5]].forEach(([dx,dy])=>{
        ctx.beginPath();
        ctx.moveTo(bsx+dx*bW,bsy+dy*bH);ctx.lineTo(bsx+dx*bW+(dx>0?-cm:cm),bsy+dy*bH);
        ctx.moveTo(bsx+dx*bW,bsy+dy*bH);ctx.lineTo(bsx+dx*bW,bsy+dy*bH+(dy>0?-cm:cm));
        ctx.stroke();
      });
    } else if(bay.occupied){
      _renderParkedShip(ctx,bsx,bsy,bW,bay.side,t,LM);
    }

    if(isDocking){
      const prog=data.dockAnim.progress;
      const eased=Math.pow(prog,0.4);
      const armStartY=bsy+(bay.side==='top'?-bH*0.5:bH*0.5);
      ctx.globalAlpha=0.9;
      ctx.strokeStyle=LM?'#334466':'#99bbdd';ctx.lineWidth=bH*0.09;
      ctx.shadowColor=LM?'#3366aa':'#aaccff';ctx.shadowBlur=LM?8:14;
      ctx.beginPath();ctx.moveTo(bsx,armStartY);ctx.lineTo(bsx,armStartY-dirY*bH*0.75*eased);ctx.stroke();
      ctx.lineWidth=bH*0.05;ctx.shadowBlur=LM?5:8;
      const armMid=armStartY-dirY*bH*0.4*eased;
      ctx.beginPath();
      ctx.moveTo(bsx-bW*0.2,armMid);ctx.lineTo(bsx-bW*0.35,armMid-dirY*bH*0.2*eased);
      ctx.moveTo(bsx+bW*0.2,armMid);ctx.lineTo(bsx+bW*0.35,armMid-dirY*bH*0.2*eased);
      ctx.stroke();
      ctx.fillStyle=LM?'#224488':'#cce0ff';ctx.shadowBlur=LM?8:16;
      ctx.beginPath();ctx.arc(bsx,armStartY-dirY*bH*0.75*eased,bH*0.07,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=(0.3+Math.sin(t*8)*0.3)*eased;
      ctx.strokeStyle=LM?'#008855':'#00ff88';ctx.lineWidth=1.5;
      ctx.shadowColor=LM?'#008855':'#00ff88';ctx.shadowBlur=LM?5:10;
      ctx.beginPath();ctx.arc(bsx,armStartY-dirY*bH*0.75*eased,bH*0.15*(1-prog*0.3),0,Math.PI*2);ctx.stroke();
      ctx.shadowBlur=0;
    }

    ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();
  });
}
function renderInteriorScene(data,p,t,dt){
  const st=data.station;

  ctx.fillStyle=window.lightMode?'#c8d4e2':'#000208';ctx.fillRect(0,0,W,H);

  // Svět se zoom transformem
  ctx.save();
  ctx.translate(W/2,H/2);ctx.scale(camZoom,camZoom);ctx.translate(-W/2,-H/2);
  renderInterior(data,t);
  renderParticles([...engineTrails,...gameState.particles]);
  ctx.restore();

  // Bay labels in screen coords
  data.bays.forEach(bay=>{
    const{x:bsx,y:bsy}=toScreen(bay.x,bay.y);
    const screenX=(bsx-W/2)*camZoom+W/2;
    const screenY=(bsy-H/2)*camZoom+H/2;
    const screenH=(bay.h||bay.r*2)*camZoom;
    const isNear=bay===data.nearBay;
    const isDocking=!!(data.dockAnim&&data.dockAnim.bay===bay);
    const LM2=window.lightMode;
    const col=bay.occupied?(LM2?'#cc2200':'#ff4400'):(isNear||isDocking?(LM2?'#007744':'#00ff88'):st.color);
    const labelY=bay.side==='top'?screenY-screenH*0.5-9:screenY+screenH*0.5+18;
    ctx.save();ctx.textAlign='center';
    ctx.font='bold 11px "Courier New",monospace';
    ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=LM2?3:6;
    ctx.fillText(`BAY-${String(bay.num).padStart(2,'0')}`,screenX,labelY);
    ctx.shadowBlur=0;ctx.font='9px "Courier New",monospace';
    ctx.fillStyle=bay.occupied?(LM2?'#aa3300':'#ff5500'):(isDocking?(LM2?'#006633':'#00ffcc'):(LM2?'#445566':'#888888'));
    const statusText=bay.occupied?'■ OBSAZENO':(isDocking?'▶ DOKOVÁNÍ...':'□ VOLNÉ');
    ctx.fillText(statusText,screenX,labelY+(bay.side==='top'?-12:14));
    ctx.restore();
  });

  // Loď hráče (vždy uprostřed)
  renderPlayerShip(p,t);

  // Entry flash fade
  if(data.entryFlash>0){
    ctx.save();ctx.globalAlpha=data.entryFlash*0.9;
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=1;ctx.restore();
  }

  renderVignette();

  // HUD
  renderHUD(p,null,{approaching:false,align:0,speed:0,dockable:false},t);

  // Nápověda dole
  ctx.save();ctx.textAlign='center';
  ctx.font='12px "Courier New",monospace';
  if(data.dockAnim){
    const pct=Math.round(data.dockAnim.progress*100);
    const _lm=window.lightMode;
    ctx.fillStyle=_lm?'#006644':'#00ffcc';ctx.shadowColor=_lm?'#006644':'#00ffcc';ctx.shadowBlur=_lm?4:12;
    ctx.fillText(`[ DOKOVACÍ RAMENO — ${pct}% — ČEKEJ... ]`,W/2,H-55);
  } else if(data.nearBay&&!data.nearBay.occupied){
    ctx.fillStyle=_lm?'#007744':'#00ff88';ctx.shadowColor=_lm?'#007744':'#00ff88';ctx.shadowBlur=_lm?4:10;
    ctx.fillText(`[ BAY-${String(data.nearBay.num).padStart(2,'0')} — ZAROVNÁNO — AKTIVOVAT RAMENO: F ]`,W/2,H-55);
  } else {
    ctx.fillStyle=_lm?'rgba(160,80,0,0.9)':'rgba(255,150,40,0.75)';ctx.shadowColor=_lm?'rgba(120,60,0,0.5)':'rgba(255,150,40,0.5)';ctx.shadowBlur=_lm?3:8;
    ctx.fillText('Naleti k volnému hangáru  •  ESC = nouzový výstup',W/2,H-55);
  }
  ctx.shadowBlur=0;ctx.restore();

  // Minimap
  ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.setLineDash([]);ctx.shadowBlur=0;
  renderMinimap(p,gameState.chunks,null,t);
}

// ---- Cinematická sekvence přistávání ----
function renderDockingSequence(gs,t){
  const anim=gs.dockAnim;
  if(!anim)return;
  const prog=anim.progress,p=gs.player,st=anim.station;

  // Fáze 2 — průlet slotem do vnitřku
  if(anim.phase===2){
    const zoom=4; // zůstaneme na konečném zoomu fáze 1
    ctx.save();
    ctx.translate(W/2,H/2);ctx.scale(zoom,zoom);ctx.translate(-W/2,-H/2);
    renderBackground(gs.chunks,t);
    renderSystems(gs.chunks,t);
    if(st.type==='large')renderLargeStation(st,t,true,false);
    else if(st.type==='dealer')renderDealer(st,t,true,false);
    else if(st.type==='garage')renderGarage(st,t,true,false);
    else renderStation(st,t,true,false);
    const{x:shipSX,y:shipSY}=toScreen(p.x,p.y);
    renderPlayerShip(p,t,shipSX,shipSY);
    ctx.restore();
    // Bílý záblesk narůstá — přechod do interiéru
    const flash=Math.pow(prog,0.75);
    ctx.globalAlpha=flash;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
    // Text "VSTUP DO HANGÁRU"
    if(prog<0.65){
      ctx.save();ctx.textAlign='center';
      ctx.font='bold 16px "Courier New",monospace';
      ctx.globalAlpha=Math.min(1,prog*5);
      ctx.fillStyle='#00ff88';ctx.shadowColor='#00ff88';ctx.shadowBlur=18;
      ctx.fillText('VSTUP DO HANGÁRU',W/2,H*0.5-40);
      ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();
    }
    return;
  }

  // Zoom kvadratický — pomalu začíná, rychle zrychluje ke konci
  const zoom=1+prog*prog*3;

  // Svět + loď se zoomem — kamera je na stanici (nastaveno v updateDocking)
  ctx.save();
  ctx.translate(W/2,H/2);ctx.scale(zoom,zoom);ctx.translate(-W/2,-H/2);
  renderBackground(gs.chunks,t);
  renderSystems(gs.chunks,t);
  gs.chunks.forEach(ch=>ch.asteroids.forEach(a=>renderAsteroid(a,t)));
  renderParticles([...engineTrails,...gs.particles]);
  if(st.type==='large')renderLargeStation(st,t,true,false);
  else if(st.type==='dealer')renderDealer(st,t,true,false);
  else if(st.type==='garage')renderGarage(st,t,true,false);
  else renderStation(st,t,true,false);
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

// ---- Sutiny stanice ----
function renderStationDebris(debris,t){
  debris.forEach(d=>{
    const{x:sx,y:sy}=toScreen(d.x,d.y);
    if(!inView(sx,sy,d.sz*2.5))return;
    ctx.save();
    ctx.translate(sx,sy);ctx.rotate(d.angle);
    // Hot glow fades from orange to dark metal
    const gf=d.glowFade||0;
    if(gf>0){
      ctx.shadowColor=gf>0.5?'#ff6600':'#882200';
      ctx.shadowBlur=8+gf*16;
    }
    ctx.fillStyle=d.color;
    ctx.strokeStyle=gf>0.2?`rgba(255,${Math.floor(80*gf)},0,${gf*0.7})`:'rgba(60,40,20,0.4)';
    ctx.lineWidth=1.5;
    ctx.beginPath();
    d.verts.forEach((v,i)=>i===0?ctx.moveTo(v.x,v.y):ctx.lineTo(v.x,v.y));
    ctx.closePath();ctx.fill();ctx.stroke();
    // Glowing edge detail on hot pieces
    if(gf>0.3){
      ctx.globalAlpha=gf*0.4;
      ctx.strokeStyle=`rgba(255,180,0,${gf})`;
      ctx.lineWidth=2.5;
      ctx.stroke();
      ctx.globalAlpha=1;
    }
    ctx.shadowBlur=0;ctx.restore();
  });
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

  // === BOČNÍ OMS TRYSKY (vychází z OMS podů na y=8, x=±9) ===
  if(strafeL){
    const fl=8+Math.random()*6;ctx.globalAlpha=0.7+Math.random()*0.2;
    const eg=ctx.createLinearGradient(9,8,9+fl,8);
    eg.addColorStop(0,'rgba(80,200,255,0.9)');eg.addColorStop(1,'transparent');
    ctx.fillStyle=eg;ctx.beginPath();ctx.moveTo(9,5.5);ctx.lineTo(9,10.5);ctx.lineTo(9+fl,8);ctx.fill();
    ctx.globalAlpha=1;
  }
  if(strafeR){
    const fl=8+Math.random()*6;ctx.globalAlpha=0.7+Math.random()*0.2;
    const eg=ctx.createLinearGradient(-9,8,-9-fl,8);
    eg.addColorStop(0,'rgba(80,200,255,0.9)');eg.addColorStop(1,'transparent');
    ctx.fillStyle=eg;ctx.beginPath();ctx.moveTo(-9,5.5);ctx.lineTo(-9,10.5);ctx.lineTo(-9-fl,8);ctx.fill();
    ctx.globalAlpha=1;
  }

  // === SSME MOTORY (3 zvony) — barva z lodi ===
  const tCol=player.thrusterColor||'#ff7700';
  const tColRgb=hexToRgb(tCol)||{r:255,g:119,b:0};
  if(player.thrusting||player.boosting){
    const isBst=player.boosting;
    const flicker=0.82+Math.random()*0.18;
    const fl=isBst?38:22;
    const sc=getShipDef(player.shipType||'viper').scale||1.0;
    const mOff=Math.round(5*sc);
    [-mOff,0,mOff].forEach(ox=>{
      ctx.globalAlpha=0.85;
      const eg=ctx.createLinearGradient(ox,13,ox,13+fl*flicker);
      const r=tColRgb.r,g=tColRgb.g,b=tColRgb.b;
      eg.addColorStop(0,`rgba(${Math.min(255,r+60)},${Math.min(255,g+60)},${Math.min(255,b+60)},0.95)`);
      eg.addColorStop(0.3,`rgba(${r},${g},${b},0.6)`);
      eg.addColorStop(1,'transparent');
      ctx.fillStyle=eg;
      ctx.beginPath();ctx.moveTo(ox-3.5,12);ctx.lineTo(ox+3.5,12);ctx.lineTo(ox,13+fl*flicker);ctx.fill();
    });
    ctx.globalAlpha=0.4;
    const gg=ctx.createRadialGradient(0,13,0,0,13,isBst?22:14);
    gg.addColorStop(0,`rgba(${tColRgb.r},${tColRgb.g},${tColRgb.b},0.7)`);gg.addColorStop(1,'transparent');
    ctx.fillStyle=gg;ctx.beginPath();ctx.arc(0,13,isBst?22:14,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
  }

  // === LOĎ — shape dle typu, barva z hráče ===
  const shipCol=player.shipColor||'#aaccff';
  const shipId=player.shipType||'viper';
  const shipScale=getShipDef(shipId).scale||1.0;
  ctx.save();ctx.scale(shipScale,shipScale);
  drawGameShuttle(shipCol,shipId);
  ctx.restore();

  ctx.restore();

  // === ŠTÍT (v screen coords) ===
  if(player.shield>0){
    const shA=player.invTimer>0?0.5:0.04+player.shield/player.shieldMax*0.14;
    ctx.save();ctx.globalAlpha=shA;ctx.strokeStyle='#4080ff';ctx.lineWidth=1.5;
    ctx.shadowColor='#4080ff';ctx.shadowBlur=8;
    ctx.beginPath();ctx.arc(sx,sy,26,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  // Blikání při zásahu
  if(player.invTimer>0&&Math.floor(player.invTimer*10)%2===0){
    ctx.save();ctx.globalAlpha=0.2;ctx.fillStyle='#ffffff';
    ctx.beginPath();ctx.arc(sx,sy,26,0,Math.PI*2);ctx.fill();ctx.restore();
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

// ---- Space Shuttle Orbiter — herní loď ----
// Kreslí se ve vlastním sys. souřadnic: nos nahoře (-Y), konec dole (+Y)
// ctx musí být již transformován (translate + rotate) jako u starého trupu.
function hexToRgb(hex){
  const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r?{r:parseInt(r[1],16),g:parseInt(r[2],16),b:parseInt(r[3],16)}:null;
}
function blendHull(base,hullHex){
  // Blenduje bílou barvu s hull barvou (0.35 hull, 0.65 white base)
  const h=hexToRgb(hullHex)||{r:200,g:210,b:230};
  const br=hexToRgb(base)||{r:204,g:212,b:230};
  const ri=Math.round(br.r*0.45+h.r*0.55);
  const gi=Math.round(br.g*0.45+h.g*0.55);
  const bi=Math.round(br.b*0.45+h.b*0.55);
  return `rgb(${ri},${gi},${bi})`;
}

// ===== 20 LODÍ — vizuální styly =====
// Každá funkce: souřadnicový střed (0,0), nos nahoru (-Y). Velikost ~±24×±26 px.

function _drawSidewinder(col){
  ctx.fillStyle=blendHull('#ccddee',col);
  ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(-20,12);ctx.lineTo(0,8);ctx.lineTo(20,12);ctx.closePath();ctx.fill();
  ctx.fillStyle='#1a1f28';ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(-3,-6);ctx.lineTo(3,-6);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(120,210,255,0.65)';ctx.beginPath();ctx.ellipse(0,-10,2.2,3,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#445';ctx.fillRect(-5,9,10,5);
  ctx.fillStyle='rgba(255,170,60,0.9)';ctx.beginPath();ctx.ellipse(0,14,3.5,2,0,0,Math.PI*2);ctx.fill();
}

function _drawHauler(col){
  // Side cargo pods with bezier rounding
  ctx.fillStyle=blendHull('#aa8833',col);
  ctx.beginPath();ctx.moveTo(-14,-4);ctx.lineTo(-22,-4);ctx.bezierCurveTo(-25,-2,-25,10,-22,13);ctx.lineTo(-14,13);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(14,-4);ctx.lineTo(22,-4);ctx.bezierCurveTo(25,-2,25,10,22,13);ctx.lineTo(14,13);ctx.closePath();ctx.fill();
  // Pod engines
  [-22,22].forEach(ex=>{
    ctx.fillStyle='#554';ctx.beginPath();ctx.ellipse(ex,13,2.8,1.8,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,170,40,0.85)';ctx.beginPath();ctx.ellipse(ex,13,1.6,1,0,0,Math.PI*2);ctx.fill();
  });
  // Main cargo hold (wide, slight taper)
  ctx.fillStyle=blendHull('#cc9944',col);
  ctx.beginPath();ctx.moveTo(-14,-14);ctx.lineTo(14,-14);ctx.lineTo(14,15);ctx.lineTo(-14,15);ctx.closePath();ctx.fill();
  // Top section bezier nose
  ctx.fillStyle=blendHull('#ddaa55',col);
  ctx.beginPath();ctx.moveTo(-6,-14);ctx.lineTo(6,-14);ctx.bezierCurveTo(5,-18,3,-21,0,-24);ctx.bezierCurveTo(-3,-21,-5,-18,-6,-14);ctx.closePath();ctx.fill();
  // Cockpit window
  ctx.fillStyle='rgba(90,180,255,0.7)';ctx.shadowColor='#66aaff';ctx.shadowBlur=4;
  ctx.beginPath();ctx.ellipse(0,-17,2.8,4,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  // Hull panel line
  ctx.strokeStyle='rgba(0,0,0,0.22)';ctx.lineWidth=0.8;ctx.beginPath();ctx.moveTo(-14,-4);ctx.lineTo(14,-4);ctx.stroke();
  // Three main engines
  ctx.fillStyle='#554';[-7,0,7].forEach(ex=>{
    ctx.beginPath();ctx.ellipse(ex,15,3.2,2,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,170,40,0.85)';ctx.beginPath();ctx.ellipse(ex,15,1.8,1.2,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#554';
  });
}

function _drawScout(col){
  ctx.fillStyle=blendHull('#44cc88',col);
  ctx.beginPath();ctx.moveTo(0,-24);ctx.lineTo(-18,8);ctx.lineTo(-3,10);ctx.lineTo(0,14);ctx.lineTo(3,10);ctx.lineTo(18,8);ctx.closePath();ctx.fill();
  ctx.fillStyle='#0a1a10';ctx.beginPath();ctx.moveTo(0,-24);ctx.lineTo(-3,0);ctx.lineTo(3,0);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(100,255,180,0.6)';ctx.beginPath();ctx.ellipse(0,-14,1.5,4,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#556';ctx.beginPath();ctx.ellipse(0,14,4,2.5,0,0,Math.PI*2);ctx.fill();
}

function _drawCobra(col){
  ctx.fillStyle=blendHull('#cc6622',col);
  ctx.beginPath();ctx.moveTo(0,-22);ctx.lineTo(-14,-8);ctx.lineTo(-14,4);ctx.lineTo(14,4);ctx.lineTo(14,-8);ctx.closePath();ctx.fill();
  ctx.fillStyle=blendHull('#dd7733',col);
  ctx.beginPath();ctx.moveTo(-14,4);ctx.lineTo(-21,14);ctx.lineTo(-4,10);ctx.lineTo(0,14);ctx.lineTo(4,10);ctx.lineTo(21,14);ctx.lineTo(14,4);ctx.closePath();ctx.fill();
  ctx.fillStyle='#200800';ctx.fillRect(-12,-12,24,3);
  ctx.fillStyle='rgba(255,160,80,0.65)';ctx.beginPath();ctx.ellipse(0,-14,4,3,0,0,Math.PI*2);ctx.fill();
  [-5,5].forEach(ex=>{ctx.fillStyle='#554';ctx.beginPath();ctx.ellipse(ex,13,2.8,1.8,0,0,Math.PI*2);ctx.fill();});
}

function _drawEagle(col){
  ctx.fillStyle=blendHull('#ddcc00',col);
  ctx.beginPath();ctx.moveTo(0,-22);ctx.lineTo(-22,12);ctx.lineTo(-9,16);ctx.lineTo(0,8);ctx.lineTo(9,16);ctx.lineTo(22,12);ctx.closePath();ctx.fill();
  ctx.fillStyle='#1a1200';
  ctx.beginPath();ctx.moveTo(-22,12);ctx.lineTo(-19,12);ctx.lineTo(-9,16);ctx.lineTo(-11,16);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(22,12);ctx.lineTo(19,12);ctx.lineTo(9,16);ctx.lineTo(11,16);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(255,240,100,0.65)';ctx.beginPath();ctx.ellipse(0,-13,3,4,0,0,Math.PI*2);ctx.fill();
  [-5,5].forEach(ex=>{ctx.fillStyle='#554433';ctx.beginPath();ctx.ellipse(ex,12,2.5,1.8,0,0,Math.PI*2);ctx.fill();});
}

function _drawDiamondback(col){
  ctx.fillStyle=blendHull('#3388dd',col);
  ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(-10,-8);ctx.lineTo(-14,8);ctx.lineTo(-7,14);ctx.lineTo(7,14);ctx.lineTo(14,8);ctx.lineTo(10,-8);ctx.closePath();ctx.fill();
  ctx.strokeStyle=blendHull('#1133aa',col);ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(-10,-8);ctx.lineTo(0,0);ctx.lineTo(10,-8);ctx.lineTo(0,-20);ctx.stroke();
  ctx.fillStyle='rgba(80,180,255,0.7)';ctx.beginPath();ctx.ellipse(0,-11,3,4,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=blendHull('#2277cc',col);
  [-14,14].forEach(s=>{ctx.beginPath();ctx.moveTo(s*0.8,8);ctx.lineTo(s,8);ctx.lineTo(s,14);ctx.lineTo(s*0.8,14);ctx.closePath();ctx.fill();});
  [-5,5].forEach(ex=>{ctx.fillStyle='#334';ctx.beginPath();ctx.ellipse(ex,14,2.2,1.5,0,0,Math.PI*2);ctx.fill();});
}

function _drawVulture(col){
  ctx.fillStyle=blendHull('#cc3366',col);
  ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(-5,-4);ctx.lineTo(-5,6);ctx.lineTo(5,6);ctx.lineTo(5,-4);ctx.closePath();ctx.fill();
  ctx.fillStyle=blendHull('#bb2255',col);
  [-11,11].forEach(bx=>{
    ctx.beginPath();ctx.moveTo(bx*0.5,-2);ctx.lineTo(bx,-2);ctx.lineTo(bx,14);ctx.lineTo(bx*0.5,14);ctx.closePath();ctx.fill();
    ctx.fillStyle='#334';ctx.beginPath();ctx.ellipse(bx,14,2.8,1.8,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=blendHull('#bb2255',col);
  });
  ctx.fillStyle=blendHull('#cc3366',col);
  ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(-5,0);ctx.lineTo(-5,4);ctx.lineTo(-18,4);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(5,0);ctx.lineTo(18,0);ctx.lineTo(18,4);ctx.lineTo(5,4);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(255,80,120,0.65)';ctx.beginPath();ctx.ellipse(0,-12,3,4,0,0,Math.PI*2);ctx.fill();
}

function _drawKrait(col){
  ctx.fillStyle=blendHull('#ee6600',col);
  ctx.beginPath();ctx.moveTo(-13,-6);ctx.lineTo(13,-6);ctx.lineTo(13,-14);ctx.lineTo(7,-22);ctx.lineTo(-7,-22);ctx.lineTo(-13,-14);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(-16,6);ctx.lineTo(-13,-6);ctx.lineTo(13,-6);ctx.lineTo(16,6);ctx.lineTo(10,14);ctx.lineTo(-10,14);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(255,160,80,0.65)';ctx.fillRect(-7,-18,14,5);
  [-16,16].forEach(ex=>{
    ctx.fillStyle=blendHull('#dd5500',col);
    ctx.beginPath();ctx.moveTo(ex,2);ctx.lineTo(ex*1.2,2);ctx.lineTo(ex*1.2,14);ctx.lineTo(ex,14);ctx.closePath();ctx.fill();
    ctx.fillStyle='#554';ctx.beginPath();ctx.ellipse(ex*1.1,14,2.8,1.8,0,0,Math.PI*2);ctx.fill();
  });
  ctx.fillStyle='#554';ctx.beginPath();ctx.ellipse(0,14,4.5,2.5,0,0,Math.PI*2);ctx.fill();
}

function _drawPython(col){
  ctx.fillStyle=blendHull('#9944dd',col);
  ctx.beginPath();ctx.ellipse(0,0,11,20,0,0,Math.PI*2);ctx.fill();
  [-16,16].forEach(ex=>{
    ctx.fillStyle=blendHull('#8833cc',col);
    const sx=Math.sign(ex);
    ctx.beginPath();ctx.moveTo(ex,-13);ctx.lineTo(ex+sx*5,-11);ctx.lineTo(ex+sx*5,10);ctx.lineTo(ex,11);ctx.closePath();ctx.fill();
    ctx.fillStyle='#554';ctx.beginPath();ctx.ellipse(ex+sx*4,11,3.2,2,0,0,Math.PI*2);ctx.fill();
  });
  ctx.fillStyle=blendHull('#aa55ee',col);
  ctx.beginPath();ctx.moveTo(-5,-20);ctx.lineTo(0,-26);ctx.lineTo(5,-20);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(190,120,255,0.65)';ctx.fillRect(-4,-16,8,6);
  ctx.fillStyle='#554';ctx.beginPath();ctx.ellipse(0,16,4,2.5,0,0,Math.PI*2);ctx.fill();
}

function _drawMamba(col){
  // Ultra-wide delta with sculpted bezier trailing edges
  ctx.fillStyle=blendHull('#cc0022',col);
  ctx.beginPath();
  ctx.moveTo(0,-22);ctx.lineTo(-24,8);
  ctx.bezierCurveTo(-20,14,-12,14,-5,12);
  ctx.lineTo(0,8);ctx.lineTo(5,12);
  ctx.bezierCurveTo(12,14,20,14,24,8);
  ctx.closePath();ctx.fill();
  // Leading edge dark stripe
  ctx.fillStyle='#220005';
  ctx.beginPath();ctx.moveTo(0,-22);ctx.lineTo(-24,8);ctx.lineTo(-21,8);ctx.lineTo(0,-19);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(0,-22);ctx.lineTo(24,8);ctx.lineTo(21,8);ctx.lineTo(0,-19);ctx.closePath();ctx.fill();
  // Central spine nacelle
  ctx.fillStyle=blendHull('#ee1133',col);
  ctx.beginPath();ctx.moveTo(-3,-22);ctx.lineTo(3,-22);ctx.lineTo(2.5,8);ctx.lineTo(-2.5,8);ctx.closePath();ctx.fill();
  // Cockpit
  ctx.fillStyle='rgba(255,60,80,0.88)';ctx.shadowColor='#ff2244';ctx.shadowBlur=5;
  ctx.beginPath();ctx.ellipse(0,-14,2.5,4.5,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  // Dual engine pods with glow
  [-7,7].forEach(ex=>{
    ctx.fillStyle='#443';ctx.beginPath();ctx.ellipse(ex,12,3.5,2.2,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,60,90,0.9)';ctx.beginPath();ctx.ellipse(ex,12,2.1,1.3,0,0,Math.PI*2);ctx.fill();
  });
}

function _drawFalcon(col){
  // 4 swept wings — X-wing interceptor layout
  // Forward wings
  ctx.fillStyle=blendHull('#cc1144',col);
  ctx.beginPath();ctx.moveTo(-3,-12);ctx.lineTo(-21,-2);ctx.lineTo(-19,4);ctx.lineTo(-3,-4);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(3,-12);ctx.lineTo(21,-2);ctx.lineTo(19,4);ctx.lineTo(3,-4);ctx.closePath();ctx.fill();
  // Rear wings
  ctx.fillStyle=blendHull('#aa0033',col);
  ctx.beginPath();ctx.moveTo(-3,6);ctx.lineTo(-21,14);ctx.lineTo(-19,20);ctx.lineTo(-3,12);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(3,6);ctx.lineTo(21,14);ctx.lineTo(19,20);ctx.lineTo(3,12);ctx.closePath();ctx.fill();
  // Engine pod at each wingtip
  [[-20,1],[20,1],[-20,17],[20,17]].forEach(([wx,wy])=>{
    ctx.fillStyle='#332233';ctx.beginPath();ctx.ellipse(wx,wy,3.2,2,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,80,140,0.9)';ctx.beginPath();ctx.ellipse(wx,wy,1.8,1.1,0,0,Math.PI*2);ctx.fill();
  });
  // Bezier-tapered fuselage
  ctx.fillStyle=blendHull('#dd2255',col);
  ctx.beginPath();
  ctx.moveTo(0,-22);ctx.bezierCurveTo(-4.5,-16,-5,0,-4,14);
  ctx.lineTo(-3.5,20);ctx.lineTo(3.5,20);ctx.bezierCurveTo(5,0,4.5,-16,0,-22);
  ctx.closePath();ctx.fill();
  // Spine line
  ctx.strokeStyle='rgba(0,0,0,0.2)';ctx.lineWidth=0.8;ctx.beginPath();ctx.moveTo(0,-22);ctx.lineTo(0,20);ctx.stroke();
  // Cockpit
  ctx.fillStyle='rgba(255,80,140,0.82)';ctx.shadowColor='#ff2255';ctx.shadowBlur=5;
  ctx.beginPath();ctx.ellipse(0,-12,2.8,4.5,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  // Main engine
  ctx.fillStyle='#443';ctx.beginPath();ctx.ellipse(0,20,4,2.5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,80,140,0.9)';ctx.beginPath();ctx.ellipse(0,20,2.4,1.4,0,0,Math.PI*2);ctx.fill();
}

function _drawAsp(col){
  // 4 diagonal wing panels (forward + rear sweep)
  ctx.fillStyle=blendHull('#33aacc',col);
  ctx.beginPath();ctx.moveTo(-6,-8);ctx.lineTo(-22,-18);ctx.lineTo(-20,-10);ctx.lineTo(-6,-2);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(6,-8);ctx.lineTo(22,-18);ctx.lineTo(20,-10);ctx.lineTo(6,-2);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(-6,6);ctx.lineTo(-22,16);ctx.lineTo(-20,22);ctx.lineTo(-6,12);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(6,6);ctx.lineTo(22,16);ctx.lineTo(20,22);ctx.lineTo(6,12);ctx.closePath();ctx.fill();
  // Rear engine pods on wingtips
  [-21,21].forEach(wx=>{
    ctx.fillStyle='#334';ctx.beginPath();ctx.ellipse(wx,19,2.8,1.8,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(60,200,255,0.9)';ctx.beginPath();ctx.ellipse(wx,19,1.6,1,0,0,Math.PI*2);ctx.fill();
  });
  // Hexagonal explorer hull
  ctx.fillStyle=blendHull('#44bbdd',col);
  ctx.beginPath();ctx.moveTo(-8,-22);ctx.lineTo(8,-22);ctx.lineTo(10,-6);ctx.lineTo(8,14);ctx.lineTo(-8,14);ctx.lineTo(-10,-6);ctx.closePath();ctx.fill();
  // Panoramic cockpit canopy (ASP signature)
  ctx.fillStyle='rgba(60,200,255,0.88)';ctx.shadowColor='#00aaff';ctx.shadowBlur=7;
  ctx.beginPath();ctx.moveTo(-6,-22);ctx.lineTo(6,-22);ctx.lineTo(7,-11);ctx.lineTo(-7,-11);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
  // Sensor spike at nose
  ctx.fillStyle=blendHull('#55ccee',col);
  ctx.beginPath();ctx.moveTo(-2,-22);ctx.lineTo(2,-22);ctx.lineTo(0,-26);ctx.closePath();ctx.fill();
  // Main engine
  ctx.fillStyle='#334';ctx.beginPath();ctx.ellipse(0,14,5.5,3,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(60,200,255,0.9)';ctx.beginPath();ctx.ellipse(0,14,3.2,1.8,0,0,Math.PI*2);ctx.fill();
}

function _drawClipper(col){
  // Swept Imperial wings
  ctx.fillStyle=blendHull('#1188bb',col);
  ctx.beginPath();ctx.moveTo(-5,-4);ctx.lineTo(-22,0);ctx.lineTo(-22,8);ctx.lineTo(-8,12);ctx.lineTo(-5,12);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(5,-4);ctx.lineTo(22,0);ctx.lineTo(22,8);ctx.lineTo(8,12);ctx.lineTo(5,12);ctx.closePath();ctx.fill();
  // Wingtip lights
  [-22,22].forEach(wx=>{
    ctx.fillStyle='rgba(60,200,255,0.8)';ctx.shadowColor='#00aaff';ctx.shadowBlur=4;
    ctx.beginPath();ctx.arc(wx,4,2.2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  });
  // Bezier fuselage — sleek Imperial body
  ctx.fillStyle=blendHull('#22aacc',col);
  ctx.beginPath();
  ctx.moveTo(0,-24);ctx.bezierCurveTo(-5.5,-18,-6,-6,-5,10);
  ctx.lineTo(-5,14);ctx.lineTo(5,14);ctx.bezierCurveTo(6,-6,5.5,-18,0,-24);
  ctx.closePath();ctx.fill();
  // Cockpit
  ctx.fillStyle='rgba(60,200,255,0.82)';ctx.shadowColor='#00aaff';ctx.shadowBlur=5;
  ctx.beginPath();ctx.ellipse(0,-16,3,5.5,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  // Dual engines
  [-3.5,3.5].forEach(ex=>{
    ctx.fillStyle='#334';ctx.beginPath();ctx.ellipse(ex,14,2.8,1.8,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(60,200,255,0.9)';ctx.beginPath();ctx.ellipse(ex,14,1.6,1,0,0,Math.PI*2);ctx.fill();
  });
}

function _drawFerDeLance(col){
  ctx.fillStyle=blendHull('#ddaa22',col);
  ctx.beginPath();ctx.moveTo(0,-26);ctx.bezierCurveTo(-9,-16,-11,4,-9,14);ctx.lineTo(9,14);ctx.bezierCurveTo(11,4,9,-16,0,-26);ctx.closePath();ctx.fill();
  ctx.fillStyle=blendHull('#cc9900',col);
  ctx.beginPath();ctx.moveTo(-9,2);ctx.lineTo(-22,10);ctx.lineTo(-18,16);ctx.lineTo(-9,12);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(9,2);ctx.lineTo(22,10);ctx.lineTo(18,16);ctx.lineTo(9,12);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(255,220,100,0.7)';ctx.beginPath();ctx.ellipse(0,-16,3,5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#554';ctx.beginPath();ctx.ellipse(0,14,4.5,2.8,0,0,Math.PI*2);ctx.fill();
}

function _drawType7(col){
  // Side cargo bays with bezier rounding
  ctx.fillStyle=blendHull('#bb7700',col);
  ctx.beginPath();ctx.moveTo(-14,-6);ctx.lineTo(-22,-6);ctx.bezierCurveTo(-25,-4,-25,11,-22,14);ctx.lineTo(-14,14);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(14,-6);ctx.lineTo(22,-6);ctx.bezierCurveTo(25,-4,25,11,22,14);ctx.lineTo(14,14);ctx.closePath();ctx.fill();
  // Side bay engines
  [-21,21].forEach(ex=>{
    ctx.fillStyle='#554';ctx.beginPath();ctx.ellipse(ex,14,3,2,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,170,40,0.85)';ctx.beginPath();ctx.ellipse(ex,14,1.8,1.2,0,0,Math.PI*2);ctx.fill();
  });
  // Main cargo hold (slightly tapered)
  ctx.fillStyle=blendHull('#dd8800',col);
  ctx.beginPath();ctx.moveTo(-14,-16);ctx.lineTo(14,-16);ctx.lineTo(14,16);ctx.lineTo(-14,16);ctx.closePath();ctx.fill();
  // Panel grid detail
  ctx.strokeStyle='rgba(0,0,0,0.22)';ctx.lineWidth=0.9;
  ctx.beginPath();ctx.moveTo(-14,-1);ctx.lineTo(14,-1);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-5,-16);ctx.lineTo(-5,16);ctx.stroke();
  ctx.beginPath();ctx.moveTo(5,-16);ctx.lineTo(5,16);ctx.stroke();
  // Forward command tower
  ctx.fillStyle=blendHull('#ffaa22',col);
  ctx.beginPath();ctx.moveTo(-6,-16);ctx.lineTo(6,-16);ctx.lineTo(5,-25);ctx.lineTo(-5,-25);ctx.closePath();ctx.fill();
  // Bridge windows
  ctx.fillStyle='rgba(255,180,80,0.82)';ctx.shadowColor='#ffaa00';ctx.shadowBlur=5;
  ctx.fillRect(-3.5,-23.5,7,4);ctx.shadowBlur=0;
  // Four rear engines
  ctx.fillStyle='#554';[-9,-3,3,9].forEach(ex=>{
    ctx.beginPath();ctx.ellipse(ex,16,3.2,2,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,170,40,0.85)';ctx.beginPath();ctx.ellipse(ex,16,1.9,1.2,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#554';
  });
}

function _drawImperialCutter(col){
  ctx.fillStyle=blendHull('#ddaa00',col);
  ctx.beginPath();ctx.moveTo(0,-22);ctx.lineTo(-18,0);ctx.lineTo(0,16);ctx.lineTo(18,0);ctx.closePath();ctx.fill();
  ctx.fillStyle='#221a00';
  ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(-15,0);ctx.lineTo(-2,16);ctx.lineTo(0,16);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(15,0);ctx.lineTo(2,16);ctx.lineTo(0,16);ctx.closePath();ctx.fill();
  ctx.fillStyle=blendHull('#cc9900',col);
  ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(-26,-2);ctx.lineTo(-22,8);ctx.lineTo(-13,8);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(26,-2);ctx.lineTo(22,8);ctx.lineTo(13,8);ctx.closePath();ctx.fill();
  [-24,24].forEach(ex=>{ctx.fillStyle='#554';ctx.beginPath();ctx.ellipse(ex,3,2.8,1.8,0,0,Math.PI*2);ctx.fill();});
  ctx.fillStyle='rgba(255,220,80,0.7)';ctx.beginPath();ctx.ellipse(0,-14,3,4,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#554';ctx.beginPath();ctx.ellipse(0,16,4.5,2.8,0,0,Math.PI*2);ctx.fill();
}

function _drawAnaconda(col){
  // Angular cross-wings
  ctx.fillStyle=blendHull('#bb1111',col);
  ctx.beginPath();ctx.moveTo(-7,0);ctx.lineTo(-24,-6);ctx.lineTo(-24,6);ctx.lineTo(-7,8);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(24,-6);ctx.lineTo(24,6);ctx.lineTo(7,8);ctx.closePath();ctx.fill();
  // Wing engine pods
  [-24,24].forEach(wx=>{
    ctx.fillStyle='#443';ctx.beginPath();ctx.ellipse(wx,4,3.2,5.5,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,80,80,0.9)';ctx.beginPath();ctx.ellipse(wx,6,1.8,2.8,0,0,Math.PI*2);ctx.fill();
  });
  // Bezier spine (serpentine fuselage)
  ctx.fillStyle=blendHull('#dd2222',col);
  ctx.beginPath();
  ctx.moveTo(-7,-24);ctx.lineTo(7,-24);
  ctx.bezierCurveTo(9,-14,9,4,8,22);
  ctx.lineTo(-8,22);ctx.bezierCurveTo(-9,4,-9,-14,-7,-24);
  ctx.closePath();ctx.fill();
  // Command module cap
  ctx.fillStyle=blendHull('#ee3333',col);
  ctx.beginPath();ctx.moveTo(-5,-24);ctx.lineTo(5,-24);ctx.lineTo(4,-26);ctx.lineTo(-4,-26);ctx.closePath();ctx.fill();
  // Cockpit window
  ctx.fillStyle='rgba(255,80,80,0.88)';ctx.shadowColor='#ff2222';ctx.shadowBlur=6;
  ctx.beginPath();ctx.ellipse(0,-22,3.5,3.5,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  // Spine ridge
  ctx.strokeStyle='rgba(255,120,120,0.22)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-24);ctx.lineTo(0,22);ctx.stroke();
  // Engine cluster (4 bells)
  ctx.fillStyle='#443';[-6,-2,2,6].forEach(ex=>{
    ctx.beginPath();ctx.ellipse(ex,22,3,2,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,80,80,0.9)';ctx.beginPath();ctx.ellipse(ex,22,1.8,1.2,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#443';
  });
}

function _drawType9(col){
  // Hexagonal main body
  ctx.fillStyle=blendHull('#7788aa',col);
  ctx.beginPath();
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2-Math.PI/6;ctx.lineTo(Math.cos(a)*22,Math.sin(a)*22-2);}
  ctx.closePath();ctx.fill();
  // Bezier-curved command spine
  ctx.fillStyle=blendHull('#5566aa',col);
  ctx.beginPath();
  ctx.moveTo(-4.5,-20);ctx.lineTo(4.5,-20);
  ctx.bezierCurveTo(5.5,-12,5.5,10,4.5,20);
  ctx.lineTo(-4.5,20);ctx.bezierCurveTo(-5.5,10,-5.5,-12,-4.5,-20);
  ctx.closePath();ctx.fill();
  // Cockpit dome
  ctx.fillStyle='rgba(120,140,220,0.85)';ctx.shadowColor='#8899ff';ctx.shadowBlur=5;
  ctx.beginPath();ctx.ellipse(0,-18,4.5,5,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  // 6 engine bells with glow
  for(let i=0;i<6;i++){
    const a=i/6*Math.PI*2+Math.PI/2;const ex=Math.cos(a)*18,ey=Math.sin(a)*18-2;
    ctx.fillStyle='#334';ctx.beginPath();ctx.ellipse(ex,ey,3.5,2.5,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(120,140,220,0.85)';ctx.beginPath();ctx.ellipse(ex,ey,2,1.5,0,0,Math.PI*2);ctx.fill();
  }
}

function _drawCarrier(col){
  // Engine nacelle pods (sides, bezier-rounded)
  ctx.fillStyle=blendHull('#6677cc',col);
  ctx.beginPath();ctx.moveTo(-16,-14);ctx.lineTo(-23,-10);ctx.bezierCurveTo(-25,-6,-25,14,-23,18);ctx.lineTo(-16,18);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(16,-14);ctx.lineTo(23,-10);ctx.bezierCurveTo(25,-6,25,14,23,18);ctx.lineTo(16,18);ctx.closePath();ctx.fill();
  // Nacelle engine glows
  [-23,23].forEach(ex=>{
    ctx.fillStyle='#334';ctx.beginPath();ctx.ellipse(ex,18,3.5,2.5,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(140,180,255,0.9)';ctx.beginPath();ctx.ellipse(ex,18,2,1.5,0,0,Math.PI*2);ctx.fill();
  });
  // Main hull (slightly tapered)
  ctx.fillStyle=blendHull('#8899ee',col);
  ctx.beginPath();ctx.moveTo(-16,-20);ctx.lineTo(16,-20);ctx.lineTo(16,20);ctx.lineTo(-16,20);ctx.closePath();ctx.fill();
  // Bow stripe
  ctx.fillStyle=blendHull('#aabbff',col);ctx.fillRect(-16,-20,32,5);
  // Armor panel lines
  ctx.strokeStyle='rgba(0,0,0,0.28)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(-16,-8);ctx.lineTo(16,-8);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-16,7);ctx.lineTo(16,7);ctx.stroke();
  // Flight deck hangar bays
  ctx.fillStyle='rgba(0,0,40,0.88)';[-11,-4,3].forEach(bx=>{ctx.fillRect(bx,-19,6,11);});
  // Command tower / island (starboard)
  ctx.fillStyle=blendHull('#99aaff',col);ctx.beginPath();ctx.rect(8,-20,7,13);ctx.fill();
  // Bridge windows
  ctx.fillStyle='rgba(180,220,255,0.82)';ctx.shadowColor='#aaccff';ctx.shadowBlur=4;
  ctx.fillRect(9,-18,5,4);ctx.shadowBlur=0;
  // Navigation lights
  ctx.fillStyle='#ff2020';ctx.shadowColor='#ff4040';ctx.shadowBlur=4;
  ctx.beginPath();ctx.arc(-16,-20,1.8,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#00cc44';ctx.shadowColor='#00ff66';
  ctx.beginPath();ctx.arc(16,-20,1.8,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
}

// Dispatcher
const SHIP_RENDERERS={
  sidewinder:_drawSidewinder,hauler:_drawHauler,scout:_drawScout,cobra:_drawCobra,
  eagle:_drawEagle,diamondback:_drawDiamondback,vulture:_drawVulture,krait:_drawKrait,
  python:_drawPython,mamba:_drawMamba,falcon:_drawFalcon,asp:_drawAsp,
  clipper:_drawClipper,fer_de_lance:_drawFerDeLance,type7:_drawType7,
  imperial_cutter:_drawImperialCutter,anaconda:_drawAnaconda,type9:_drawType9,carrier:_drawCarrier
};

function drawGameShuttle(hullColor,shipId){
  const col=hullColor||'#aaccff';
  const fn=shipId&&SHIP_RENDERERS[shipId];
  if(fn){fn(col);return;}
  // Default: Viper (space shuttle design)
  const bh=30,bw=6.5;
  const bTop=-bh*.5; // -15

  // Delta křídla
  ctx.fillStyle=blendHull('#ccd4e6',col);
  ctx.beginPath();
  ctx.moveTo(-bw*.5,1);ctx.lineTo(-21,11);ctx.lineTo(-bw*.5,13);ctx.closePath();ctx.fill();
  ctx.beginPath();
  ctx.moveTo(bw*.5,1);ctx.lineTo(21,11);ctx.lineTo(bw*.5,13);ctx.closePath();ctx.fill();

  // Tepelné dlaždice — přední hrana křídla
  ctx.fillStyle='#181818';
  ctx.beginPath();
  ctx.moveTo(-bw*.5,1);ctx.lineTo(-21,11);ctx.lineTo(-19,11);ctx.lineTo(-bw*.5+2,2);ctx.closePath();ctx.fill();
  ctx.beginPath();
  ctx.moveTo(bw*.5,1);ctx.lineTo(21,11);ctx.lineTo(19,11);ctx.lineTo(bw*.5-2,2);ctx.closePath();ctx.fill();

  // Trup (fuselage)
  ctx.fillStyle=blendHull('#d4dcea',col);
  ctx.beginPath();
  if(ctx.roundRect)ctx.roundRect(-bw*.5,bTop,bw,bh,1.8);
  else ctx.rect(-bw*.5,bTop,bw,bh);
  ctx.fill();

  // Břicho — černé dlaždice
  ctx.fillStyle='#1c1c1c';
  ctx.fillRect(-bw*.5,10,bw,5);

  // Nos — aerodynamický kužel
  ctx.beginPath();
  ctx.moveTo(-bw*.5,bTop);
  ctx.quadraticCurveTo(-bw*.4,bTop-3.5,0,bTop-11);
  ctx.quadraticCurveTo(bw*.4,bTop-3.5,bw*.5,bTop);
  ctx.closePath();ctx.fillStyle=blendHull('#c8d0e4',col);ctx.fill();

  // Nos — černá špička
  ctx.beginPath();
  ctx.moveTo(-bw*.3,bTop-.5);
  ctx.quadraticCurveTo(0,bTop-11,bw*.3,bTop-.5);
  ctx.closePath();ctx.fillStyle='#111';ctx.fill();

  // Kokpit — okno
  ctx.fillStyle='rgba(100,190,255,0.55)';ctx.shadowColor='#88ccff';ctx.shadowBlur=5;
  ctx.beginPath();ctx.ellipse(0,bTop+4.5,1.9,2.8,0,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;

  // Svislá ocasní plocha
  ctx.fillStyle=blendHull('#bcc8dc',col);
  ctx.beginPath();
  ctx.moveTo(-1,bTop+3);ctx.lineTo(3.5,11);ctx.lineTo(3.5,14);ctx.lineTo(-1,13.5);ctx.closePath();ctx.fill();

  // OMS pody
  ctx.fillStyle=blendHull('#a8b8cc',col);
  ctx.beginPath();ctx.ellipse(-bw*.65,8,4.5,7,-.15,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(bw*.65,8,4.5,7,.15,0,Math.PI*2);ctx.fill();

  // Motorová sekce
  ctx.fillStyle='#5a6878';
  ctx.fillRect(-7,11.5,14,4.5);

  // 3 SSME zvony
  [-4,0,4].forEach(ex=>{
    ctx.fillStyle='#445566';
    ctx.beginPath();ctx.ellipse(ex,16,2.2,1.3,0,0,Math.PI*2);ctx.fill();
  });

  // Wingtip navigační světla
  ctx.fillStyle='#ff2020';ctx.shadowColor='#ff4040';ctx.shadowBlur=4;
  ctx.beginPath();ctx.arc(-21,11,1.4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#00cc44';ctx.shadowColor='#00ff66';
  ctx.beginPath();ctx.arc(21,11,1.4,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
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
  ctx.fillText('100 000 000 km/s',cx,cy-62);

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
  const txt=dockable?'[ ZAROVNÁNO — PŘISTÁT: F ]':`KORIDOR: ${Math.round(align)}°  SPD: ${Math.round(speed)}`;
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
