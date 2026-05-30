/* ============================================================================
   SINGE RUN — an arcade endless runner set in "When You Call Me, Singe".
   Lou auto-runs the neon rooftops of late-night internet; collect Elias's blue
   hearts, dodge the "you're too much" monkeys + obstacles, keep the connexion
   alive. Three lanes, jump + slide, combos, power-ups, a speed ramp, and a
   warmth mode when the connexion meter fills. Pure canvas, no assets.
   ============================================================================ */
'use strict';

/* ----------------------------------------------------------------- canvas -- */
const cv  = document.getElementById('cv');
const ctx = cv.getContext('2d');
let W = 480, H = 800, DPR = 1;

function resize(){
  const r = cv.getBoundingClientRect();
  W = Math.max(320, Math.round(r.width  || window.innerWidth  || 480));
  H = Math.max(480, Math.round(r.height || window.innerHeight || 800));
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  cv.width  = Math.round(W * DPR);
  cv.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  layout();
}
window.addEventListener('resize', resize);

/* ------------------------------------------------------------ layout/proj -- */
// Pseudo-3D lane projection. Player sits at the near plane (z=0); the world
// rushes toward the camera. persp shrinks with depth so lanes converge.
let HORIZON = 0, GROUND = 0, CX = 0, LANE = 0;
const FOCAL = 26, ZFAR = 130;
function layout(){
  HORIZON = H * 0.30;
  GROUND  = H * 0.90;
  CX      = W * 0.5;
  LANE    = Math.min(W * 0.265, 175);   // near-plane offset between lanes
}
function persp(z){ return FOCAL / (FOCAL + Math.max(0, z)); }
function project(laneX, z, up){            // laneX continuous, up = height units
  const p = persp(z);
  const groundY = HORIZON + (GROUND - HORIZON) * p;
  return { x: CX + laneX * p, y: groundY - (up || 0) * p, p };
}

/* ----------------------------------------------------------------- utils --- */
const rand  = (a,b)=>a+Math.random()*(b-a);
const rint  = (a,b)=>Math.floor(rand(a,b+1));
const clamp = (v,a,b)=>v<a?a:v>b?b:v;
const lerp  = (a,b,t)=>a+(b-a)*t;
const TAU = Math.PI*2;
const pick = arr => arr[(Math.random()*arr.length)|0];

/* ----------------------------------------------------------------- store --- */
const Store = {
  best:  +(localStorage.getItem('singe.best')   || 0),
  total: +(localStorage.getItem('singe.hearts') || 0),
  music: localStorage.getItem('singe.music') === '1',
  saveBest(v){ if(v>this.best){ this.best=v; localStorage.setItem('singe.best',v); return true; } return false; },
  addHearts(n){ this.total+=n; localStorage.setItem('singe.hearts',this.total); },
  setMusic(v){ this.music=v; localStorage.setItem('singe.music', v?'1':'0'); },
};

/* ----------------------------------------------------------------- audio --- */
const Sound = (function(){
  let ac=null, musicTimer=null, step=0;
  const on=()=>!!ac;
  function ensure(){ if(!ac){ try{ ac=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } return ac; }
  function blip(freq,dur,type,gain,slideTo){
    if(!ac) return;
    try{
      const o=ac.createOscillator(), g=ac.createGain();
      o.type=type||'square'; o.frequency.value=freq;
      if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime+dur);
      g.gain.setValueAtTime(0.0001, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(gain||0.05, ac.currentTime+0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime+dur);
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime+dur+0.02);
    }catch(e){}
  }
  const scale=[261.6,293.7,329.6,392.0,440.0,523.3,587.3];
  function startMusic(){
    ensure(); if(!ac||musicTimer) return;
    musicTimer=setInterval(()=>{
      const base=scale[step%scale.length];
      blip(base*(step%8===0?0.5:1), 0.34, 'triangle', 0.05);
      if(step%4===0) blip(base/2, 0.6, 'sine', 0.04);
      step++;
    },300);
  }
  function stopMusic(){ if(musicTimer){ clearInterval(musicTimer); musicTimer=null; } }
  return {
    resume(){ ensure(); if(ac&&ac.state==='suspended') ac.resume(); },
    has:on, startMusic, stopMusic,
    coin(){ blip(880,0.09,'sine',0.05,1320); },
    coinHi(p){ blip(720+p*60,0.08,'square',0.05,1100+p*80); },
    jump(){ blip(440,0.14,'square',0.05,820); },
    slide(){ blip(300,0.16,'sawtooth',0.04,160); },
    lane(){ blip(560,0.05,'square',0.03); },
    power(){ [523,659,880].forEach((f,i)=>setTimeout(()=>blip(f,0.12,'triangle',0.05),i*70)); },
    warmth(){ [440,554,659,880].forEach((f,i)=>setTimeout(()=>blip(f,0.18,'triangle',0.06),i*90)); },
    hurt(){ blip(170,0.3,'sawtooth',0.06,70); },
    dead(){ [400,330,250,170].forEach((f,i)=>setTimeout(()=>blip(f,0.32,'sawtooth',0.06),i*140)); },
  };
})();

