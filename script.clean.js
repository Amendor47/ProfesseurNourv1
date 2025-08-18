/* =======================================================
   Coach — Offline IA v2 (RAKE + TF-IDF + MMR + ConceptGraph)
   ======================================================= */

// ---------- État global ----------
const CM = { meta:{title:"",lang:"fr"}, text:"", sections:[], conceptIndex:{}, qa:{ qcm:[], flashcards:[] } };

// ---------- Utils de base ----------
const normalize = s => (s||"").toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s-]/gu," ");
const tokens = s => normalize(s).split(/\s+/).filter(w=>w.length>2);
const uniq = a => [...new Set(a)];
const clamp = (arr,min,max)=> (arr.length<min? [...arr, ...arr.slice(0,Math.max(0,min-arr.length))] : arr).slice(0,Math.min(arr.length,max));
const Jaccard = (A,B)=>{ const a=new Set(A), b=new Set(B); let i=0; a.forEach(x=>b.has(x)&&i++); return i/Math.max(1,a.size+b.size-i); };

// Split FR robuste (protège ex., p.ex., nombres décimaux)
const sentSplit = t => {
  const safe = (t||"")
    .replace(/\b(p\.ex\.|ex\.|i\.e\.|e\.g\.)/gi,m=>m.replaceAll('.','∎'))
    .replace(/(\d)\.(\d)/g,'$1∎$2');
  return safe
    .split(/(?<=[.!?])\s+(?=[A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ0-9])/)
    .map(s=>s.replaceAll('∎','.').trim()).filter(Boolean);
};

const STOP = new Set(`les des une un du le la de et que qui pour pas est sont avec sans par sur dans plus moins donc or car comme ainsi cela ceci tres tout toute tous toutes chez fait faire avoir etre afin quand si alors tandis meme entre au aux ces cet cette ce d’ des l’ m’ n’ s’ t’ qu’`.split(/\s+/));

// ---------- RAKE simple (expressions clés) ----------
function rakeKeyphrases(text){
  const sents = sentSplit(text);
  const phrases = [];
  sents.forEach(s=>{
    const words = tokens(s);
    let cur=[]; words.forEach(w=>{
      if(STOP.has(w)) { if(cur.length) { phrases.push(cur.join(' ')); cur=[]; } }
      else cur.push(w);
    });
    if(cur.length) phrases.push(cur.join(' '));
  });
  const deg = new Map(), freq = new Map();
  phrases.forEach(p=>{
    const ws = p.split(/\s+/);
    ws.forEach(w=>{
      freq.set(w,(freq.get(w)||0)+1);
      deg.set(w,(deg.get(w)||0)+ws.length-1);
    });
  });
  const score = new Map();
  phrases.forEach(p=>{
    const ws = p.split(/\s+/);
    const s = ws.reduce((a,w)=> a + ( (deg.get(w)||0) + (freq.get(w)||0) ), 0) / Math.max(1, ws.length);
    score.set(p, (score.get(p)||0) + s);
  });
  return [...score.entries()].sort((a,b)=>b[1]-a[1]).map(([p])=>p);
}

// ---------- Stats globales (TF-IDF) ----------
function computeGlobalStats(text){
  const secs = text.split(/\n{2,}/).map(s=>s.trim()).filter(Boolean);
  const secToks = secs.map(s => tokens(s));
  const df = new Map();
  secToks.forEach(set => uniq(set).forEach(w=>df.set(w,(df.get(w)||0)+1)));
  const N = Math.max(1, secs.length);
  const idf = w => Math.log(1 + N / (1 + (df.get(w)||0)));
  return { idf, secs };
}

