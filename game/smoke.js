/* Headless smoke test for SINGE RUN.
   Stubs a minimal DOM + canvas so characters.js and engine.js run under Node,
   then drives the endless runner: boot, start, pump frames, fire input,
   force collisions, and assert core mechanics without a browser.
   Results are written to smoke-report.txt (Bash stdout is unreliable in this
   session, so we persist them to a file and Read that). */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const lines = [];
const log = s => lines.push(s);
let fails = 0;
const ok = (c,m)=>{ if(c){ log('[PASS] '+m); } else { fails++; log('[FAIL] '+m); } };

/* ---- canvas 2d context stub ---- */
function gradient(){ return { addColorStop(){} }; }
const ctxStub = new Proxy({}, {
  get(t,p){
    if(typeof p==='symbol'||p==='then'||p==='inspect') return undefined;
    if(p==='createLinearGradient'||p==='createRadialGradient'||p==='createPattern') return gradient;
    if(p==='measureText') return ()=>({width:8});
    if(p in t) return t[p];
    return function(){ return undefined; };
  },
  set(t,p,v){ t[p]=v; return true; }
});

/* ---- DOM stubs ---- */
function makeStyle(){ const s={ setProperty(k,v){s[k]=v;}, getPropertyValue(k){return s[k]||'';}, removeProperty(k){delete s[k];} }; return s; }
function makeEl(tag){
  const el={
    tagName:(tag||'div').toUpperCase(), nodeType:1, style:makeStyle(), dataset:{}, attributes:{},
    children:[], _l:{}, id:'', className:'', innerHTML:'', textContent:'', value:'',
    width:480, height:800,
    classList:{ _s:new Set(), add(...c){c.forEach(x=>this._s.add(x));}, remove(...c){c.forEach(x=>this._s.delete(x));},
      toggle(c,f){ const has=this._s.has(c); const want=(f===undefined)?!has:!!f; want?this._s.add(c):this._s.delete(c); }, contains(c){return this._s.has(c);} },
    getContext(){ return ctxStub; },
    setAttribute(k,v){ this.attributes[k]=v; if(k==='id') this.id=v; },
    getAttribute(k){ return this.attributes[k]; },
    appendChild(c){ this.children.push(c); c.parentNode=this; return c; },
    removeChild(c){ this.children=this.children.filter(x=>x!==c); return c; },
    querySelector(){ return makeEl('div'); }, querySelectorAll(){ return []; },
    getBoundingClientRect(){ return {left:0,top:0,right:480,bottom:800,width:480,height:800,x:0,y:0}; },
    focus(){}, blur(){}, click(){ this._fire('click',{}); }, remove(){},
    addEventListener(t,fn){ (this._l[t]=this._l[t]||[]).push(fn); },
    removeEventListener(t,fn){ if(this._l[t]) this._l[t]=this._l[t].filter(f=>f!==fn); },
    _fire(t,ev){ (this._l[t]||[]).forEach(fn=>{ try{ fn(Object.assign({preventDefault(){},stopPropagation(){},target:this},ev)); }catch(e){} }); },
    dispatchEvent(){ return true; },
  };
  return el;
}
const byId={};
function getEl(id){ return byId[id] || (byId[id]=(()=>{ const e=makeEl('div'); e.id=id; return e; })()); }

const doc={
  body:makeEl('body'), documentElement:makeEl('html'), head:makeEl('head'),
  getElementById:getEl,
  querySelector:sel=>{ if(sel==='.conn-wrap') return getEl('__connwrap'); if(sel&&sel[0]==='#') return getEl(sel.slice(1)); return makeEl('div'); },
  querySelectorAll:()=>[],
  createElement:t=>makeEl(t), createElementNS:(n,t)=>makeEl(t), createTextNode:t=>({nodeType:3,textContent:t}),
  addEventListener:(t,fn)=>{ (winL['doc:'+t]=winL['doc:'+t]||[]).push(fn); }, removeEventListener(){},
  fonts:{ ready:Promise.resolve(), load:()=>Promise.resolve(), add(){} },
  hidden:false, visibilityState:'visible',
};

const winL={};
const rafQ=[];
let timerBudget=4000;
const win={
  innerWidth:480, innerHeight:800, devicePixelRatio:1, document:doc,
  location:{href:'',hash:'',search:'',reload(){}},
  localStorage:(()=>{ const m={}; return { getItem:k=>k in m?m[k]:null, setItem:(k,v)=>{m[k]=String(v);}, removeItem:k=>{delete m[k];}, clear(){for(const k in m)delete m[k];} }; })(),
  matchMedia:()=>({matches:false, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){}}),
  addEventListener:(t,fn)=>{ (winL[t]=winL[t]||[]).push(fn); }, removeEventListener(){},
  requestAnimationFrame:cb=>{ rafQ.push(cb); return rafQ.length; }, cancelAnimationFrame(){},
  setTimeout:(fn)=>{ if(typeof fn==='function'&&timerBudget-->0){ try{fn();}catch(e){} } return 0; },
  clearTimeout(){}, setInterval:()=>0, clearInterval(){},
  getComputedStyle:()=>({getPropertyValue:()=>''}),
  performance:{ now:()=>Date.now() },
  navigator:{ userAgent:'node', language:'en', maxTouchPoints:0 },
  AudioContext:function(){ return audioStub(); },
};
win.webkitAudioContext=win.AudioContext; win.window=win; win.self=win; win.globalThis=win;

function audioStub(){
  const n={ gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},
    frequency:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}}, type:'sine',
    connect(){return n;}, disconnect(){}, start(){}, stop(){},
    createGain(){return audioStub();}, createOscillator(){return audioStub();} };
  n.state='running'; n.currentTime=0; n.destination={}; n.resume=()=>Promise.resolve();
  return n;
}