/* ---------------------------------------------------------------- effects -- */
const parts=[], floats=[];
function burst(x,y,n,color,opt){
  opt=opt||{};
  for(let i=0;i<n;i++){
    const a=rand(0,TAU), s=rand(1,opt.speed||5);
    parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-(opt.up||0),life:1,
      dec:rand(0.02,0.05),size:rand(2,opt.size||5),color,grav:opt.grav||0});
  }
}
function updateParts(dt){
  for(let i=parts.length-1;i>=0;i--){
    const p=parts[i];
    p.x+=p.vx*dt*60*0.4; p.y+=p.vy*dt*60*0.4; p.vy+=p.grav*dt*60*0.4;
    p.vx*=0.97; p.vy*=0.97; p.life-=p.dec*dt*60;
    if(p.life<=0) parts.splice(i,1);
  }
}
function drawParts(){
  for(const p of parts){
    ctx.save(); ctx.globalAlpha=clamp(p.life,0,1);
    ctx.shadowColor=p.color; ctx.shadowBlur=10; ctx.fillStyle=p.color;
    ctx.beginPath(); ctx.arc(p.x,p.y,Math.max(0.4,p.size*p.life),0,TAU); ctx.fill();
    ctx.restore();
  }
}
function floatText(x,y,txt,color,size){
  floats.push({x,y,txt,color:color||'#f2c14e',size:size||18,life:1});
}
function updateFloats(dt){
  for(let i=floats.length-1;i>=0;i--){ const f=floats[i]; f.y-=dt*46; f.life-=dt*1.1; if(f.life<=0) floats.splice(i,1); }
}
function drawFloats(){
  for(const f of floats){
    ctx.save(); ctx.globalAlpha=clamp(f.life,0,1);
    ctx.font=`700 ${f.size}px "JetBrains Mono",monospace`; ctx.textAlign='center';
    ctx.lineWidth=4; ctx.strokeStyle='rgba(0,0,0,.55)'; ctx.strokeText(f.txt,f.x,f.y);
    ctx.fillStyle=f.color; ctx.fillText(f.txt,f.x,f.y); ctx.restore();
  }
}
let shake=0; const addShake=v=>{ shake=Math.max(shake,v); };

/* ------------------------------------------------------------------ state -- */
const ST = { MENU:'menu', PLAY:'play', PAUSE:'pause', DEAD:'dead' };
let state = ST.MENU;

const G = {
  speed:0, dist:0, score:0, hearts:0, combo:0, bestCombo:0,
  conn:0, warm:0, magnet:0, shield:false, shieldT:0,
  rowTimer:0, time:0, mult:1, hitFlash:0, started:false,
};
const SPEED0=34, SPEEDMAX=96, ACCEL=0.7;
const player = { lane:1, lanePos:1, jumpT:-1, jumpDur:0.72, slideT:0, run:0, lean:0, dead:false };

const ents=[];  // {kind:'heart'|'obst'|'pow', sub, lane, z, taken, passed, ...}

function jumpHeight(){ return H*0.20; }
function isAir(){ return player.jumpT>=0; }
function airUp(){ if(player.jumpT<0) return 0; const p=player.jumpT/player.jumpDur; return jumpHeight()*4*p*(1-p); }
function isSliding(){ return player.slideT>0; }

/* ------------------------------------------------------------------ input -- */
function setLane(d){
  if(state!==ST.PLAY) return;
  const n=clamp(player.lane+d,0,2);
  if(n!==player.lane){ player.lane=n; player.lean=d*0.5; Sound.lane(); }
}
function doJump(){
  if(state!==ST.PLAY) return;
  if(player.jumpT<0 && !isSliding()){ player.jumpT=0; Sound.jump();
    const pj=project((player.lane-1)*LANE,0,0); burst(pj.x,pj.y,8,'#cdb6ff',{speed:3,up:1}); }
}
function doSlide(){
  if(state!==ST.PLAY) return;
  if(player.jumpT>=0){ player.jumpT=Math.max(player.jumpT,player.jumpDur*0.62); } // fast-fall
  if(player.slideT<=0){ player.slideT=0.55; Sound.slide();
    const pj=project((player.lane-1)*LANE,0,0); burst(pj.x,pj.y,8,'#cdd6dd',{speed:3}); }
}
window.addEventListener('keydown',e=>{
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code)) e.preventDefault();
  if(e.repeat) return;
  Sound.resume();
  switch(e.code){
    case 'ArrowLeft': case 'KeyA': setLane(-1); break;
    case 'ArrowRight': case 'KeyD': setLane(1); break;
    case 'ArrowUp': case 'KeyW': case 'Space': doJump(); break;
    case 'ArrowDown': case 'KeyS': doSlide(); break;
    case 'KeyP': case 'Escape': togglePause(); break;
    case 'Enter': if(state===ST.MENU) startGame(); else if(state===ST.DEAD) startGame(); break;
  }
});
// touch: swipe gestures + tap-to-jump
let tsx=0,tsy=0,tst=0;
cv.addEventListener('touchstart',e=>{ const t=e.changedTouches[0]; tsx=t.clientX;tsy=t.clientY;tst=Date.now(); Sound.resume(); },{passive:true});
cv.addEventListener('touchend',e=>{
  const t=e.changedTouches[0], dx=t.clientX-tsx, dy=t.clientY-tsy, adx=Math.abs(dx), ady=Math.abs(dy);
  if(adx<24 && ady<24){ doJump(); return; }          // tap
  if(adx>ady){ setLane(dx>0?1:-1); } else { dy<0?doJump():doSlide(); }
},{passive:true});
cv.addEventListener('mousedown',()=>{ Sound.resume(); if(state===ST.PLAY) doJump(); });