// ---------- Scoring de phrases + MMR (diversité de contenu) ----------
function scoreSentences(sentences, idf){
  const all = sentences.map(s=>tokens(s));
  const tf = new Map(); all.flat().forEach(w=>tf.set(w,(tf.get(w)||0)+1));
  return sentences.map((s,i)=>{
    const ws=tokens(s);
    const lenPenalty = Math.abs(ws.length-18);
    const posBonus   = (i===0?2:(i<3?1:0));
    const tfidf      = uniq(ws).reduce((a,w)=>a + ((tf.get(w)||1)*idf(w)),0)/Math.max(1,ws.length);
    const cueBonus   = /\b(parce que|entra[iî]ne|implique|résulte|conduit à|donc|ainsi|en pratique|par exemple)\b/i.test(s) ? 0.8 : 0;
    return { s, score: tfidf + posBonus + cueBonus - (lenPenalty*0.02), ws };
  }).sort((a,b)=>b.score-a.score);
}
function pickMMR(ranked, k=10, lambda=0.7){
  const chosen=[]; const bag=[];
  while(chosen.length<k && ranked.length){
    let best=null, bi=-1;
    ranked.forEach((r,i)=>{
      const sim = chosen.length ? Math.max(...chosen.map(c=>Jaccard(new Set(r.ws), new Set(c.ws)))) : 0;
      const mmr = lambda*r.score - (1-lambda)*sim;
      if(!best || mmr>best.mmr) best={mmr, r, i};
    });
    chosen.push(best.r);
    ranked.splice(best.i,1);
  }
  return chosen.map(x=>x.s);
}

// ---------- Fiches : résumés + HTML structuré ----------
function buildSummariesRich(raw, idf){
  const S = sentSplit(raw);
  const ranked = scoreSentences(S, idf);
  const base = pickMMR([...ranked], 30, 0.72);             // diversité + pertinence

  const short  = clamp(base.slice(0,6), 5, 7).join(' ');
  const medium = clamp(base.slice(0,12),10,14).join(' ');
  const long   = clamp(base.slice(0,28),22,34).join(' ');

  const example = S.find(x=>/exemple|par exemple|illustr|cas\s+(concret|pratique)?/i.test(x));
  const limit   = S.find(x=>/(limite|biais|risque|attention|contre-exemple)/i.test(x));
  const persp   = S.find(x=>/(en pratique|dans le contexte|implique|conduit à|application)/i.test(x));

  const bullets = base.slice(0,8).map(x=>`<li>${x}</li>`).join('');
  const html = `
    <div class="fiche-card">
      <h4>Idée centrale</h4>
      <p>${ranked[0]?.s || base[0] || ''}</p>
      <h5>Points clés</h5>
      <ul>${bullets}</ul>
      ${example?`<h5>Exemple</h5><p>${example}</p>`:''}
      ${limit?  `<h5>Limites</h5><p>${limit}</p>`:''}
      ${persp?  `<h5>Mise en perspective</h5><p>${persp}</p>`:''}
    </div>`;
  return { short, medium, long, html, base };
}

// ---------- Section builder ----------
function buildSection(id, title, raw, idf){
  const sentences = sentSplit(raw);
  const rake = rakeKeyphrases(raw).slice(0,12);
  const tf = new Map(); tokens(raw).forEach(w=>tf.set(w,(tf.get(w)||0)+1));
  const keywords = uniq([ ...rake, ...[...tf.entries()].map(([w,f])=>[w,f*idf(w)]).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([w])=>w) ]);
  const summary = buildSummariesRich(raw, idf);
  // claims = phrases “de fond” (top MMR + marqueurs logiques)
  const claims = summary.base.filter(s=>/\b(est|se définit|parce que|entra[iî]ne|implique|résulte|conduit à|diff[eé]re|contraire|compar[ée])\b/i.test(s)).slice(0,8);
  return { id, title, raw, sentences, keywords, summary, claims };
}

function buildModelFromText(text){
  CM.text = text;
  const { idf, secs } = computeGlobalStats(text);
  CM.sections = secs.map((c,i)=>{
    const t = c.split('\n')[0].replace(/^[-–•]\s*/,'').slice(0,96);
    return buildSection('S'+(i+1), t || `Section ${i+1}`, c, idf);
  });
}

