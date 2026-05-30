/* Headless smoke test for the single-file game (index.html).
   Extracts the <script>, stubs a Canvas2D + DOM, boots the game, and drives
   every chapter (menu -> cutscene -> play, forced catches/win/fail, NPC + item
   collisions) to catch runtime errors without a browser.
   Writes results to test/smoke-report.txt (stdout is unreliable in this env). */
'use strict';
const fs=require('fs'), path=require('path'), vm=require('vm');
const lines=[]; let fails=0;
const ok=(c,m)=>{ lines.push((c?'[PASS] ':'[FAIL] ')+m); if(!c) fails++; };

/* ---- extract the inline script from index.html ---- */
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const m=html.match(/<script>([\s\S]*?)<\/script>/);
ok(!!m,'index.html contains an inline <script>');
const code=m?m[1]:'';

/* ---- canvas 2d stub ---- */
function grad(){ return {addColorStop(){}}; }
const ctx2d=new Proxy({},{ get(t,p){
  if(typeof p==='symbol'||p==='then') return undefined;
  if(p==='createLinearGradient'||p==='createRadialGradient'||p==='createPattern') return grad;
  if(p==='measureText') return ()=>({width:40});
  if(p in t) return t[p];
  return function(){}; }, set(t,p,v){ t[p]=v; return true; } });

function style(){ const s={setProperty(k,v){s[k]=v;},getPropertyValue(k){return s[k]||'';},removeProperty(k){delete s[k];}}; return s; }
function el(tag){ return {
  tagName:(tag||'div').toUpperCase(), style:style(), classList:{_s:new Set(),add(...c){c.forEach(x=>this._s.add(x));},remove(...c){c.forEach(x=>this._s.delete(x));},toggle(c,f){const h=this._s.has(c);(f===undefined?!h:!!f)?this._s.add(c):this._s.delete(c);},contains(c){return this._s.has(c);}},
  width:900,height:500, _l:{},
  getContext(){ return ctx2d; },
  getBoundingClientRect(){ return {left:0,top:0,right:900,bottom:500,width:900,height:500}; },
  addEventListener(t,fn){ (this._l[t]=this._l[t]||[]).push(fn); }, removeEventListener(){},
  appendChild(c){return c;}, setAttribute(){}, getAttribute(){return null;},
  _fire(t,ev){ (this._l[t]||[]).forEach(fn=>{try{fn(Object.assign({preventDefault(){},clientX:0,clientY:0,changedTouches:[{clientX:0,clientY:0}]},ev));}catch(e){}}); } }; }

const byId={}; const ids=['game','pad','bL','bR','bJ','bD','bZ'];
ids.forEach(i=>{ byId[i]=el(); byId[i].id=i; });
const winL={};
const doc={ getElementById:id=>byId[id]||(byId[id]=el()), createElement:el, body:el(), documentElement:el(),
  addEventListener(t,fn){ (winL['doc:'+t]=winL['doc:'+t]||[]).push(fn); } };
let rafCb=null;
const win={ innerWidth:1000, innerHeight:700, devicePixelRatio:1,
  addEventListener(t,fn){ (winL[t]=winL[t]||[]).push(fn); }, removeEventListener(){},
  requestAnimationFrame(cb){ rafCb=cb; return 1; }, cancelAnimationFrame(){},
  matchMedia(){ return {matches:false,addEventListener(){},addListener(){}}; },
  setTimeout(fn){ if(typeof fn==='function'){ try{fn();}catch(e){} } return 0; }, clearTimeout(){},
  navigator:{maxTouchPoints:0,userAgent:'node'},
  localStorage:(()=>{const s={};return{getItem:k=>k in s?s[k]:null,setItem:(k,v)=>{s[k]=String(v);},removeItem:k=>{delete s[k];}};})(),
  AudioContext:function(){ return audio(); },
  performance:{ now:()=>clock },
};
win.webkitAudioContext=win.AudioContext;
function audio(){ const n={ state:'running', currentTime:0, destination:{}, resume(){},
  createOscillator(){return{type:'',frequency:{value:0,exponentialRampToValueAtTime(){}},connect(){},start(){},stop(){}};},
  createGain(){return{gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};} }; return n; }

let clock=1000;
const sandbox={ window:win, document:doc, console, Math, Date, JSON, Object, Array, String, Number, Boolean,
  parseInt, parseFloat, isNaN, isFinite, navigator:win.navigator, localStorage:win.localStorage,
  performance:win.performance, requestAnimationFrame:win.requestAnimationFrame, cancelAnimationFrame:win.cancelAnimationFrame,
  setTimeout:win.setTimeout, clearTimeout:win.clearTimeout, AudioContext:win.AudioContext, webkitAudioContext:win.AudioContext };
sandbox.globalThis=sandbox; sandbox.self=sandbox; win.window=win; win.self=win;
vm.createContext(sandbox);

try{ vm.runInContext(code, sandbox, {filename:'index.html#script'}); ok(true,'script booted without throwing'); }
catch(e){ ok(false,'script threw on boot: '+(e.stack||e)); fs.writeFileSync(path.join(__dirname,'smoke-report.txt'),lines.join('\n')+'\n'); process.exit(1); }