/* ------------------------------------------------------------------ spawn -- */
function spawnRow(){
  // difficulty grows with distance; never block all three lanes.
  const diff = clamp(G.dist/2600, 0, 1);
  const nObst = Math.random() < lerp(0.35,0.92,diff) ? (Math.random()<lerp(0.15,0.6,diff)?2:1) : 0;
  const lanes=[0,1,2];
  // shuffle
  for(let i=lanes.length-1;i>0;i--){ const j=rint(0,i); [lanes[i],lanes[j]]=[lanes[j],lanes[i]]; }
  const obstLanes = lanes.slice(0,nObst);
  const free = [0,1,2].filter(l=>!obstLanes.includes(l));

  for(const l of obstLanes){
    const sub = pick(['low','high','full','low','high']); // full a bit rarer
    ents.push({kind:'obst', sub, lane:l, z:ZFAR, passed:false, t:rand(0,TAU)});
  }
  // heart trail in a free lane
  if(free.length && Math.random()<0.85){
    const l = pick(free);
    const n = rint(3,6);
    const arc = Math.random()<0.4;          // arc => jump to grab
    for(let k=0;k<n;k++){
      ents.push({kind:'heart', lane:l, z:ZFAR + k*5, taken:false,
        up: arc ? jumpHeight()*0.8*Math.sin(Math.PI*(k/(n-1))) : 0, t:rand(0,TAU)});
    }
  }
  // occasional power-up in a free lane
  if(free.length && Math.random()<0.10){
    const l = pick(free);
    ents.push({kind:'pow', sub: pick(['magnet','shield']), lane:l, z:ZFAR+12, taken:false, t:0});
  }
}

/* ----------------------------------------------------------------- update -- */
function update(dt){
  G.time+=dt;
  G.speed = Math.min(SPEEDMAX, SPEED0 + G.time*ACCEL);
  G.dist += G.speed*dt;
  G.score += G.speed*dt*0.18*G.mult;

  // timers
  if(G.warm>0){ G.warm-=dt; if(G.warm<=0){ G.conn=0; hud.connWrap.classList.remove('warm'); } }
  if(G.magnet>0) G.magnet-=dt;
  if(G.shield && G.shieldT>0){ G.shieldT-=dt; }
  if(G.hitFlash>0) G.hitFlash-=dt;

  // multiplier from combo tier + warmth
  const tier = 1 + Math.min(4, Math.floor(G.combo/10));
  G.mult = tier * (G.warm>0?2:1);

  // player anim
  player.lanePos = lerp(player.lanePos, player.lane, clamp(dt*14,0,1));
  player.lean = lerp(player.lean, 0, clamp(dt*8,0,1));
  player.run += G.speed*dt*0.10;
  if(player.jumpT>=0){ player.jumpT+=dt; if(player.jumpT>=player.jumpDur) player.jumpT=-1; }
  if(player.slideT>0) player.slideT-=dt;

  // spawn rows at a consistent world spacing regardless of speed
  G.rowTimer-=dt;
  if(G.rowTimer<=0){ spawnRow(); G.rowTimer = 22 / G.speed; }

  // move + resolve entities
  const pl = Math.round(player.lanePos);
  for(let i=ents.length-1;i>=0;i--){
    const e=ents[i]; e.z-=G.speed*dt; e.t+=dt;
    if(e.z < -8){ ents.splice(i,1); continue; }

    const inWindow = e.z<=5 && e.z>=-5;
    if(e.kind==='heart'){
      const grab = !e.taken && inWindow && (G.magnet>0 || e.lane===pl);
      if(grab){ e.taken=true; collectHeart(e); ents.splice(i,1); }
    } else if(e.kind==='pow'){
      if(!e.taken && inWindow && e.lane===pl){ e.taken=true; collectPower(e); ents.splice(i,1); }
    } else { // obstacle
      if(!e.passed && inWindow && e.lane===pl){
        const cleared = (e.sub==='low'  && isAir()) ||
                        (e.sub==='high' && isSliding());
        if(!cleared){ e.passed=true; hitObstacle(e); }
        else { e.passed=true; nearMiss(e); }
      } else if(!e.passed && e.z<-2){ e.passed=true; if(e.lane!==pl) nearMiss(e,true); }
    }
  }

  updateParts(dt); updateFloats(dt);
  if(shake>0){ shake*=0.86; if(shake<0.4) shake=0; }
}