// ---------- Graphe de concepts (co-occurrences) ----------
function indexConcepts(){
  CM.conceptIndex={}; // node: keyphrase; edges: co-occur in same sentence
  CM.sections.forEach(sec=>{
    const local = uniq(sec.keywords);
    local.forEach(a=>{
      (CM.conceptIndex[a] ||= {defs:[], mentions:[], edges:new Map()});
      const def=sec.sentences.find(x=>/\b(est|se définit|désigne|consiste)\b/i.test(x));
      if(def) CM.conceptIndex[a].defs.push({secId:sec.id,def});
      CM.conceptIndex[a].mentions.push({secId:sec.id, sent:sec.sentences[0]||sec.raw});
    });
    sec.sentences.forEach(s=>{
      const ks = uniq(tokens(s).filter(w=>local.includes(w)));
      ks.forEach(x=>ks.forEach(y=>{
        if(x===y) return;
        const e = CM.conceptIndex[x].edges;
        e.set(y, (e.get(y)||0)+1);
      }));
    });
  });
}

// ---------- QCM (profond & contextuel) ----------
function uniqueOptions(arr){
  const seen=new Set(), out=[];
  for(const x of arr){ const k=normalize(x); if(k && !seen.has(k)){ seen.add(k); out.push(x); } }
  return out;
}
function fillToFour(opts, sec){
  const pool = sec.claims.concat(sec.sentences).filter(Boolean);
  while(opts.length<4){
    const cand = pool[(Math.random()*pool.length)|0] || `Affirmation liée à ${sec.title}`;
    if(!opts.includes(cand)) opts.push(cand);
  }
  return opts.slice(0,4);
}
function contextualDistractors(sec, correct){
  const base = sec.sentences.filter(s=>s!==correct);
  const cw = uniq(tokens(correct));
  const topNearby = base.map(s=>({ s, sim:Jaccard(cw, uniq(tokens(s))) }))
                        .sort((a,b)=>b.sim-a.sim)
                        .slice(0,8).map(x=>x.s);
  const transforms = [
    s => s.replace(/\b(entra[iî]ne|conduit à|provoque)\b/i,'correspond à'),
    s => s.replace(/\b(parce que|car)\b/i,'alors que'),
    s => `Généralisation hâtive : ${s}`
  ];
  const out = [];
  for(const cand of topNearby){ out.push(transforms[out.length%transforms.length](cand)); if(out.length>=3) break; }
  return out.length ? out : ["Corrélation sans causalité","Cause/effet inversés","Hors contexte apparent"];
}
function makeMCQ_FromSection(sec){
  const out=[]; const sents=sec.sentences;
  // Idée centrale
  const defSent = sec.claims[0] || sents[0];
  if(defSent){
    const stem = `Quelle formulation rend le mieux l’idée centrale de « ${sec.title} » ?`;
    const correct = defSent.replace(/^[-–•]\s*/, '');
    let options = uniqueOptions([correct, ...contextualDistractors(sec, correct)]);
    options = fillToFour(options, sec);
    const explain = o => (o===correct) ? "Formulation fidèle au passage."
                                       : "Approximation/contre-sens par rapport au texte.";
    out.push({type:'definition', stem, options, answer:correct, explain});
  }
  // Causalité
  const cause = sents.find(x=>/\b(parce que|car|entra[iî]ne|conduit à|provoque|résulte)\b/i.test(x));
  if(cause){
    const stem = `Quelle relation de causalité à propos de « ${sec.title} » est la plus solide ?`;
    const correct = cause;
    let options = uniqueOptions([correct, ...contextualDistractors(sec, correct)]);
    options = fillToFour(options, sec);
    const explain = o => (o===correct) ? "Lien cause→effet explicite."
                                       : "Confusion corrélation/causalité ou inversion cause/effet.";
    out.push({type:'causalite', stem, options, answer:correct, explain});
  }
  // Comparaison
  const cmp = sents.find(x=>/\b(diff[eé]re|vs|plut[oô]t que|compar[ée] à|contraire)\b/i.test(x));
  if(cmp){
    const stem = `Quelle différence essentielle ressort dans « ${sec.title} » ?`;
    const correct = cmp;
    let options = uniqueOptions([correct, ...contextualDistractors(sec, correct)]);
    options = fillToFour(options, sec);
    const explain = o => (o===correct) ? "Différence explicitée dans le texte."
                                       : "Différences superficielles ou hors-sujet.";
    out.push({type:'comparaison', stem, options, answer:correct, explain});
  }
  // Application (mini-cas)
  if(sents.length>=4){
    const base = sents.slice(0,3).join(' ');
    const stem = `Cas: ${base} → Quelle conclusion est la plus cohérente ?`;
    const correct = sents[3];
    let options = uniqueOptions([correct, ...contextualDistractors(sec, correct)]);
    options = fillToFour(options, sec);
    const explain = o => (o===correct) ? "Conclusion alignée avec les prémisses."
                                       : "Conclusion trop générale/contradictoire ou hors contexte.";
    out.push({type:'application', stem, options, answer:correct, explain});
  }
  return out;
}
function buildQCM(){ CM.qa.qcm = CM.sections.flatMap(sec => makeMCQ_FromSection(sec)); }

