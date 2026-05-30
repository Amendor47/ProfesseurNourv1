/* Headless smoke test for "When You Call Me, Singe".
   Stubs a minimal DOM + canvas so engine.js and characters.js can load and
   boot under Node, catching syntax/runtime errors without a browser.
   Writes a human-readable report to smoke-report.txt (Bash stdout is
   unreliable in this session, so we persist results to a file). */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const lines = [];
const log = (s) => lines.push(s);
let fails = 0;
const ok = (c, m) => { log((c ? '[PASS] ' : '[FAIL] ') + m); if (!c) fails++; };

/* ---- tiny DOM / canvas stubs ---- */
function gradient(){ return { addColorStop(){} }; }
const ctxProto = new Proxy({}, {
  get(t, p){
    if (typeof p === 'symbol' || p === 'then') return undefined;
    if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return gradient;
    if (p === 'measureText') return () => ({ width: 8 });
    if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
    if (p in t) return t[p];
    return function(){ return undefined; };
  },
  set(t, p, v){ t[p] = v; return true; }
});

let idCounter = 0;
function makeStyle(){
  const s = { setProperty(k,v){ s[k]=v; }, getPropertyValue(k){ return s[k]||''; }, removeProperty(k){ delete s[k]; } };
  return s;
}
function makeEl(tag){
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    nodeType: 1,
    style: makeStyle(), dataset: {}, attributes: {},
    children: [], childNodes: [],
    _listeners: {},
    id: '', className: '', innerHTML: '', textContent: '', value: '',
    width: 960, height: 540,
    classList: { _s:new Set(), add(...c){c.forEach(x=>this._s.add(x));}, remove(...c){c.forEach(x=>this._s.delete(x));},
                 toggle(c){ this._s.has(c)?this._s.delete(c):this._s.add(c); }, contains(c){return this._s.has(c);} },
    getContext(){ return ctxProto; },
    setAttribute(k,v){ this.attributes[k]=v; if(k==='id') this.id=v; },
    getAttribute(k){ return this.attributes[k]; },
    removeAttribute(k){ delete this.attributes[k]; },
    appendChild(c){ this.children.push(c); this.childNodes.push(c); c.parentNode = this; return c; },
    removeChild(c){ this.children = this.children.filter(x=>x!==c); this.childNodes = this.childNodes.filter(x=>x!==c); return c; },
    insertBefore(c){ this.children.push(c); this.childNodes.push(c); return c; },
    append(...cs){ cs.forEach(c=>this.appendChild(c)); },
    prepend(c){ this.children.unshift(c); },
    cloneNode(){ return makeEl(tag); },
    querySelector(){ return makeEl('div'); },
    querySelectorAll(){ return []; },
    getBoundingClientRect(){ return { left:0, top:0, right:960, bottom:540, width:960, height:540, x:0, y:0 }; },
    focus(){}, blur(){}, click(){ this._fire('click', {}); }, remove(){ if(this.parentNode) this.parentNode.removeChild(this); },
    scrollIntoView(){}, animate(){ return { onfinish:null, cancel(){}, finished: Promise.resolve() }; },
    addEventListener(type, fn){ (this._listeners[type]=this._listeners[type]||[]).push(fn); },
    removeEventListener(type, fn){ if(this._listeners[type]) this._listeners[type]=this._listeners[type].filter(f=>f!==fn); },
    _fire(type, ev){ (this._listeners[type]||[]).forEach(fn=>{ try{ fn(Object.assign({preventDefault(){},stopPropagation(){},target:el},ev)); }catch(e){} }); },
    dispatchEvent(){ return true; },
  };
  Object.defineProperty(el, 'firstChild', { get(){ return this.childNodes[0] || null; } });
  Object.defineProperty(el, 'parentElement', { get(){ return this.parentNode || null; } });
  return el;
}

const byId = {};
function getEl(id){ return byId[id] || (byId[id] = (()=>{ const e=makeEl('div'); e.id=id; return e; })()); }