const API=sandbox.window.WYCM, G=API&&API.game;
ok(!!API,'WYCM test hook exposed');
ok(!!G,'game instance exposed');
const cls=['Lou','Elias','Cutscene','NPCManager','ItemManager','Platform','ParticleSystem','BackgroundRenderer'];
ok(cls.every(c=>typeof API[c]==='function'),'required classes present: '+cls.join(', '));
ok(Array.isArray(API.CHAPTERS)&&API.CHAPTERS.length===4,'4 chapters defined');
ok(G.state==='menu','starts in MENU');

/* drive helpers */
function pump(frames){ for(let i=0;i<frames;i++){ clock+=16; if(rafCb) rafCb(clock); } }
function key(code,down){ (winL[down?'keydown':'keyup']||[]).forEach(fn=>fn({code,preventDefault(){},repeat:false})); }

pump(1);                                  // first scheduled frame

/* full playthrough Ch1..Ch3: force a catch in each via gap, expect advance */
let runErr=null;
try{
  G.startGame(0);                          // -> cutscene (intro). setTimeout stub auto-skips? no; skip manually
  ok(G.state==='cutscene','startGame enters a cutscene');
  G.cutscene.skip(); pump(2);
  ok(G.state==='play','cutscene -> play (Chapter 1)');

  // play a bit with input, no throw
  key('ArrowRight',true); pump(40); key('ArrowRight',false);
  ok(G.lou.wx>0,'Lou advances to the right ('+G.lou.wx.toFixed(0)+')');
  ok(G.lou.speed>0,'Lou has positive run speed');

  // jump + slide don't throw and change state
  key('Space',true); pump(2); const jumped=!G.lou.onGround; pump(50);
  key('ArrowDown',true); pump(2); const slid=G.lou.slideT>0; key('ArrowDown',false); pump(40);
  ok(jumped,'jump leaves the ground');
  ok(slid,'slide activates');

  // Z throwable doesn't throw an error in ch1
  key('KeyZ',true); pump(2); key('KeyZ',false); pump(4);
  ok(true,'Z item action runs');

  // force Elias to catch -> should advance to Ch2 cutscene then play
  for(let g=0;g<200 && G.state==='play';g++){ G.elias.wx=G.lou.wx-40; pump(1); }
  ok(G.state==='cutscene'||API.CHAPTERS[G.chapterIndex].n===2,'getting caught advances toward Chapter 2');
  if(G.state==='cutscene'){ G.cutscene.skip(); pump(2); }
  ok(API.CHAPTERS[G.chapterIndex].n===2,'now in Chapter 2 ('+API.CHAPTERS[G.chapterIndex].n+')');
  ok(G.elias.form==='monkey','Elias is a monkey in Chapter 2');

  // advance Ch2 -> Ch3
  for(let g=0;g<200 && G.state==='play';g++){ G.elias.wx=G.lou.wx-40; pump(1); }
  if(G.state==='cutscene'){ G.cutscene.skip(); pump(2); }
  ok(API.CHAPTERS[G.chapterIndex].n===3,'advanced to Chapter 3 ('+API.CHAPTERS[G.chapterIndex].n+')');

  // advance Ch3 -> Ch4 (role reversal)
  for(let g=0;g<200 && G.state==='play';g++){ G.elias.wx=G.lou.wx-40; pump(1); }
  if(G.state==='cutscene'){ G.cutscene.skip(); pump(2); }
  ok(API.CHAPTERS[G.chapterIndex].n===4,'advanced to Chapter 4 ('+API.CHAPTERS[G.chapterIndex].n+')');
  ok(G.elias.form==='human','Elias is human again (the runner) in Chapter 4');

  // Ch4 WIN: pull Elias next to Lou
  for(let g=0;g<200 && G.state==='play';g++){ G.elias.wx=G.lou.wx+40; pump(1); }
  ok(G.state==='ending','catching Elias triggers the WIN ending');
  pump(30); ok(true,'ending animation runs without throwing');

  // Ch4 FAIL path: restart ch4, push Elias to the border
  G.startChapterDirect(3); pump(2);
  ok(G.state==='play','restarted Chapter 4 directly');
  for(let g=0;g<300 && G.state==='play';g++){ G.elias.wx=G.borderX+10; pump(1); }
  ok(G.state==='fail','Elias reaching the border triggers FAIL');
}catch(e){ runErr=e; }
ok(!runErr,'no exceptions during full playthrough'+(runErr?(' — '+(runErr.stack||runErr)):''));

/* menu render + chapter-select render must not throw */
try{ G.toMenu(); pump(2); G.openSelect(); pump(2); ok(true,'menu + chapter-select render without throwing'); }
catch(e){ ok(false,'menu/select render threw: '+(e.stack||e)); }

lines.push(''); lines.push((fails?fails+' FAILED':'ALL PASSED')+' — '+lines.filter(l=>l.startsWith('[PASS]')).length+' checks passed');
fs.writeFileSync(path.join(__dirname,'smoke-report.txt'),lines.join('\n')+'\n');
process.exit(fails?1:0);