function collectHeart(e){
  G.hearts++; G.combo++; if(G.combo>G.bestCombo) G.bestCombo=G.combo;
  const tier=1+Math.min(4,Math.floor(G.combo/10));
  const gain = 10 * G.mult;
  G.score += gain;
  if(G.warm<=0){ G.conn=clamp(G.conn+3.2,0,100); if(G.conn>=100) enterWarmth(); }
  const pj=project((e.lane-1)*LANE, Math.max(0,e.z), e.up);
  burst(pj.x,pj.y,8,'#8fb4e6',{speed:3,size:4});
  Sound.coinHi(Math.min(1,G.combo/40));
  if(G.combo>0 && G.combo%10===0){ showCombo(G.combo); }
  hud.bumpMult();
  refreshHud();
}
function collectPower(e){
  Sound.power();
  const pj=project((e.lane-1)*LANE,Math.max(0,e.z),26);
  if(e.sub==='magnet'){ G.magnet=8; floatText(pj.x,pj.y,'MAGNET',' #f2c14e',18); burst(pj.x,pj.y,16,'#f2c14e',{speed:5}); }
  else { G.shield=true; G.shieldT=12; floatText(pj.x,pj.y,'SHIELD','#b8b0cf',18); burst(pj.x,pj.y,16,'#b8b0cf',{speed:5}); }
  refreshHud();
}
function enterWarmth(){
  G.warm=7; Sound.warmth(); hud.connWrap.classList.add('warm');
  const pj=project((player.lane-1)*LANE,0,40);
  burst(pj.x,pj.y,40,'#f2c14e',{speed:7,size:6,up:1});
  floatText(W/2,H*0.4,'WARMTH ×2','#f2c14e',30);
}
function nearMiss(e,sideways){
  if(sideways){ G.score+=6*G.mult; }
}
function hitObstacle(e){
  const pj=project((e.lane-1)*LANE,Math.max(0,e.z),20);
  if(G.warm>0){ // warmth burns through
    burst(pj.x,pj.y,20,'#f2c14e',{speed:6}); Sound.coin(); return;
  }
  if(G.shield){ G.shield=false; G.shieldT=0; addShake(10); G.hitFlash=0.3;
    burst(pj.x,pj.y,24,'#b8b0cf',{speed:6}); Sound.hurt(); floatText(pj.x,pj.y,'shield!','#b8b0cf',18);
    refreshHud(); return; }
  // death
  G.combo=0; addShake(18); G.hitFlash=0.6; Sound.hurt();
  burst(pj.x,pj.y,34,'#e0533a',{speed:7,size:6});
  die();
}