const sandbox=Object.assign(Object.create(null), win, {
  window:win, document:doc, console, Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Map, Set, Promise,
  parseInt, parseFloat, isNaN, isFinite,
  setTimeout:win.setTimeout, clearTimeout:win.clearTimeout, setInterval:win.setInterval, clearInterval:win.clearInterval,
  requestAnimationFrame:win.requestAnimationFrame, cancelAnimationFrame:win.cancelAnimationFrame,
  performance:win.performance, navigator:win.navigator, localStorage:win.localStorage,
  AudioContext:win.AudioContext, webkitAudioContext:win.AudioContext,
});
sandbox.globalThis=sandbox; sandbox.self=sandbox;
vm.createContext(sandbox);

function loadFile(name){ vm.runInContext(fs.readFileSync(path.join(__dirname,name),'utf8'), sandbox, {filename:name}); }

/* ---- run ---- */
try{
  loadFile('characters.js');
  sandbox.Characters = sandbox.window.Characters;   // browser: shared global scope
  ok(typeof sandbox.window.Characters.svg==='function', 'characters.js: Characters.svg() available');
  let n=0; for(const who of ['lou','elias']) for(const ex of ['neutral','angry','laugh','cry','sleep','soft','surprise','warm','away','sad'])
    if(sandbox.window.Characters.svg(who,ex).indexOf('<svg')===0) n++;
  ok(n===20, 'characters.js: all 20 sprite/expression combos render ('+n+')');
}catch(e){ ok(false,'characters.js threw: '+(e.stack||e)); }

let G=null;
try{
  loadFile('engine.js');
  G = sandbox.window.Game;
  ok(!!G && typeof G.start==='function', 'engine.js loaded; Game API exposed');
  ok(G.state==='menu', 'starts in MENU state ('+(G&&G.state)+')');
}catch(e){ ok(false,'engine.js threw on load: '+(e.stack||e)); }

function key(code){ (winL.keydown||[]).forEach(fn=>fn({code,key:code,preventDefault(){},repeat:false})); }
// Single monotonically increasing clock across all pumps — a real browser's
// rAF timestamps never go backwards, so the engine always sees positive dt.
let clock = 1000;
function pump(frames){ for(let i=0;i<frames && rafQ.length;i++){ const cb=rafQ.shift(); clock+=16; cb(clock); } }

if(G){
  // the boot already scheduled one frame; start a run
  pump(1);
  G.start();
  ok(G.state==='play', 'Game.start() enters PLAY');

  // run a while with no input — score (distance) must climb, must not die instantly
  const s0=G.G.score;
  let err=null;
  try{
    for(let i=0;i<120;i++){ pump(1); }
  }catch(e){ err=e; }
  ok(!err, 'main loop runs without throwing'+(err?(' — '+(err.message||err)):''));
  ok(G.G.score>s0, 'score increases over distance ('+s0.toFixed(0)+' -> '+G.G.score.toFixed(0)+')');
  ok(G.G.speed>=34, 'speed ramps up ('+G.G.speed.toFixed(1)+')');

  // input: lane changes + jump + slide don't throw and update the player
  let inputErr=null, laneMoved=false, jumped=false, slid=false;
  try{
    key('ArrowLeft');  pump(8); if(G.player.lane===0) laneMoved=true;
    key('ArrowRight'); key('ArrowRight'); pump(8);
    key('ArrowUp');    pump(2); if(G.player.jumpT>=0) jumped=true; pump(50);
    key('ArrowDown');  pump(2); if(G.player.slideT>0) slid=true; pump(40);
  }catch(e){ inputErr=e; }
  ok(!inputErr, 'lane/jump/slide input runs without throwing'+(inputErr?(' — '+inputErr.message):''));
  ok(laneMoved, 'ArrowLeft switches lane');
  ok(jumped,   'jump activates an airborne arc');
  ok(slid,     'slide activates a slide window');

  // force a collision: drop a full-block obstacle into the player's lane at z~0
  try{
    G.G.shield=false; G.G.warm=0;
    G.ents.length=0;
    G.ents.push({kind:'obst', sub:'full', lane:Math.round(G.player.lanePos), z:3, passed:false, t:0});
    let died=false;
    for(let i=0;i<30;i++){ pump(1); if(G.state==='dead'){ died=true; break; } }
    ok(died, 'hitting a full-block obstacle ends the run (game over)');
  }catch(e){ ok(false,'collision handling threw: '+(e.stack||e)); }

  // restart works
  try{ G.start(); ok(G.state==='play' && G.G.score<5, 'Game.start() restarts a fresh run'); }
  catch(e){ ok(false,'restart threw: '+(e.stack||e)); }

  // collect a heart -> hearts++ and combo++
  try{
    const before=G.G.hearts;
    G.ents.length=0;
    G.ents.push({kind:'heart', lane:Math.round(G.player.lanePos), z:2, taken:false, up:0, t:0});
    for(let i=0;i<10;i++){ pump(1); if(G.G.hearts>before) break; }
    ok(G.G.hearts>before, 'collecting a heart increments the heart count');
    ok(G.G.combo>0, 'collecting a heart builds combo');
  }catch(e){ ok(false,'heart collection threw: '+(e.stack||e)); }
}

log('');
log((fails? fails+' FAILED':'ALL PASSED')+' — '+lines.filter(l=>l.startsWith('[PASS]')).length+' checks passed');
fs.writeFileSync(path.join(__dirname,'smoke-report.txt'), lines.join('\n')+'\n');
process.exit(fails?1:0);