// ---------- Flashcards (+ cloze) ----------
function firstMatching(s,rx){ return s.find(x=>rx.test(x)) || ""; }
function clozeFromSentence(s, keyphrases){
  const kp = keyphrases.find(k=>s.toLowerCase().includes(k.toLowerCase()));
  if(!kp) return null;
  const masked = s.replace(new RegExp(kp.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'), '_____');
  return { q:`Complète : ${masked}`, a: kp };
}
function dedupeCards(cards){
  const seen=new Set(), out=[];
  for(const c of cards){ const k=(c.type+'|'+c.q+'|'+c.a).toLowerCase(); if(!seen.has(k)){ seen.add(k); out.push(c);} }
  return out;
}
function buildFlashcards(){
  const cards=[];
  for(const sec of CM.sections){
    const s=sec.sentences;
    const def = firstMatching(s,/\b(est|se définit|désigne|correspond|consiste)\b/i) || sec.claims[0] || s[0];
    if(def) cards.push({type:'def',q:`Qu'est-ce que « ${sec.title} » ?`,a:def});
    const why = firstMatching(s,/\b(parce que|car|afin|pour que)\b/i);
    if(why) cards.push({type:'why',q:`Pourquoi ${sec.title} ?`,a:why});
    const effect = firstMatching(s,/\b(entra[îi]ne|conduit à|provoque|résulte|implique)\b/i);
    if(effect) cards.push({type:'effect',q:`Quelles conséquences de ${sec.title} ?`,a:effect});
    const cmp = firstMatching(s,/\b(diff[eé]re|vs|plut[oô]t que|compar[ée] à|contraire)\b/i);
    if(cmp) cards.push({type:'compare',q:`Différence clé liée à « ${sec.title} » ?`,a:cmp});
    const ex = firstMatching(s,/\b(exemple|par exemple|cas|illustr)/i);
    if(ex) cards.push({type:'example',q:`Un exemple parlant de ${sec.title} ?`,a:ex});
    // Cloze (1 par section si possible)
    const clz = clozeFromSentence(sec.claims[0]||s[0]||'', sec.keywords.slice(0,6));
    if(clz) cards.push({type:'cloze', q:clz.q, a:clz.a});
  }
  CM.qa.flashcards = dedupeCards(cards).slice(0, 120);
}

// ---------- Fusion IA interne (non destructif) ----------
function mergeInternalOut(out){
  if(!out) return;
  if(Array.isArray(out.sections)){
    out.sections.forEach((ext,i)=>{
      const sec = CM.sections[i]; if(!sec) return;
      if(ext.title) sec.title = sec.title || ext.title;
      if(ext.summary) sec.summary = { ...sec.summary, ...ext.summary };
      if(ext.keywords) sec.keywords = uniq([...sec.keywords, ...ext.keywords]);
      if(ext.claims) sec.claims = uniq([...(sec.claims||[]), ...ext.claims]);
      if(ext.qcm) CM.qa.qcm.push(...ext.qcm);
      if(ext.flashcards) CM.qa.flashcards.push(...ext.flashcards);
    });
  }else{
    if(out.qcm) CM.qa.qcm.push(...out.qcm);
    if(out.flashcards) CM.qa.flashcards.push(...out.flashcards);
  }
  // Dédoublonnage
  CM.qa.qcm = CM.qa.qcm.filter((q,i,self)=> i===self.findIndex(z=>q.stem===z.stem));
  CM.qa.flashcards = dedupeCards(CM.qa.flashcards);
}

// ---------- Chat offline (retrieval) ----------
function retrieveTopSentences(q, k=5){
  const tw = tokens(q);
  if(!tw.length) return [];
  // score BM25-like léger
  const k1=1.5, b=0.75;
  const sents = CM.sections.flatMap((sec,si)=> sec.sentences.map((s,pi)=>({s, si, pi, len:tokens(s).length || 1})));
  const avgLen = sents.reduce((a,x)=>a+x.len,0)/Math.max(1,sents.length);
  const df = new Map();
  sents.forEach(x=> uniq(tokens(x.s)).forEach(w=>df.set(w,(df.get(w)||0)+1)) );
  const N = sents.length;
  const score = (x)=>{
    const ws = tokens(x.s);
    let sc=0;
    uniq(tw).forEach(w=>{
      const f = ws.filter(z=>z===w).length;
      if(!f) return;
      const idf = Math.log(1 + (N - (df.get(w)||0) + 0.5) / ((df.get(w)||0) + 0.5));
      sc += idf * ( f * (k1+1) / ( f + k1*(1 - b + b*(x.len/avgLen)) ) );
    });
    return sc;
  };
  return sents.map(x=>({...x,score:score(x)})).sort((a,b)=>b.score-a.score).slice(0,k);
}

function answerQuery(q){
  const nq = normalize(q);
  if(/résume|summary/.test(nq)){
    return CM.sections.map(s=>s.summary.short).join(' ') || "Colle un cours puis clique Analyser.";
  }
  if(/mots\s*cl[eé]s|keywords?/.test(nq)){
    return `Mots-clés: ${uniq(CM.sections.flatMap(s=>s.keywords)).slice(0,25).join(', ')}`;
  }
  const defm = q.match(/qu['’]est-ce que\s+(.+?)\s*\?/i);
  if(defm){
    const t = defm[1].toLowerCase();
    const node = Object.keys(CM.conceptIndex).find(k=>k.includes(t));
    if(node && CM.conceptIndex[node].defs[0]) return CM.conceptIndex[node].defs[0].def;
  }
  if(/\b(quiz|qcm)\b/.test(nq)){
    if(!CM.qa.qcm.length) buildQCM();
    const x = CM.qa.qcm[0];
    return `Exemple de QCM:\n${x.stem}\n- ${x.options.join('\n- ')}`;
  }
  if(/\bcarte(s)?\b/.test(nq)){
    if(!CM.qa.flashcards.length) buildFlashcards();
    const c = CM.qa.flashcards[0];
    return `Exemple de carte:\nQ: ${c.q}\nA: ${c.a}`;
  }
  // retrieval générique
  const top = retrieveTopSentences(q, 4);
  if(!top.length) return "Précise ta question ou lance l’analyse.";
  return top.map(x=>`• ${x.s}`).join('\n');
}

// ---------- Rendus ----------
function renderFiches(){
  const host = document.getElementById('sheet-output'); if(!host) return;
  host.innerHTML = CM.sections.map((s,i)=>`
    <article class="fiche" data-i="${i}">
      <h3>${s.title}</h3>
      <div class="view-toggle">
        <button data-view="short">Courte</button>
        <button data-view="medium">Moyenne</button>
        <button data-view="long">Longue</button>
        <button data-view="html" class="active">Structurée</button>
      </div>
      <div class="fiche-content">${s.summary.html}</div>
    </article>
  `).join('');
  host.querySelectorAll('.fiche').forEach(card=>{
    const idx=+card.dataset.i;
    const content=card.querySelector('.fiche-content');
    card.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const v=btn.dataset.view;
        card.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===btn));
        content.innerHTML = (v==='html') ? CM.sections[idx].summary.html : CM.sections[idx].summary[v];
      });
    });
  });
}