/* ------------------------------------------------------------------ render - */
function blend(){ // 0..1 warm blend follows connexion + warmth
  return clamp(G.warm>0 ? 1 : G.conn/100*0.7, 0, 1);
}
function drawSky(){
  const b=blend();
  const top = mix('#0a0a1e','#241a2e',b);
  const mid = mix('#1b1430','#3a1f2a',b);
  const low = mix('#241a3a','#5a2f33',b);
  const g=ctx.createLinearGradient(0,0,0,HORIZON+40);
  g.addColorStop(0,top); g.addColorStop(0.6,mid); g.addColorStop(1,low);
  ctx.fillStyle=g; ctx.fillRect(0,0,W,HORIZON+60);
  // moon
  const mx=W*0.74, my=HORIZON*0.5;
  const mg=ctx.createRadialGradient(mx,my,4,mx,my,90);
  mg.addColorStop(0,'rgba(255,246,223,.9)'); mg.addColorStop(0.25,'rgba(255,246,223,.8)'); mg.addColorStop(1,'rgba(255,246,223,0)');
  ctx.fillStyle=mg; ctx.beginPath(); ctx.arc(mx,my,90,0,TAU); ctx.fill();
  ctx.fillStyle='#fff6df'; ctx.beginPath(); ctx.arc(mx,my,26,0,TAU); ctx.fill();
  // stars
  ctx.fillStyle='rgba(255,255,255,.7)';
  for(let i=0;i<48;i++){ const sx=((i*167.3)% W), sy=(i*53.7)%HORIZON; const tw=0.4+0.6*Math.sin(G.time*2+i);
    ctx.globalAlpha=0.25+0.5*tw; ctx.fillRect(sx,sy,2,2); }
  ctx.globalAlpha=1;
  // skyline silhouettes (parallax with lane drift)
  const drift = (player.lanePos-1)*18;
  cityBand(HORIZON+10, 0.5, mix('#120e22','#241526',b), 64, drift*0.4);
  cityBand(HORIZON+24, 1.0, mix('#0c0a18','#1a0f1e',b), 96, drift*0.8);
}
function cityBand(baseY,alpha,color,maxh,drift){
  ctx.save(); ctx.globalAlpha=alpha; ctx.fillStyle=color;
  const sp=46, off=((G.dist*0.4+drift)% sp);
  for(let x=-off-sp; x<W+sp; x+=sp){
    const seed=Math.sin((x+off)*12.9)*0.5+0.5;
    const bw=sp*(0.7+seed*0.5), bh=18+seed*maxh;
    ctx.fillRect(x, baseY-bh, bw, bh+40);
  }
  ctx.restore();
}
function drawRoad(){
  const b=blend();
  // ground trapezoid
  const nL=project(-1.5*LANE,0,0), nR=project(1.5*LANE,0,0);
  const fL=project(-1.5*LANE,ZFAR,0), fR=project(1.5*LANE,ZFAR,0);
  const g=ctx.createLinearGradient(0,HORIZON,0,GROUND);
  g.addColorStop(0, mix('#0e0b1a','#1c1020',b)); g.addColorStop(1, mix('#1a1430','#2a1622',b));
  ctx.fillStyle=g;
  ctx.beginPath(); ctx.moveTo(fL.x,fL.y); ctx.lineTo(fR.x,fR.y); ctx.lineTo(nR.x,nR.y); ctx.lineTo(nL.x,nL.y); ctx.closePath(); ctx.fill();
  // moving transverse rungs (speed feel)
  const SEG=10, phase=G.dist % SEG;
  for(let z=ZFAR - phase; z>0; z-=SEG){
    const a=project(-1.5*LANE,z,0), c=project(1.5*LANE,z,0);
    ctx.strokeStyle=`rgba(242,193,78,${0.04+0.10*a.p})`; ctx.lineWidth=Math.max(1,2*a.p);
    ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(c.x,c.y); ctx.stroke();
  }
  // lane divider lines
  for(const off of [-0.5,0.5]){
    const a=project(off*2*LANE,0,0), f=project(off*2*LANE,ZFAR,0);
    ctx.strokeStyle='rgba(205,214,221,.18)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(f.x,f.y); ctx.stroke();
  }
  // glowing road edges
  for(const off of [-1.5,1.5]){
    const a=project(off*LANE,0,0), f=project(off*LANE,ZFAR,0);
    ctx.strokeStyle=mix('rgba(110,147,189,.5)','rgba(216,105,59,.6)',b); ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(f.x,f.y); ctx.stroke();
  }
}
function drawEntities(){
  const sorted=ents.slice().sort((a,b)=>b.z-a.z);  // far first
  for(const e of sorted){
    if(e.z>ZFAR) continue;
    const laneX=(e.lane-1)*LANE;
    if(e.kind==='heart') drawHeart(laneX,e.z,e.up,e.t);
    else if(e.kind==='pow') drawPower(laneX,e.z,e.sub,e.t);
    else drawObstacle(laneX,e.z,e.sub,e.t);
  }
}
function drawHeart(laneX,z,up,t){
  const pj=project(laneX,z,(up||0)+14+Math.sin(t*4)*3); const s=Math.max(3,16*pj.p);
  ctx.save(); ctx.globalAlpha=clamp(pj.p*1.4,0,1);
  ctx.shadowColor='#6e93bd'; ctx.shadowBlur=14*pj.p;
  ctx.fillStyle='#8fb4e6'; heartPath(pj.x,pj.y,s); ctx.fill();
  ctx.fillStyle='#dbe8fb'; heartPath(pj.x-s*0.12,pj.y-s*0.12,s*0.5); ctx.fill();
  ctx.restore();
}
function heartPath(x,y,s){
  ctx.beginPath();
  ctx.moveTo(x,y+s*0.35);
  ctx.bezierCurveTo(x-s*0.6,y-s*0.25, x-s*0.5,y-s*0.85, x,y-s*0.45);
  ctx.bezierCurveTo(x+s*0.5,y-s*0.85, x+s*0.6,y-s*0.25, x,y+s*0.35);
  ctx.closePath();
}
function drawPower(laneX,z,sub,t){
  const pj=project(laneX,z,26+Math.sin(t*3)*3); const s=Math.max(5,20*pj.p);
  ctx.save(); ctx.globalAlpha=clamp(pj.p*1.4,0,1);
  const col=sub==='magnet'?'#f2c14e':'#b8b0cf';
  ctx.shadowColor=col; ctx.shadowBlur=18*pj.p;
  ctx.strokeStyle=col; ctx.lineWidth=Math.max(2,4*pj.p); ctx.fillStyle='rgba(0,0,0,.35)';
  ctx.beginPath(); ctx.arc(pj.x,pj.y,s,0,TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle=col; ctx.font=`700 ${Math.max(8,s*1.1)}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(sub==='magnet'?'🧲':'🛡', pj.x, pj.y+1);
  ctx.textBaseline='alphabetic'; ctx.restore();
}
function drawObstacle(laneX,z,sub,t){
  const baseP=persp(z);
  const w=Math.max(6, LANE*0.78*baseP);
  ctx.save();
  if(sub==='low'){
    const pj=project(laneX,z,0); const h=Math.max(6,34*baseP);
    ctx.shadowColor='#e0533a'; ctx.shadowBlur=12*baseP;
    ctx.fillStyle='#b1502a'; rrect(pj.x-w/2,pj.y-h,w,h,4*baseP); ctx.fill();
    ctx.fillStyle='#f2c14e'; ctx.fillRect(pj.x-w/2,pj.y-h,w,Math.max(1.5,4*baseP));
    // hazard stripes
    ctx.fillStyle='rgba(0,0,0,.25)';
    for(let i=0;i<w;i+=Math.max(6,10*baseP)) ctx.fillRect(pj.x-w/2+i,pj.y-h,Math.max(2,4*baseP),h);
  } else if(sub==='high'){
    const pj=project(laneX,z,0);
    const top=Math.max(8,jumpHeight()*0.9*baseP), gap=Math.max(8,38*baseP), th=Math.max(5,18*baseP);
    ctx.shadowColor='#6e93bd'; ctx.shadowBlur=12*baseP;
    ctx.fillStyle='#506f97'; rrect(pj.x-w/2,pj.y-top-th,w,th,3*baseP); ctx.fill();   // overhead banner
    ctx.fillStyle='#cdd6dd'; ctx.font=`700 ${Math.max(6,th*0.7)}px "JetBrains Mono"`; ctx.textAlign='center';
    if(baseP>0.4) ctx.fillText('SLIDE', pj.x, pj.y-top-th*0.3);
    // posts
    ctx.fillStyle='#3a4a64'; ctx.fillRect(pj.x-w/2,pj.y-top-th,Math.max(2,4*baseP),top+th);
    ctx.fillRect(pj.x+w/2-Math.max(2,4*baseP),pj.y-top-th,Math.max(2,4*baseP),top+th);
  } else { // full — a "you're too much" monkey gremlin
    const h=Math.max(14,jumpHeight()*1.15*baseP);
    const pj=project(laneX,z,0); const cy=pj.y-h*0.5, cx=pj.x;
    ctx.shadowColor='rgba(120,60,160,.8)'; ctx.shadowBlur=16*baseP;
    ctx.fillStyle='#2a1830';
    ctx.beginPath();
    for(let a=0;a<TAU;a+=0.4){ const r=w*0.5*(1+0.12*Math.sin(a*3+t*4));
      const px=cx+Math.cos(a)*r, py=cy+Math.sin(a)*r*(h/w); a===0?ctx.moveTo(px,py):ctx.lineTo(px,py); }
    ctx.closePath(); ctx.fill();
    if(baseP>0.3){
      ctx.shadowBlur=8*baseP; ctx.shadowColor='#ff5a5a'; ctx.fillStyle='#f2c14e';
      const ey=cy-h*0.1, ex=w*0.16;
      ctx.beginPath(); ctx.ellipse(cx-ex,ey,4*baseP,2.6*baseP,0.3,0,TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx+ex,ey,4*baseP,2.6*baseP,-0.3,0,TAU); ctx.fill();
      ctx.fillStyle='#ff5a5a';
      ctx.beginPath(); ctx.arc(cx-ex,ey,1.4*baseP,0,TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+ex,ey,1.4*baseP,0,TAU); ctx.fill();
    }
  }
  ctx.restore();
}

/* ----- Lou, the runner ----- */
function drawPlayer(){
  const up=airUp();
  const pj=project((player.lanePos-1)*LANE,0,up);
  const sliding=isSliding(), air=isAir();
  ctx.save();
  ctx.translate(pj.x, pj.y);
  ctx.rotate(player.lean*0.18);
  if(G.hitFlash>0 && Math.floor(G.hitFlash*16)%2) ctx.globalAlpha=0.4;

  // shadow on the deck (shrinks as she leaves the ground)
  ctx.save(); ctx.globalAlpha=clamp(0.4-up/H,0.08,0.4); ctx.fillStyle='#000';
  ctx.beginPath(); ctx.ellipse(0,2, 22-up*0.04, 6,0,0,TAU); ctx.fill(); ctx.restore();

  // warmth / shield aura
  if(G.warm>0 || G.shield || G.magnet>0){
    const col=G.warm>0?'#f2c14e':(G.shield?'#b8b0cf':'#f2c14e');
    ctx.save(); ctx.globalAlpha=0.25+0.1*Math.sin(G.time*8); ctx.shadowColor=col; ctx.shadowBlur=22;
    ctx.fillStyle=col; ctx.beginPath(); ctx.arc(0,-34,40,0,TAU); ctx.fill(); ctx.restore();
  }

  const run=player.run;
  // colours (Lou)
  const hood='#d8693b', hoodD='#b1502a', skin='#c5895b', hair='#46291a', amber='#f2c14e';

  if(sliding){
    // low slide pose
    ctx.fillStyle=hoodD; rrect(-26,-18,46,16,6); ctx.fill();
    ctx.fillStyle=hood;  rrect(-26,-22,40,12,6); ctx.fill();
    ctx.fillStyle=skin;  rrect(14,-24,14,12,4); ctx.fill();   // head forward
    ctx.fillStyle=hair;  rrect(14,-26,14,5,3); ctx.fill();
    ctx.fillStyle=amber; ctx.fillRect(13,-22,3,7);            // headphone
    ctx.restore(); return;
  }

  const legSwing = air? 0.5 : Math.sin(run)*0.85;
  const armSwing = air? -0.9 : Math.sin(run)*0.8;
  // legs
  leg(-legSwing, hoodD); leg(legSwing, '#2a2440');
  // torso (hoodie)
  ctx.fillStyle=hood; rrect(-12,-46,24,30,7); ctx.fill();
  ctx.fillStyle=hoodD; rrect(-12,-22,24,6,3); ctx.fill();
  ctx.fillStyle=amber; ctx.fillRect(-2,-44,4,22);            // zipper highlight
  // back arm + front arm
  arm(-armSwing, hoodD);
  // head
  ctx.save(); ctx.translate(0,-52);
  ctx.fillStyle=skin; rrect(-9,-12,18,18,6); ctx.fill();
  ctx.fillStyle=hair; rrect(-10,-14,20,8,4); ctx.fill();
  ctx.fillStyle=hair; rrect(-11,-6,4,16,2); ctx.fill();      // long hair fall
  // amber headphones
  ctx.fillStyle='#272030'; ctx.fillRect(-11,-14,22,3);
  ctx.fillStyle=amber; ctx.fillRect(-12,-9,4,8); ctx.fillRect(8,-9,4,8);
  // eye
  ctx.fillStyle='#1c130c'; ctx.fillRect(3,-3,2.4,2.4);
  ctx.restore();
  arm(armSwing, hood);

  ctx.restore();

  function leg(sw,col){
    ctx.save(); ctx.translate(0,-18); ctx.rotate(sw*0.6);
    ctx.fillStyle=col; rrect(-4,0,8,18,3); ctx.fill();
    ctx.fillStyle='#2a1a12'; rrect(-5,16,11,5,2); ctx.fill();
    ctx.restore();
  }
  function arm(sw,col){
    ctx.save(); ctx.translate(0,-42); ctx.rotate(sw*0.7);
    ctx.fillStyle=col; rrect(-3,0,7,18,3); ctx.fill();
    ctx.fillStyle=skin; ctx.beginPath(); ctx.arc(0.5,18,3.4,0,TAU); ctx.fill();
    ctx.restore();
  }
}
function drawSpeedLines(){
  if(G.speed<48) return;
  const n=Math.floor((G.speed-40)/6);
  ctx.save(); ctx.strokeStyle='rgba(255,255,255,.10)'; ctx.lineWidth=2;
  for(let i=0;i<n;i++){
    const yy=(G.time*900 + i*123)% (H*0.7) + HORIZON;
    const xx=(i%2? W*0.12: W*0.88) + Math.sin(i)*10;
    ctx.beginPath(); ctx.moveTo(xx,yy); ctx.lineTo(xx,yy+22); ctx.stroke();
  }
  ctx.restore();
}
function mix(a,b,t){
  const pa=hx(a), pb=hx(b);
  return `rgb(${Math.round(lerp(pa[0],pb[0],t))},${Math.round(lerp(pa[1],pb[1],t))},${Math.round(lerp(pa[2],pb[2],t))})`;
}
function hx(c){ c=c.replace('#',''); return [parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)]; }
function rrect(x,y,w,h,r){ r=Math.min(r,w/2,h/2); ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

function render(){
  ctx.save();
  if(shake>0) ctx.translate(rand(-shake,shake),rand(-shake,shake));
  drawSky();
  drawRoad();
  drawSpeedLines();
  drawEntities();
  drawParts();
  if(state===ST.PLAY||state===ST.PAUSE||state===ST.DEAD) drawPlayer();
  drawFloats();
  ctx.restore();
  // hit vignette
  if(G.hitFlash>0){ ctx.save(); ctx.globalAlpha=clamp(G.hitFlash,0,0.6);
    ctx.fillStyle='rgba(224,83,58,0.5)'; ctx.fillRect(0,0,W,H); ctx.restore(); }
}

/* ------------------------------------------------------------------ HUD ---- */
const hud = {
  el:    document.getElementById('hud'),
  score: document.getElementById('score'),
  best:  document.getElementById('bestline'),
  mult:  document.getElementById('mult'),
  hcnt:  document.getElementById('hcnt'),
  conn:  document.getElementById('connfill'),
  connWrap: document.querySelector('.conn-wrap'),
  combo: document.getElementById('combo'),
  bumpMult(){ this.mult.classList.add('pop'); clearTimeout(this._mt); this._mt=setTimeout(()=>this.mult.classList.remove('pop'),130); },
};
function refreshHud(){
  hud.score.textContent = Math.floor(G.score);
  hud.best.textContent  = 'best '+Store.best;
  hud.mult.textContent  = '×'+G.mult;
  hud.hcnt.textContent  = G.hearts;
  hud.conn.style.width  = (G.warm>0? 100 : G.conn)+'%';
}
function showCombo(c){
  hud.combo.textContent = c+' COMBO!';
  hud.combo.classList.remove('show'); void hud.combo.offsetWidth; hud.combo.classList.add('show');
}

/* -------------------------------------------------------------- lifecycle -- */
function startGame(){
  Sound.resume(); if(Store.music) Sound.startMusic();
  ents.length=0; parts.length=0; floats.length=0;
  Object.assign(G,{ speed:SPEED0, dist:0, score:0, hearts:0, combo:0, bestCombo:0,
    conn:0, warm:0, magnet:0, shield:false, shieldT:0, rowTimer:0, time:0, mult:1, hitFlash:0, started:true });
  Object.assign(player,{ lane:1, lanePos:1, jumpT:-1, slideT:0, run:0, lean:0, dead:false });
  hud.connWrap.classList.remove('warm');
  state=ST.PLAY;
  document.getElementById('menu').classList.add('hide');
  document.getElementById('over').classList.add('hide');
  document.getElementById('pause').classList.add('hide');
  hud.el.classList.remove('hide');
  refreshHud();
  // brief touch hint on coarse pointers
  if(window.matchMedia && window.matchMedia('(pointer:coarse)').matches){
    const sh=document.getElementById('swipehint'); sh.classList.remove('hide');
    setTimeout(()=>sh.classList.add('hide'),2600);
  }
}
function die(){
  state=ST.DEAD; player.dead=true; Sound.dead(); Sound.stopMusic();
  Store.addHearts(G.hearts);
  const isBest=Store.saveBest(Math.floor(G.score));
  setTimeout(()=>{
    document.getElementById('finalScore').textContent=Math.floor(G.score);
    document.getElementById('finalBest').textContent=Store.best;
    document.getElementById('finalHearts').textContent=G.hearts;
    document.getElementById('totalHearts').textContent=Store.total;
    document.getElementById('newbest').classList.toggle('hide',!isBest);
    const good=G.score>=Math.max(400,Store.best*0.6);
    document.getElementById('overTitle').textContent = isBest? 'she stayed on the line.' : (good?'still figuring it out.':'she logged off.');
    document.getElementById('overLine').textContent = pick(good
      ? ['"told you, le singe."','restraint reads louder than noise.','another night, another attempt.']
      : ['"whatever lol."','the monkeys won this round.','some people arrive like unfinished songs.']);
    document.getElementById('overPortrait').innerHTML = Characters.svg('lou', isBest?'laugh':(good?'soft':'cry'));
    hud.el.classList.add('hide');
    document.getElementById('over').classList.remove('hide');
  }, 650);
}
function togglePause(){
  if(state===ST.PLAY){ state=ST.PAUSE; document.getElementById('pause').classList.remove('hide'); Sound.stopMusic(); }
  else if(state===ST.PAUSE){ state=ST.PLAY; document.getElementById('pause').classList.add('hide'); if(Store.music) Sound.startMusic(); }
}
function toMenu(){
  state=ST.MENU; Sound.stopMusic();
  document.getElementById('over').classList.add('hide');
  document.getElementById('pause').classList.add('hide');
  hud.el.classList.add('hide');
  document.getElementById('menu').classList.remove('hide');
  buildMenu();
}

/* ------------------------------------------------------------------ menu --- */
function buildMenu(){
  document.getElementById('menuPortrait').innerHTML = Characters.svg('lou','laugh');
  const coarse = window.matchMedia && window.matchMedia('(pointer:coarse)').matches;
  document.getElementById('controls').innerHTML = coarse
    ? 'swipe <b>← →</b> lane · <b>↑</b> jump · <b>↓</b> slide · tap to jump'
    : '<kbd>←</kbd><kbd>→</kbd> lane &nbsp; <kbd>↑</kbd>/<kbd>space</kbd> jump &nbsp; <kbd>↓</kbd> slide &nbsp; <kbd>P</kbd> pause';
  document.getElementById('menuBest').textContent =
    Store.best>0 ? `best ${Store.best}  ·  💙 ${Store.total} collected` : '';
  const mb=document.getElementById('musicbtn'); mb.textContent='♪ music: '+(Store.music?'on':'off');
}

/* ------------------------------------------------------------------ loop --- */
let last=performance.now();
function frame(now){
  let dt=(now-last)/1000; last=now; if(dt>0.05) dt=0.05;
  if(state===ST.PLAY){ update(dt); refreshHud(); }
  else { updateParts(dt); updateFloats(dt); if(shake>0) shake*=0.86; G.time+=dt; player.run+=dt*2; }
  render();
  requestAnimationFrame(frame);
}

/* --------------------------------------------------------------- buttons --- */
document.getElementById('playbtn').addEventListener('click', startGame);
document.getElementById('againbtn').addEventListener('click', startGame);
document.getElementById('menubtn').addEventListener('click', toMenu);
document.getElementById('pausebtn').addEventListener('click', togglePause);
document.getElementById('resumebtn').addEventListener('click', togglePause);
document.getElementById('quitbtn').addEventListener('click', toMenu);
document.getElementById('musicbtn').addEventListener('click', ()=>{
  Store.setMusic(!Store.music); Sound.resume();
  if(Store.music){ Sound.startMusic(); } else { Sound.stopMusic(); }
  document.getElementById('musicbtn').textContent='♪ music: '+(Store.music?'on':'off');
});

/* ------------------------------------------------------------------ boot --- */
resize();
buildMenu();
requestAnimationFrame(frame);

/* expose for the headless smoke test */
window.Game = {
  start: startGame, toMenu, pause: togglePause,
  get state(){ return state; },
  get G(){ return G; }, get player(){ return player; }, get ents(){ return ents; },
  _spawn: spawnRow, _resize: resize,
};