const docListeners = {};
const documentStub = {
  body: makeEl('body'),
  documentElement: makeEl('html'),
  head: makeEl('head'),
  getElementById: (id) => getEl(id),
  querySelector: (sel) => { if (sel && sel[0]==='#') return getEl(sel.slice(1)); return makeEl('div'); },
  querySelectorAll: () => [],
  createElement: (t) => makeEl(t),
  createElementNS: (ns,t) => makeEl(t),
  createTextNode: (t) => ({ nodeType:3, textContent:t }),
  createDocumentFragment: () => makeEl('fragment'),
  addEventListener: (type, fn) => { (docListeners[type]=docListeners[type]||[]).push(fn); },
  removeEventListener: () => {},
  fire(type, ev){ (docListeners[type]||[]).forEach(fn=>{ try{ fn(Object.assign({preventDefault(){},target:documentStub},ev)); }catch(e){} }); },
  fonts: { ready: Promise.resolve(), load: () => Promise.resolve(), add(){} },
  hidden: false, visibilityState: 'visible',
};
// app mount point used by index.html
byId['app'] = makeEl('div'); byId['app'].id = 'app';
byId['crt'] = makeEl('div'); byId['crt'].id = 'crt';
documentStub.body.appendChild(byId['app']);

const rafQueue = [];
const windowStub = {
  innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
  document: documentStub,
  location: { href:'', hash:'', search:'', reload(){} },
  localStorage: (()=>{ const m={}; return { getItem:k=>k in m?m[k]:null, setItem:(k,v)=>{m[k]=String(v);}, removeItem:k=>{delete m[k];}, clear(){for(const k in m)delete m[k];} }; })(),
  matchMedia: () => ({ matches:false, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){} }),
  addEventListener(type, fn){ (docListeners['win:'+type]=docListeners['win:'+type]||[]).push(fn); },
  removeEventListener(){},
  requestAnimationFrame: (cb) => { rafQueue.push(cb); return rafQueue.length; },
  cancelAnimationFrame: () => {},
  setTimeout: (fn) => { return 0; },           // don't auto-run timers
  clearTimeout(){}, setInterval(){ return 0; }, clearInterval(){},
  getComputedStyle: () => ({ getPropertyValue: () => '' }),
  AudioContext: function(){ return audioStub(); },
  performance: { now: () => Date.now() },
  navigator: { userAgent: 'node', language: 'en', maxTouchPoints: 0 },
  scrollTo(){},
};
windowStub.webkitAudioContext = windowStub.AudioContext;
windowStub.window = windowStub;
windowStub.globalThis = windowStub;
windowStub.self = windowStub;

function audioStub(){
  const node = {
    gain:{ value:0, setValueAtTime(){}, linearRampToValueAtTime(){}, exponentialRampToValueAtTime(){}, setTargetAtTime(){} },
    frequency:{ value:0, setValueAtTime(){}, linearRampToValueAtTime(){}, exponentialRampToValueAtTime(){} },
    type:'sine', Q:{value:1}, pan:{value:0}, detune:{value:0},
    connect(){ return node; }, disconnect(){}, start(){}, stop(){},
    createGain(){ return audioStub(); }, createOscillator(){ return audioStub(); },
    createBiquadFilter(){ return audioStub(); }, createStereoPanner(){ return audioStub(); },
    createBufferSource(){ return audioStub(); }, createBuffer(){ return {}; },
    createDynamicsCompressor(){ return audioStub(); }, createAnalyser(){ return audioStub(); },
  };
  node.state='running'; node.currentTime=0; node.destination={}; node.sampleRate=44100;
  node.resume=()=>Promise.resolve(); node.suspend=()=>Promise.resolve(); node.close=()=>Promise.resolve();
  return node;
}

/* ---- run engine in a shared context ---- */
const sandbox = Object.assign(Object.create(null), windowStub, {
  window: windowStub, document: documentStub, console,
  Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Map, Set, Promise,
  parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent,
  Float32Array, Uint8Array, Uint8ClampedArray, Int32Array, ArrayBuffer,
  setTimeout: windowStub.setTimeout, clearTimeout: windowStub.clearTimeout,
  setInterval: windowStub.setInterval, clearInterval: windowStub.clearInterval,
  requestAnimationFrame: windowStub.requestAnimationFrame, cancelAnimationFrame: windowStub.cancelAnimationFrame,
  performance: windowStub.performance, navigator: windowStub.navigator, localStorage: windowStub.localStorage,
  AudioContext: windowStub.AudioContext, webkitAudioContext: windowStub.AudioContext,
});
sandbox.globalThis = sandbox; sandbox.self = sandbox;
vm.createContext(sandbox);

