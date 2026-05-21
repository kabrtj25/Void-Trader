// ===== VOID TRADER — Zvukový engine (Web Audio API) =====
// Všechny zvuky jsou syntetizované — žádné externí soubory

const SFX = (function(){
  let ac = null;  // AudioContext — lazy init po první interakci

  // Nastavení hlasitosti
  let masterVol  = 1.0;
  let sfxVol     = 0.85;
  let engineVol  = 0.55;
  let uiVol      = 0.7;

  // Uzly pro kontinuální engine sound
  let _engineNode = null;
  let _engineGain = null;
  let _engineActive = false;
  let _engineBoost = false;
  let _engineFilterNode = null;

  function _ac(){
    if(!ac){
      try{ ac = new(window.AudioContext||window.webkitAudioContext)(); }
      catch(e){ return null; }
    }
    if(ac.state==='suspended') ac.resume();
    return ac;
  }

  // ---- Utility ----
  function _master(){
    const a = _ac(); if(!a) return null;
    const g = a.createGain();
    g.gain.value = masterVol;
    g.connect(a.destination);
    return { ac:a, out:g };
  }

  function _env(gainNode, a, d, s, r, peak=1){
    const t = gainNode.context.currentTime;
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(peak, t+a);
    gainNode.gain.linearRampToValueAtTime(peak*s, t+a+d);
    gainNode.gain.setTargetAtTime(0, t+a+d, r*0.5);
  }

  // ---- SFX ----

  function playShoot(){
    const m = _master(); if(!m) return;
    const vol = sfxVol * 0.55;

    // Záblesk — krátký přesweep oscilátoru
    const osc = m.ac.createOscillator();
    const g   = m.ac.createGain();
    const filt= m.ac.createBiquadFilter();
    filt.type = 'bandpass'; filt.frequency.value = 2400; filt.Q.value = 2.5;
    osc.connect(filt); filt.connect(g); g.connect(m.out);
    osc.type = 'sawtooth';
    const t = m.ac.currentTime;
    osc.frequency.setValueAtTime(1800, t);
    osc.frequency.exponentialRampToValueAtTime(220, t+0.09);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t+0.09);
    osc.start(t); osc.stop(t+0.1);

    // Druhý tón — energetický ping
    const osc2 = m.ac.createOscillator();
    const g2   = m.ac.createGain();
    osc2.type = 'square'; osc2.frequency.setValueAtTime(3200, t);
    osc2.frequency.exponentialRampToValueAtTime(800, t+0.06);
    g2.gain.setValueAtTime(vol*0.3, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t+0.06);
    osc2.connect(g2); g2.connect(m.out);
    osc2.start(t); osc2.stop(t+0.07);
  }

  function playEnemyShoot(){
    const m = _master(); if(!m) return;
    const osc = m.ac.createOscillator();
    const g   = m.ac.createGain();
    osc.connect(g); g.connect(m.out);
    osc.type = 'sawtooth';
    const t = m.ac.currentTime;
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(180, t+0.12);
    g.gain.setValueAtTime(sfxVol*0.28, t);
    g.gain.exponentialRampToValueAtTime(0.001, t+0.12);
    osc.start(t); osc.stop(t+0.13);
  }

  function playShieldHit(){
    const m = _master(); if(!m) return;
    const t = m.ac.currentTime;
    // Vysokofrekvenční metalický ping
    [2200, 3100, 4400].forEach((f,i)=>{
      const osc = m.ac.createOscillator();
      const g   = m.ac.createGain();
      osc.type = 'sine'; osc.frequency.value = f;
      g.gain.setValueAtTime(sfxVol*0.25*(1-i*0.08), t+i*0.005);
      g.gain.exponentialRampToValueAtTime(0.001, t+0.28+i*0.05);
      osc.connect(g); g.connect(m.out);
      osc.start(t+i*0.005); osc.stop(t+0.32);
    });
    // Přepěťový šum
    const buf = _noise(m.ac, 0.06, 'highpass', 3000);
    const gn  = m.ac.createGain();
    gn.gain.setValueAtTime(sfxVol*0.15, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t+0.06);
    buf.connect(gn); gn.connect(m.out); buf.start(t); buf.stop(t+0.07);
  }

  function playHullHit(){
    const m = _master(); if(!m) return;
    const t = m.ac.currentTime;
    // Tvrdý kovový úder
    const osc = m.ac.createOscillator();
    const g   = m.ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(40, t+0.18);
    g.gain.setValueAtTime(sfxVol*0.7, t);
    g.gain.exponentialRampToValueAtTime(0.001, t+0.22);
    osc.connect(g); g.connect(m.out);
    osc.start(t); osc.stop(t+0.23);
    // Šumivý kovový praskot
    const noise = _noise(m.ac, 0.15, 'lowpass', 800);
    const gn = m.ac.createGain();
    gn.gain.setValueAtTime(sfxVol*0.5, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t+0.15);
    noise.connect(gn); gn.connect(m.out); noise.start(t); noise.stop(t+0.16);
  }

  function playExplosion(big=false){
    const m = _master(); if(!m) return;
    const t = m.ac.currentTime;
    const scale = big ? 1.0 : 0.65;

    // Basový úder — nízká frekvence
    const osc = m.ac.createOscillator();
    const g   = m.ac.createGain();
    const filt= m.ac.createBiquadFilter();
    filt.type='lowpass'; filt.frequency.value=220;
    osc.type='sawtooth';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(18, t+0.6*scale+0.4);
    g.gain.setValueAtTime(sfxVol*0.9*scale, t);
    g.gain.exponentialRampToValueAtTime(0.001, t+0.7*scale+0.4);
    osc.connect(filt); filt.connect(g); g.connect(m.out);
    osc.start(t); osc.stop(t+0.8*scale+0.4);

    // Šumivá exploze
    const dur = big ? 1.4 : 0.8;
    const noise = _noise(m.ac, dur, 'lowpass', big?1200:600);
    const gn = m.ac.createGain();
    gn.gain.setValueAtTime(sfxVol*0.8*scale, t);
    gn.gain.exponentialRampToValueAtTime(sfxVol*0.2*scale, t+0.15);
    gn.gain.exponentialRampToValueAtTime(0.001, t+dur);
    noise.connect(gn); gn.connect(m.out); noise.start(t); noise.stop(t+dur+0.05);

    // Ostrý praskot na začátku
    const crack = _noise(m.ac, 0.04, 'highpass', 3000);
    const gc = m.ac.createGain();
    gc.gain.setValueAtTime(sfxVol*0.6*scale, t);
    gc.gain.exponentialRampToValueAtTime(0.001, t+0.04);
    crack.connect(gc); gc.connect(m.out); crack.start(t); crack.stop(t+0.05);
  }

  function playDock(){
    const m = _master(); if(!m) return;
    const t = m.ac.currentTime;
    // Přistávací mechanický zvuk — série kliknutí + tón
    [0, 0.08, 0.18].forEach((delay,i)=>{
      const n = _noise(m.ac, 0.04, 'bandpass', 800+i*400);
      const gn = m.ac.createGain();
      gn.gain.setValueAtTime(sfxVol*0.4, t+delay);
      gn.gain.exponentialRampToValueAtTime(0.001, t+delay+0.04);
      n.connect(gn); gn.connect(m.out); n.start(t+delay); n.stop(t+delay+0.05);
    });
    // Závěrečný potvrzující tón
    const osc = m.ac.createOscillator();
    const g   = m.ac.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(520, t+0.2);
    osc.frequency.setValueAtTime(780, t+0.32);
    g.gain.setValueAtTime(0, t+0.2);
    g.gain.linearRampToValueAtTime(sfxVol*0.35, t+0.25);
    g.gain.exponentialRampToValueAtTime(0.001, t+0.55);
    osc.connect(g); g.connect(m.out); osc.start(t+0.2); osc.stop(t+0.6);
  }

  function playUndock(){
    const m = _master(); if(!m) return;
    const t = m.ac.currentTime;
    // Odemknutí + whoosh
    const osc = m.ac.createOscillator();
    const g   = m.ac.createGain();
    osc.type = 'square'; osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(80, t+0.25);
    g.gain.setValueAtTime(sfxVol*0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t+0.28);
    osc.connect(g); g.connect(m.out); osc.start(t); osc.stop(t+0.3);

    const noise = _noise(m.ac, 0.3, 'highpass', 400);
    const gn = m.ac.createGain();
    gn.gain.setValueAtTime(0, t);
    gn.gain.linearRampToValueAtTime(sfxVol*0.25, t+0.06);
    gn.gain.exponentialRampToValueAtTime(0.001, t+0.3);
    noise.connect(gn); gn.connect(m.out); noise.start(t); noise.stop(t+0.32);
  }

  function playWarpStart(){
    const m = _master(); if(!m) return;
    const t = m.ac.currentTime;
    // Stoupající energie
    const osc = m.ac.createOscillator();
    const g   = m.ac.createGain();
    const filt= m.ac.createBiquadFilter();
    filt.type='bandpass'; filt.Q.value=3;
    filt.frequency.setValueAtTime(200, t);
    filt.frequency.exponentialRampToValueAtTime(3000, t+2.5);
    osc.type='sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t+2.5);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(sfxVol*0.45, t+0.4);
    g.gain.linearRampToValueAtTime(sfxVol*0.6, t+2.2);
    g.gain.exponentialRampToValueAtTime(0.001, t+2.8);
    osc.connect(filt); filt.connect(g); g.connect(m.out);
    osc.start(t); osc.stop(t+2.9);

    // Šum budování energie
    const noise = _noise(m.ac, 2.5, 'bandpass', 800);
    const gn = m.ac.createGain();
    gn.gain.setValueAtTime(0, t);
    gn.gain.linearRampToValueAtTime(sfxVol*0.2, t+1.0);
    gn.gain.exponentialRampToValueAtTime(0.001, t+2.6);
    noise.connect(gn); gn.connect(m.out); noise.start(t); noise.stop(t+2.7);
  }

  function playWarpJump(){
    const m = _master(); if(!m) return;
    const t = m.ac.currentTime;
    // BOOM + hluboký rezonující praskot
    const osc = m.ac.createOscillator();
    const g   = m.ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2200, t);
    osc.frequency.exponentialRampToValueAtTime(30, t+1.2);
    g.gain.setValueAtTime(sfxVol*0.8, t);
    g.gain.exponentialRampToValueAtTime(0.001, t+1.3);
    osc.connect(g); g.connect(m.out); osc.start(t); osc.stop(t+1.4);

    const noise = _noise(m.ac, 0.8, 'lowpass', 600);
    const gn = m.ac.createGain();
    gn.gain.setValueAtTime(sfxVol*0.7, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t+0.8);
    noise.connect(gn); gn.connect(m.out); noise.start(t); noise.stop(t+0.85);
  }

  function playLevelUp(){
    const m = _master(); if(!m) return;
    const t = m.ac.currentTime;
    // Stoupající hudební fanfára
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq,i)=>{
      const osc = m.ac.createOscillator();
      const g   = m.ac.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      g.gain.setValueAtTime(0, t+i*0.12);
      g.gain.linearRampToValueAtTime(sfxVol*0.4, t+i*0.12+0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t+i*0.12+0.35);
      osc.connect(g); g.connect(m.out); osc.start(t+i*0.12); osc.stop(t+i*0.12+0.4);
    });
  }

  function playUIClick(){
    const m = _master(); if(!m) return;
    const t = m.ac.currentTime;
    const osc = m.ac.createOscillator();
    const g   = m.ac.createGain();
    osc.type = 'square'; osc.frequency.value = 1200;
    g.gain.setValueAtTime(uiVol*sfxVol*0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t+0.05);
    osc.connect(g); g.connect(m.out); osc.start(t); osc.stop(t+0.06);
  }

  function playUIConfirm(){
    const m = _master(); if(!m) return;
    const t = m.ac.currentTime;
    [880, 1320].forEach((f,i)=>{
      const osc = m.ac.createOscillator();
      const g   = m.ac.createGain();
      osc.type='sine'; osc.frequency.value=f;
      g.gain.setValueAtTime(uiVol*sfxVol*0.22, t+i*0.08);
      g.gain.exponentialRampToValueAtTime(0.001, t+i*0.08+0.12);
      osc.connect(g); g.connect(m.out); osc.start(t+i*0.08); osc.stop(t+i*0.08+0.14);
    });
  }

  function playWarpLoop(){
    const m = _master(); if(!m) return;
    const t = m.ac.currentTime;
    // Krátký kontinuální hum — volat periodicky
    const osc = m.ac.createOscillator();
    const g   = m.ac.createGain();
    const filt= m.ac.createBiquadFilter();
    filt.type='bandpass'; filt.frequency.value=1800; filt.Q.value=4;
    osc.type='sawtooth'; osc.frequency.value=220+Math.random()*40;
    g.gain.setValueAtTime(sfxVol*0.12, t);
    g.gain.setValueAtTime(sfxVol*0.12, t+0.3);
    g.gain.exponentialRampToValueAtTime(0.001, t+0.5);
    osc.connect(filt); filt.connect(g); g.connect(m.out); osc.start(t); osc.stop(t+0.5);
  }

  // ---- Engine — kontinuální zvuk ----
  function startEngine(boost=false){
    const a = _ac(); if(!a) return;
    if(_engineActive && _engineBoost===boost) return;
    stopEngine(true);
    _engineBoost = boost;
    _engineActive = true;

    const gain = a.createGain();
    const filt = a.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = boost ? 1800 : 900;
    filt.Q.value = 0.8;

    // Šumivá základna
    const bufSize = a.sampleRate * 2;
    const buf = a.createBuffer(1, bufSize, a.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<bufSize;i++) d[i]=(Math.random()*2-1);
    const src = a.createBufferSource();
    src.buffer = buf; src.loop = true;
    src.connect(filt); filt.connect(gain); gain.connect(a.destination);

    const vol = engineVol * masterVol * (boost ? 0.55 : 0.35);
    gain.gain.setValueAtTime(0, a.currentTime);
    gain.gain.linearRampToValueAtTime(vol, a.currentTime+0.12);
    src.start();

    // Basový oscilátorový tón přidaný k šumu
    const osc = a.createOscillator();
    const og  = a.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = boost ? 95 : 60;
    og.gain.setValueAtTime(0, a.currentTime);
    og.gain.linearRampToValueAtTime(engineVol*masterVol*(boost?0.28:0.18), a.currentTime+0.15);
    osc.connect(og); og.connect(a.destination); osc.start();

    _engineNode  = { src, osc, stop: ()=>{ try{src.stop();osc.stop();}catch(e){} } };
    _engineGain  = gain;
    _engineFilterNode = og;
  }

  function stopEngine(immediate=false){
    if(!_engineNode) return;
    const a = _ac(); if(!a){ _engineNode=null;return; }
    const g = _engineGain;
    const og = _engineFilterNode;
    const node = _engineNode;
    _engineNode=null; _engineGain=null; _engineFilterNode=null; _engineActive=false;
    const t = a.currentTime;
    if(immediate){
      try{ node.stop(); } catch(e){}
    } else {
      if(g)  g.gain.setTargetAtTime(0, t, 0.06);
      if(og) og.gain.setTargetAtTime(0, t, 0.06);
      setTimeout(()=>{ try{ node.stop(); }catch(e){} }, 300);
    }
  }

  // ---- Noise helper ----
  // Vrací wrapper s .connect(), .start(), .stop() — vždy funkční i s filtrem
  function _noise(ac, dur, filterType, filterFreq){
    const bufSize = Math.ceil(ac.sampleRate * (dur+0.05));
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<bufSize;i++) d[i]=(Math.random()*2-1);
    const src = ac.createBufferSource();
    src.buffer = buf;
    let out = src;
    if(filterType){
      const filt = ac.createBiquadFilter();
      filt.type=filterType; filt.frequency.value=filterFreq;
      src.connect(filt);
      out = filt;
    }
    return {
      connect(node){ out.connect(node); return this; },
      start(t){ try{ src.start(t); }catch(e){} return this; },
      stop(t){ try{ src.stop(t); }catch(e){} return this; },
    };
  }

  // ---- Nastavení hlasitosti ----
  function setMasterVol(v){
    masterVol = Math.max(0,Math.min(1,v));
    _saveVolumes();
    if(_engineGain) _engineGain.gain.value = engineVol*masterVol*(_engineBoost?0.55:0.35);
  }
  function setSfxVol(v){   sfxVol    = Math.max(0,Math.min(1,v)); _saveVolumes(); }
  function setEngineVol(v){ engineVol = Math.max(0,Math.min(1,v)); _saveVolumes();
    if(_engineGain) _engineGain.gain.value = engineVol*masterVol*(_engineBoost?0.55:0.35);
  }
  function setUiVol(v){ uiVol = Math.max(0,Math.min(1,v)); _saveVolumes(); }

  function _saveVolumes(){
    try{
      localStorage.setItem('st_snd',JSON.stringify({m:masterVol,s:sfxVol,e:engineVol,u:uiVol}));
    }catch(e){}
  }
  function loadVolumes(){
    try{
      const d=JSON.parse(localStorage.getItem('st_snd')||'{}');
      if(d.m!=null) masterVol=d.m;
      if(d.s!=null) sfxVol=d.s;
      if(d.e!=null) engineVol=d.e;
      if(d.u!=null) uiVol=d.u;
    }catch(e){}
  }

  function getVolumes(){ return {master:masterVol,sfx:sfxVol,engine:engineVol,ui:uiVol}; }

  // ---- Inicializace AudioContext po první interakci ----
  function init(){
    loadVolumes();
    const resume = ()=>{ _ac(); document.removeEventListener('keydown',resume); document.removeEventListener('pointerdown',resume); };
    document.addEventListener('keydown',resume,{once:true});
    document.addEventListener('pointerdown',resume,{once:true});
  }

  return {
    init,
    playShoot, playEnemyShoot,
    playShieldHit, playHullHit,
    playExplosion,
    playDock, playUndock,
    playWarpStart, playWarpJump, playWarpLoop,
    playLevelUp,
    playUIClick, playUIConfirm,
    startEngine, stopEngine,
    setMasterVol, setSfxVol, setEngineVol, setUiVol,
    getVolumes,
  };
})();