function renderQCM(){
  const host=document.getElementById('qcm-output'); if(!host) return;
  host.innerHTML=CM.qa.qcm.map((q,i)=>`
    <div class="qcm-item" data-i="${i}">
      <p><strong>${q.stem}</strong></p>
      <div class="qcm-options">
        ${q.options.map((opt,idx)=>`<label><input type="radio" name="q-${i}" value="${idx}"> ${opt}</label>`).join('')}
      </div>
      <div class="feedback hidden"></div>
    </div>
  `).join('');
  host.querySelectorAll('.qcm-item').forEach(item=>{
    const qi=+item.dataset.i;
    const q=CM.qa.qcm[qi];
    const labels=item.querySelectorAll('label');
    const fb=item.querySelector('.feedback');
    const correctIndex=q.options.indexOf(q.answer);
    labels.forEach((lab,idx)=>{
      lab.addEventListener('click',()=>{
        labels.forEach(l=>l.classList.remove('qq-correct','qq-wrong'));
        lab.classList.add(idx===correctIndex?'qq-correct':'qq-wrong');
        fb.classList.remove('hidden');
        const chosen = q.options[idx];
        fb.textContent = (idx===correctIndex)
          ? 'Bravo ! ✔️ ' + (q.explain?.(chosen) || '')
          : `À revoir : ${q.answer}. ` + (q.explain?.(chosen) || '');
      });
    });
  });
}

