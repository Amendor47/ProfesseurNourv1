/*
  Professeur Nour — script nettoyé (core minimal)
  Restaure l’interactivité: onglets, statut provider, analyse, chats, sessions.
*/
(function(){
  // --- Utils ---
  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const on = (el,ev,fn)=> el&&el.addEventListener(ev,fn);
  const esc = (s)=> String(s||'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const API_BASE = location.protocol.startsWith('http') ? location.origin : 'http://127.0.0.1:8000';
  const store = {
    // Provider stored in localStorage; default to fully offline mode
    get provider(){ return localStorage.getItem('provider') || 'offline'; },
    set provider(v){ try{ localStorage.setItem('provider', v); }catch{} },
    get apiKey(){ return localStorage.getItem('apiKey') || ''; },
    set apiKey(v){ try{ localStorage.setItem('apiKey', v); }catch{} },
    get model(){ return localStorage.getItem('model') || 'gpt-4o-mini'; },
    set model(v){ try{ localStorage.setItem('model', v); }catch{} }
  };
  async function fetchJSON(url, opts={}, timeout=15000){
    const ctl=new AbortController(); const id=setTimeout(()=>ctl.abort(), timeout);
    try{ const res=await fetch(url,{...opts,signal:ctl.signal}); if(!res.ok) throw new Error(`${res.status} ${res.statusText}`); return await res.json(); } finally { clearTimeout(id); }
  }
  async function getHealth(){
    const tries=[`${API_BASE}/health`,`${API_BASE}/api/health`,`${API_BASE}/v1/health`];
    for(const u of tries){ try{ const j=await fetchJSON(u,{},3000); if(j&&(j.status==='ok'||j.ok===true)) return j; }catch{} }
    return null;
  }
  function showToast(msg,type='info',ms=2400){
    let host=$('#toast-container'); if(!host){ host=document.createElement('div'); host.id='toast-container'; host.style.cssText='position:fixed;right:16px;bottom:16px;z-index:9999'; host.setAttribute('role','status'); host.setAttribute('aria-live','polite'); document.body.appendChild(host); }
    const t=document.createElement('div'); t.style.cssText='margin-top:8px;padding:10px 12px;border-radius:10px;background:#111827;color:#e5e7eb;border:1px solid #334155;box-shadow:0 6px 20px rgba(20,30,58,.18)'; t.textContent=String(msg||''); host.appendChild(t); setTimeout(()=>{ try{ t.remove(); }catch{} }, ms);
  }

  // --- Provider status ---
  async function updateProviderStatus(){
    const sel=$('#aiProvider'); const keyIn=$('#apiKey'); const badge=$('#providerStatus');
    const provider=(sel&&sel.value)||store.provider||'offline'; const key=(keyIn&&keyIn.value)||store.apiKey||'';
    store.provider=provider; if(keyIn) store.apiKey=keyIn.value;
    if(badge){ badge.textContent='Test…'; badge.style.background='transparent'; badge.style.border='1px solid var(--border-color, #334155)'; }
    try{
      if(provider==='offline'){
        if(badge){ badge.textContent='Local (offline)'; badge.className='badge success'; }
        return;
      }
      if(provider==='internal'){
        const h=await getHealth(); const ok=!!h; const ready=!!(h&&h.llm&&h.llm.ready===true);
        const def=(h&&h.llm&&h.llm.default_model)?` • modèle: ${h.llm.default_model}`:'';
        if(badge){ badge.textContent= ready? ('IA interne • prête'+def) : ok? 'IA interne • serveur OK, modèle indispo' : 'IA interne • indisponible'; badge.style.border='none'; badge.style.background= ready?'rgba(34,197,94,.15)': ok?'rgba(234,179,8,.15)':'rgba(239,68,68,.15)'; badge.style.color= ready?'#22c55e': ok?'#eab308':'#ef4444'; }
      } else if(provider==='openai'){
        if(!key){ if(badge){ badge.textContent='OpenAI • clé manquante'; badge.style.border='none'; badge.style.background='rgba(239,68,68,.15)'; badge.style.color='#ef4444'; } return; }
        try{ const body={task:'chat',prompt:'user: ping? réponds "pong".',provider:'openai',model:store.model,api_key:key}; const r=await fetchJSON(`${API_BASE}/llm/run`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify(body)},8000); if(r&&r.status==='ok'){ if(badge){ badge.textContent='OpenAI • OK'; badge.style.border='none'; badge.style.background='rgba(34,197,94,.15)'; badge.style.color='#22c55e'; } return; } }catch{}
        try{ const j=await fetchJSON('https://api.openai.com/v1/models',{headers:{'Authorization':`Bearer ${key}`}},8000); if(j){ if(badge){ badge.textContent='OpenAI • OK'; badge.style.border='none'; badge.style.background='rgba(34,197,94,.15)'; badge.style.color='#22c55e'; } } }
        catch(e){ if(badge){ badge.textContent='OpenAI • échec (backend ou clé)'; badge.style.border='none'; badge.style.background='rgba(239,68,68,.15)'; badge.style.color='#ef4444'; } }
      } else if(provider==='firecrawl'){
        try{ const j=await fetchJSON(`${API_BASE}/firecrawl/health`,{},4000); const ok=j&&j.ok; if(badge){ badge.textContent= ok?'Firecrawl • OK':'Firecrawl • indispo'; badge.style.border='none'; badge.style.background= ok?'rgba(34,197,94,.15)':'rgba(239,68,68,.15)'; badge.style.color= ok?'#22c55e':'#ef4444'; } }
        catch{ if(badge){ badge.textContent='Firecrawl • indispo'; badge.style.border='none'; badge.style.background='rgba(239,68,68,.15)'; badge.style.color='#ef4444'; } }
      }
    }catch(e){ if(badge){ badge.textContent=`Erreur provider: ${e.message||e}`; badge.style.border='none'; badge.style.background='rgba(239,68,68,.15)'; badge.style.color='#ef4444'; } }
  }

  // --- Tabs ---
  function activateTab(btn){
    if(!btn||!btn.dataset.tab) return;
    const tabId=btn.dataset.tab; const tabs=btn.parentElement; const content=$('#tab-content');
    tabs && $$('button.tab-link',tabs).forEach(b=>{ const on=b===btn; b.classList.toggle('active',on); b.setAttribute('aria-selected', on?'true':'false'); b.setAttribute('tabindex', on?'0':'-1'); });
    content && $$('.tab-pane',content).forEach(p=>{ const show=p.id===tabId; p.classList.toggle('active',show); p.setAttribute('aria-hidden', show?'false':'true'); });
    try{ const card=$('#input-card'); if(card) card.style.display= tabId==='analyse' ? '' : 'none'; }catch{}
    try{ btn.focus(); }catch{}
  }
  function wireTabs(){
    const tabs=$('.tabs'); if(!tabs) return;
    on(tabs,'click',e=>{ const b=e.target.closest('.tab-link'); if(!b) return; activateTab(b); });
    on(tabs,'keydown',e=>{ const cur=e.target.closest('.tab-link'); if(!cur) return; const list=$$('.tab-link',tabs); const i=list.indexOf(cur);
      if(['ArrowRight','ArrowDown'].includes(e.key)){ e.preventDefault(); activateTab(list[(i+1)%list.length]); }
      if(['ArrowLeft','ArrowUp'].includes(e.key)){ e.preventDefault(); activateTab(list[(i-1+list.length)%list.length]); }
      if(e.key==='Home'){ e.preventDefault(); activateTab(list[0]); }
      if(e.key==='End'){ e.preventDefault(); activateTab(list[list.length-1]); }
    });
  }

  // --- Analysis ---
  function setCourseText(t){ const ta=$('#textInput'); if(ta) ta.value=t||''; try{ localStorage.setItem('last_course_text',t||''); }catch{} }
  function getCourseText(){ return ($('#textInput')&&$('#textInput').value)||localStorage.getItem('last_course_text')||''; }
  function localExtract(text){
    // Lightweight client-side extractor to keep Analyse usable offline
    const stop = new Set('le la les de des du un une et ou a au aux en dans pour par avec sans sur sous entre d l que qui quoi dont est sont ete été etre être ce cet cette ces il elle nous vous on ne pas'.split(/\s+/));
    const tokens = String(text||'').match(/[A-Za-zÀ-ÿ]{3,}/g) || [];
    const norm = s=> s.normalize('NFKD').replace(/[^\w\s-]/g,'').toLowerCase();
    const freq = new Map(); tokens.forEach(t=>{ const w=norm(t); if(!stop.has(w)) freq.set(w,(freq.get(w)||0)+1); });
    const notions = Array.from(freq.entries()).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([w])=>w);
    const lines = String(text||'').split(/\n+/).map(s=>s.trim()).filter(Boolean);
    const defs = []; for(const l of lines){ if(/(définition|se définit|est|consiste en)/i.test(l)){ defs.push(l.slice(0,220)); if(defs.length>=8) break; } }
    const questions = notions.slice(0,6).map(w=>`Expliquez la notion: « ${w} ».`);
    return { notions_cles: notions, definitions: defs, questions };
  }
  async function runAnalysis(){
    const txt=getCourseText().trim(); const out=$('#analysis-output'); if(!out) return;
    const empty=$('#analysis-empty');
  // Always activate the Analyse pane first to avoid "all hidden" states
  try{ const btn = document.querySelector('.tabs .tab-link[data-tab="analyse"]'); if(btn){ activateTab(btn); } }catch(_){ }
    if(!txt){ out.innerHTML='<div class="banner warn">Collez un cours ou déposez un fichier pour démarrer.</div>'; empty && (empty.style.display=''); showToast('Veuillez fournir un texte de cours.','warn'); return; }
    // hide empty state during analysis
    empty && (empty.style.display='none');
    const prevHTML = out.innerHTML;
    out.innerHTML='<div class="skeleton h16 w60"></div><div class="skeleton h12 w90" style="margin-top:8px"></div><div class="skeleton h12 w80" style="margin-top:6px"></div>';
    try{
      const j=await fetchJSON(`${API_BASE}/v1/extract`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:txt})},45000);
      const data=j&&j.data? j.data : { notions_cles:[], definitions:[], questions:[] };
      const li=arr=>(arr||[]).map(s=>`<li>${esc(String(s))}</li>`).join('');
      out.innerHTML=`<section class="rag-banner"><div><h4>Notions clés</h4><ul>${li(data.notions_cles)}</ul></div><div><h4>Définitions</h4><ul>${li(data.definitions)}</ul></div><div><h4>Questions</h4><ul>${li(data.questions)}</ul></div></section>`;
      showToast('Analyse terminée','success');
  // Trigger intelligent follow-ups for other features
  try { await updateDownstreamFeatures(txt, data); } catch(_){ }
      // After cascade, show the Fiche tab to make results visible immediately
      try{ const b = document.querySelector('.tabs .tab-link[data-tab="fiche"]'); if(b){ activateTab(b); } }catch(_){ }
    }catch(e){
      // Restore previous content if any, then append a local fallback
      const data = localExtract(txt);
      const li=arr=>(arr||[]).map(s=>`<li>${esc(String(s))}</li>`).join('');
      const fallbackHTML = `<div class="banner warn">Impossible d'analyser via serveur. Affichage d'une analyse locale simplifiée.</div>`+
        `<section class="rag-banner"><div><h4>Notions clés</h4><ul>${li(data.notions_cles)}</ul></div><div><h4>Définitions</h4><ul>${li(data.definitions)}</ul></div><div><h4>Questions</h4><ul>${li(data.questions)}</ul></div></section>`;
      out.innerHTML = (prevHTML && prevHTML.trim() ? prevHTML : '') + fallbackHTML;
      try { await updateDownstreamFeatures(txt, data); } catch(_){ }
      // Ensure a visible tab and open Fiche to highlight results
      try{ const b = document.querySelector('.tabs .tab-link[data-tab=\"fiche\"]'); if(b){ activateTab(b); } }catch(_){ }
    }
  }
  function wireFileInputs(){
    const drop=$('#dropzone'); const file=$('#fileInput'); if(!drop||!file) return;
    on(drop,'click',()=>file.click());
    on(file,'change',e=>{ const f=e.target.files&&e.target.files[0]; if(f) readFile(f); });
    const toggle=e=>{ e.preventDefault(); drop.classList[e.type==='dragover'?'add':'remove']('dragover'); };
    ['dragover','dragleave'].forEach(ev=>on(drop,ev,toggle));
    on(drop,'drop',e=>{ e.preventDefault(); drop.classList.remove('dragover'); const f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0]; if(f) readFile(f); });
  }
  function readFile(file){
    const name=(file.name||'').toLowerCase(); const r=new FileReader();
    if(name.endsWith('.docx')){ r.onload=e=>{ mammoth.extractRawText({arrayBuffer:e.target.result}).then(x=>{ setCourseText(x.value||''); runAnalysis(); }).catch(()=>showToast('Erreur de lecture du .docx','error')); }; r.readAsArrayBuffer(file); return; }
    if(name.endsWith('.txt')||name.endsWith('.md')){ r.onload=e=>{ setCourseText(e.target.result||''); runAnalysis(); }; r.readAsText(file); return; }
    showToast('Format non pris en charge (.txt, .md, .docx)','warn');
  }

  // --- Chats ---
  function renderMessages(host,h){ if(!host) return; host.innerHTML=h.map(m=>`<div class="chat-message ${m.role==='user'?'user-message':'assistant-message prof-nour'}">${esc(m.content)}</div>`).join(''); host.scrollTop=host.scrollHeight; }
  async function callChat(question){
    const prov=($('#aiProvider')&&$('#aiProvider').value)||store.provider||'internal';
    const context=getCourseText().slice(0,8000);
    if(prov==='openai'){
      const key=(($('#apiKey')&&$('#apiKey').value)||store.apiKey||'').trim(); if(!key) return 'OpenAI: ajoutez une clé API.';
      try{ const body={task:'chat',prompt:`user: ${question}`,provider:'openai',model:store.model,api_key:key,max_tokens:600}; const r=await fetchJSON(`${API_BASE}/llm/run`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify(body)},20000); return (r&&r.output)||'—'; }
      catch(e){ return `OpenAI indisponible (${e.message||e}).`; }
    }
    if(prov==='firecrawl'){
      try{
        const key=(($('#apiKey')&&$('#apiKey').value)||store.apiKey||'').trim();
        const body={messages:[{role:'user',content:question}]}; if(key) body.api_key=key;
        const r=await fetchJSON(`${API_BASE}/firecrawl/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)},20000);
        if(r && (r.status==='ok'||r.ok===true)) return r.answer||r.output||'—';
      }catch(_){ /* ignore */ }
    }
    const urls=[`${API_BASE}/api/chat`,'http://127.0.0.1:8000/api/chat','http://localhost:8000/api/chat'];
    for(const u of urls){ try{ const j=await fetchJSON(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:question,context})},20000); if(j&&(j.reply||j.output)) return j.reply||j.output; }catch{} }
    return context? `Je n’ai pas accès à l’IA interne pour le moment. Contexte détecté (${context.length} car.).` : `Je n’ai pas trouvé cela dans le cours.`;
  }

  async function callSocratic(question){
    const key=(($('#apiKey')&&$('#apiKey').value)||store.apiKey||'').trim();
    if(!key) return 'Veuillez ajouter une clé OpenAI pour le dialogue socratique.';
    try{
      const body={task:'chat',prompt:`user: ${question}`,provider:'openai',model:store.model,api_key:key,max_tokens:700};
      const r=await fetchJSON(`${API_BASE}/llm/run`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify(body)},25000);
      return (r&&r.output)||'—';
    }catch(e){ return `Socratique indisponible (${e.message||e}).`; }
  }

  function wireChats(){
    // Tab chat
    const wrap=$('#chat-messages'), input=$('#chat-input'), send=$('#chat-send'); const hist=[];
    function render(){ renderMessages(wrap,hist); }
  async function ask(){ const q=(input&&input.value||'').trim(); if(!q) return; hist.push({role:'user',content:q}); input.value=''; render(); const a=await callChat(q); hist.push({role:'assistant',content:a}); render(); }
    on(send,'click',ask); on(input,'keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); ask(); }});
    if(wrap && !wrap.dataset.greeted){ hist.push({role:'assistant',content:'Bonjour, je suis Professeur Nour. Comment puis-je vous aider ?'}); wrap.dataset.greeted='1'; render(); }
    // Floating chat
    const fab=$('#nour-fab'), panel=$('#nour-chat'), fWrap=$('#nour-chat-messages'), fInput=$('#nour-chat-input'), fSend=$('#nour-chat-send'); const fMin=$('#nour-min'), fClose=$('#nour-close'); const fHist=[];
    function fRender(){ renderMessages(fWrap,fHist); }
    function open(){ if(panel){ panel.classList.remove('hidden'); fab&&fab.setAttribute('aria-expanded','true'); if(fWrap && !fWrap.dataset.greeted){ fHist.push({role:'assistant',content:'Bonjour, je suis Professeur Nour. Comment puis-je vous aider ?'}); fWrap.dataset.greeted='1'; fRender(); } } }
    function close(){ if(panel){ panel.classList.add('hidden'); fab&&fab.setAttribute('aria-expanded','false'); } }
    async function fAsk(){ const q=(fInput&&fInput.value||'').trim(); if(!q) return; fHist.push({role:'user',content:q}); fInput.value=''; fRender(); const a=await callChat(q); fHist.push({role:'assistant',content:a}); fRender(); }
    on(fab,'click',open); on(fSend,'click',fAsk); on(fInput,'keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); fAsk(); }}); on(fMin,'click',()=>panel&&panel.classList.add('hidden')); on(fClose,'click',close);
  }

  function wireSocratic(){
    const wrap=$('#socratic-messages'), input=$('#socratic-input'), send=$('#socratic-send'); const hist=[];
    function render(){ renderMessages(wrap,hist); }
    async function ask(){ const q=(input&&input.value||'').trim(); if(!q) return; hist.push({role:'user',content:q}); input.value=''; render(); const a=await callSocratic(q); hist.push({role:'assistant',content:a}); render(); }
    on(send,'click',ask); on(input,'keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); ask(); }});
    if(wrap && !wrap.dataset.greeted){ hist.push({role:'assistant',content:'Bienvenue en dialogue socratique. Posez une question précise et avançons étape par étape.'}); wrap.dataset.greeted='1'; render(); }
  }

  // --- Sessions (simple) ---
  function wireSessions(){
    const open=$('#sessionBtn'), modal=$('#sessionModal'), closeBtn=$('.close-button'), saveBtn=$('#saveSessionBtn'), nameIn=$('#sessionName'), list=$('#sessionList');
    function state(){ return { text:getCourseText() }; }
    function renderList(){ if(!list) return; list.innerHTML=''; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(!k.startsWith('coach_session_')) continue; const n=k.replace('coach_session_',''); list.innerHTML+=`<div class="session-item"><span>${esc(n)}</span><div><button class="btn load-btn" data-name="${esc(n)}">Charger</button><button class="btn delete-btn" data-name="${esc(n)}">Suppr.</button></div></div>`; } }
    on(open,'click',()=>{ renderList(); if(modal) modal.style.display='block'; });
    on(closeBtn,'click',()=>{ if(modal) modal.style.display='none'; });
    window.addEventListener('click',e=>{ if(e.target===modal) modal.style.display='none'; });
    on(saveBtn,'click',()=>{ const n=(nameIn&&nameIn.value||'').trim(); if(!n){ showToast('Donnez un nom à la session','warn'); return; } localStorage.setItem(`coach_session_${n}`, JSON.stringify(state())); nameIn.value=''; renderList(); showToast('Session sauvegardée','success'); });
    on(list,'click',e=>{ const load=e.target.closest('.load-btn'); const del=e.target.closest('.delete-btn'); if(!load && !del) return; const n=(load||del).dataset.name; const key=`coach_session_${n}`; if(load){ try{ const st=JSON.parse(localStorage.getItem(key)||'{}'); if(st && st.text!=null) setCourseText(st.text); showToast(`Session "${n}" chargée`,'success'); }catch{} if(modal) modal.style.display='none'; } if(del){ if(confirm(`Supprimer la session "${n}" ?`)){ localStorage.removeItem(key); renderList(); } }});
  }

  // --- Helpers for downstream features ---
  async function postJSON(url, payload, timeout=20000, headers={}){
    return await fetchJSON(url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(payload)},timeout);
  }
  function ensureFlashcardsPane(){
    let pane = document.getElementById('flashcards-pane');
    const tabs = document.getElementById('tab-content');
    if(!pane && tabs){
      pane = document.createElement('div');
      pane.id = 'flashcards-pane'; pane.className = 'tab-pane'; pane.setAttribute('role','tabpanel'); pane.setAttribute('tabindex','0');
  pane.innerHTML = '<h3>Cartes (règles, définitions, formules)</h3><div id="flashcards-output"></div>';
      tabs.appendChild(pane);
    }
    return pane;
  }
  function setSkeleton(el, lines=3){ if(!el) return; el.innerHTML = Array.from({length:lines}).map((_,i)=>`<div class="skeleton h${i?12:16} w${80+i*4}" style="margin:${i?6:0}px 0"></div>`).join(''); }
  function renderSuggestionsFromAnalysis(data){
    const seeds = (data.notions_cles||[]).slice(0,6);
    const starters = ['Peux-tu résumer simplement ?', 'Donne un exemple concret.', 'Quelles exceptions ?', 'Comment l’appliquer ?'];
    const items = [...seeds.map(s=>`Explique « ${s} » en 2 phrases.`), ...starters].slice(0,8);
    const mk = (q)=>`<button class="chip" data-ask="${esc(q)}">${esc(q)}</button>`;
    const chatHost = document.getElementById('chat-suggestions'); if(chatHost) chatHost.innerHTML = items.map(mk).join('');
    const socHost = document.getElementById('socratic-suggestions'); if(socHost) socHost.innerHTML = items.map(mk).join('');
    // click to insert into inputs
    function wireAsk(hostId, inputId, sendId){
      const host = document.getElementById(hostId), input = document.getElementById(inputId), send = document.getElementById(sendId);
      if(!host||!input||!send) return;
      host.addEventListener('click', e=>{ const b=e.target.closest('[data-ask]'); if(!b) return; input.value=b.getAttribute('data-ask')||''; send.click(); });
    }
    wireAsk('chat-suggestions','chat-input','chat-send');
    wireAsk('socratic-suggestions','socratic-input','socratic-send');
  }
  async function aiJSON(prompt, context){
    try{
      const j = await postJSON(`${API_BASE}/api/chat`, { prompt, context, task:'json', format:'json' }, 30000);
      const txt = j && (j.reply||j.output||'');
      if(!txt) return null; const cleaned = txt.trim().replace(/^```(json)?/i,'').replace(/```$/,'');
      return JSON.parse(cleaned);
    }catch(_){ return null; }
  }

  // === Thematic segmentation + offline enrichers ===
  function _normalize(text){ return String(text||'').replace(/\r/g,'').trim(); }
  function _splitParas(text){ return _normalize(text).split(/\n{2,}/).map(s=>s.trim()).filter(Boolean); }
  function _splitSentences(p){ return String(p||'').split(/(?<=[\.!?…])\s+/).map(s=>s.trim()).filter(Boolean); }
  function _toLines(text){ return _normalize(text).split(/\n/); }
  function _detectHeadings(lines){ return lines.map((l,i)=>({i,l})).filter(x=>/^#{1,6}\s|^\d+[\.)]\s|^(Chapitre|Section|Partie|Thème|Definition|Définition|Propriété|Théorème)\b/i.test(x.l)); }
  function _keywords(text, n=12){
    const t = String(text||'').toLowerCase().replace(/[^a-z0-9àâçéèêëîïôûùüÿœ\s\-]/gi,' ');
    const tokens = t.split(/\s+/).filter(Boolean);
    const freq = new Map();
    const stop = new Set('les des aux une un du le la de et que qui pour pas est sont avec sans par sur dans plus moins donc or car comme entre ainsi cela ceci ces ceux celles tandis sauf même etc très tout toute tous toutes chez fait faire avoir être beaucoup selon lorsque où quand puis alors si sinon tandis peut peut-être au aux auxdites auxdits the of to in and is are was were be been being with from by on for as at into about than after before between under over then very'.split(/\s+/));
    for(const w of tokens){ if(w.length>2 && !stop.has(w)) freq.set(w,(freq.get(w)||0)+1); }
    return Array.from(freq.entries()).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([w])=>w);
  }
  function _extractFormulas(text){ return String(text||'').split(/\n/).filter(l=>/[=≈∑^<>]|->|≤|≥/.test(l)).slice(0,12); }
  function _extractDatesNumbers(text){ const ds=String(text||'').match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4})\b/g)||[]; const nums=String(text||'').match(/\b\d+(?:[.,]\d+)?\b/g)||[]; return Array.from(new Set([...ds,...nums])).slice(0,20); }
  function _segmentThemes(text){
    const lines = _toLines(text); const headings=_detectHeadings(lines);
    if(headings.length){
      const segs=[]; for(let h=0; h<headings.length; h++){ const start=headings[h].i; const end=(h<headings.length-1? headings[h+1].i : lines.length); const title=lines[start].replace(/^#{1,6}\s*/, '').trim(); const body=lines.slice(start+1,end).join('\n').trim(); if(body) segs.push({title, body}); }
      return segs;
    }
    // fallback: cluster by top keywords
    const paras=_splitParas(text); const all=paras.join(' ').toLowerCase(); const words=all.replace(/[^a-z0-9àâçéèêëîïôûùüÿœ\s]/gi,' ').split(/\s+/).filter(w=>w.length>3);
    const freq=new Map(); const stop=new Set('les des aux une un du le la de et que qui pour pas est sont avec sans par sur dans plus moins donc or car comme entre ainsi cela ceci ces ceux celles tandis sauf même etc très tout toute tous toutes chez fait faire avoir être beaucoup selon lorsque où quand puis alors si sinon tandis'.split(/\s+/));
    for(const w of words){ if(!stop.has(w)) freq.set(w,(freq.get(w)||0)+1); }
    const top=Array.from(freq.entries()).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([w])=>w);
    const bins=top.map(k=>({title:`Thème: ${k}`, key:k, paras:[]}));
    paras.forEach(p=>{ let best=-1, idx=-1; top.forEach((k,i)=>{ const sc=(p.toLowerCase().match(new RegExp(`\\b${k}\\b`,'g'))||[]).length; if(sc>best){ best=sc; idx=i; } }); (idx>=0? bins[idx]: (bins[0]||{paras:[]})).paras.push(p); });
    return bins.filter(b=>b.paras.length).map(b=>({title:b.title, body:b.paras.join('\n\n')}));
  }

  // === Themed sheets (long/multi-view) ===
  function _slug(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9àâçéèêëîïôûùüÿœ\- ]/gi,'').replace(/\s+/g,'-').slice(0,40); }
  function _renderFichesByTheme(themes){
    const cards = themes.map(t=>{
      const k=_keywords(t.body,12); const forms=_extractFormulas(t.body); const refs=_extractDatesNumbers(t.body); const sents=_splitSentences(t.body); const longSum=(sents.slice(0,12).join(' ') || t.body.slice(0,900));
      return `<article class="fiche-card" data-theme="${_slug(t.title)}" contenteditable="true">
        <h4>${esc(t.title)}</h4>
        <div class="view-toggle">
          <button class="btn seg selected" data-view="long">Long</button>
          <button class="btn seg" data-view="bullets">Points-clés</button>
          <button class="btn seg" data-view="formulas">Formules</button>
        </div>
        <div class="fiche-body">
          <section class="summary" data-s="long"><p>${esc(longSum)}</p></section>
          <section class="summary hidden" data-s="bullets">
            <h5>Concepts clés</h5>
            <ul>${k.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
            ${refs.length?`<h5>Dates/Chiffres</h5><ul>${refs.slice(0,10).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
          </section>
          <section class="summary hidden" data-s="formulas">${forms.length?`<pre style="text-align:left;white-space:pre-wrap;">${esc(forms.join('\n'))}</pre>`:'<p>Aucune formule détectée.</p>'}</section>
        </div>
        <button class="export-fiche">Exporter</button>
      </article>`; }).join('');
    return `<div class="sheet-toolbar"><div><strong>Fiches de synthèse par thème</strong></div><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn" id="fiche-view-grid">Grille</button><button class="btn" id="fiche-view-list">Liste</button><button class="btn primary" id="fiche-export-all">Exporter toutes</button></div></div><div class="sheet-grid" id="fiches-grid">${cards}</div>`;
  }
  function _wireFiches(){
    $$('.fiche-card').forEach(card=>{
      const toggles = $$('.btn.seg', card); const sections = $$('[data-s]', card);
      toggles.forEach(btn=>{ btn.addEventListener('click', ()=>{ toggles.forEach(b=>b.classList.toggle('selected', b===btn)); const view=btn.getAttribute('data-view'); sections.forEach(s=> s.classList.toggle('hidden', s.getAttribute('data-s')!==view)); }); });
      $('.export-fiche', card)?.addEventListener('click', ()=>{ const w=window.open('', '_blank'); w.document.write(`<pre style="font-family:system-ui, sans-serif; white-space:pre-wrap">${card.innerText}</pre>`); w.document.close(); w.focus(); w.print(); w.close(); });
    });
    $('#fiche-view-grid')?.addEventListener('click', ()=>{ $('#fiches-grid')?.classList.remove('stack-md'); });
    $('#fiche-view-list')?.addEventListener('click', ()=>{ const g=$('#fiches-grid'); if(g){ g.classList.add('stack-md'); g.style.display='block'; } });
    $('#fiche-export-all')?.addEventListener('click', ()=>{ const txt=$$('.fiche-card').map(c=>`# ${c.querySelector('h4')?.innerText}\n\n${c.innerText}`).join('\n\n---\n\n'); const blob=new Blob([txt],{type:'text/plain'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='fiches.txt'; a.click(); URL.revokeObjectURL(url); });
  }
  async function updateSheet(txt, data){
    const out = document.getElementById('sheet-output'); if(!out) return;
    setSkeleton(out, 4);
    // Prefer AI JSON if available to get rich variants per theme, else fallback to local segmentation
    let usedFallback = false;
    try{
      // Try to obtain a thematic outline first
      const j = await aiJSON('Découpe ce cours en 4 à 6 thèmes clés (JSON {"themes":[{"title":"...","summary":"..."}]})', txt);
      if(j && Array.isArray(j.themes) && j.themes.length){
        // Render using AI-proposed themes enriched locally
        const themes = j.themes.map(t=>({ title: String(t.title||'Thème'), body: String(t.summary||'') }))
          .map(t=> ({ ...t, body: t.body && t.body.length>40 ? t.body : txt }));
        out.innerHTML = _renderFichesByTheme(themes);
        _wireFiches();
        return;
      }
      usedFallback = true;
    }catch{ usedFallback = true; }
    if(usedFallback){
      const themes = _segmentThemes(txt);
      out.innerHTML = _renderFichesByTheme(themes);
      _wireFiches();
    }
  }
  function renderQCMItems(host, payload){
    const items = (payload && payload.items)||[]; if(!host) return;
    if(!items.length){ host.innerHTML = '<p>Aucun QCM.</p>'; return; }
    host.innerHTML = items.map((it,idx)=>{
      const opts = it.options||[];
      return `<div class="qcm-item"><div class="q">${esc(it.question||'')}</div>
        <div class="qcm-options">${opts.map((o,i)=>`<label><input type="radio" name="q${idx}" data-idx="${i}" ${i===0?'checked':''}> ${esc(o||'')}</label>`).join('')}</div>
        <div class="feedback" id="fb-${idx}" aria-live="polite"></div></div>`; }).join('');
    if(!host.dataset.bound){
      host.addEventListener('change', e=>{ const input=e.target.closest('input[type=radio]'); if(!input) return; const name=input.name; const i=parseInt(input.getAttribute('data-idx')||'0',10); const qIdx=parseInt(name.slice(1),10); const item=items[qIdx]; const ok=(i===item.answer_index); const fb=document.getElementById(`fb-${qIdx}`); if(fb){ fb.classList.toggle('correct',ok); fb.classList.toggle('incorrect',!ok); fb.textContent= ok? 'Correct ✔︎':'Incorrect ✘'; fb.classList.remove('hidden'); }});
      host.dataset.bound='1';
    }
  }
  async function updateQCM(txt, data){
    const out = document.getElementById('qcm-output'); if(!out) return;
    setSkeleton(out, 3);
    const prompt = `Genère un QCM JSON STRICT sur ce cours (8 questions). Chaque item: {id,question,options:[4],answer_index,difficulty:"easy|medium|hard",bloom:"rappel|compréhension|application|analyse"}. Évite "Toutes les réponses".`;
    let payload = await aiJSON(prompt, txt);
    if(!payload || !Array.isArray(payload.items)){
      // Fallback: build 4-choice items with plausible distractors from themes
      const themes = _segmentThemes(txt);
      const pool = themes.flatMap(t=> _splitSentences(t.body).map(s=>({theme:t.title, s})));
      const vocab = _keywords(themes.map(t=>t.body).join('\n'), 60);
      function distractors(correct, n=3){
        const cw = new Set(_keywords(correct, 8)); const others = vocab.filter(w=>!cw.has(w)).slice(0,40);
        const out=[]; while(out.length<n && others.length){ const a=others[Math.floor(Math.random()*others.length)]||''; const b=others[Math.floor(Math.random()*others.length)]||''; const cand=(a && b)? `${a} ${b}` : (a||b||'Option'); if(!out.includes(cand) && cand.toLowerCase()!==correct.toLowerCase()) out.push(cand); }
        while(out.length<n) out.push('—'); return out;
      }
      const items=[]; for(let i=0;i<pool.length && items.length<10;i++){ const base=pool[i].s.replace(/\s+/g,' ').trim(); if(base.length<40) continue; const correct= base.length>160? base.slice(0,160)+'…' : base; const d=distractors(correct,3); const options=[correct,...d].sort(()=>Math.random()-0.5); const ai=options.indexOf(correct); items.push({ id:`q${items.length+1}`, question: `${pool[i].theme} — que retenir ?`, options, answer_index: ai, difficulty: ['easy','medium','hard'][Math.floor(Math.random()*3)], bloom: ['rappel','compréhension','application','analyse'][Math.floor(Math.random()*4)] }); }
      payload = { items };
    }
    out.innerHTML = '<div class="qcm-container"></div>';
    const host = out.querySelector('.qcm-container');
    renderQCMItems(host, payload);
  }
  async function updateFlashcards(txt, data){
    ensureFlashcardsPane();
    const out = document.getElementById('flashcards-output'); if(!out) return;
    setSkeleton(out, 3);
    // Build structured rule cards by theme/type offline (fallback-first)
    const themes = _segmentThemes(txt);
    function classify(text){ const t=String(text||'').toLowerCase(); if(/(règle|loi|si\s.+\salors|doit|il faut)/.test(t)) return 'RÈGLE'; if(/(définition|est appelé|on appelle|désigne)/.test(t)) return 'DÉFINITION'; if(/(théorème|propriété|proposition|lemme)/.test(t)) return 'THÉORÈME'; if(/(formule|≈|=|∑|\b\d+\s*%\b|\^|≤|≥|->)/.test(t)) return 'FORMULE'; if(/(attention|piège|exception|sauf|ne pas confondre)/.test(t)) return 'EXCEPTION'; return 'CONCEPT'; }
    const cards=[]; themes.forEach(t=>{ _splitSentences(t.body).slice(0,20).forEach(s=>{ const type=classify(s); let q=''; const head=_keywords(s,1)[0]||'ce concept'; if(type==='DÉFINITION') q=`Qu'est-ce que ${head} ?`; else if(type==='RÈGLE') q=`Quelle règle s'applique à ${head} ?`; else if(type==='FORMULE') q='Quelle est la formule utile ?'; else if(type==='THÉORÈME') q='Quel énoncé retenir ?'; else if(type==='EXCEPTION') q='Quelle exception faut-il connaître ?'; else q=`Point clé (${t.title}) ?`; cards.push({ theme:t.title, type, q, a:s }); }); });
    cards.forEach((c,i)=>{ c.q = `Q${i+1}. ${c.q}`; });
    const byTheme={}; cards.forEach(c=>{ (byTheme[c.theme]=byTheme[c.theme]||[]).push(c); });
    const filters = `<div class="fc-toolbar"><strong>Filtres</strong><select id="fc-theme" class="input"><option value="">Tous les thèmes</option>${Object.keys(byTheme).map(t=>`<option>${esc(t)}</option>`).join('')}</select><select id="fc-type" class="input"><option value="">Tous les types</option>${['RÈGLE','DÉFINITION','FORMULE','THÉORÈME','EXCEPTION','CONCEPT'].map(t=>`<option>${t}</option>`).join('')}</select><button class="btn" id="fc-export">Exporter</button></div>`;
    const grid = `<div id="flashcards-grid" class="fc-deck">${cards.map(c=>`<div class="flashcard" data-theme="${_slug(c.theme)}" data-type="${c.type}"><div class="fc-inner"><div class="fc-face fc-front"><span class="badge">${c.type}</span> ${esc(c.q)}</div><div class="fc-face fc-back">${esc(c.a)}</div></div><small class="muted">${esc(c.theme)}</small></div>`).join('')}</div>`;
    out.innerHTML = filters + grid;
    Array.from(out.querySelectorAll('.fc-inner')).forEach(inner=>inner.addEventListener('click',()=>inner.classList.toggle('flip')));
    const themeSel = document.getElementById('fc-theme'); const typeSel=document.getElementById('fc-type');
    function applyFilters(){ const t=themeSel && themeSel.value || ''; const ty=typeSel && typeSel.value || ''; Array.from(document.querySelectorAll('#flashcards-grid .flashcard')).forEach(card=>{ const okT = !t || card.getAttribute('data-theme')===_slug(t); const okTy=!ty || card.getAttribute('data-type')===ty; card.style.display = (okT && okTy)? '' : 'none'; }); }
    themeSel && themeSel.addEventListener('change', applyFilters); typeSel && typeSel.addEventListener('change', applyFilters);
    const exportBtn = document.getElementById('fc-export'); exportBtn && exportBtn.addEventListener('click', ()=>{ const visible = Array.from(document.querySelectorAll('#flashcards-grid .flashcard')).filter(c=>c.style.display!== 'none'); const txt = visible.map(c=>`# ${c.getAttribute('data-type')}\nQ: ${c.querySelector('.fc-front')?.innerText||''}\nA: ${c.querySelector('.fc-back')?.innerText||''}\n`).join('\n'); const blob=new Blob([txt],{type:'text/plain'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='flashcards.txt'; a.click(); URL.revokeObjectURL(url); });
  }
  async function updateSRS(txt, data){
    const out = document.getElementById('srs-output'); if(!out) return;
    let notions = (data.notions_cles||[]).slice(0,10);
    if(!notions.length && txt){
      const words = String(txt).toLowerCase().replace(/[^a-zàâçéèêëîïôûùüÿñæœ0-9\s]/gi,' ').split(/\s+/).filter(w=>w.length>3);
      const freq = new Map(); words.forEach(w=>freq.set(w,(freq.get(w)||0)+1));
      notions = Array.from(freq.entries()).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([w])=>w);
    }
    out.innerHTML = notions.length? `<ol>${notions.map(n=>`<li>${esc(n)}</li>`).join('')}</ol>` : '<p>Ajoutez du contenu pour prioriser vos révisions.</p>';
  }
  async function updateDownstreamFeatures(txt, data){
    renderSuggestionsFromAnalysis(data);
    // Run features in parallel for speed
    await Promise.allSettled([
      updateSheet(txt, data),
      updateQCM(txt, data),
      updateFlashcards(txt, data),
      updateSRS(txt, data)
    ]);
    // Pre-initialize guided reading first section so the user can start instantly
    try{
      const txtSections = splitSections(txt, 5);
      if(txtSections.length){
        const j = await summarize3Levels(txtSections[0]);
        setReading(txtSections[0], j);
        renderStepper(txtSections, 0); setProgress(0, txtSections.length);
        const start=$('#gr-start'), next=$('#gr-next'), prev=$('#gr-prev');
        start && (start.disabled=false); next && (next.disabled = txtSections.length<=1); prev && (prev.disabled=true);
      }
    }catch(_){ /* best-effort */ }
  // Keep current tab; switching is handled by runAnalysis after cascade
  }

  // --- Guided Reading (Parcours) ---
  function splitSections(txt, maxSec=5){
    const paras = txt.split(/\n{2,}/).map(s=>s.trim()).filter(Boolean);
    if(paras.length<=maxSec) return paras;
    const size = Math.ceil(paras.length/maxSec); const out=[]; for(let i=0;i<paras.length;i+=size){ out.push(paras.slice(i,i+size).join('\n\n')); } return out;
  }
  async function summarize3Levels(text){
    const prompt = `Résume cette section en trois niveaux. Réponds en JSON STRICT {"short":["• ...","• ..."], "medium":["..."], "long":"..."}.`;
    const j = await aiJSON(prompt, text);
    return j && (j.short||j.medium||j.long) ? j : { short:[text.slice(0,120)+'…'], medium:[text.slice(0,240)+'…'], long:text.slice(0,400)+'…' };
  }
  function renderStepper(steps, idx){ const host = document.getElementById('gr-stepper'); if(!host) return; host.innerHTML = steps.map((t,i)=>`<span class="step ${i===idx?'active':''}">${esc(String(i+1))}</span>`).join(''); }
  function setProgress(idx,total){ const bar=document.querySelector('#gr-progressbar .bar'); if(!bar||!total) return; const pct=Math.round(((idx+1)/total)*100); bar.style.width = `${pct}%`; }
  function setReading(section, j){
    const t=document.getElementById('gr-section-title'); if(t) t.textContent = section.slice(0,60)+(section.length>60?'…':'');
    const s=document.getElementById('gr-content-short'); const m=document.getElementById('gr-content-medium'); const l=document.getElementById('gr-content-long');
    if(s) s.innerHTML = (j.short||[]).map(x=>`<li>${esc(x)}</li>`).join('');
    if(m) m.innerHTML = (j.medium||[]).map(x=>`<p>${esc(x)}</p>`).join('');
    if(l) l.innerHTML = `<p>${esc(j.long||'')}</p>`;
  }
  function wireGuidedReading(){
    const gen=$('#gr-generate'), start=$('#gr-start'), next=$('#gr-next'), prev=$('#gr-prev');
    const exportBtn=$('#gr-export');
    const optimizeBtn=$('#gr-optimize');
    const makePlanBtn=$('#gr-make-plan');
    const planView=$('#gr-plan-view');
    if(!gen) return;
    const state = { sections:[], idx:0, summaries:[] };
    gen.addEventListener('click', async ()=>{
      const txt = getCourseText(); if(!txt){ showToast('Ajoutez un cours d’abord.','warn'); return; }
      gen.disabled=true; showToast('Génération du parcours…');
      state.sections = splitSections(txt, 5);
      state.idx = 0; state.summaries = [];
      renderStepper(state.sections, 0); setProgress(0, state.sections.length);
      const first = state.sections[0]||''; const j = await summarize3Levels(first); state.summaries[0]=j; setReading(first, j);
      start && (start.disabled=false);
      next && (next.disabled = state.sections.length<=1);
      prev && (prev.disabled=true);
      gen.disabled=false; showToast('Parcours prêt.');
    });
    start && start.addEventListener('click',()=>{ document.getElementById('gr-reading-pane')?.scrollIntoView({behavior:'smooth',block:'start'}); });
    next && next.addEventListener('click', async ()=>{
      if(state.idx >= state.sections.length-1) return; state.idx++;
      renderStepper(state.sections, state.idx); setProgress(state.idx, state.sections.length);
      const sec = state.sections[state.idx];
      if(!state.summaries[state.idx]) state.summaries[state.idx] = await summarize3Levels(sec);
      setReading(sec, state.summaries[state.idx]);
      prev && (prev.disabled=false); next.disabled = (state.idx>=state.sections.length-1);
    });
    prev && prev.addEventListener('click', async ()=>{
      if(state.idx<=0) return; state.idx--; renderStepper(state.sections, state.idx); setProgress(state.idx, state.sections.length);
      const sec = state.sections[state.idx]; if(!state.summaries[state.idx]) state.summaries[state.idx]=await summarize3Levels(sec);
      setReading(sec, state.summaries[state.idx]);
      prev.disabled = (state.idx===0); next && (next.disabled=false);
    });
    // View toggles
    const toggleWrap=document.querySelector('.reading-header .view-toggle');
    toggleWrap && toggleWrap.addEventListener('click', e=>{ const b=e.target.closest('.btn.seg'); if(!b) return; const v=b.dataset.view; $$('.reading-header .view-toggle .btn').forEach(x=>x.classList.toggle('selected', x===b)); $('#gr-content-short')?.classList.toggle('hidden', v!=='short'); $('#gr-content-medium')?.classList.toggle('hidden', v!=='medium'); $('#gr-content-long')?.classList.toggle('hidden', v!=='long'); });
    // Difficulty buttons
    on($('#gr-mark-easy'),'click',()=>showToast('Section marquée: Facile'));
    on($('#gr-mark-ok'),'click',()=>showToast('Section marquée: Moyen'));
    on($('#gr-mark-hard'),'click',()=>showToast('Section marquée: Difficile'));
    // Export
    on(exportBtn,'click',()=>{ if(!state.sections.length){ showToast('Rien à exporter.','warn'); return; } const data={sections: state.sections.map((s,i)=>({text:s, summary: state.summaries[i]||null}))}; const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='parcours.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500); });
    // Simple planning
    function parseTime(t){ const [h,m]=String(t||'9:00').split(':').map(x=>parseInt(x,10)||0); return h*60+m; }
    function fmt(m){ const h=Math.floor(m/60), mm=String(m%60).padStart(2,'0'); return `${h}:${mm}`; }
    function buildPlan(){
      const dur=parseInt($('#gr-duration')?.value||'30',10), pause=parseInt($('#gr-break')?.value||'10',10), perDay=parseInt($('#gr-sessions-per-day')?.value||'2',10);
      const startT=parseTime($('#gr-start-time')?.value||'09:00'); const endT=parseTime($('#gr-end-time')?.value||'20:00'); const days=($('#gr-days')?.value||'LU,MA,ME,JE,VE').split(',').map(s=>s.trim()).filter(Boolean);
      const slots=[]; for(const d of days){ let t=startT, n=0; while(t+dur<=endT && n<perDay){ slots.push({day:d, start:fmt(t), end:fmt(t+dur), section: (state.sections[n%Math.max(1,state.sections.length)]||'').slice(0,40)}); t+=dur+pause; n++; } }
      return slots;
    }
    on(optimizeBtn,'click',()=>{ const plan=buildPlan(); if(planView) planView.innerHTML = plan.length? `<ul>${plan.map(s=>`<li><strong>${esc(s.day)}</strong> ${esc(s.start)}–${esc(s.end)} • ${esc(s.section)}</li>`).join('')}</ul>` : '<p>Aucun créneau trouvé.</p>'; });
    on(makePlanBtn,'click',()=>{ const plan=buildPlan(); if(planView) planView.innerHTML = plan.length? `<ol>${plan.map(s=>`<li>${esc(s.day)} ${esc(s.start)}–${esc(s.end)} • ${esc(s.section)}</li>`).join('')}</ol>` : '<p>Aucun créneau.</p>'; });
  }

  function wireSettings(){
    const pane=$('#settings-pane'); const openBtn=$('#openSettings'); const closeBtn=$('#closeSettings'); const toggleWide=$('#toggleWide'); const loadBtn=$('#loadSamplesBtn');
    on(openBtn,'click',()=>{ pane&&pane.classList.toggle('hidden', false); });
    on(closeBtn,'click',()=>{ pane&&pane.classList.add('hidden'); });
    on(toggleWide,'click',()=>{ const main=document.querySelector('main.container'); if(!main) return; const wide=main.getAttribute('data-wide')==='1'; if(wide){ main.style.maxWidth='1440px'; main.setAttribute('data-wide','0'); toggleWide.textContent='↔️ Étendre'; } else { main.style.maxWidth='100%'; main.setAttribute('data-wide','1'); toggleWide.textContent='↔️ Réduire'; } });
  on(loadBtn,'click', async ()=>{ try{ const data=await fetchJSON(`${API_BASE}/samples`,{},8000); const sheetHost=document.getElementById('sheet-output'); if(sheetHost && data && data.sheets && Array.isArray(data.sheets.sheets)){ const s=data.sheets.sheets[0]; sheetHost.innerHTML = `<div class=\"fiche-card study-cave\"><h4>🧠 Synthèse (exemple)</h4><div class=\"summary\"><h5>📌 Points clés</h5><ul>${(s.short_version?.content||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h5>📝 Version moyenne</h5>${(s.medium_version?.content||[]).map(p=>`<p>${esc(p)}</p>`).join('')}<h5>📚 Version longue</h5><p>${esc(s.long_version?.content||'')}</p></div><footer class=\"fiche-footer\"><button class=\"btn seg selected\">✔️ Mémorisé</button><button class=\"btn seg\">🔁 À revoir</button></footer></div>`; }
      const qHost=document.getElementById('qcm-output'); if(qHost && data && data.mcq){ qHost.innerHTML='<div class="qcm-container"></div>'; const inner=qHost.querySelector('.qcm-container'); renderQCMItems(inner, data.mcq); }
      showToast('Exemples chargés','success'); }catch(e){ showToast('Impossible de charger les exemples','error'); } });
  }

  function wireNudge(){
    const nudge=document.getElementById('nour-nudge'); if(!nudge) return; const close=nudge.querySelector('.nudge-close');
    if(!localStorage.getItem('nour_nudge_seen')){ setTimeout(()=>{ nudge.classList.remove('hidden'); }, 1800); }
    on(close,'click',()=>{ nudge.classList.add('hidden'); try{ localStorage.setItem('nour_nudge_seen','1'); }catch{} });
  }

  // --- Boot ---
  document.addEventListener('DOMContentLoaded', ()=>{
    // Ensure file input accept list is correct
    try{ const fi = document.getElementById('fileInput'); if(fi && fi.getAttribute('accept') !== '.txt,.md,.docx'){ fi.setAttribute('accept','.txt,.md,.docx'); } }catch{}
    // Ensure at least one pane is active; default to Analyse
    try{
      const panes = $$('.tab-pane');
      const anyActive = panes.some(p=>p.classList.contains('active'));
      if(!anyActive){ const btn = document.querySelector('.tabs .tab-link[data-tab="analyse"]'); if(btn){ activateTab(btn); } }
    }catch{}
    // Theme restore
    try{ const html=document.documentElement; let saved=localStorage.getItem('selected-theme')||'theme-nour'; if(saved==='theme-light') saved='theme-nour'; html.classList.remove('theme-nour','theme-light','theme-studycave'); html.classList.add(saved); html.classList.add('theme-dark'); const sel=$('#theme-select'); if(sel){ sel.value=saved; on(sel,'change',e=>{ const v=e.target.value; html.classList.remove('theme-nour','theme-light','theme-studycave'); html.classList.add(v); html.classList.add('theme-dark'); localStorage.setItem('selected-theme', v); }); } }catch{}
    // Provider controls
    const prov=$('#aiProvider'); const key=$('#apiKey'); if(prov){ prov.value=store.provider; on(prov,'change', updateProviderStatus); } if(key){ key.value=store.apiKey; on(key,'change', updateProviderStatus); on(key,'input',()=>{ store.apiKey=key.value; updateProviderStatus(); }); }
    document.addEventListener('keydown',e=>{ if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='o'){ if(prov) prov.value='offline'; store.provider='offline'; updateProviderStatus(); } if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='i'){ if(prov) prov.value='internal'; store.provider='internal'; updateProviderStatus(); } });
    updateProviderStatus();
    // Tabs
    wireTabs();
    // Files + Analyse
    wireFileInputs(); on($('#processBtn'),'click', runAnalysis);
    // Chats
    wireChats();
    wireSocratic();
    // Guided reading (Parcours)
    wireGuidedReading();
    // Settings & Samples
    wireSettings();
    // Sessions
    wireSessions();
    // Nudge
    wireNudge();
    // Restore last text
    const last=localStorage.getItem('last_course_text'); if(last) setCourseText(last);
  });
})();
