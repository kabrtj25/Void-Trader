let sosTimer=0,convoyTimer=0;

function spawnEnemy(type){
  let attempts=0,x,y;
  do{
    const angle=Math.random()*Math.PI*2,d=rnd(800,1200);
    x=player.x+Math.cos(angle)*d;y=player.y+Math.sin(angle)*d;
    attempts++;
  }while(worldDistFromOrigin(x,y)<SPAWN_SAFE_RADIUS&&attempts<8);
  if(worldDistFromOrigin(x,y)<SPAWN_SAFE_RADIUS){
    const angle=Math.random()*Math.PI*2;
    x=SPAWN_SAFE_RADIUS*Math.cos(angle)+player.x;y=SPAWN_SAFE_RADIUS*Math.sin(angle)+player.y;
  }
  enemies.push({x,y,vx:0,vy:0,angle:0,type,
    hp:type==='pirate'?35:14,maxHp:type==='pirate'?35:14,shootCooldown:rnd(1,2.5),
    lootTable:type==='pirate'?['Pirátská data','Černý trh zboží']:['Stará technika','Pirátská data'],
    credits:type==='pirate'?rndInt(25,90):rndInt(8,35),sz:type==='pirate'?12:8,
    wanderAngle:Math.random()*Math.PI*2,wanderTimer:0,
    state:'patrol',stateTimer:0,patrolAngle:Math.random()*Math.PI*2,patrolTimer:rnd(3,8),});
}

function spawnConvoy(){
  const angle=Math.random()*Math.PI*2,d=1200+Math.random()*800;
  convoys.push({x:player.x+Math.cos(angle)*d,y:player.y+Math.sin(angle)*d,
    vx:Math.cos(angle+Math.PI)*0.5,vy:Math.sin(angle+Math.PI)*0.5,
    hp:60,maxHp:60,sz:16,cargo:rndItem(TRADE_GOODS).name,credits:rndInt(80,200),
    life:60,angle:angle+Math.PI,shootCooldown:3});
}

function updateEnemyAI(e,dt){
  const d=dist2(player,e);
  const chaseRange=e.type==='pirate'?600:500;
  const attackRange=e.type==='pirate'?280:220;
  e.stateTimer+=dt;
  if(e.state==='patrol'){if(d<chaseRange){e.state='chase';e.stateTimer=0;}}
  else if(e.state==='chase'){
    if(d<attackRange){e.state='attack';e.stateTimer=0;}
    else if(d>chaseRange*1.4&&e.stateTimer>3){e.state='patrol';e.stateTimer=0;e.patrolTimer=rnd(3,6);}
  }
  else if(e.state==='attack'){if(d>attackRange*1.5){e.state='chase';e.stateTimer=0;}}

  if(e.state==='patrol'){
    e.patrolTimer-=dt;if(e.patrolTimer<=0){e.patrolAngle+=rnd(-1.2,1.2);e.patrolTimer=rnd(2,5);}
    let da=e.patrolAngle-e.angle;while(da>Math.PI)da-=Math.PI*2;while(da<-Math.PI)da+=Math.PI*2;
    e.angle+=clamp(da,-1.2*dt,1.2*dt);e.vx+=Math.cos(e.angle)*0.03;e.vy+=Math.sin(e.angle)*0.03;
    const ws=Math.hypot(e.vx,e.vy);if(ws>0.6){e.vx*=0.6/ws;e.vy*=0.6/ws;}
  } else if(e.state==='chase'){
    const targetAngle=Math.atan2(player.y-e.y,player.x-e.x);
    let da=targetAngle-e.angle;while(da>Math.PI)da-=Math.PI*2;while(da<-Math.PI)da+=Math.PI*2;
    const turnRate=e.type==='pirate'?2.5:2.0;e.angle+=clamp(da,-turnRate*dt,turnRate*dt);
    if(d>120){
      const topSpd=e.type==='pirate'?2.2:2.6;
      e.vx+=Math.cos(e.angle)*0.12;e.vy+=Math.sin(e.angle)*0.12;
      const s2=Math.hypot(e.vx,e.vy);if(s2>topSpd){e.vx*=topSpd/s2;e.vy*=topSpd/s2;}
    } else {e.vx*=.88;e.vy*=.88;}
  } else if(e.state==='attack'){
    const circleAngle=Math.atan2(player.y-e.y,player.x-e.x)+Math.sin(e.stateTimer*0.8)*0.5;
    let da=circleAngle-e.angle;while(da>Math.PI)da-=Math.PI*2;while(da<-Math.PI)da+=Math.PI*2;
    e.angle+=clamp(da,-2.8*dt,2.8*dt);
    if(d>110){e.vx+=Math.cos(e.angle)*0.08;e.vy+=Math.sin(e.angle)*0.08;}
    else{e.vx-=Math.cos(e.angle)*0.04;e.vy-=Math.sin(e.angle)*0.04;}
    const topSpd=e.type==='pirate'?1.8:1.4,s2=Math.hypot(e.vx,e.vy);if(s2>topSpd){e.vx*=topSpd/s2;e.vy*=topSpd/s2;}
  }

  e.vx*=.97;e.vy*=.97;e.x+=e.vx;e.y+=e.vy;
  if(e.state!=='patrol'){
    e.shootCooldown-=dt;
    if(d<500&&e.shootCooldown<=0){
      e.shootCooldown=e.type==='pirate'?1.8:2.5;
      const spread=(Math.random()-.5)*.12;
      const aimAngle=Math.atan2(player.y-e.y,player.x-e.x)+spread;
      bullets.push({x:e.x+Math.cos(e.angle)*16,y:e.y+Math.sin(e.angle)*16,
        vx:Math.cos(aimAngle)*(e.type==='pirate'?5.8:5.0),vy:Math.sin(aimAngle)*(e.type==='pirate'?5.8:5.0),
        life:1.5,owner:'enemy',dmg:e.type==='pirate'?12:8});
    }
  }
}

function maybeSOS(dt){
  sosTimer+=dt;
  if(sosTimer>45+Math.random()*60){
    sosTimer=0;
    const angle=Math.random()*Math.PI*2,d=600+Math.random()*500;
    sosEvents.push({x:player.x+Math.cos(angle)*d,y:player.y+Math.sin(angle)*d,blink:0,life:30,reward:rndInt(150,500),handled:false});
    showEventNotif('📡 SOS SIGNÁL DETEKOVÁN');
    const bar=document.getElementById('anomaly-bar');
    bar.textContent='📡 SOS · Přibližte se k signálu';bar.style.opacity='1';bar.style.color='#fa4';
    setTimeout(()=>bar.style.opacity='0',4000);
  }
}
function maybeConvoy(dt){
  convoyTimer+=dt;
  if(convoyTimer>60+Math.random()*90){convoyTimer=0;spawnConvoy();showEventNotif('🚚 OBCHODNÍ KONVOJ DETEKOVÁN NA RADARU');}
}