function ensureFlashcardsPane(){
  let pane = document.getElementById('flashcards-pane');
  if (!pane){
    const host = document.getElementById('cards') || document.getElementById('qcm') || document.body;
    pane = document.createElement('div'); pane.id='flashcards-pane'; host.appendChild(pane);
  }
  return pane;
}
function renderFlashcards(){
  const host = ensureFlashcardsPane();
  host.innerHTML=CM.qa.flashcards.map((fc,i)=>`
    <div class="flashcard" data-i="${i}">
      <div class="flashcard-front">${fc.q}</div>
      <div class="flashcard-back hidden">${fc.a}</div>
      <button class="flip">Retourner</button>
    </div>
  `).join('');
  host.querySelectorAll('.flashcard').forEach(card=>{
    const front=card.querySelector('.flashcard-front');
    const back=card.querySelector('.flashcard-back');
    card.querySelector('.flip').addEventListener('click',()=>{
      front.classList.toggle('hidden'); back.classList.toggle('hidden');
    });
  });
}

// ---------- Runner unifié ----------
const CONFIG = { INTERNAL_TIMEOUT: 1800, MAX_CHARS: 12000 };

async function tryInternal(text){
  const ctrl = new AbortController();
  const timer = setTimeout(()=>ctrl.abort(), CONFIG.INTERNAL_TIMEOUT);
  try{
    const res = await fetch('/analyze/fast', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ text: text.slice(0, CONFIG.MAX_CHARS) }),
      signal: ctrl.signal
    });
    clearTimeout(timer);
    if(!res.ok) throw new Error('HTTP '+res.status);
    return await res.json();
  }catch(e){ try{ clearTimeout(timer); }catch{}; return null; }
}

async function runUnifiedPipeline(text, mode='offline', setStatus=(s)=>{}){
  // 1) Base offline (toujours)
  buildModelFromText(text);
  indexConcepts();
  buildQCM();
  buildFlashcards();

  // 2) IA interne → enrichit sans casser
  if(mode!=='offline'){
    const out = await tryInternal(text);
    if(out){ mergeInternalOut(out); }
  }

  // 3) Rendus
  renderFiches(); renderQCM(); renderFlashcards();
}

// (le chat peut utiliser answerQuery(q) si tu l’appelles côté UI)

