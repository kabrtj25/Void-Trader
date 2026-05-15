let audioCtx=null;
function getAudioCtx(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();return audioCtx;}

function playTone(freq,type,vol,dur){
  if(settings.sfxVol===0)return;
  try{
    const ac=getAudioCtx(),o=ac.createOscillator(),g=ac.createGain();
    o.connect(g);g.connect(ac.destination);o.type=type;o.frequency.value=freq;
    const v=vol*settings.sfxVol;
    g.gain.setValueAtTime(v,ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+dur);
    o.start();o.stop(ac.currentTime+dur);
  }catch(e){}
}

function playMenuHover(){playTone(420,'sine',.04,.08);}
function playMenuClick(){playTone(660,'square',.07,.12);}
function playSfxShoot(){if(!settings.shootSound)return;playTone(880,'sawtooth',.03,.06);}
function playSfxHit(){playTone(200,'square',.08,.15);}
function playSfxBuy(){playTone(550,'sine',.06,.18);}

function playSfxLevelUp(){
  try{
    const ac=getAudioCtx();
    [440,550,660,880].forEach((f,i)=>{
      const o=ac.createOscillator(),g=ac.createGain();
      o.connect(g);g.connect(ac.destination);
      o.frequency.value=f;const v=0.07*settings.sfxVol;
      g.gain.setValueAtTime(v,ac.currentTime+i*.08);
      g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+i*.08+.2);
      o.start(ac.currentTime+i*.08);o.stop(ac.currentTime+i*.08+.2);
    });
  }catch(e){}
}

function playSfxExplosion(){
  if(settings.sfxVol===0)return;
  try{
    const ac=getAudioCtx(),buf=ac.createBuffer(1,ac.sampleRate*.2,ac.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);
    const src=ac.createBufferSource(),g=ac.createGain();
    src.buffer=buf;src.connect(g);g.connect(ac.destination);
    g.gain.setValueAtTime(0.15*settings.sfxVol,ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+.2);
    src.start();
  }catch(e){}
}