function loadFile(name){
  const code = fs.readFileSync(path.join(__dirname, name), 'utf8');
  vm.runInContext(code, sandbox, { filename: name });
}

try {
  loadFile('characters.js');
  // In a browser, characters.js and engine.js are separate <script> tags that
  // share one global object, so engine.js sees the bare `Characters` that
  // characters.js published via `window.Characters`. Mirror that here.
  sandbox.Characters = sandbox.window.Characters;
  ok(true, 'characters.js loaded');
  ok(sandbox.window.Characters && typeof sandbox.window.Characters.svg === 'function', 'Characters.svg() available');
  // exercise every expression for both characters
  const exprs = ['neutral','angry','laugh','cry','sleep','soft','surprise','warm','away','sad'];
  let svgErr = null, svgCount = 0;
  for (const who of ['lou','elias']) for (const ex of exprs) {
    try { const s = sandbox.window.Characters.svg(who, ex); if (s && s.indexOf('<svg') === 0) svgCount++; }
    catch(e){ svgErr = e; }
  }
  ok(!svgErr, 'all character expressions render to SVG' + (svgErr ? ' — ' + svgErr.message : ` (${svgCount} sprites)`));
  ok(typeof sandbox.window.Characters.two === 'function', 'Characters.two() (paired bust) available');
} catch (e) {
  ok(false, 'characters.js threw: ' + (e.stack || e));
}

// The engine has no explicit boot(): loading it self-initialises (landing IIFE
// runs, meters init, listeners bind). A clean load == a successful boot.
let engineLoaded = false;
try {
  loadFile('engine.js');
  engineLoaded = true;
  ok(true, 'engine.js loaded + self-initialised without throwing');
} catch (e) {
  ok(false, 'engine.js threw on load: ' + (e.stack || e));
}

if (engineLoaded) {
  // landing typewriter + meter init run via setTimeout, which our stub fires
  // synchronously — verify the visible side-effects landed.
  const title = byId['title'];
  ok(title && title.textContent && title.textContent.length > 0,
     'landing typewriter populated the title ("' + (title.textContent||'') + '")');
  const meter = byId['meterfill'];
  ok(meter && meter.style && /%$/.test(meter.style.width || ''),
     'connexion meter initialised (' + (meter && meter.style.width) + ')');

  // pump any scheduled frames (canvas minigames) without throwing
  let frames = 0, t = 0, err = null;
  for (let i = 0; i < 120 && rafQueue.length; i++) {
    const cb = rafQueue.shift(); t += 16;
    try { cb(t); frames++; } catch(e){ err = e; break; }
  }
  ok(!err, 'scheduled frames pumped without throwing (' + frames + ' frames)' + (err ? ' — ' + err.message : ''));

  // fire input + click the cat (VOD unlock) to exercise interactive paths
  let inputErr = null;
  try {
    ['win:keydown','win:keyup'].forEach(t2 => {
      (docListeners[t2]||[]).forEach(fn => [' ','ArrowLeft','ArrowRight','x','ArrowUp','Enter'].forEach(key =>
        fn({ key, code:key, preventDefault(){}, repeat:false })));
    });
    if (byId['baudelaire']) byId['baudelaire']._fire('click', {});
    for (let i=0;i<40 && rafQueue.length;i++){ const cb=rafQueue.shift(); cb(t+=16); }
  } catch(e){ inputErr = e; }
  ok(!inputErr, 'input + cat-click handlers run without throwing' + (inputErr ? ' — ' + inputErr.message : ''));
}

log('');
log((fails ? fails + ' FAILED' : 'ALL PASSED') + ' — ' + (lines.filter(l=>l.startsWith('[PASS]')).length) + ' checks passed');
fs.writeFileSync(path.join(__dirname, 'smoke-report.txt'), lines.join('\n') + '\n');
process.exit(fails ? 1 : 0);
